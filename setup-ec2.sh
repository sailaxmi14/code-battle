#!/bin/bash

# CodeBattle EC2 Setup Script
# This script helps you quickly set up the application on EC2

echo "╔════════════════════════════════════════════════════════════╗"
echo "║          CodeBattle EC2 Setup Script                       ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please install Node.js 18+ first:"
    echo "   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
    echo "   sudo apt-get install -y nodejs"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed!"
    exit 1
fi

echo "✅ npm version: $(npm --version)"
echo ""

# Step 1: Install dependencies
echo "📦 Installing dependencies..."
echo ""

echo "Installing backend dependencies..."
cd backend
npm install
cd ..

echo "Installing frontend dependencies..."
npm install

echo ""
echo "✅ Dependencies installed"
echo ""

# Step 2: Check for .env files
echo "🔍 Checking environment configuration..."
echo ""

if [ ! -f "backend/.env" ]; then
    echo "⚠️  backend/.env not found!"
    echo "Creating from template..."
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env"
    echo ""
    echo "⚠️  IMPORTANT: Edit backend/.env and add your AWS credentials:"
    echo "   nano backend/.env"
    echo ""
    echo "Required variables:"
    echo "   - AWS_ACCESS_KEY_ID"
    echo "   - AWS_SECRET_ACCESS_KEY"
    echo "   - JWT_SECRET"
    echo ""
else
    echo "✅ backend/.env exists"
fi

if [ ! -f ".env" ]; then
    echo "⚠️  .env not found!"
    echo "Creating from template..."
    cp .env.example .env
    echo "✅ Created .env"
else
    echo "✅ .env exists"
fi

echo ""

# Step 3: Check AWS credentials
echo "🔐 Checking AWS credentials..."
echo ""

if grep -q "your_aws_access_key_id" backend/.env || grep -q "YOUR_ACCESS_KEY_ID" backend/.env; then
    echo "❌ AWS credentials not configured!"
    echo ""
    echo "Please edit backend/.env and add your AWS credentials:"
    echo "   nano backend/.env"
    echo ""
    echo "Get your credentials from:"
    echo "   https://console.aws.amazon.com/iam"
    echo ""
    exit 1
else
    echo "✅ AWS credentials appear to be configured"
fi

echo ""

# Step 4: Setup DynamoDB tables
echo "🗄️  Setting up DynamoDB tables..."
echo ""

read -p "Do you want to create DynamoDB tables now? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd backend
    echo "Creating tables..."
    npm run create-tables
    
    echo ""
    read -p "Do you want to seed sample data? (y/n) " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Seeding data..."
        npm run seed
    fi
    
    cd ..
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║          ✅ Setup Complete!                                ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "🚀 To start the application:"
echo ""
echo "Terminal 1 (Backend):"
echo "   cd backend"
echo "   npm run dev"
echo ""
echo "Terminal 2 (Frontend):"
echo "   npm run dev"
echo ""
echo "📝 Access the application:"
echo "   http://your-ec2-ip:8081"
echo ""
echo "📖 For more details, see DEPLOYMENT-GUIDE.md"
echo ""
