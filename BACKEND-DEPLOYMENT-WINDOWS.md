# 🚀 Backend Deployment on Windows EC2

## Step-by-Step Backend Setup

### 1. Navigate to Backend Folder
```powershell
cd backend
```

### 2. Install Backend Dependencies
```powershell
npm install
```

### 3. Create .env File
```powershell
# Copy example file
copy .env.example .env

# Edit with your AWS credentials
notepad .env
```

**Add these values in .env:**
```env
PORT=3001
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-change-this
FRONTEND_URL=http://YOUR_EC2_PUBLIC_IP:8080
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_KEY
DYNAMODB_PROBLEMS_TABLE=CodeBattleProblems
CODEFORCES_API_KEY=your_codeforces_api_key
CODEFORCES_API_SECRET=your_codeforces_api_secret
```

### 4. Create DynamoDB Tables
```powershell
node create-users-dynamodb-table.js
node create-questions-dynamodb-table.js
node create-solved-problems-table.js
```

### 5. Seed Sample Data (Optional)
```powershell
node seed-questions-dynamodb.js
```

### 6. Open Firewall Port for Backend
```powershell
netsh advfirewall firewall add rule name="CodeBattle Backend 3001" dir=in action=allow protocol=TCP localport=3001
```

### 7. Start Backend with PM2
```powershell
# Start backend
pm2 start npm --name "codebattle-backend" -- run dev

# Save PM2 configuration
pm2 save

# View status
pm2 list
```

### 8. Verify Backend is Running
```powershell
# Test health endpoint
curl http://localhost:3001/health
```

Expected response:
```json
{"status":"ok","timestamp":"2026-02-26T..."}
```

---

## 🔧 Update Frontend to Connect to Backend

### 1. Navigate to Frontend Root
```powershell
cd ..
```

### 2. Update Frontend .env
```powershell
notepad .env
```

**Add this:**
```env
VITE_API_URL=http://YOUR_EC2_PUBLIC_IP:3001/api
```

### 3. Rebuild Frontend
```powershell
npm run build
```

### 4. Restart Frontend with PM2
```powershell
pm2 restart all
```

---

## 📊 PM2 Management Commands

### View All Processes
```powershell
pm2 list
```

### View Logs
```powershell
# All logs
pm2 logs

# Backend logs only
pm2 logs codebattle-backend

# Frontend logs only
pm2 logs 0
```

### Restart Services
```powershell
# Restart all
pm2 restart all

# Restart backend only
pm2 restart codebattle-backend

# Restart frontend only
pm2 restart 0
```

### Stop Services
```powershell
# Stop all
pm2 stop all

# Stop backend only
pm2 stop codebattle-backend
```

### Monitor in Real-time
```powershell
pm2 monit
```

### Delete Process
```powershell
pm2 delete codebattle-backend
```

---

## 🌐 Access Your Application

### Frontend
```
http://YOUR_EC2_PUBLIC_IP:8080
```

### Backend API
```
http://YOUR_EC2_PUBLIC_IP:3001
```

### Health Check
```
http://YOUR_EC2_PUBLIC_IP:3001/health
```

---

## ✅ EC2 Security Group Configuration

Make sure these ports are open in your EC2 Security Group:

| Type | Protocol | Port | Source | Description |
|------|----------|------|--------|-------------|
| RDP | TCP | 3389 | Your IP | Remote Desktop |
| Custom TCP | TCP | 8080 | 0.0.0.0/0 | Frontend |
| Custom TCP | TCP | 3001 | 0.0.0.0/0 | Backend API |

---

## 🔍 Troubleshooting

### Backend shows "Running in MOCK MODE"
**Solution:** Check backend/.env has correct AWS credentials

### Cannot access backend from browser
**Solution:** 
1. Check firewall: `netsh advfirewall firewall show rule name=all`
2. Check EC2 Security Group allows port 3001
3. Verify backend is running: `pm2 list`

### Frontend cannot connect to backend
**Solution:**
1. Update .env with correct EC2 IP
2. Rebuild: `npm run build`
3. Restart: `pm2 restart all`

### Port already in use
**Solution:**
```powershell
# Find process using port
netstat -ano | findstr :3001

# Kill process (replace PID)
taskkill /PID <PID> /F
```

---

## 🔄 Auto-Start on Reboot

### Install PM2 Startup
```powershell
npm install -g pm2-windows-startup
pm2-startup install
pm2 save
```

Now PM2 will automatically start your services when Windows reboots.

---

## 📝 Complete Command Summary

```powershell
# Backend Setup
cd backend
npm install
copy .env.example .env
notepad .env  # Add AWS credentials
node create-users-dynamodb-table.js
node create-questions-dynamodb-table.js
node create-solved-problems-table.js
netsh advfirewall firewall add rule name="Backend 3001" dir=in action=allow protocol=TCP localport=3001
pm2 start npm --name "codebattle-backend" -- run dev
pm2 save

# Frontend Update
cd ..
notepad .env  # Add VITE_API_URL
npm run build
pm2 restart all

# Verify
pm2 list
curl http://localhost:3001/health
```

---

## ✅ Success Checklist

- [ ] Backend dependencies installed
- [ ] backend/.env created with AWS credentials
- [ ] DynamoDB tables created
- [ ] Firewall port 3001 opened
- [ ] Backend started with PM2
- [ ] Frontend .env updated with backend URL
- [ ] Frontend rebuilt
- [ ] Both services running in PM2
- [ ] Health check passing
- [ ] Can access frontend from browser
- [ ] Can register/login successfully

---

**Your CodeBattle application is now fully deployed on Windows EC2!** 🎉
