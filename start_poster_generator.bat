@echo off
setlocal
cd /d "%~dp0"
set PORT=8088

where py >nul 2>nul
if %errorlevel%==0 (
  start "" "http://localhost:%PORT%/"
  py -3 -m http.server %PORT%
  exit /b %errorlevel%
)

where python >nul 2>nul
if %errorlevel%==0 (
  start "" "http://localhost:%PORT%/"
  python -m http.server %PORT%
  exit /b %errorlevel%
)

echo Python is not installed. Opening the app directly instead.
echo Installable app mode requires Python or another local web server.
start "" "%~dp0index.html"
pause
