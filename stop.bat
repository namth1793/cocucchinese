@echo off
echo Dang dung Backend (4000) va Frontend (5173)...

for /f "tokens=5" %%p in ('netstat -ano ^| findstr :4000 ^| findstr LISTENING') do taskkill /F /PID %%p >nul 2>&1
for /f "tokens=5" %%p in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') do taskkill /F /PID %%p >nul 2>&1

echo Da dung xong.
pause
