# GA Parameter Explorer — Sample Strategy: RSI + ATR
# ====================================================
# This file shows the exact format expected by the backtest engine.
#
# HOW IT WORKS
# ------------
# 1. Upload this file via POST /api/backtest/upload-strategy
# 2. Select a GA results row — the engine will replace the parameter values
#    below with the corresponding column values from that row.
# 3. Run the backtest via POST /api/backtest/run
#
# PARAMETER INJECTION
# --------------------
# Any top-level assignment like "RSI_Period = 14" will be overwritten by
# the GA parameter of the same name if it exists in the GA results CSV.
# Names are case-sensitive.
#
# SIGNAL CONTRACT
# ---------------
# generate_signals() must return the OHLCV DataFrame with an added
# 'signal' column:
#   1  → go long
#  -1  → go short
#   0  → flat / no position
#
# The backtest engine handles the trade execution — do NOT implement
# trade logic inside generate_signals().

import pandas as pd
import numpy as np

# ============================================================
# PARAMETERS  ← injected from GA results row at backtest time
# ============================================================
RSI_Period = 14
ATR_Length = 14
RSI_OB = 70       # Overbought threshold → short entry
RSI_OS = 30       # Oversold threshold  → long entry


# ============================================================
# STRATEGY CLASS  (must be named exactly "Strategy")
# ============================================================
class Strategy:
    """RSI mean-reversion with ATR-based regime filter."""

    def generate_signals(self, ohlcv_df: pd.DataFrame) -> pd.DataFrame:
        """
        Parameters
        ----------
        ohlcv_df : pd.DataFrame
            Must contain columns: Date, Open, High, Low, Close.
            Volume column is optional.

        Returns
        -------
        pd.DataFrame
            Same DataFrame with an added 'signal' column (int: 1, -1, or 0).
        """
        df = ohlcv_df.copy()

        # ── RSI ────────────────────────────────────────────────────────────
        delta = df["Close"].diff()
        gain = delta.clip(lower=0.0).rolling(window=RSI_Period, min_periods=RSI_Period).mean()
        loss = (-delta.clip(upper=0.0)).rolling(window=RSI_Period, min_periods=RSI_Period).mean()
        rs = gain / loss.replace(0.0, np.nan)
        df["RSI"] = 100.0 - (100.0 / (1.0 + rs))

        # ── ATR (True Range) ───────────────────────────────────────────────
        hl = df["High"] - df["Low"]
        hc = (df["High"] - df["Close"].shift(1)).abs()
        lc = (df["Low"] - df["Close"].shift(1)).abs()
        tr = pd.concat([hl, hc, lc], axis=1).max(axis=1)
        df["ATR"] = tr.rolling(window=ATR_Length, min_periods=ATR_Length).mean()

        # ── ATR regime filter: only trade when market is "moving" ──────────
        # ATR must be at least 0.5 % of Close price to avoid choppy markets
        atr_filter = df["ATR"] >= (df["Close"] * 0.005)

        # ── Signals ────────────────────────────────────────────────────────
        df["signal"] = 0

        long_cond = (df["RSI"] < RSI_OS) & atr_filter
        short_cond = (df["RSI"] > RSI_OB) & atr_filter

        df.loc[long_cond, "signal"] = 1    # Oversold  → long entry
        df.loc[short_cond, "signal"] = -1  # Overbought → short entry

        return df
