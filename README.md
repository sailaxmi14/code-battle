# CodeBattle - Competitive Programming Platform

A full-stack web application for tracking coding progress, managing daily problem-solving streaks, and competing with other coders.

## Features

- 🔥 **Daily Streak Tracking** - Maintain your coding consistency
- 🏆 **Leaderboard System** - Compete with other coders
- � **Analytics Dashboard** - Track your progress and performance
- ✅ **Codeforces Integration** - Auto-verify problem submissions
- 👤 **User Profiles** - Manage your coding journey
- � **XP & Leveling System** - Earn rewards for solving problems

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite (Build tool)
- Tailwind CSS + shadcn/ui
- React Router
- Framer Motion

### Backend
- Node.js + Express
- TypeScript
- AWS Cognito (Authentication)
- AWS DynamoDB (Database)
- Codeforces API Integration

## Prerequisites

- Node.js 18+ and npm
- AWS Account (for Cognito & DynamoDB)
- Codeforces API credentials (optional)

## Local Development Setup

### 1. Clone Repository
```bash
git clone https://github.com/sailaxmi14/code-battle.git
cd code-battle
```

### 2. Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 3. Configure Environment Variables

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:3001/api
```

**Backend (backend/.env):**
```env
PORT=3001
NODE_ENV=development
JWT_SECRET=your-jwt-secret-here
FRONTEND_URL=http://localhost:8080

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# DynamoDB Tables
DYNAMODB_PROBLEMS_TABLE=CodeBattleProblems

# Codeforces API (optional)
CODEFORCES_API_KEY=your-api-key
CODEFORCES_API_SECRET=your-api-secret
```

### 4. Setup DynamoDB Tables

Run the setup scripts to create required tables:

**Windows:**
```bash
cd backend
.\setup-dynamodb.bat
```

**Linux/Mac:**
```bash
cd backend
chmod +x setup-dynamodb.sh
./setup-dynamodb.sh
```

### 5. Build Backend
```bash
cd backend
npm run build
```

### 6. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

Access the application at: http://localhost:5173

## Production Build

### Build Frontend
```bash
npm run build
```

### Serve Production Build
```bash
npm install -g serve
serve -s dist -p 8080
```

## EC2 Deployment

See [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) for detailed EC2 deployment instructions.

### Quick EC2 Setup

1. **Update Environment Variables** with EC2 IP
2. **Build Backend**: `cd backend && npm run build`
3. **Start Backend**: `npm run dev`
4. **Build Frontend**: `npm run build`
5. **Serve Frontend**: `serve -s dist -p 8080`

## Project Structure

```
code-battle/
├── src/                      # Frontend source
│   ├── components/          # React components
│   ├── pages/              # Page components
│   ├── services/           # API services
│   ├── contexts/           # React contexts
│   └── lib/                # Utilities
├── backend/                 # Backend source
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Express middleware
│   │   └── config/         # Configuration
│   └── dist/               # Compiled backend
├── public/                  # Static assets
└── dist/                    # Production build

```

## Key Features Explained

### Streak System
- Solve at least 1 problem per day to maintain streak
- Current streak resets if you miss a day
- Best streak is your personal record (never decreases)
- 12-hour grace period for consecutive days

### Codeforces Integration
- Auto-verify problem submissions
- Username saved after first verification
- Supports Codeforces username (not email)
- Real-time submission checking

### Leaderboard
- Weekly and All-Time rankings
- Shows current and best streaks
- XP-based ranking system
- Real-time updates

## API Endpoints

### Authentication
- `POST /api/auth/cognito-register` - Register user
- `POST /api/auth/cognito-login` - Login user

### User
- `GET /api/users/me` - Get current user
- `PATCH /api/users/me` - Update profile

### Problems
- `GET /api/codeforces-problems/daily` - Get daily problems
- `POST /api/codeforces-problems/verify/:problemId` - Verify solution

### Leaderboard
- `GET /api/leaderboard/weekly` - Weekly leaderboard
- `GET /api/leaderboard/alltime` - All-time leaderboard

### Streaks
- `GET /api/streaks/history` - Streak history
- `GET /api/streaks/current` - Current streak

## Environment Variables

### Required
- `AWS_ACCESS_KEY_ID` - AWS credentials
- `AWS_SECRET_ACCESS_KEY` - AWS credentials
- `AWS_REGION` - AWS region (default: us-east-1)

### Optional
- `CODEFORCES_API_KEY` - For Codeforces integration
- `CODEFORCES_API_SECRET` - For Codeforces integration
- `JWT_SECRET` - Custom JWT secret

## Troubleshooting

### CORS Errors
- Ensure `FRONTEND_URL` in backend/.env matches your frontend URL
- Rebuild backend after changing .env

### Connection Refused
- Check backend is running on correct port
- Verify `VITE_API_URL` in frontend .env
- Rebuild frontend after changing .env

### DynamoDB Errors
- Verify AWS credentials are correct
- Check DynamoDB tables exist
- Ensure IAM permissions are set

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Create an issue on GitHub
- Check existing documentation
- Review deployment guides

## Acknowledgments

- Codeforces for problem data
- AWS for cloud infrastructure
- shadcn/ui for UI components
