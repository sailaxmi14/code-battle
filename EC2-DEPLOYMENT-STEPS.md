# EC2 Deployment Steps (Windows)

## Prerequisites
- EC2 Windows instance running
- Node.js and npm installed
- Git installed
- Project cloned to EC2

## Step 1: Configure Environment Variables

### Frontend (.env)
```bash
VITE_API_URL=http://3.239.212.18:3001/api
```

### Backend (backend/.env)
```bash
PORT=3001
NODE_ENV=production
JWT_SECRET=your-secure-jwt-secret-here
FRONTEND_URL=http://3.239.212.18:8080
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
DYNAMODB_PROBLEMS_TABLE=CodeBattleProblems
CODEFORCES_API_KEY=your-api-key
CODEFORCES_API_SECRET=your-api-secret
```

## Step 2: Open Firewall Ports
```powershell
netsh advfirewall firewall add rule name="Backend 3001" dir=in action=allow protocol=TCP localport=3001
netsh advfirewall firewall add rule name="Frontend 8080" dir=in action=allow protocol=TCP localport=8080
```

## Step 3: Deploy Backend
```bash
cd backend
npm install
npm run build
npm run dev
```

Backend will run on: http://3.239.212.18:3001

## Step 4: Deploy Frontend (New Terminal)
```bash
# Build frontend
npm install
npm run build

# Install serve globally
npm install -g serve

# Serve production build
serve -s dist -p 8080
```

Frontend will run on: http://3.239.212.18:8080

## Step 5: Verify Deployment
- Frontend: http://3.239.212.18:8080
- Backend Health: http://3.239.212.18:3001/health
- Test registration and login

## Troubleshooting

### CORS Errors
Ensure backend .env has correct FRONTEND_URL

### Connection Refused
- Check if backend is running: `netstat -ano | findstr :3001`
- Check if frontend is running: `netstat -ano | findstr :8080`
- Verify firewall rules are active

### API Calls Failing
- Verify .env files have correct IP addresses
- Rebuild frontend after changing .env: `npm run build`
- Restart both servers

## Production Notes
- Use PM2 or similar for process management
- Set NODE_ENV=production
- Use strong JWT_SECRET
- Enable HTTPS with SSL certificates
- Set up proper logging and monitoring
