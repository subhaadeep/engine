# GA Engine — Local Launcher

Run the entire engine on your **local computer** (no VPS needed).  
One double-click: pulls latest code, sets up env, starts backend + frontend, opens browser.

---

## Requirements (install once)

| Tool | Windows | Mac |
|---|---|---|
| Git | [git-scm.com](https://git-scm.com/download/win) | `brew install git` |
| Python 3.10+ | [python.org](https://www.python.org/downloads/) | `brew install python3` |
| Node.js 18+ | [nodejs.org](https://nodejs.org/) | `brew install node` |

---

## First-Time Setup

### Windows
```
1. Install Git, Python, Node.js (links above)
2. Open PowerShell:
   git clone https://github.com/subhaadeep/engine.git C:\engine
3. Double-click: C:\engine\launcher\launch-local.bat
   (first run takes 2-3 min to install all packages)
```

### Mac
```
1. Install tools: brew install git python3 node
2. Open Terminal:
   git clone https://github.com/subhaadeep/engine.git ~/engine
   chmod +x ~/engine/launcher/launch-local.sh
3. Double-click: ~/engine/launcher/launch-local.sh
   (first run takes 2-3 min to install all packages)
```

---

## Daily Use

| OS | Action |
|---|---|
| **Windows** | Double-click `launcher/launch-local.bat` |
| **Mac** | Double-click `launcher/launch-local.sh` |

The launcher automatically:
- Checks GitHub for new commits
- Pulls + rebuilds only if there are updates
- Starts backend on `http://localhost:8765`
- Starts frontend on `http://localhost:5173`
- Opens browser automatically

**Press any key (Windows) or Ctrl+C (Mac) to stop.**

---

## URLs

| Service | URL |
|---|---|
| Frontend (App) | http://localhost:5173 |
| Backend API Docs | http://localhost:8765/docs |
| Backend Health | http://localhost:8765/api/health |

---

## Logs

| OS | Backend Log | Frontend Log |
|---|---|---|
| Windows | `backend\\backend.log` | `frontend\\frontend.log` |
| Mac | `/tmp/ga-backend.log` | `/tmp/ga-frontend.log` |
