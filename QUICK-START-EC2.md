# ⚡ Quick Start - Deploy to EC2 in 5 Minutes

## 🚀 Super Fast Deployment

### Step 1: Connect to EC2
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

### Step 2: Install Node.js (if not installed)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs git
```

### Step 3: Clone & Deploy
```bash
git clone https://github.com/sailaxmi14/code-battle.git
cd code-battle
chmod +x deploy-ec2-production.sh
./deploy-ec2-production.sh
```

### Step 4: Configure AWS Credentials
```bash
nano backend/.env
```

Add your AWS credentials:
```env
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
```

Save and exit (Ctrl+X, Y, Enter)

### Step 5: Access Application
```
http://YOUR_EC2_IP:8081
```

## ✅ Done!

Your application is now running with PM2.

### Useful Commands:
```bash
pm2 list          # View status
pm2 logs          # View logs
pm2 restart all   # Restart
pm2 stop all      # Stop
```

---

## 🔧 EC2 Security Group

Make sure these ports are open:
- **22** - SSH
- **3001** - Backend
- **8081** - Frontend

---

## 📖 Need More Details?

See [EC2-PRODUCTION-SETUP.md](EC2-PRODUCTION-SETUP.md) for complete guide.
