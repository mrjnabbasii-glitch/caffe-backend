@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Install Node.js 22 or newer, then run this file again.
  pause
  exit /b 1
)
node -e "if(Number(process.versions.node.split('.')[0]) < 22) process.exit(1)"
if errorlevel 1 (
  echo Node.js 22 or newer is required.
  pause
  exit /b 1
)
if not exist "server\node_modules\mongoose\package.json" goto install
if not exist "server\node_modules\mongodb-memory-server-core\package.json" goto install
if not exist "cafe-aramesh-final-task\node_modules\vite\package.json" goto install
if not exist "server\node_modules\typescript\bin\tsc" goto install
if not exist "server\node_modules\class-validator\package.json" goto install
if not exist "server\node_modules\class-transformer\package.json" goto install
goto run
:install
echo Installing dependencies. Please wait...
call npm.cmd run setup
if errorlevel 1 (
  echo Installation failed. Check the internet connection and the error above.
  pause
  exit /b 1
)
:run
call npm.cmd run dev:local
if errorlevel 1 pause
