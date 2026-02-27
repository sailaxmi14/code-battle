 @echo off
REM CodeBattle Production Deployment Script for EC2 (Windows)
REM This script sets up both backend and frontend on Windows EC2 with PM2

echo ================================================================
echo     CodeBattle Production Deployment on EC2 (Windows)
echo ================================================================
echo.

REM Get EC2 public IP (Windows method)
echo Detecting EC2 public IP...
for /f %%i in ('powershell -Command "(Invoke-WebRequest -Uri http://169.254.169.254/latest/meta-data/public-ipv4 -UseBasicParsing).Content"') do set EC2_IP=%%i

if "%EC2_IP%"=="" (
    echo [WARNING] Could not detect EC2 IP automatically.
    set /p EC2_IP="Please enter EC2 Public IP: "
)

echo [OK] EC2 Public IP: %EC2_IP%
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js 18+ from: https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js version:
node --version
echo.

REM Install PM2 globally
where pm2 >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Installing PM2...
    call npm install -g pm2
    call npm install -g pm2-windows-startup
    pm2-startup install
)

echo [OK] PM2 installed
echo.

REM Step 1: Install dependencies
echo ================================================================
echo Installing dependencies...
echo ================================================================
echo.

echo Installing backend dependencies...
cd backend
call npm install --production
cd ..

echo Installing frontend dependencies...
call npm install
echo.

REM Step 2: Configure environment files
echo ================================================================
echo Configuring environment files...
echo ================================================================
echo.

if not exist "backend\.env" (
    echo Creating backend\.env...
    copy backend\.env.example backend\.env
    
    REM Update with EC2 IP using PowerShell
    powershell -Command "(Get-Content backend\.env) -replace 'http://localhost:8081', 'http://%EC2_IP%:8081' | Set-Content backend\.env"
    powershell -Command "(Get-Content backend\.env) -replace 'NODE_ENV=development', 'NODE_ENV=production' | Set-Content backend\.env"
    
    echo.
    echo [IMPORTANT] Edit backend\.env and add your AWS credentials:
    echo    notepad backend\.env
    echo.
    echo Required variables:
    echo    - AWS_ACCESS_KEY_ID
    echo    - AWS_SECRET_ACCESS_KEY
    echo    - JWT_SECRET (change the default!)
    echo.
    pause
)

if not exist ".env" (
    echo Creating frontend .env...
    copy .env.example .env
    
    REM Update with EC2 IP
    powershell -Command "(Get-Content .env) -replace 'http://localhost:3001', 'http://%EC2_IP%:3001' | Set-Content .env"
)

echo [OK] Environment files configured
echo.

REM Step 3: Setup DynamoDB tables
echo ================================================================
echo Setting up DynamoDB tables...
echo ================================================================
echo.

set /p SETUP_TABLES="Create DynamoDB tables? (y/n): "
if /i "%SETUP_TABLES%"=="y" (
    cd backend
    node create-users-dynamodb-table.js
    node create-questions-dynamodb-table.js
    node create-solved-problems-table.js
    
    set /p SEED_DATA="Seed sample data? (y/n): "
    if /i "%SEED_DATA%"=="y" (
        node seed-questions-dynamodb.js
    )
    cd ..
)

echo.

REM Step 4: Build frontend
echo ================================================================
echo Building frontend for production...
echo ================================================================
echo.

call npm run build

echo [OK] Frontend built
echo.

REM Step 5: Start services with PM2
echo ================================================================
echo Starting services with PM2...
echo ================================================================
echo.

REM Stop existing processes
pm2 delete codebattle-backend 2>nul
pm2 delete codebattle-frontend 2>nul

REM Start backend
cd backend
pm2 start npm --name "codebattle-backend" -- run dev
cd ..

REM Start frontend
pm2 start npm --name "codebattle-frontend" -- run preview -- --port 8081 --host 0.0.0.0

REM Save PM2 process list
pm2 save

echo.
echo [OK] Services started with PM2
echo.

REM Configure Windows Firewall
echo ================================================================
echo Configuring Windows Firewall...
echo ================================================================
echo.

netsh advfirewall firewall add rule name="CodeBattle Backend" dir=in action=allow protocol=TCP localport=3001
netsh advfirewall firewall add rule name="CodeBattle Frontend" dir=in action=allow protocol=TCP localport=8081

echo [OK] Firewall rules added
echo.

REM Display status
echo ================================================================
echo Deployment Status
echo ================================================================
echo.

pm2 list

echo.
echo ================================================================
echo          DEPLOYMENT COMPLETE!
echo ================================================================
echo.
echo Access your application:
echo    Frontend: http://%EC2_IP%:8081
echo    Backend:  http://%EC2_IP%:3001
echo.
echo Useful PM2 commands:
echo    pm2 list              - List all processes
echo    pm2 logs              - View logs
echo    pm2 restart all       - Restart all services
echo    pm2 stop all          - Stop all services
echo    pm2 monit             - Monitor processes
echo.
echo IMPORTANT: Configure EC2 Security Group to allow:
echo    - Port 3389 (RDP)
echo    - Port 3001 (Backend)
echo    - Port 8081 (Frontend)
echo.
echo For troubleshooting, see DEPLOYMENT-GUIDE.md
echo.
pause
