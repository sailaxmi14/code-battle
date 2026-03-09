import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dynamodbUserService from '../services/dynamodbUserService.js';
import { mockUsers, MOCK_MODE } from '../services/mockStore.js';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      cognitoSub?: string;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Try to decode the token
    const decoded = jwt.decode(token) as any;
    
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // STRICT: Only accept Cognito tokens
    if (!decoded.sub || !decoded['cognito:username']) {
      console.error('❌ Non-Cognito token rejected');
      return res.status(401).json({ error: 'Only AWS Cognito authentication is supported' });
    }

    console.log('🔐 Cognito token detected, sub:', decoded.sub);
    
    // Get user from DynamoDB
    try {
      let user = await dynamodbUserService.getUserByCognitoSub(decoded.sub);

      if (!user) {
        console.log('⚠️  User not found in database, auto-registering from Cognito token...');
        
        // Auto-register user from Cognito token
        user = await dynamodbUserService.createUser({
          cognitoSub: decoded.sub,
          email: decoded.email || decoded['cognito:username'],
          name: decoded.name || decoded['cognito:username'],
          phoneNumber: decoded.phone_number,
        });
        
        console.log('✅ User auto-registered:', user.userId);
      }

      req.userId = user.userId;
      req.cognitoSub = user.cognitoSub;
      console.log('✅ Cognito auth successful, userId:', user.userId);
      next();
    } catch (dbError: any) {
      console.error('❌ Database error during authentication:', dbError.message);
      return res.status(500).json({ error: 'Authentication failed - database error' });
    }
  } catch (error) {
    console.error('❌ Auth error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};
