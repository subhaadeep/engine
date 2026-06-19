#!/usr/bin/env python
"""
GA Engine  —  local development launcher  v1.0.4

Usage
-----
  cd backend
  python start.py          # uses whatever python ran this script

What it does
  1. Detects whether pip is available (handles uv-managed venvs)
  2. Installs missing deps via  uv pip install  OR  pip install
  3. Starts uvicorn on http://127.0.0.1:8765  with --reload
"""
from __future__ import annotations

import importlib
import os
import subprocess
import sys

# ── version ────────────────────────────────────────────────────────────────
START_VERSION = "1.0.4"


BANNER = f"""
┌───────────────────────────────────────────┐
│  GA Engine  v{START_VERSION}                       │
│  http://127.0.0.1:8765                    │
│  Docs    → /docs                           │
│  Version → /api/version                   │
│  Health  → /api/health                    │
└───────────────────────────────────────────┘
"""

REQUIRED = [
    "fastapi", "uvicorn", "sqlmodel", "sqlalchemy",
    "aiosqlite", "greenlet", "pandas", "numpy",
    "pydantic", "pydantic_settings", "multipart", "watchfiles",
]


def _pip_available() -> bool:
    """Return True if pip is importable in this interpreter."""
    try:
        import pip  # noqa: F401
        return True
    except ImportError:
        return False


def _uv_available() -> bool:
    """Return True if the  uv  CLI is on PATH."""
    return subprocess.run(
        ["uv", "--version"], capture_output=True
    ).returncode == 0


def install_deps() -> None:
    req = os.path.join(os.path.dirname(os.path.abspath(__file__)), "requirements.txt")
    if not os.path.exists(req):
        print("[start.py] WARNING: requirements.txt not found, skipping dep install")
        return

    print("[start.py] Installing / syncing dependencies...")

    if _uv_available():
        # uv pip install works even when the venv has no pip module
        cmd = ["uv", "pip", "install", "-r", req]
        label = "uv pip"
    elif _pip_available():
        cmd = [sys.executable, "-m", "pip", "install", "-r", req, "--quiet"]
        label = "pip"
    else:
        # Last resort: ensurepip then pip
        print("[start.py] pip not found — bootstrapping via ensurepip...")
        subprocess.run([sys.executable, "-m", "ensurepip", "--upgrade"], check=False)
        cmd = [sys.executable, "-m", "pip", "install", "-r", req, "--quiet"]
        label = "pip (bootstrapped)"

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"[start.py] WARNING: {label} install had issues:")
        print(result.stderr[-3000:])
    else:
        print(f"[start.py] Dependencies OK  (via {label})")


def check_critical() -> None:
    """Hard-fail early if a critical package is missing after install attempt."""
    missing = []
    for pkg in ("fastapi", "uvicorn", "sqlalchemy", "aiosqlite", "greenlet"):
        try:
            importlib.import_module(pkg)
        except ImportError:
            missing.append(pkg)
    if missing:
        print("\n[start.py] FATAL: still missing packages after install:")
        for m in missing:
            print(f"   pip install {m}")
        print("\nIf you use a uv venv without pip, run:")
        print("   uv pip install -r requirements.txt")
        print("then:")
        print("   python start.py")
        sys.exit(1)


def main() -> None:
    major, minor = sys.version_info[:2]
    if (major, minor) < (3, 10):
        print(f"[ERROR] Python 3.10+ required. You have {major}.{minor}")
        sys.exit(1)

    # Always cd to the backend/ directory so ./trading.db and ./data/ resolve correctly
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    install_deps()
    check_critical()

    print(BANNER)

    import uvicorn  # imported AFTER install_deps so it’s guaranteed present
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8765,
        reload=True,
        reload_dirs=["app"],
        log_level="info",
    )


if __name__ == "__main__":
    main()
