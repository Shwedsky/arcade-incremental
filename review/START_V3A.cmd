@echo off
setlocal
cd /d "%~dp0"
title Arcade Incremental V3-A Owner Review

echo Arcade Incremental V3-A - Owner Review
echo Starting local game server...
echo.

where powershell.exe >nul 2>nul
if errorlevel 1 (
  echo ERROR: Windows PowerShell was not found.
  echo This launcher requires only the PowerShell included with Windows 10/11.
  echo.
  pause
  exit /b 1
)

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve_v3a.ps1"
set "EXIT_CODE=%ERRORLEVEL%"

if not "%EXIT_CODE%"=="0" (
  echo.
  echo ERROR: V3-A launcher stopped with code %EXIT_CODE%.
  echo Details are saved in launcher-v3a.log next to this file.
  echo.
  pause
)

endlocal & exit /b %EXIT_CODE%
