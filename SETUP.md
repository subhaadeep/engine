# GA Parameter Explorer — Setup Guide

A local-first Tauri desktop app (React + FastAPI) for exploring genetic algorithm trading parameter spaces, running backtests, and running Monte Carlo risk simulations.

---

## Prerequisites

| Tool | Min version | Install |
|------|-------------|--------|
| Python | 3.10+ | [python.org](https://python.org) |
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| Rust | stable | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` |

---

## Quick Start (Browser Dev Mode)

Browser mode runs the React frontend + FastAPI backend without Tauri. Fastest for development.

```bash
# 1. Clone
git clone https://github.com/subhaadeep/engine.git
cd engine

# 2. One-time setup
chmod +x scripts/setup.sh scripts/dev.sh
./scripts/setup.sh

# 3. Start dev servers (both frontend + backend)
./scripts/dev.sh
# Open http://localhost:5173
```

---

## Manual Setup (Windows)

### Backend
```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
# Run:
uvicorn app.main:app --host 0.0.0.0 --port 8765 --reload
```

### Frontend
```powershell
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

---

## Tauri Desktop Build

```bash
cd frontend
npm run tauri build
# Installer at: src-tauri/target/release/bundle/
```

---

## Project Structure

```
engine/
├── backend/                  # FastAPI server
│   ├── app/
│   │   ├── main.py           # App entry, lifespan, CORS
│   │   ├── core/             # Config, database
│   │   ├── models/           # SQLModel tables
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   ├── routers/          # API route handlers
│   │   ├── services/         # Business logic
│   │   └── utils/            # Numba kernels, helpers
│   ├── requirements.txt
│   └── run.py                # PyInstaller entry point
├── frontend/                 # React + Vite + MUI
│   └── src/
│       ├── api/              # Axios API clients
│       ├── store/            # Zustand state stores
│       ├── types/            # TypeScript interfaces
│       ├── pages/            # Route-level components
│       └── components/       # UI components
├── src-tauri/                # Tauri desktop wrapper
└── scripts/                  # setup.sh, dev.sh, build_backend.sh
```

---

## API Endpoints (Backend: http://localhost:8765)

| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/import/ga-results` | Upload GA results CSV |
| POST | `/api/import/ohlcv` | Upload OHLCV price data CSV |
| GET | `/api/import/status` | Check import readiness |
| GET | `/api/filter/columns?session_id=N` | Get column ranges for a GA session |
| POST | `/api/filter/apply` | Filter & rank GA rows |
| POST | `/api/backtest/upload-strategy` | Upload Python strategy file |
| GET | `/api/backtest/strategies` | List all strategies |
| POST | `/api/backtest/run` | Run a backtest |
| GET | `/api/backtest/trades/{id}` | Get paginated trades |
| GET | `/api/backtest/list` | List recent backtests |
| POST | `/api/montecarlo/run` | Run Monte Carlo simulation |
| GET | `/api/montecarlo/results/{id}` | Get MC results |
| GET | `/api/montecarlo/runs/{backtest_id}` | List MC runs for a backtest |

---

## Strategy File Format

Upload a `.py` file that defines a class `Strategy` with a `generate_signals` method:

```python
# my_strategy.py
import pandas as pd

# Parameters are injected at runtime from the GA row:
# FAST_PERIOD = 10  (example)
# SLOW_PERIOD = 30

class Strategy:
    def generate_signals(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Receive OHLCV DataFrame with columns: Date, Open, High, Low, Close, [Volume]
        Return the SAME DataFrame with an added 'signal' column:
          +1  = enter long / exit short
          -1  = enter short / exit long
           0  = hold
        """
        fast = df['Close'].rolling(FAST_PERIOD).mean()
        slow = df['Close'].rolling(SLOW_PERIOD).mean()
        df['signal'] = 0
        df.loc[fast > slow, 'signal'] = 1
        df.loc[fast < slow, 'signal'] = -1
        return df
```

---

## GA Results CSV Format

Any CSV produced by your genetic algorithm optimizer. Must have numeric columns representing strategy parameters.

```csv
FAST_PERIOD,SLOW_PERIOD,RSI_PERIOD,fitness
10,30,14,0.82
12,28,12,0.79
...
```

## OHLCV CSV Format

```csv
Date,Open,High,Low,Close,Volume
2020-01-01,100.0,105.0,98.0,103.0,1000000
...
```
