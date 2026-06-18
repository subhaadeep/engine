# GA Parameter Explorer

> Professional quantitative trading research platform for GA optimization result analysis, dynamic backtesting, and Monte Carlo risk simulation.

![GA Parameter Explorer](docs/screenshot.png)

## Overview

GA Parameter Explorer is a desktop application built with **Tauri v2**, **React + TypeScript + Material UI** (frontend), and **Python FastAPI** (backend). It allows traders and quant researchers to:

1. **Import** GA optimization results (CSV) and historical OHLCV data
2. **Filter** parameter sets dynamically across hundreds of parameters
3. **Explore** the best-ranked parameter combinations
4. **Backtest** selected parameters against historical data using custom Python strategies
5. **Simulate** trade robustness with Monte Carlo analysis (up to 10,000 paths)
6. **Analyze** risk metrics: drawdown distribution, risk of ruin, return distribution

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop Shell | Tauri v2 |
| Frontend | React 18 + TypeScript + Material UI v6 + Vite |
| State Management | Zustand |
| Charts | Plotly.js (WebGL / scattergl) |
| Backend | Python FastAPI + uvicorn |
| Data Processing | Pandas + NumPy |
| Monte Carlo | Numba (JIT, parallel) |
| Database | SQLite (aiosqlite + SQLAlchemy 2.0) |

---

## Quick Start

### Prerequisites

- **Node.js** 18+ and **npm** 9+
- **Python** 3.11+
- **Rust** (stable) + Tauri CLI v2
- **Git**

### First-time Setup

```bash
# Clone and enter project
git clone <repo-url>
cd Engine

# Install all dependencies (Python venv + Node modules)
make setup
```

### Development

```bash
# Start everything (backend + frontend + Tauri shell)
make dev
```

Or run components separately:

```bash
# Terminal 1: Start Python backend only
make backend

# Terminal 2: Start Tauri frontend only (requires backend running)
make frontend
```

### Production Build

```bash
# Build Python sidecar + Tauri desktop app
make build
```

---

## Project Structure

```
Engine/
├── src-tauri/              # Tauri Rust shell
│   ├── src/
│   │   ├── main.rs         # Entry point
│   │   └── lib.rs          # Sidecar spawning, Tauri commands
│   ├── capabilities/       # Tauri v2 permission declarations
│   ├── binaries/           # Built PyInstaller sidecar goes here
│   └── tauri.conf.json
│
├── frontend/               # React + TypeScript + MUI
│   ├── src/
│   │   ├── api/            # Axios API clients
│   │   ├── components/     # UI components
│   │   ├── pages/          # Page-level components
│   │   ├── store/          # Zustand state stores
│   │   ├── theme/          # MUI dark theme
│   │   └── types/          # TypeScript interfaces
│   └── vite.config.ts
│
├── backend/                # Python FastAPI sidecar
│   ├── app/
│   │   ├── routers/        # FastAPI route handlers
│   │   ├── services/       # Business logic
│   │   ├── models/         # SQLModel DB models
│   │   ├── schemas/        # Pydantic request/response schemas
│   │   ├── core/           # Config, database setup
│   │   ├── utils/          # Numba kernels, validators
│   │   └── strategies/     # Sample strategy files
│   ├── requirements.txt
│   └── run.py              # PyInstaller entry
│
├── scripts/
│   ├── setup.sh            # First-time setup
│   ├── dev.sh              # Development startup
│   └── build_backend.sh    # PyInstaller build + copy
│
└── Makefile                # Dev/build commands
```

---

## Strategy Interface

User strategies must follow this structure:

```python
# my_strategy.py
import pandas as pd
import numpy as np

# ─── PARAMETERS (matched to GA CSV column names) ────────────────
RSI_Period = 14      # ← name must match CSV column exactly
ATR_Length = 14
RSI_OB = 70
RSI_OS = 30

# ─── STRATEGY CLASS ─────────────────────────────────────────────
class Strategy:
    def generate_signals(self, ohlcv_df: pd.DataFrame) -> pd.DataFrame:
        """
        Returns the input DataFrame with an added 'signal' column:
          1  = Long entry
         -1  = Short entry
          0  = No signal / Exit
        """
        df = ohlcv_df.copy()
        # ... your logic here ...
        df['signal'] = 0
        return df
```

**Parameter injection**: When you click "Run Backtest" for a specific parameter set,
the system automatically replaces the default parameter values with the selected GA row values
before execution. Column names in the CSV must match variable names in the strategy file exactly.

---

## API Reference

The FastAPI backend runs on `http://localhost:8765`.

### Import
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/import/ga-results` | Upload GA optimization results CSV |
| `POST` | `/api/import/ohlcv` | Upload historical OHLCV CSV |
| `GET` | `/api/import/status` | Check current import status |

### Filter
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/filter/columns?session_id=1` | Get column ranges for filter UI |
| `POST` | `/api/filter/apply` | Apply filters and get top-N results |

### Backtest
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/backtest/upload-strategy` | Upload strategy Python file |
| `GET` | `/api/backtest/strategies` | List uploaded strategies |
| `POST` | `/api/backtest/run` | Execute backtest |
| `GET` | `/api/backtest/trades/{id}` | Get trade history (paginated) |

### Monte Carlo
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/montecarlo/run` | Start Monte Carlo simulation |
| `GET` | `/api/montecarlo/results/{id}` | Get simulation results |

Interactive API docs: `http://localhost:8765/docs`

---

## Performance Targets

| Operation | Target |
|-----------|--------|
| Filter 50,000 GA rows | < 1 second |
| Backtest execution | As fast as strategy logic allows |
| Monte Carlo (10k sims) | 5–30 seconds (Numba JIT) |
| Chart rendering (10k curves) | < 2 seconds (WebGL scattergl) |

---

## Future Features (Post V1)

- Prop Firm Pass Probability analysis
- Walk Forward Analysis
- Parameter Stability / Cluster Analysis
- Multi-Asset Testing
- Custom Ranking Formula Builder
- AI-Assisted Parameter Selection
- Portfolio Monte Carlo
- Cloud Execution

---

## License

MIT
