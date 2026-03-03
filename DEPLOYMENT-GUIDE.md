# Deployment Guide

Complete guide for deploying CodeBattle to AWS EC2 (Windows).

## Prerequisites

- AWS EC2 Windows instance
- Node.js 18+ installed
- Git installed
- AWS credentials (Access Key & Secret)
- Codeforces API credentials (optional)

## Quick Deployment Steps

### 1. Connect to EC2
Use Remote Desktop to connect to your EC2 Windows instance.

### 2. Clone Repository
```powershell
cd E:\projects
git clone https://github.com/sailaxmi14/code-battle.git
cd code-battle
```

### 3. Install Dependencies
```powershell
# Frontend
npm install

# Backend
cd backend
npm install
cd ..
```

### 4. Configure Environment Variables

**Frontend (.env):**
```env
VITE_API_URL=http://YOUR_EC2_IP:3001/api
```

**Backend (backend/.env):**
```env
PORT=3001
NODE_ENV=production
JWT_SECRET=your-secure-jwt-secret
FRONTEND_URL=http://YOUR_EC2_IP:8080

AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

DYNAMODB_PROBLEMS_TABLE=CodeBattleProblems

CODEFORCES_API_KEY=your-api-key
CODEFORCES_API_SECRET=your-api-secret
```

Replace `YOUR_EC2_IP` with your actual EC2 public IP address.

### 5. Setup DynamoDB Tables
```powershell
cd backend
.\setup-dynamodb.bat
cd ..
```

### 6. Open Firewall Ports
```powershell
netsh advfirewall firewall add rule name="Backend 3001" dir=in action=allow protocol=TCP localport=3001
netsh advfirewall firewall add rule name="Frontend 8080" dir=in action=allow protocol=TCP localport=8080
```

### 7. Build Backend
```powershell
cd backend
npm run build
```

### 8. Start Backend
```powershell
npm run dev
```

Keep this terminal open. Backend runs on port 3001.

### 9. Build Frontend (New Terminal)
```powershell
cd E:\projects\code-battle
npm run build
```

### 10. Install and Start Serve
```powershell
npm install -g serve
serve -s dist -p 8080
```

Keep this terminal open. Frontend runs on port 8080.

### 11. Access Application
Open browser: `http://YOUR_EC2_IP:8080`

## Updating Deployment

When you have new code changes:

### 1. Pull Latest Changes
```powershell
cd E:\projects\code-battle
git pull origin main
```

### 2. Install New Dependencies (if any)
```powershell
npm install
cd backend
npm install
cd ..
```

### 3. Rebuild Backend
```powershell
cd backend
npm run build
```

### 4. Restart Backend
Stop current backend (Ctrl+C), then:
```powershell
npm run dev
```

### 5. Rebuild Frontend
```powershell
cd ..
npm run build
```

### 6. Restart Frontend
Stop current serve (Ctrl+C), then:
```powershell
serve -s dist -p 8080
```

## Production Best Practices

### 1. Use Process Manager (PM2)

Install PM2:
```powershell
npm install -g pm2
```

Start backend with PM2:
```powershell
cd backend
pm2 start "npm run dev" --name codebattle-backend
```

Start frontend with PM2:
```powershell
cd ..
pm2 start "serve -s dist -p 8080" --name codebattle-frontend
```

Save PM2 configuration:
```powershell
pm2 save
pm2 startup
```

Manage processes:
```powershell
pm2 list                    # List all processes
pm2 logs codebattle-backend # View backend logs
pm2 logs codebattle-frontend # View frontend logs
pm2 restart all             # Restart all processes
pm2 stop all                # Stop all processes
```

### 2. Enable HTTPS

For production, use HTTPS:
1. Get SSL certificate (Let's Encrypt, AWS Certificate Manager)
2. Configure reverse proxy (Nginx, IIS)
3. Update environment variables with HTTPS URLs

### 3. Environment Security

- Use strong JWT_SECRET
- Rotate AWS credentials regularly
- Use AWS IAM roles instead of access keys
- Enable CloudWatch logging
- Set up monitoring and alerts

### 4. Database Backup

Setup DynamoDB backups:
- Enable Point-in-Time Recovery
- Configure automated backups
- Test restore procedures

## Troubleshooting

### Backend Won't Start

**Check port availability:**
```powershell
netstat -ano | findstr :3001
```

**Kill process if needed:**
```powershell
taskkill /PID <PID_NUMBER> /F
```

### Frontend Won't Start

**Check port availability:**
```powershell
netstat -ano | findstr :8080
```

**Clear npm cache:**
```powershell
npm cache clean --force
```

### CORS Errors

1. Verify `FRONTEND_URL` in backend/.env
2. Rebuild backend: `cd backend && npm run build`
3. Restart backend

### Connection Refused

1. Check backend is running: `http://YOUR_EC2_IP:3001/health`
2. Verify firewall rules are active
3. Check .env files have correct IP addresses
4. Rebuild frontend after .env changes

### DynamoDB Errors

1. Verify AWS credentials in backend/.env
2. Check IAM permissions
3. Ensure tables exist: Run setup-dynamodb.bat
4. Check AWS region is correct

### Git Pull Conflicts

**Stash local changes:**
```powershell
git stash
git pull origin main
git stash pop
```

**Or discard local changes:**
```powershell
git reset --hard HEAD
git pull origin main
```

## Monitoring

### Check Application Status

**Backend health:**
```powershell
curl http://localhost:3001/health
```

**Frontend access:**
Open: `http://YOUR_EC2_IP:8080`

### View Logs

**Backend logs:**
Check terminal where backend is running

**Frontend logs:**
Check browser console (F12)

**PM2 logs:**
```powershell
pm2 logs
```

## Backup & Recovery

### Backup Configuration

1. **Environment files:**
   - Copy .env files to secure location
   - Never commit .env to git

2. **DynamoDB data:**
   - Enable Point-in-Time Recovery
   - Export tables regularly

3. **Code:**
   - Keep git repository updated
   - Tag releases: `git tag v1.0.0`

### Recovery Steps

1. **Restore from backup:**
   ```powershell
   git clone https://github.com/sailaxmi14/code-battle.git
   # Restore .env files
   # Follow deployment steps
   ```

2. **Restore DynamoDB:**
   - Use AWS Console
   - Restore from backup
   - Update table names in .env

## Performance Optimization

### 1. Enable Caching
- Configure browser caching
- Use CDN for static assets
- Enable DynamoDB caching (DAX)

### 2. Optimize Build
```powershell
# Production build with optimizations
npm run build -- --mode production
```

### 3. Monitor Performance
- Use AWS CloudWatch
- Monitor API response times
- Track error rates

## Security Checklist

- ✅ Use HTTPS in production
- ✅ Strong JWT_SECRET
- ✅ AWS credentials secured
- ✅ Firewall rules configured
- ✅ Regular security updates
- ✅ Input validation enabled
- ✅ CORS properly configured
- ✅ Rate limiting enabled
- ✅ Logs monitored
- ✅ Backups automated

## Support

For deployment issues:
1. Check this guide
2. Review error logs
3. Verify environment variables
4. Test locally first
5. Create GitHub issue if needed

## Additional Resources

- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [DynamoDB Documentation](https://docs.aws.amazon.com/dynamodb/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [React Deployment](https://create-react-app.dev/docs/deployment/)
