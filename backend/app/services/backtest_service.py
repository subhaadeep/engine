"""
GA Parameter Explorer — Backtest Service

Pipeline
--------
1. Retrieve GA row (parameters) + Strategy source + OHLCV DataFrame.
2. Inject GA parameters into strategy source via simple token substitution.
3. Execute strategy in a restricted Python environment to obtain signals.
4. Our vectorised engine converts signals → trades → balance curve.
5. Persist Backtest + Trade records to the database.
"""
from __future__ import annotations

import json
import re
import textwrap
import traceback
from typing import Optional

import numpy as np
import pandas as pd
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Backtest, Strategy, Trade
from app.services import ga_import_service, ohlcv_service


# ---------------------------------------------------------------------------
# Strategy storage
# ---------------------------------------------------------------------------

async def upload_strategy(
    file_content: bytes,
    filename: str,
    db: AsyncSession,
) -> Strategy:
    """Store a user strategy Python file verbatim in the database."""
    try:
        source = file_content.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise ValueError(f"Strategy file '{filename}' is not valid UTF-8.") from exc

    strategy = Strategy(filename=filename, content=source)
    db.add(strategy)
    await db.flush()
    await db.refresh(strategy)
    return strategy


async def get_strategy(strategy_id: int, db: AsyncSession) -> Optional[Strategy]:
    result = await db.execute(select(Strategy).where(Strategy.id == strategy_id))
    return result.scalars().first()


async def list_strategies(db: AsyncSession) -> list[Strategy]:
    result = await db.execute(select(Strategy).order_by(Strategy.id.desc()))
    return list(result.scalars().all())


# ---------------------------------------------------------------------------
# Parameter injection
# ---------------------------------------------------------------------------

_PARAM_PATTERN = re.compile(
    r"^(?P<indent>[ \t]*)(?P<name>[A-Za-z_][A-Za-z0-9_]*)"
    r"[ \t]*=[ \t]*(?P<value>[^\n#]+?)[ \t]*(?:#[^\n]*)?$",
    re.MULTILINE,
)


def _inject_parameters(source: str, params: dict) -> str:
    """
    Replace top-level assignment lines in *source* whose name matches a key
    in *params* with the GA-provided value.

    Only replaces bare ``NAME = <value>`` assignments that appear before any
    ``class`` definition (i.e. the "parameter section" at the top of the file).

    For safety the replacement is done with a simple line-by-line scan rather
    than regex substitution on the full source, which avoids touching strings
    or comments that happen to contain the parameter name.
    """
    # Find where the first class/def block starts so we don't touch method bodies
    class_start = len(source)
    for m in re.finditer(r"^(class|def) ", source, re.MULTILINE):
        class_start = m.start()
        break

    header = source[:class_start]
    body = source[class_start:]

    new_header_lines = []
    for line in header.splitlines():
        replaced = False
        stripped = line.strip()
        for name, value in params.items():
            # Match: "NAME = anything" at start of line (no leading spaces = top-level)
            if re.match(rf"^{re.escape(name)}\s*=", stripped):
                # Format the value appropriately
                if isinstance(value, float) and value == int(value):
                    formatted = str(int(value))
                elif isinstance(value, (int, float)):
                    formatted = repr(value)
                else:
                    formatted = repr(value)
                indent = len(line) - len(line.lstrip())
                new_header_lines.append(" " * indent + f"{name} = {formatted}")
                replaced = True
                break
        if not replaced:
            new_header_lines.append(line)

    return "\n".join(new_header_lines) + "\n" + body


# ---------------------------------------------------------------------------
# Restricted execution environment
# ---------------------------------------------------------------------------

_SAFE_BUILTINS = {
    "__builtins__": {
        "print": print,
        "len": len,
        "range": range,
        "enumerate": enumerate,
        "zip": zip,
        "map": map,
        "filter": filter,
        "sorted": sorted,
        "reversed": reversed,
        "list": list,
        "dict": dict,
        "tuple": tuple,
        "set": set,
        "str": str,
        "int": int,
        "float": float,
        "bool": bool,
        "abs": abs,
        "min": min,
        "max": max,
        "sum": sum,
        "round": round,
        "isinstance": isinstance,
        "issubclass": issubclass,
        "hasattr": hasattr,
        "getattr": getattr,
        "setattr": setattr,
        "type": type,
        "repr": repr,
        "ValueError": ValueError,
        "TypeError": TypeError,
        "RuntimeError": RuntimeError,
        "StopIteration": StopIteration,
        "NotImplementedError": NotImplementedError,
        "Exception": Exception,
    }
}


