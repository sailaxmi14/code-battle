# CodeBattle - Competitive Programming Practice Tracker

A full-stack web application for tracking coding progress on Codeforces with structured difficulty progression, daily problem tracking, and gamification features.

## 🎯 Overview

CodeBattle is a practice tracker that helps you:
- Track your Codeforces problem-solving progress
- Follow a structured difficulty progression (Basic → Easy → Medium → Hard → Difficult)
- Maintain daily coding streaks
- Compete with other coders on leaderboards
- Earn XP and unlock new difficulty levels

## ✨ Key Features

### 📅 Daily Problem System
- Get 3 curated problems daily from your current difficulty level
- Problems selected consistently for the entire day
- Clean to-do list style interface
- One-click "Solve" button opens Codeforces problem page

### 🎚️ 5-Level Difficulty Progression
- **Basic** (800-900) → **Easy** (1000-1100) → **Medium** (1200-1400) → **Hard** (1500-1700) → **Difficult** (1800-2000)
- Solve 51 problems to unlock next level
- Visual progress bars and completion tracking
- Automatic level progression

### ✅ Automatic Verification
- Verify solutions via Codeforces API
- Automatic progress tracking
- XP rewards based on difficulty
- Streak maintenance

### 🔥 Streak System
- Daily streak tracking with 12-hour grace period
- Current streak resets if you miss a day
- Best streak permanently stored
- Visual streak indicators

### 🏆 Leaderboard & Competition
- Weekly and all-time rankings
- XP-based scoring system
- Real-time updates
- Compare with other coders

### 💡 Hint System
- Conceptual guidance without code solutions
- Topics and approach explanations
- Thinking process questions
- No spoilers - learn by understanding

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** - Fast build tool
- **Tailwind CSS** + **shadcn/ui** - Modern UI components
- **React Router** - Navigation
- **Framer Motion** - Smooth animations

### Backend
- **Node.js** + **Express** - REST API
- **TypeScript** - Type safety
- **AWS Cognito** - Authentication
- **AWS DynamoDB** - Database
- **Codeforces API** - Problem verification

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- AWS Account (for Cognito & DynamoDB)
- Codeforces account

### 1. Clone Repository
```bash
git clone <repository-url>
cd code-battle
```

### 2. Install Dependencies
```bash
# Frontend
npm install

# Backend
cd backend
npm install
cd ..
```

### 3. Configure Environment

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:3001/api
```

**Backend (backend/.env):**
```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:8080

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Cognito
COGNITO_USER_POOL_ID=your-pool-id
COGNITO_CLIENT_ID=your-client-id

# DynamoDB Tables
DYNAMODB_USERS_TABLE=CodeBattleUsers
DYNAMODB_PROBLEMS_TABLE=CodeBattleProblems
DYNAMODB_STREAKS_TABLE=CodeBattleStreaks
```

### 4. Setup Database
```bash
cd backend
# Windows
.\setup-dynamodb.bat

# Linux/Mac
chmod +x setup-dynamodb.sh
./setup-dynamodb.sh
```

### 5. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

Access at: **http://localhost:8080** (or 8081 if 8080 is in use)

## 📖 User Guide

### Getting Started

1. **Register/Login**
   - Create account with email and password
   - Verify email (if required)
   - Login to access dashboard

2. **Add Codeforces Handle**
   - Go to Profile page
   - Add your Codeforces username (not email)
   - Required for solution verification

3. **Start Solving**
   - Dashboard shows 3 daily problems
   - Click "Solve" to open problem on Codeforces
   - Solve and submit on Codeforces
   - Return and click "Check" to verify

4. **Track Progress**
   - View progress on Dashboard
   - Check Levels page for overall progression
   - Monitor streaks on Streaks page
   - Compare on Leaderboard

### Navigation

- **Dashboard** - Today's 3 problems and daily progress
- **Levels** - View all difficulty levels and progress
- **Streaks** - Track your daily coding consistency
- **History** - View past solved problems
- **Leaderboard** - Compare with other users
- **Profile** - Manage account and Codeforces handle

## 🎮 How It Works

### Problem Flow
```
1. User clicks "Solve" → Codeforces problem opens
2. User solves problem on Codeforces
3. User returns to CodeBattle
4. User clicks "Check" → System verifies via API
5. If accepted → Progress updates, XP awarded
6. If not accepted → User can try again
```

### Difficulty Progression
```
Basic (0/51) → Solve 51 → Easy (0/51) → Solve 51 → Medium (0/51)
                                                          ↓
                                                    Continue...
