# ─────────────────────────────────────────────────────────────────────────────
# GA Parameter Explorer — Makefile
# ─────────────────────────────────────────────────────────────────────────────

.PHONY: setup dev build build-backend clean test help

## Show this help
help:
	@echo ""
	@echo "  GA Parameter Explorer — Available Commands"
	@echo "  ─────────────────────────────────────────────"
	@echo "  make setup          First-time project setup"
	@echo "  make dev            Start development environment"
	@echo "  make build          Build production desktop app"
	@echo "  make build-backend  Build only the Python sidecar"
	@echo "  make clean          Remove build artifacts"
	@echo "  make test-backend   Run Python backend tests"
	@echo ""

## First-time project setup (installs all dependencies)
setup:
	@bash scripts/setup.sh

## Start development: FastAPI backend + Tauri dev frontend
dev:
	@bash scripts/dev.sh

## Build Python backend PyInstaller binary
build-backend:
	@bash scripts/build_backend.sh

## Build production Tauri desktop app (runs build-backend first)
build: build-backend
	@echo "[BUILD] Building Tauri desktop app..."
	@cd frontend && npm run tauri build

## Run backend unit tests
test-backend:
	@echo "[TEST] Running Python backend tests..."
	@cd backend && source .venv/bin/activate && python -m pytest tests/ -v

## Clean all build artifacts
clean:
	@echo "[CLEAN] Removing build artifacts..."
	@rm -rf backend/dist backend/build backend/__pycache__
	@rm -rf frontend/dist
	@rm -rf src-tauri/target
	@rm -f src-tauri/binaries/python-backend-*
	@echo "[CLEAN] Done."

## Start only the backend (for development/debugging)
backend:
	@echo "[DEV] Starting backend only..."
	@cd backend && source .venv/bin/activate && uvicorn app.main:app --host 127.0.0.1 --port 8765 --reload

## Start only the frontend (Tauri dev mode — requires backend running)
frontend:
	@echo "[DEV] Starting frontend only..."
	@cd frontend && npm run tauri dev
