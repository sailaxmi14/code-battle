#!/bin/bash

# CodeBattle Production Deployment Script for EC2 (Linux)
# This script sets up both backend and frontend on EC2 with PM2

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     CodeBattle Production Deployment on EC2                ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get EC2 public IP
EC2_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
if [ -z "$EC2_IP" ]; then
    echo -e "${YELLOW}⚠️  Could not detect EC2 IP. Please enter manually:${NC}"
    read -p "EC2 Public IP: " EC2_IP
fi

echo -e "${GREEN}✅ EC2 Public IP: $EC2_IP${NC}"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed!${NC}"
    echo "Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo -e "${GREEN}✅ Node.js version: $(node --version)${NC}"
echo -e "${GREEN}✅ npm version: $(npm --version)${NC}"
echo ""

# Install PM2 globally if not installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    sudo npm install -g pm2
fi

echo -e "${GREEN}✅ PM2 installed${NC}"
echo ""

# Step 1: Install dependencies
echo "════════════════════════════════════════════════════════════"
echo "📦 Installing dependencies..."
echo "════════════════════════════════════════════════════════════"
echo ""

echo "Installing backend dependencies..."
cd backend
npm install --production
cd ..

echo "Installing frontend dependencies..."
npm install
echo ""

# Step 2: Configure environment files
echo "════════════════════════════════════════════════════════════"
echo "🔧 Configuring environment files..."
echo "════════════════════════════════════════════════════════════"
echo ""

# Backend .env
if [ ! -f "backend/.env" ]; then
    echo "Creating backend/.env..."
    cp backend/.env.example backend/.env
    
    # Update with EC2 IP
    sed -i "s|http://localhost:8081|http://$EC2_IP:8081|g" backend/.env
    sed -i "s|NODE_ENV=development|NODE_ENV=production|g" backend/.env
    
    echo -e "${YELLOW}⚠️  IMPORTANT: Edit backend/.env and add your AWS credentials:${NC}"
    echo "   nano backend/.env"
    echo ""
    echo "Required variables:"
    echo "   - AWS_ACCESS_KEY_ID"
    echo "   - AWS_SECRET_ACCESS_KEY"
    echo "   - JWT_SECRET (change the default!)"
    echo ""
    read -p "Press Enter after you've updated backend/.env..."
fi

# Frontend .env
if [ ! -f ".env" ]; then
    echo "Creating frontend .env..."
    cp .env.example .env
    
    # Update with EC2 IP
    sed -i "s|http://localhost:3001|http://$EC2_IP:3001|g" .env
fi

echo -e "${GREEN}✅ Environment files configured${NC}"
echo ""

# Step 3: Setup DynamoDB tables
echo "════════════════════════════════════════════════════════════"
echo "🗄️  Setting up DynamoDB tables..."
echo "════════════════════════════════════════════════════════════"
echo ""

read -p "Create DynamoDB tables? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd backend
    node create-users-dynamodb-table.js
    node create-questions-dynamodb-table.js
    node create-solved-problems-table.js
    
    read -p "Seed sample data? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        node seed-questions-dynamodb.js
    fi
    cd ..
fi

echo ""

# Step 4: Build frontend for production
echo "════════════════════════════════════════════════════════════"
echo "🏗️  Building frontend for production..."
echo "════════════════════════════════════════════════════════════"
echo ""

npm run build

echo -e "${GREEN}✅ Frontend built${NC}"
echo ""

# Step 5: Start services with PM2
echo "════════════════════════════════════════════════════════════"
echo "🚀 Starting services with PM2..."
echo "════════════════════════════════════════════════════════════"
echo ""

# Stop existing processes
pm2 delete codebattle-backend 2>/dev/null || true
pm2 delete codebattle-frontend 2>/dev/null || true

# Start backend
cd backend
pm2 start npm --name "codebattle-backend" -- run dev
cd ..

# Start frontend (preview mode for production build)
pm2 start npm --name "codebattle-frontend" -- run preview -- --port 8081 --host 0.0.0.0

# Save PM2 process list
pm2 save

# Setup PM2 to start on system boot
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME

echo ""
echo -e "${GREEN}✅ Services started with PM2${NC}"
echo ""

# Step 6: Configure firewall (if UFW is available)
if command -v ufw &> /dev/null; then
    echo "════════════════════════════════════════════════════════════"
    echo "🔥 Configuring firewall..."
    echo "════════════════════════════════════════════════════════════"
    echo ""
    
    sudo ufw allow 22/tcp    # SSH
    sudo ufw allow 3001/tcp  # Backend
    sudo ufw allow 8081/tcp  # Frontend
    sudo ufw --force enable
    
    echo -e "${GREEN}✅ Firewall configured${NC}"
    echo ""
fi

# Display status
echo "════════════════════════════════════════════════════════════"
echo "📊 Deployment Status"
echo "════════════════════════════════════════════════════════════"
echo ""

pm2 list

echo ""
echo "════════════════════════════════════════════════════════════"
echo "✅ DEPLOYMENT COMPLETE!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "🌐 Access your application:"
echo "   Frontend: http://$EC2_IP:8081"
echo "   Backend:  http://$EC2_IP:3001"
echo ""
echo "📊 Useful PM2 commands:"
echo "   pm2 list              - List all processes"
echo "   pm2 logs              - View logs"
echo "   pm2 restart all       - Restart all services"
echo "   pm2 stop all          - Stop all services"
echo "   pm2 monit             - Monitor processes"
echo ""
echo "⚠️  IMPORTANT: Configure EC2 Security Group to allow:"
echo "   - Port 22 (SSH)"
echo "   - Port 3001 (Backend)"
echo "   - Port 8081 (Frontend)"
echo ""
echo "📖 For troubleshooting, see DEPLOYMENT-GUIDE.md"
echo ""
