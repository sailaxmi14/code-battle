# 🚀 CodeBattle - EC2 Production Deployment Guide

Complete guide to deploy both backend and frontend on a single EC2 instance.

---

## 📋 Prerequisites

### AWS Requirements
- AWS EC2 instance (t2.medium or higher recommended)
- Ubuntu 20.04+ (Linux) or Windows Server 2019+ (Windows)
- At least 4GB RAM
- 20GB storage
- Public IP address assigned

### Required Software
- Node.js 18+
- npm
- Git
- PM2 (will be installed by script)

---

## 🔧 EC2 Instance Setup

### Step 1: Launch EC2 Instance

1. **Go to AWS EC2 Console**
   - https://console.aws.amazon.com/ec2

2. **Launch Instance**
   - Name: `codebattle-production`
   - AMI: Ubuntu Server 20.04 LTS (or Windows Server 2019)
   - Instance type: `t2.medium` (minimum)
   - Key pair: Create or select existing
   - Storage: 20GB gp3

3. **Configure Security Group**
   
   Create inbound rules:
   
   | Type | Protocol | Port | Source | Description |
   |------|----------|------|--------|-------------|
   | SSH | TCP | 22 | Your IP | SSH access (Linux) |
   | RDP | TCP | 3389 | Your IP | Remote Desktop (Windows) |
   | Custom TCP | TCP | 3001 | 0.0.0.0/0 | Backend API |
   | Custom TCP | TCP | 8081 | 0.0.0.0/0 | Frontend App |
   | HTTP | TCP | 80 | 0.0.0.0/0 | Optional (for reverse proxy) |
   | HTTPS | TCP | 443 | 0.0.0.0/0 | Optional (for SSL) |

4. **Launch Instance**

---

## 🔌 Connect to EC2

### Linux (SSH)
```bash
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

### Windows (RDP)
1. Get Windows password using your key pair
2. Connect via Remote Desktop
3. Use Administrator credentials

---

## 📦 Installation Steps

### For Linux EC2:

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install Git
sudo apt-get install -y git

# 4. Clone repository
git clone https://github.com/sailaxmi14/code-battle.git
cd code-battle

# 5. Run deployment script
chmod +x deploy-ec2-production.sh
./deploy-ec2-production.sh
```

### For Windows EC2:

```powershell
# 1. Install Node.js
# Download from: https://nodejs.org/
# Install and restart PowerShell

# 2. Install Git
# Download from: https://git-scm.com/download/win

# 3. Clone repository
git clone https://github.com/sailaxmi14/code-battle.git
cd code-battle

# 4. Run deployment script
.\deploy-ec2-production.bat
```

---

## 🔐 Configure AWS Credentials

### Edit backend/.env

```bash
# Linux
nano backend/.env

# Windows
notepad backend\.env
```

### Required Configuration

```env
# Server Configuration
PORT=3001
NODE_ENV=production

# JWT Secret - CHANGE THIS!
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long

# Frontend URL (use your EC2 public IP)
FRONTEND_URL=http://YOUR_EC2_PUBLIC_IP:8081

# AWS DynamoDB Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=YOUR_ACTUAL_AWS_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_ACTUAL_AWS_SECRET_KEY

# DynamoDB Tables
DYNAMODB_PROBLEMS_TABLE=CodeBattleProblems

# Codeforces API (Optional)
CODEFORCES_API_KEY=your_codeforces_api_key
CODEFORCES_API_SECRET=your_codeforces_api_secret
```

**⚠️ IMPORTANT:** Replace `YOUR_EC2_PUBLIC_IP` with your actual EC2 public IP address!

---

## 🗄️ DynamoDB Tables Setup

The deployment script will prompt you to create tables. If you need to create them manually:

```bash
cd backend

# Create tables
node create-users-dynamodb-table.js
node create-questions-dynamodb-table.js
node create-solved-problems-table.js

# Seed sample data (optional)
node seed-questions-dynamodb.js
```

### Required Tables:
1. **Users** - User accounts
2. **CodeBattleQuestions** - Problem repository
3. **CodeBattleUserProgress** - User progress
4. **CodeBattleUserStreaks** - Streak tracking
5. **CodeBattleDailySolved** - Daily activity
6. **SolvedProblems** - Complete history

---

## 🚀 Starting the Application

### Using PM2 (Recommended)

PM2 keeps your application running and restarts it if it crashes.

```bash
# Start both services
pm2 start all

# View status
pm2 list

# View logs
pm2 logs

# Restart services
pm2 restart all

# Stop services
pm2 stop all

# Monitor in real-time
pm2 monit
```

