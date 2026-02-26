# 🚀 CodeBattle Deployment Guide - EC2 Instance

## 📋 Prerequisites

- AWS EC2 instance (Windows/Linux)
- Node.js 18+ installed
- Git installed
- AWS IAM credentials with DynamoDB access

---

## 🔧 Step 1: Clone Repository

```bash
git clone <your-repo-url>
cd codestreak-challenge-1
```

---

## 🔐 Step 2: Configure Environment Variables

### Backend Configuration

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Create .env file from template:**
```bash
# Windows
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

3. **Edit backend/.env with your credentials:**
```env
# Server Configuration
PORT=3001
NODE_ENV=production

# JWT Secret (change this!)
JWT_SECRET=your-super-secret-jwt-key-change-this

# Frontend URL
FRONTEND_URL=http://your-ec2-public-ip:8081

# AWS DynamoDB Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=YOUR_ACTUAL_AWS_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_ACTUAL_AWS_SECRET_KEY

# DynamoDB Tables
DYNAMODB_PROBLEMS_TABLE=CodeBattleProblems

# Codeforces API Configuration
CODEFORCES_API_KEY=your_codeforces_api_key
CODEFORCES_API_SECRET=your_codeforces_api_secret
```

### Frontend Configuration

1. **Navigate to root directory:**
```bash
cd ..
```

2. **Create .env file:**
```bash
# Windows
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

3. **Edit .env:**
```env
# Backend API URL
VITE_API_URL=http://your-ec2-public-ip:3001/api
```

---

## 📦 Step 3: Install Dependencies

### Backend Dependencies
```bash
cd backend
npm install
```

### Frontend Dependencies
```bash
cd ..
npm install
```

---

## 🗄️ Step 4: Setup DynamoDB Tables

```bash
cd backend
npm run create-tables
npm run seed
```

This will create:
- Users table
- Questions table
- UserProgress table
- UserStreaks table
- DailySolved table
- SolvedProblems table

---

## 🚀 Step 5: Start the Application

### Option A: Development Mode (with auto-restart)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### Option B: Production Mode

**Build Backend:**
```bash
cd backend
npm run build
npm start
```

**Build Frontend:**
```bash
npm run build
npm run preview
```

---

## 🔒 Step 6: Configure EC2 Security Group

Add inbound rules to allow traffic:

| Type | Protocol | Port | Source |
|------|----------|------|--------|
| HTTP | TCP | 8081 | 0.0.0.0/0 |
| Custom TCP | TCP | 3001 | 0.0.0.0/0 |
| SSH | TCP | 22 | Your IP |

---

## 🌐 Step 7: Access the Application

Open your browser:
```
http://your-ec2-public-ip:8081
```

---

## 🔍 Troubleshooting

### Issue: "Running in MOCK MODE - AWS credentials not configured"

**Solution:**
1. Check if backend/.env file exists
2. Verify AWS credentials are correct
3. Test credentials:
```bash
aws dynamodb list-tables --region us-east-1
```

### Issue: "Cannot connect to backend"

**Solution:**
1. Check backend is running: `curl http://localhost:3001/health`
2. Verify EC2 security group allows port 3001
3. Check backend logs for errors

### Issue: "CORS error"

**Solution:**
Update backend/src/server.ts CORS configuration:
```typescript
app.use(cors({
  origin: ['http://your-ec2-public-ip:8081', 'http://localhost:8081'],
  credentials: true
}));
```

---

## 🔄 Using PM2 for Production (Recommended)

### Install PM2
```bash
npm install -g pm2
```

### Start Backend with PM2
```bash
cd backend
pm2 start npm --name "codebattle-backend" -- run dev
```

### Start Frontend with PM2
```bash
cd ..
pm2 start npm --name "codebattle-frontend" -- run dev
```

### Manage Processes
```bash
pm2 list                 # List all processes
pm2 logs                 # View logs
pm2 restart all          # Restart all
pm2 stop all             # Stop all
pm2 startup              # Auto-start on reboot
pm2 save                 # Save current process list
```

---

## 📊 Health Checks

### Backend Health
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{"status":"ok","timestamp":"2026-02-26T..."}
```

### Frontend Health
```bash
curl http://localhost:8081
```

Expected: HTML response (status 200)

---

## 🔐 AWS IAM Permissions Required

Your AWS IAM user needs these DynamoDB permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:CreateTable",
        "dynamodb:DescribeTable",
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:BatchWriteItem"
      ],
      "Resource": "arn:aws:dynamodb:us-east-1:*:table/CodeBattle*"
    }
  ]
}
```

---

## 📝 Environment Variables Reference

### Backend (.env)
| Variable | Description | Required |
|----------|-------------|----------|
| PORT | Backend port | Yes |
| NODE_ENV | Environment (development/production) | Yes |
| JWT_SECRET | Secret for JWT tokens | Yes |
| FRONTEND_URL | Frontend URL for CORS | Yes |
| AWS_REGION | AWS region | Yes |
| AWS_ACCESS_KEY_ID | AWS access key | Yes |
| AWS_SECRET_ACCESS_KEY | AWS secret key | Yes |
| CODEFORCES_API_KEY | Codeforces API key | Optional |
| CODEFORCES_API_SECRET | Codeforces API secret | Optional |

### Frontend (.env)
| Variable | Description | Required |
|----------|-------------|----------|
| VITE_API_URL | Backend API URL | Yes |

---

## 🎯 Quick Start Checklist

- [ ] Clone repository
- [ ] Create backend/.env with AWS credentials
- [ ] Create frontend .env with API URL
- [ ] Install dependencies (backend & frontend)
- [ ] Create DynamoDB tables
- [ ] Configure EC2 security group
- [ ] Start backend server
- [ ] Start frontend server
- [ ] Access application in browser
- [ ] Test registration and login

---

## 📞 Support

If you encounter issues:
1. Check backend logs
2. Check frontend console
3. Verify AWS credentials
4. Check EC2 security group
5. Verify DynamoDB tables exist

---

**Last Updated:** February 26, 2026
