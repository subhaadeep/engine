#!/usr/bin/env python
"""
GA Engine  —  local development launcher

Usage
-----
  cd backend
  python start.py

This script:
  1. Checks Python version (3.10+)
  2. Auto-installs missing dependencies from requirements.txt
  3. Starts uvicorn on http://127.0.0.1:8765
  4. Prints version + docs URL so you can confirm the update loaded
"""
from __future__ import annotations

import subprocess
import sys
import os

# ── version shown in terminal (must match main.py APP_VERSION) ───────────────
START_VERSION = "1.0.3"
# ───────────────────────────────────────────────────────────────────────────

BANNER = f"""
┌─────────────────────────────────────────┐
│   GA Engine  v{START_VERSION}                     │
│   http://127.0.0.1:8765                   │
│   Docs  →  http://127.0.0.1:8765/docs     │
│   Version → http://127.0.0.1:8765/api/version │
└─────────────────────────────────────────┘
"""


def check_python():
    major, minor = sys.version_info[:2]
    if (major, minor) < (3, 10):
        print(f"[ERROR] Python 3.10+ required. You have {major}.{minor}")
        sys.exit(1)


def install_deps():
    req = os.path.join(os.path.dirname(__file__), "requirements.txt")
    if not os.path.exists(req):
        print("[WARN] requirements.txt not found, skipping auto-install")
        return
    print("[start.py] Checking / installing dependencies...")
    result = subprocess.run(
        [sys.executable, "-m", "pip", "install", "-r", req, "--quiet"],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        print("[WARN] pip install had issues:")
        print(result.stderr[-2000:])
    else:
        print("[start.py] Dependencies OK")


def main():
    check_python()
    install_deps()

    # Change to backend/ dir so relative paths (./trading.db, ./data) are correct
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    print(BANNER)

    try:
        import uvicorn
    except ImportError:
        print("[ERROR] uvicorn not found. Run:  pip install uvicorn")
        sys.exit(1)

    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8765,
        reload=True,          # auto-reload on file save
        reload_dirs=["app"],
        log_level="info",
    )


if __name__ == "__main__":
    main()
