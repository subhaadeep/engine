# GA Engine Launcher

Double-click one file on your local PC — it auto-updates from GitHub and restarts the engine on your VPS.

## First-Time Setup (One Time Only)

### Windows PC
1. Double-click `setup-ssh-key.bat`
2. Enter your VPS password when asked (only this once)
3. Done — SSH key is saved, no more passwords

### Mac/Linux PC
1. Open Terminal, run: `bash setup-ssh-key.sh`
2. Enter your VPS password when asked (only this once)
3. Done

## Daily Use

### Windows
- Double-click **`launch-engine.bat`**
- It will: check GitHub → pull if updated → rebuild if needed → restart services → open browser

### Mac/Linux
- Double-click **`launch-engine.sh`** (or right-click → Open)
- Or run: `bash launch-engine.sh`

## What It Does Each Time

```
1. SSH into your VPS
2. git fetch — check if GitHub has new commits
3. If yes: git pull + npm install + vite build (rebuild frontend)
4. Stop old backend/frontend processes
5. Start fresh backend (uvicorn port 8765)
6. Start fresh frontend (serve port 3000)
7. Print the URL + open browser (Windows only)
```

## No Update = Fast Start
If GitHub has no new commits, it skips the rebuild step and just restarts the services in ~5 seconds.

## Customize VPS IP
If your VPS IP changes, edit the top of `launch-engine.bat` or `launch-engine.sh`:
```
SET VPS_IP=YOUR_NEW_IP
```