```

### Daily System
- 3 problems per day from current level
- Same 3 problems all day (date-based seeding)
- New problems tomorrow
- Encourages consistent daily practice

## 📁 Project Structure

```
code-battle/
├── src/                          # Frontend
│   ├── components/              # React components
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── Navbar.tsx          # Navigation bar
│   │   └── ProtectedRoute.tsx  # Auth guard
│   ├── pages/                   # Page components
│   │   ├── Dashboard.tsx       # Daily problems (to-do style)
│   │   ├── Levels.tsx          # Difficulty levels overview
│   │   ├── Profile.tsx         # User profile
│   │   ├── Leaderboard.tsx     # Rankings
│   │   └── Streaks.tsx         # Streak tracking
│   ├── contexts/                # React contexts
│   │   └── AuthContext.tsx     # Authentication state
│   └── services/                # API services
│       └── cognitoIntegrationService.ts
├── backend/                      # Backend
│   ├── src/
│   │   ├── routes/             # API endpoints
│   │   │   ├── difficultyProgression.ts  # Main system
│   │   │   ├── auth.ts         # Authentication
│   │   │   └── user.ts         # User management
│   │   ├── services/           # Business logic
│   │   │   ├── difficultyProgressionService.ts
│   │   │   ├── codeforcesService.ts
│   │   │   └── dynamodbService.ts
│   │   ├── middleware/         # Express middleware
│   │   │   └── auth.ts         # JWT verification
│   │   └── config/             # Configuration
│   │       └── env.ts          # Environment setup
│   └── dist/                    # Compiled output
└── public/                       # Static assets
```

## 🔌 API Endpoints

### Difficulty Progression
- `GET /api/difficulty/progress` - Get user progress
- `GET /api/difficulty/daily-problems` - Get today's 3 problems
- `GET /api/difficulty/questions/:level` - Get problems for level
- `GET /api/difficulty/hint/:problemId` - Get problem hint
- `POST /api/difficulty/complete/:level/:questionId` - Verify solution
- `POST /api/difficulty/reset` - Reset progress (testing)

### Authentication
- `POST /api/auth/cognito-register` - Register user
- `POST /api/auth/cognito-login` - Login user

### User Management
- `GET /api/users/me` - Get current user profile
- `PATCH /api/users/me` - Update profile (including Codeforces handle)

### Leaderboard
- `GET /api/leaderboard/weekly` - Weekly rankings
- `GET /api/leaderboard/alltime` - All-time rankings

### Streaks
- `GET /api/streaks/current` - Current streak info
- `GET /api/streaks/history` - Streak history

## 🔧 Configuration

### Environment Variables

**Required:**
- `AWS_ACCESS_KEY_ID` - AWS credentials
- `AWS_SECRET_ACCESS_KEY` - AWS credentials
- `COGNITO_USER_POOL_ID` - Cognito user pool
- `COGNITO_CLIENT_ID` - Cognito app client

**Optional:**
- `PORT` - Backend port (default: 3001)
- `NODE_ENV` - Environment (development/production)
- `CODEFORCES_API_KEY` - For authenticated Codeforces requests
- `CODEFORCES_API_SECRET` - For authenticated Codeforces requests

## 🐛 Troubleshooting

### Backend Connection Issues
```bash
# Check if backend is running
curl http://localhost:3001/health

# Restart backend
cd backend
npm run dev
```

### Frontend Issues
```bash
# Clear cache and restart
rm -rf node_modules/.vite
npm run dev
```

### Codeforces Verification Issues
1. Ensure Codeforces handle is correct (username, not email)
2. Verify you're logged into Codeforces
3. Check problem was submitted and accepted (verdict: OK)
4. Wait a few seconds after submission before checking

### DynamoDB Issues
1. Verify AWS credentials are correct
2. Check tables exist in AWS Console
3. Ensure IAM permissions include DynamoDB access

## 📚 Additional Documentation

- [QUICK-START-GUIDE.md](QUICK-START-GUIDE.md) - Detailed setup instructions
- [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) - EC2 deployment guide

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **Codeforces** - For providing the problem database and API
- **AWS** - For cloud infrastructure
- **shadcn/ui** - For beautiful UI components
- **Tailwind CSS** - For utility-first styling

## 📞 Support

For issues or questions:
- Create an issue on GitHub
- Check documentation files
- Review troubleshooting section

---

**Happy Coding! 🚀**
