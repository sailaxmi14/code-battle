import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import dynamodbUserService from '../services/dynamodbUserService.js';
import { mockUsers, MOCK_MODE } from '../services/mockStore.js';

const router = express.Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  college: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const cognitoRegisterSchema = z.object({
  cognitoSub: z.string(),
  email: z.string().email(),
  name: z.string(),
  phoneNumber: z.string().optional(),
  college: z.string().optional(),
});

// Cognito Register - Create user in backend after Cognito registration
router.post('/cognito-register', async (req, res) => {
  try {
    const { cognitoSub, email, name, phoneNumber, college } = cognitoRegisterSchema.parse(req.body);
    
    console.log('📝 Cognito registration request:', { cognitoSub, email, name });
    
    // Check if user already exists by cognitoSub
    let existingUser = await dynamodbUserService.getUserByCognitoSub(cognitoSub);
    
    if (existingUser) {
      console.log('✅ User already exists, returning existing user');
      return res.json({ user: existingUser });
    }
    
    // Check by email as fallback
    existingUser = await dynamodbUserService.getUserByEmail(email);
    
    if (existingUser) {
      console.log('⚠️  User exists with different cognitoSub, updating...');
      // Update the cognitoSub to match current Cognito user
      const updatedUser = await dynamodbUserService.updateUser(existingUser.userId, {
        cognitoSub,
        name,
        phoneNumber,
        college,
      });
      console.log('✅ User cognitoSub updated');
      return res.json({ user: updatedUser });
    }

    // Create new user
    const user = await dynamodbUserService.createUser({
      cognitoSub,
      email,
      name,
      phoneNumber,
      college,
    });

    console.log('✅ New Cognito user created:', user.userId);
    res.status(201).json({ user });
  } catch (error: any) {
    console.error('❌ Cognito register error:', error);
    res.status(400).json({ error: 'Cognito registration failed', details: error.message });
  }
});

// Legacy routes disabled - Only Cognito authentication is supported
router.post('/register', async (req, res) => {
  res.status(403).json({ 
    error: 'Legacy registration disabled', 
    message: 'Please use AWS Cognito authentication' 
  });
});

router.post('/login', async (req, res) => {
  res.status(403).json({ 
    error: 'Legacy login disabled', 
    message: 'Please use AWS Cognito authentication' 
  });
});

router.post('/google', async (req, res) => {
  res.status(403).json({ 
    error: 'Google OAuth disabled', 
    message: 'Please use AWS Cognito authentication' 
  });
});

export default router;
