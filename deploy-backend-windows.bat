@echo off
REM Quick Backend Deployment Script for Windows EC2

echo ================================================================
echo     CodeBattle Backend Deployment (Windows)
echo ================================================================
echo.

REM Get EC2 IP
echo Detecting EC2 public IP...
for /f %%i in ('powershell -Command "(Invoke-WebRequest -Uri http://169.254.169.254/latest/meta-data/public-ipv4 -UseBasicParsing).Content"') do set EC2_IP=%%i

if "%EC2_IP%"=="" (
    set /p EC2_IP="Enter EC2 Public IP: "
)

echo [OK] EC2 IP: %EC2_IP%
echo.

REM Navigate to backend
cd backend

REM Install dependencies
echo ================================================================
echo Installing backend dependencies...
echo ================================================================
npm install
echo.

REM Create .env if not exists
if not exist ".env" (
    echo Creating .env file...
    copy .env.example .env
    
    REM Update with EC2 IP
    powershell -Command "(Get-Content .env) -replace 'http://localhost:8081', 'http://%EC2_IP%:8080' | Set-Content .env"
    powershell -Command "(Get-Content .env) -replace 'NODE_ENV=development', 'NODE_ENV=production' | Set-Content .env"
    
    echo.
    echo [IMPORTANT] Edit backend\.env and add AWS credentials:
    echo    notepad .env
    echo.
    pause
)

REM Create DynamoDB tables
echo ================================================================
echo Creating DynamoDB tables...
echo ================================================================
echo.

set /p CREATE_TABLES="Create DynamoDB tables? (y/n): "
if /i "%CREATE_TABLES%"=="y" (
    node create-users-dynamodb-table.js
    node create-questions-dynamodb-table.js
    node create-solved-problems-table.js
    
    set /p SEED="Seed sample data? (y/n): "
    if /i "%SEED%"=="y" (
        node seed-questions-dynamodb.js
    )
)

echo.

REM Open firewall port
echo ================================================================
echo Opening firewall port 3001...
echo ================================================================
netsh advfirewall firewall add rule name="CodeBattle Backend 3001" dir=in action=allow protocol=TCP localport=3001
echo.

REM Start with PM2
echo ================================================================
echo Starting backend with PM2...
echo ================================================================
echo.

REM Delete existing process if any
pm2 delete codebattle-backend 2>nul

REM Start backend
pm2 start npm --name "codebattle-backend" -- run dev

REM Save PM2 config
pm2 save

echo.
echo ================================================================
echo Backend Deployment Complete!
echo ================================================================
echo.

pm2 list

echo.
echo Backend is running at: http://%EC2_IP%:3001
echo Health check: http://%EC2_IP%:3001/health
echo.
echo Next steps:
echo 1. Update frontend .env with: VITE_API_URL=http://%EC2_IP%:3001/api
echo 2. Rebuild frontend: npm run build
echo 3. Restart frontend: pm2 restart all
echo.
echo Useful commands:
echo   pm2 list              - View processes
echo   pm2 logs              - View logs
echo   pm2 restart all       - Restart services
echo.
pause