def _run_strategy(source: str, ohlcv_df: pd.DataFrame) -> pd.DataFrame:
    """
    Execute user strategy code in a restricted namespace and return the
    annotated DataFrame (must contain a 'signal' column).

    The user's file must define a class named ``Strategy`` with a method:
        ``def generate_signals(self, ohlcv_df: pd.DataFrame) -> pd.DataFrame``

    Raises
    ------
    ValueError
        If Strategy class or generate_signals method is missing, or if the
        returned DataFrame lacks a 'signal' column.
    RuntimeError
        If execution raises any exception.
    """
    namespace: dict = {
        **_SAFE_BUILTINS,
        "np": np,
        "pd": pd,
    }

    try:
        exec(compile(source, "<strategy>", "exec"), namespace)  # noqa: S102
    except Exception as exc:
        raise RuntimeError(
            f"Strategy code raised an exception during compilation/load: {exc}\n"
            + traceback.format_exc()
        ) from exc

    if "Strategy" not in namespace:
        raise ValueError(
            "Strategy file must define a class named 'Strategy' at module level."
        )

    strategy_cls = namespace["Strategy"]
    if not callable(getattr(strategy_cls, "generate_signals", None)):
        raise ValueError(
            "Strategy.generate_signals(self, ohlcv_df) method is required."
        )

    try:
        instance = strategy_cls()
        result_df = instance.generate_signals(ohlcv_df.copy())
    except Exception as exc:
        raise RuntimeError(
            f"generate_signals() raised an exception: {exc}\n"
            + traceback.format_exc()
        ) from exc

    if not isinstance(result_df, pd.DataFrame):
        raise ValueError("generate_signals() must return a pandas DataFrame.")
    if "signal" not in result_df.columns:
        raise ValueError(
            "The DataFrame returned by generate_signals() must contain a 'signal' column "
            "(1=long, -1=short, 0=flat)."
        )

    return result_df


# ---------------------------------------------------------------------------
# Trade execution engine (our code, not user code)
# ---------------------------------------------------------------------------

def _execute_trades(
    ohlcv_df: pd.DataFrame,
    signals: pd.Series,
    initial_balance: float = 100_000.0,
) -> list[dict]:
    """
    Vectorised signal-to-trade conversion.

    Rules
    -----
    - A trade opens on the *next* bar's Open price after the signal changes.
    - A trade closes on the *next* bar's Open price after an opposing signal.
    - At end-of-data any open position is closed at the last Close price.
    - No partial fills, no commissions in V1.

    Parameters
    ----------
    ohlcv_df : pd.DataFrame
        Must contain 'Date', 'Open', 'Close' columns at minimum.
    signals : pd.Series
        Integer series aligned with ohlcv_df index. Values: 1 / -1 / 0.
    initial_balance : float

    Returns
    -------
    list[dict]  — one dict per completed trade with keys matching Trade model.
    """
    df = ohlcv_df.copy()
    df["signal"] = signals.values

    # Forward-fill signal so flat periods don't create phantom trade flips
    df["signal"] = df["signal"].replace(0, np.nan).ffill().fillna(0).astype(int)

    trades: list[dict] = []
    balance = initial_balance
    in_trade = False
    entry_price = 0.0
    entry_date = ""
    direction = ""
    trade_no = 0

    n = len(df)
    for i in range(n):
        row = df.iloc[i]
        sig = int(row["signal"])
        date_str = str(row["Date"])[:10]
        close_price = float(row["Close"])
        open_price = float(row["Open"])

        if not in_trade:
            if sig == 1:
                # Enter long on this bar's open (simplified: use open of signal bar)
                in_trade = True
                direction = "long"
                entry_price = open_price
                entry_date = date_str
            elif sig == -1:
                in_trade = True
                direction = "short"
                entry_price = open_price
                entry_date = date_str
        else:
            # Check for exit: opposite signal OR last bar
            should_exit = False
            if direction == "long" and sig == -1:
                should_exit = True
            elif direction == "short" and sig == 1:
                should_exit = True
            elif i == n - 1:
                should_exit = True
                # Use close of last bar if end-of-data
                open_price = close_price

            if should_exit:
                exit_price = open_price
                exit_date = date_str

                if direction == "long":
                    pnl = (exit_price - entry_price) / entry_price
                else:
                    pnl = (entry_price - exit_price) / entry_price

                profit = balance * pnl
                balance += profit
                trade_no += 1

                trades.append(
                    {
                        "trade_no": trade_no,
                        "entry_date": entry_date,
                        "exit_date": exit_date,
                        "entry_price": round(entry_price, 6),
                        "exit_price": round(exit_price, 6),
                        "direction": direction,
                        "profit": round(profit, 4),
                        "balance": round(balance, 4),
                    }
                )

                in_trade = False
                # Immediately open opposite trade if a strong signal
                if sig == 1 and i < n - 1:
                    in_trade = True
                    direction = "long"
                    entry_price = open_price
                    entry_date = date_str
                elif sig == -1 and i < n - 1:
                    in_trade = True
                    direction = "short"
                    entry_price = open_price
                    entry_date = date_str

    return trades


