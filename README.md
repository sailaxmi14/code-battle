# CodeBattle - Competitive Programming Platform

A full-stack web application for competitive programming practice with AWS Cognito authentication, DynamoDB backend, and real-time progress tracking.

## Features

- ✅ **AWS Cognito Authentication** - Secure user registration and login without email verification
- 📊 **User Dashboard** - Track daily problem completion
- 🔥 **Streak Tracking** - Monitor current and best coding streaks
- 📈 **Progress History** - View all completed problems with statistics
- 🏆 **Leaderboard** - Compete with other users
- 👤 **User Profile** - Manage profile and change password
- 💾 **DynamoDB Backend** - Scalable NoSQL database for all user data
- 🎯 **Problem Management** - Curated coding problems from LeetCode

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- Framer Motion for animations
- Shadcn/ui components
- React Router for navigation

### Backend
- Node.js with Express
- TypeScript
- AWS Cognito for authentication
- AWS DynamoDB for data storage
- JWT token validation

### AWS Services
- **Cognito** - User authentication and management
- **DynamoDB** - NoSQL database for users, problems, progress, and streaks
- **IAM** - Access management

## Quick Start

### Prerequisites

- Node.js v16 or higher
- AWS Account
- AWS CLI configured (optional)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd codebattle
```

### 2. AWS Cognito Setup

1. Go to [AWS Cognito Console](https://console.aws.amazon.com/cognito)
2. Create a new User Pool:
   - Sign-in: Email
   - Password policy: Your choice
   - MFA: Disabled (for development)
   - **IMPORTANT**: Disable email verification
   - Required attributes: name, email
3. Create App Client (no client secret)
4. Note your User Pool ID and App Client ID

### 3. Configure Frontend

Edit `src/config/cognito.ts`:

```typescript
export const cognitoConfig = {
  region: 'us-east-1',
  userPoolId: 'us-east-1_XXXXXXXXX', // Your User Pool ID
  userPoolWebClientId: 'XXXXXXXXXXXXXXXXXXXXXXXXXX', // Your App Client ID
};
```

### 4. Configure Backend

Create `backend/.env`:

```env
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key

# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Secret
JWT_SECRET=your-secret-key-change-in-production

