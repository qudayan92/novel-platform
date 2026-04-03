@echo off
echo Starting Novel Platform...

echo.
echo [1/2] Starting Backend...
start cmd /k "cd backend && npm install && npm run dev"

timeout /t 3 /nobreak > nul

echo.
echo [2/2] Starting Frontend...
start cmd /k "cd frontend && npm install && npm run dev"

echo.
echo ========================================
echo  Novel Platform is starting!
echo  Frontend: http://localhost:5173
echo  Backend:  http://localhost:3000
echo ========================================
pause