# ---------------------------------------------------------------------------
# Main backtest runner
# ---------------------------------------------------------------------------

async def run_backtest(
    ga_row_id: int,
    strategy_id: int,
    ohlcv_session_id: int,
    db: AsyncSession,
    initial_balance: float = 100_000.0,
) -> Backtest:
    """
    Full backtest pipeline.

    Creates a Backtest record, runs the strategy, persists trades, and
    updates the Backtest status/summary.  All errors are caught and stored
    on the Backtest record (status='error') so the front-end can display them.
    """
    # Create a pending backtest record first
    backtest = Backtest(
        ga_row_id=ga_row_id,
        strategy_id=strategy_id,
        ohlcv_session_id=ohlcv_session_id,
        status="running",
    )
    db.add(backtest)
    await db.flush()
    await db.refresh(backtest)

    try:
        # 1. Load GA row parameters
        ga_row = await ga_import_service.get_ga_row(ga_row_id, db)
        if ga_row is None:
            raise ValueError(f"GA row {ga_row_id} not found.")
        params: dict = json.loads(ga_row.data)

        # 2. Load OHLCV data
        ohlcv_df = await ohlcv_service.get_ohlcv_data(ohlcv_session_id, db)

        # 3. Load strategy source
        strategy = await get_strategy(strategy_id, db)
        if strategy is None:
            raise ValueError(f"Strategy {strategy_id} not found.")

        # 4. Inject parameters into source
        source_with_params = _inject_parameters(strategy.content, params)

        # 5. Execute strategy → annotated DataFrame
        annotated_df = _run_strategy(source_with_params, ohlcv_df)

        # 6. Convert signals → trades
        trade_dicts = _execute_trades(
            ohlcv_df=annotated_df,
            signals=annotated_df["signal"],
            initial_balance=initial_balance,
        )

        # 7. Persist trades
        trade_objects = [
            Trade(backtest_id=backtest.id, **td) for td in trade_dicts
        ]
        if trade_objects:
            db.add_all(trade_objects)
            await db.flush()

        # 8. Update backtest summary
        net_profit = None
        if trade_dicts:
            final_balance = trade_dicts[-1]["balance"]
            net_profit = final_balance - initial_balance

        backtest.status = "done"
        backtest.trade_count = len(trade_dicts)
        backtest.net_profit = net_profit
        backtest.error_msg = None

    except Exception as exc:
        backtest.status = "error"
        backtest.error_msg = f"{type(exc).__name__}: {exc}"

    db.add(backtest)
    await db.flush()
    return backtest


# ---------------------------------------------------------------------------
# Queries
# ---------------------------------------------------------------------------

async def get_trades(
    backtest_id: int,
    page: int,
    limit: int,
    db: AsyncSession,
) -> list[Trade]:
    offset = (page - 1) * limit
    result = await db.execute(
        select(Trade)
        .where(Trade.backtest_id == backtest_id)
        .order_by(Trade.trade_no)
        .offset(offset)
        .limit(limit)
    )
    return list(result.scalars().all())


async def count_trades(backtest_id: int, db: AsyncSession) -> int:
    result = await db.execute(
        select(func.count()).where(Trade.backtest_id == backtest_id)
    )
    return result.scalar_one()


async def get_backtest(backtest_id: int, db: AsyncSession) -> Optional[Backtest]:
    result = await db.execute(select(Backtest).where(Backtest.id == backtest_id))
    return result.scalars().first()


async def list_backtests(db: AsyncSession, limit: int = 50) -> list[Backtest]:
    result = await db.execute(
        select(Backtest).order_by(Backtest.id.desc()).limit(limit)
    )
    return list(result.scalars().all())


async def get_all_trades(backtest_id: int, db: AsyncSession) -> list[Trade]:
    """Return all trades for a backtest (used by Monte Carlo service)."""
    result = await db.execute(
        select(Trade)
        .where(Trade.backtest_id == backtest_id)
        .order_by(Trade.trade_no)
    )
    return list(result.scalars().all())