# Frontend URL
FRONTEND_URL=http://localhost:8080
```

### 5. Setup DynamoDB Tables

#### On Linux/Mac:

```bash
cd backend
chmod +x setup-dynamodb.sh
./setup-dynamodb.sh
```

#### On Windows:

```bash
cd backend
setup-dynamodb.bat
```

#### Manual Setup:

```bash
cd backend
npm install
node create-users-dynamodb-table.js
node create-questions-dynamodb-table.js
node seed-questions-dynamodb.js
```

### 6. Start the Application

#### Terminal 1 - Backend:

```bash
cd backend
npm install
npm run dev
```

Backend runs on http://localhost:3001

#### Terminal 2 - Frontend:

```bash
npm install
npm run dev
```

Frontend runs on http://localhost:8080

### 7. Test the Application

1. Open http://localhost:8080
2. Register a new account
3. Complete a problem
4. Check your streak and history

## Project Structure

```
codebattle/
├── src/                          # Frontend source
│   ├── components/               # React components
│   ├── pages/                    # Page components
│   ├── contexts/                 # React contexts (Auth)
│   ├── services/                 # API services
│   ├── config/                   # Configuration files
│   └── lib/                      # Utilities
├── backend/                      # Backend source
│   ├── src/
│   │   ├── routes/               # API routes
│   │   ├── services/             # Business logic
│   │   ├── middleware/           # Express middleware
│   │   └── server.ts             # Server entry point
│   ├── create-users-dynamodb-table.js
│   ├── create-questions-dynamodb-table.js
│   └── seed-questions-dynamodb.js
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/cognito-register` - Register user after Cognito signup
- `POST /api/auth/login` - Legacy login (not used with Cognito)

### Users
- `GET /api/users/me` - Get current user profile
- `PATCH /api/users/me` - Update user profile

### Problems
- `GET /api/problems/today` - Get today's assigned problems
- `POST /api/problems/:problemId/complete` - Mark problem as complete

### Streaks
- `GET /api/streaks/me` - Get user streak data
- `GET /api/streaks/history` - Get streak history (last 30 days)

### History
- `GET /api/history` - Get problem completion history
- `GET /api/history/stats` - Get history statistics

### Leaderboard
- `GET /api/leaderboard/weekly` - Get weekly leaderboard
- `GET /api/leaderboard/alltime` - Get all-time leaderboard

## DynamoDB Tables

### CodeBattleUsers
- Primary Key: `userId` (String)
- Attributes: email, name, college, level, xp, currentStreak, bestStreak, totalProblemsSolved
- GSI: `CognitoSubIndex` (cognitoSub), `EmailIndex` (email)

### CodeBattleQuestions
- Primary Key: `questionId` (String)
- Attributes: title, description, difficulty, platform, problemUrl, tags
- GSI: `difficulty-createdAt-index`

### CodeBattleUserProgress
- Primary Key: `userId` (String), Sort Key: `questionId` (String)
- Attributes: difficulty, completed, completedAt, attempts, submittedUrl

### CodeBattleUserStreaks
- Primary Key: `userId` (String)
- Attributes: currentStreak, highestStreak, lastSolvedDate, totalProblemsSolved

### CodeBattleDailySolved
- Primary Key: `userId` (String), Sort Key: `date` (String)
- Attributes: problemsSolved, totalCount, easyCount, moderateCount, hardCount

## Features in Detail

### Authentication Flow

1. User registers on frontend
2. AWS Cognito creates user account
3. Frontend receives JWT tokens
4. Backend validates JWT and creates user record in DynamoDB
5. User is logged in and redirected to dashboard

### Problem Completion Flow

1. User views today's problems on dashboard
2. User clicks "Solve" to open problem on LeetCode
3. After solving, user clicks "Complete"
4. Backend updates:
   - User progress in DynamoDB
   - User XP and total problems solved
   - Current and best streak
   - Daily solved count
5. Frontend shows success message with XP earned

### Streak Calculation

- Streak increases when user completes at least 1 problem per day
- Streak resets to 0 if user misses a day
- Best streak is saved permanently
- Streak is updated in real-time after problem completion

## Development

### Frontend Development

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Backend Development

```bash
cd backend
npm run dev          # Start with nodemon (auto-reload)
npm start            # Start production server
```

### Adding New Problems

1. Edit `backend/seed-questions-dynamodb.js`
2. Add new problem objects to the `questions` array
3. Run: `node seed-questions-dynamodb.js`

## Troubleshooting

### "User Pool does not exist"
- Verify User Pool ID in `src/config/cognito.ts`
- Ensure User Pool is in the correct region

### Backend connection failed
- Check if backend is running on port 3001
- Verify AWS credentials in `backend/.env`
- Check DynamoDB tables exist in AWS Console

### No problems showing
- Run `node seed-questions-dynamodb.js`
- Check `CodeBattleQuestions` table in DynamoDB

### Authentication errors
- Clear browser localStorage
- Verify Cognito configuration
- Check App Client ID is correct

## Production Deployment

### Frontend
1. Update Cognito config with production values
2. Build: `npm run build`
3. Deploy `dist` folder to Vercel/Netlify/S3

### Backend
1. Update environment variables
2. Deploy to AWS Lambda/EC2/ECS
3. Configure CORS for production domain
4. Use AWS Secrets Manager for credentials

### Security Checklist
- [ ] Change JWT_SECRET to strong random value
- [ ] Enable HTTPS
- [ ] Configure proper CORS origins
- [ ] Use AWS Secrets Manager
- [ ] Enable CloudWatch logging
- [ ] Set up DynamoDB backups
- [ ] Configure Cognito password policies
- [ ] Enable MFA for production

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues or questions:
- Check the [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed setup instructions
- Review error logs in browser console and backend terminal
- Verify AWS service configurations

## Roadmap

- [ ] Email notifications for streaks
- [ ] Social login (Google, GitHub)
- [ ] Admin dashboard
- [ ] Problem recommendations based on user level
- [ ] Team competitions
- [ ] Achievement badges
- [ ] Mobile app
- [ ] Code submission and verification
- [ ] Discussion forums
- [ ] Video tutorials

## Authors

CodeBattle Team

## Acknowledgments

- LeetCode for problem inspiration
- AWS for cloud services
- Shadcn/ui for beautiful components


## 🚀 EC2 Deployment

### Quick Setup on EC2

For detailed EC2 deployment instructions, see [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md)

#### Windows EC2:
```bash
setup-ec2.bat
```

#### Linux EC2:
```bash
chmod +x setup-ec2.sh
./setup-ec2.sh
```

### Manual EC2 Setup

1. **Clone repository on EC2**
2. **Create backend/.env with AWS credentials**
3. **Install dependencies**: `npm install` (root and backend)
4. **Create DynamoDB tables**: `cd backend && npm run create-tables`
5. **Start servers**: Backend on port 3001, Frontend on port 8081
6. **Configure EC2 Security Group** to allow ports 3001 and 8081

See [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) for complete instructions.

---

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues and questions, please open an issue on GitHub.
