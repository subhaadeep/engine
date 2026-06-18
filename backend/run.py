"""
GA Parameter Explorer — Backend Entry Point
PyInstaller-compatible launcher.
"""
import multiprocessing
import argparse
import uvicorn

if __name__ == '__main__':
    multiprocessing.freeze_support()
    parser = argparse.ArgumentParser(description='GA Parameter Explorer API Server')
    parser.add_argument('--port', type=int, default=8765, help='Port to listen on (default: 8765)')
    parser.add_argument('--db-path', type=str, default='./trading.db', help='Path to SQLite database')
    parser.add_argument('--host', type=str, default='127.0.0.1', help='Host to bind to')
    parser.add_argument('--reload', action='store_true', help='Enable auto-reload (dev only)')
    args = parser.parse_args()

    # Pass DB path via environment so config.py picks it up
    import os
    os.environ['DB_PATH'] = args.db_path

    uvicorn.run(
        'app.main:app',
        host=args.host,
        port=args.port,
        workers=1,
        reload=args.reload,
        log_level='info',
    )
