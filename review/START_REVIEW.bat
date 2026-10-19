@echo off
setlocal
cd /d "%~dp0"
set PORT=41971
set URL=http://127.0.0.1:%PORT%/review-start.html

echo Arcade Incremental - Manual Review V1
if exist BUILD_INFO.txt (
  echo.
  type BUILD_INFO.txt
)
echo.
echo Review save is isolated on 127.0.0.1:%PORT%.
echo Close this window or press Ctrl+C when you finish.
echo.

where py >nul 2>nul
if not errorlevel 1 (
  start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Milliseconds 900; Start-Process '%URL%'"
  py -3 -m http.server %PORT% --bind 127.0.0.1 --directory dist
  goto :eof
)

where python >nul 2>nul
if not errorlevel 1 (
  start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Milliseconds 900; Start-Process '%URL%'"
  python -m http.server %PORT% --bind 127.0.0.1 --directory dist
  goto :eof
)

echo ERROR: Python 3 was not found in PATH.
echo Install Python 3 or launch the dist folder with any local static HTTP server on port %PORT%.
echo Then open: %URL%
echo.
pause
