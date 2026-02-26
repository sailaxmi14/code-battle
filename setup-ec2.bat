@echo off
REM CodeBattle EC2 Setup Script for Windows
REM This script helps you quickly set up the application on Windows EC2

echo ================================================================
echo          CodeBattle EC2 Setup Script (Windows)
echo ================================================================
echo.

REM Check if Node.js is installed
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

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not installed!
    pause
    exit /b 1
)

echo [OK] npm version:
npm --version
echo.

REM Step 1: Install dependencies
echo ================================================================
echo Installing dependencies...
echo ================================================================
echo.

echo Installing backend dependencies...
cd backend
call npm install
cd ..

echo.
echo Installing frontend dependencies...
call npm install

echo.
echo [OK] Dependencies installed
echo.

REM Step 2: Check for .env files
echo ================================================================
echo Checking environment configuration...
echo ================================================================
echo.

if not exist "backend\.env" (
    echo [WARNING] backend\.env not found!
    echo Creating from template...
    copy backend\.env.example backend\.env
    echo [OK] Created backend\.env
    echo.
    echo [IMPORTANT] Edit backend\.env and add your AWS credentials:
    echo    notepad backend\.env
    echo.
    echo Required variables:
    echo    - AWS_ACCESS_KEY_ID
    echo    - AWS_SECRET_ACCESS_KEY
    echo    - JWT_SECRET
    echo.
) else (
    echo [OK] backend\.env exists
)

if not exist ".env" (
    echo [WARNING] .env not found!
    echo Creating from template...
    copy .env.example .env
    echo [OK] Created .env
) else (
    echo [OK] .env exists
)

echo.

REM Step 3: Check AWS credentials
echo ================================================================
echo Checking AWS credentials...
echo ================================================================
echo.

findstr /C:"your_aws_access_key_id" backend\.env >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [ERROR] AWS credentials not configured!
    echo.
    echo Please edit backend\.env and add your AWS credentials:
    echo    notepad backend\.env
    echo.
    echo Get your credentials from:
    echo    https://console.aws.amazon.com/iam
    echo.
    pause
    exit /b 1
)

findstr /C:"YOUR_ACCESS_KEY_ID" backend\.env >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [ERROR] AWS credentials not configured!
    echo.
    echo Please edit backend\.env and add your AWS credentials:
    echo    notepad backend\.env
    echo.
    pause
    exit /b 1
)

echo [OK] AWS credentials appear to be configured
echo.

REM Step 4: Setup DynamoDB tables
echo ================================================================
echo Setting up DynamoDB tables...
echo ================================================================
echo.

set /p SETUP_TABLES="Do you want to create DynamoDB tables now? (y/n): "
if /i "%SETUP_TABLES%"=="y" (
    cd backend
    echo Creating tables...
    call npm run create-tables
    
    echo.
    set /p SEED_DATA="Do you want to seed sample data? (y/n): "
    if /i "%SEED_DATA%"=="y" (
        echo Seeding data...
        call npm run seed
    )
    
    cd ..
)

echo.
echo ================================================================
echo          Setup Complete!
echo ================================================================
echo.
echo To start the application:
echo.
echo Terminal 1 (Backend):
echo    cd backend
echo    npm run dev
echo.
echo Terminal 2 (Frontend):
echo    npm run dev
echo.
echo Access the application:
echo    http://your-ec2-ip:8081
echo.
echo For more details, see DEPLOYMENT-GUIDE.md
echo.
pause