### Manual Start (Development)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run preview -- --port 8081 --host 0.0.0.0
```

---

## 🌐 Access Your Application

### Frontend
```
http://YOUR_EC2_PUBLIC_IP:8081
```

### Backend API
```
http://YOUR_EC2_PUBLIC_IP:3001
```

### Health Check
```bash
curl http://YOUR_EC2_PUBLIC_IP:3001/health
```

Expected response:
```json
{"status":"ok","timestamp":"2026-02-26T..."}
```

---

## 🔍 Troubleshooting

### Issue: Cannot access application from browser

**Solution:**
1. Check EC2 Security Group allows ports 3001 and 8081
2. Verify services are running: `pm2 list`
3. Check firewall rules:
   ```bash
   # Linux
   sudo ufw status
   
   # Windows
   netsh advfirewall firewall show rule name=all
   ```

### Issue: Backend shows "Running in MOCK MODE"

**Solution:**
1. Check `backend/.env` exists
2. Verify AWS credentials are correct
3. Test AWS connection:
   ```bash
   aws dynamodb list-tables --region us-east-1
   ```

### Issue: Frontend cannot connect to backend

**Solution:**
1. Update `.env` with correct EC2 IP:
   ```env
   VITE_API_URL=http://YOUR_EC2_IP:3001/api
   ```
2. Rebuild frontend:
   ```bash
   npm run build
   pm2 restart codebattle-frontend
   ```

### Issue: PM2 processes not starting

**Solution:**
```bash
# View detailed logs
pm2 logs --lines 100

# Delete and restart
pm2 delete all
pm2 start deploy-ec2-production.sh
```

### Issue: Port already in use

**Solution:**
```bash
# Linux - Find and kill process
sudo lsof -i :3001
sudo kill -9 <PID>

# Windows - Find and kill process
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

---

## 🔄 Updating the Application

### Pull Latest Changes

```bash
# Stop services
pm2 stop all

# Pull updates
git pull origin main

# Install dependencies
npm install
cd backend && npm install && cd ..

# Rebuild frontend
npm run build

# Restart services
pm2 restart all
```

---

## 🔒 Security Best Practices

### 1. Change Default Secrets
```env
JWT_SECRET=generate-a-strong-random-secret-here
```

### 2. Restrict Security Group
- Limit SSH/RDP to your IP only
- Use VPN for administrative access

### 3. Enable HTTPS (Optional)
```bash
# Install Nginx
sudo apt install nginx

# Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com
```

### 4. Regular Updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Node.js packages
npm update
cd backend && npm update
```

### 5. Monitor Logs
```bash
# PM2 logs
pm2 logs

# System logs
sudo journalctl -u pm2-ubuntu
```

---

## 📊 Monitoring & Maintenance

### PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# Process list
pm2 list

# Detailed info
pm2 show codebattle-backend
pm2 show codebattle-frontend
```

### System Resources

```bash
# Check CPU and memory
htop

# Check disk space
df -h

# Check network
netstat -tulpn
```

### Log Management

```bash
# View PM2 logs
pm2 logs --lines 100

# Clear logs
pm2 flush

# Rotate logs
pm2 install pm2-logrotate
```

---

## 🔄 Auto-Start on Reboot

PM2 is configured to start automatically on system reboot.

### Verify Auto-Start

```bash
# Linux
pm2 startup
pm2 save

# Windows
pm2-startup install
pm2 save
```

---

## 📈 Performance Optimization

### 1. Enable Clustering (Backend)

Edit `backend/ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'codebattle-backend',
    script: 'npm',
    args: 'run dev',
    instances: 2,
    exec_mode: 'cluster'
  }]
}
```

### 2. Enable Gzip Compression

Backend already has compression enabled in Express.

### 3. Use CDN for Static Assets

Consider using CloudFront for frontend assets.

---

## 🆘 Support & Resources

### Useful Commands

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check PM2 version
pm2 --version

# Check running processes
pm2 list

# View environment variables
pm2 env 0

# Restart with new env
pm2 restart all --update-env
```

### Log Locations

- PM2 logs: `~/.pm2/logs/`
- Application logs: Check PM2 logs
- System logs: `/var/log/` (Linux)

---

## ✅ Deployment Checklist

- [ ] EC2 instance launched and running
- [ ] Security group configured (ports 22/3389, 3001, 8081)
- [ ] Node.js 18+ installed
- [ ] Git installed
- [ ] Repository cloned
- [ ] backend/.env configured with AWS credentials
- [ ] .env configured with EC2 IP
- [ ] DynamoDB tables created
- [ ] Dependencies installed
- [ ] Frontend built
- [ ] PM2 services started
- [ ] Application accessible from browser
- [ ] Health check passing
- [ ] PM2 auto-start configured

---

## 🎉 Success!

Your CodeBattle application is now running in production on EC2!

**Access URLs:**
- Frontend: `http://YOUR_EC2_IP:8081`
- Backend: `http://YOUR_EC2_IP:3001`

**Next Steps:**
1. Register a domain name (optional)
2. Set up SSL certificate (optional)
3. Configure CloudWatch monitoring (optional)
4. Set up automated backups (optional)

---

**Last Updated:** February 26, 2026  
**Version:** 1.0.0
