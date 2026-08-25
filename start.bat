@echo off
setlocal

set ROOT=%~dp0

echo Dang khoi dong Backend (cong 4000)...
start "Cocuc - Backend" cmd /k "cd /d "%ROOT%backend" && npm run dev"

echo Dang khoi dong Frontend (cong 5173)...
start "Cocuc - Frontend" cmd /k "cd /d "%ROOT%frontend" && npm run dev"

timeout /t 3 /nobreak >nul
start "" http://localhost:5173

echo.
echo Da mo 2 cua so: Backend va Frontend.
echo Truy cap: http://localhost:5173
echo Dong 2 cua so do de tat server.
echo.
pause
