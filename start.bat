@echo off
title Workshop Manager
color 0A

:: Kill any old server on port 3001
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do (
    taskkill /PID %%a /F >nul 2>&1
)

echo.
echo  =============================================
echo   Workshop Manager
echo  =============================================
echo.
echo  Starting server...
cd /d E:\WorkshopApp

node --env-file=.env server/index.js

echo.
echo  Server stopped. Press any key to exit.
pause >nul
