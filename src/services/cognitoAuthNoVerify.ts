import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
  CognitoUserSession,
} from 'amazon-cognito-identity-js';
import { cognitoConfig } from '../config/cognito';

const userPool = new CognitoUserPool({
  UserPoolId: cognitoConfig.userPoolId,
  ClientId: cognitoConfig.userPoolWebClientId,
});

// Cache for session validation to avoid repeated Cognito calls
let sessionCache: { isValid: boolean; timestamp: number } | null = null;
const CACHE_DURATION = 60000; // 1 minute cache

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  phoneNumber?: string;
}

export interface AuthTokens {
  accessToken: string;
  idToken: string;
  refreshToken: string;
}

// ============================================
// SIGN UP (Auto-confirmed, no email verification)
// ============================================
export const signUp = async (data: SignUpData): Promise<any> => {
  return new Promise((resolve, reject) => {
    const attributeList: CognitoUserAttribute[] = [
      new CognitoUserAttribute({ Name: 'email', Value: data.email }),
      new CognitoUserAttribute({ Name: 'name', Value: data.name }),
    ];

    // Add phone number if provided
    if (data.phoneNumber) {
      attributeList.push(
        new CognitoUserAttribute({ Name: 'phone_number', Value: data.phoneNumber })
      );
    }

    userPool.signUp(
      data.email,
      data.password,
      attributeList,
      [],
      (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        if (!result) {
          reject(new Error('Sign up failed'));
          return;
        }
        
        // User is created
        resolve({
          user: result.user,
          userConfirmed: result.userConfirmed,
          userSub: result.userSub,
        });
      }
    );
  });
};

// ============================================
// SIGN IN
// ============================================
export const signIn = (email: string, password: string): Promise<AuthTokens> => {
  return new Promise((resolve, reject) => {
    const authenticationDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });

    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (result: CognitoUserSession) => {
        // Update cache on successful login
        sessionCache = { isValid: true, timestamp: Date.now() };
        
        resolve({
          accessToken: result.getAccessToken().getJwtToken(),
          idToken: result.getIdToken().getJwtToken(),
          refreshToken: result.getRefreshToken().getToken(),
        });
      },
      onFailure: (err) => {
        reject(err);
      },
    });
  });
};

// ============================================
// SIGN OUT
// ============================================
export const signOut = (): void => {
  const cognitoUser = userPool.getCurrentUser();
  if (cognitoUser) {
    cognitoUser.signOut();
  }
  localStorage.removeItem('accessToken');
  localStorage.removeItem('idToken');
  localStorage.removeItem('refreshToken');
  
  // Clear session cache
  sessionCache = null;
};

// ============================================
// GET CURRENT USER
// ============================================
export const getCurrentUser = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    const cognitoUser = userPool.getCurrentUser();

    if (!cognitoUser) {
      reject(new Error('No user found'));
      return;
    }

    cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session) {
        reject(err || new Error('No session found'));
        return;
      }

      if (!session.isValid()) {
        reject(new Error('Session is invalid'));
        return;
      }

      cognitoUser.getUserAttributes((err, attributes) => {
        if (err || !attributes) {
          reject(err || new Error('No attributes found'));
          return;
        }

        const userData: any = {};
        attributes.forEach((attribute) => {
          userData[attribute.Name] = attribute.Value;
        });

        resolve(userData);
      });
    });
  });
};

// ============================================
// CHECK IF AUTHENTICATED
// ============================================
export const isAuthenticated = (): Promise<boolean> => {
  return new Promise((resolve) => {
    // Check cache first for instant response
    if (sessionCache && Date.now() - sessionCache.timestamp < CACHE_DURATION) {
      resolve(sessionCache.isValid);
      return;
    }

    const cognitoUser = userPool.getCurrentUser();

    if (!cognitoUser) {
      sessionCache = { isValid: false, timestamp: Date.now() };
      resolve(false);
      return;
    }

    // Add timeout to prevent hanging
    const timeout = setTimeout(() => {
      sessionCache = { isValid: false, timestamp: Date.now() };
      resolve(false);
    }, 5000);

    cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
      clearTimeout(timeout);
      
      if (err || !session) {
        sessionCache = { isValid: false, timestamp: Date.now() };
        resolve(false);
        return;
      }

      const isValid = session.isValid();
      sessionCache = { isValid, timestamp: Date.now() };
      resolve(isValid);
    });
  });
};

// ============================================
// GET ACCESS TOKEN
// ============================================
export const getAccessToken = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    const cognitoUser = userPool.getCurrentUser();

    if (!cognitoUser) {
      reject(new Error('No user found'));
      return;
    }

    cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session) {
        reject(err || new Error('No session found'));
        return;
      }

      if (!session.isValid()) {
        reject(new Error('Session is invalid'));
        return;
      }

      resolve(session.getAccessToken().getJwtToken());
    });
  });
};

// ============================================
// REFRESH SESSION
// ============================================
export const refreshSession = (): Promise<AuthTokens> => {
  return new Promise((resolve, reject) => {
    const cognitoUser = userPool.getCurrentUser();

    if (!cognitoUser) {
      reject(new Error('No user found'));
      return;
    }

    cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session) {
        reject(err || new Error('No session found'));
        return;
      }

      const refreshToken = session.getRefreshToken();

      cognitoUser.refreshSession(refreshToken, (err, newSession) => {
        if (err) {
          reject(err);
          return;
        }

        resolve({
          accessToken: newSession.getAccessToken().getJwtToken(),
          idToken: newSession.getIdToken().getJwtToken(),
          refreshToken: newSession.getRefreshToken().getToken(),
        });
      });
    });
  });
};

// Dummy functions for compatibility (not needed without verification)
export const confirmSignUp = async (email: string, code: string): Promise<string> => {
  return Promise.resolve('Not needed - auto-confirmed');
};

export const resendConfirmationCode = async (email: string): Promise<string> => {
  return Promise.resolve('Not needed - auto-confirmed');
};

export const forgotPassword = async (email: string): Promise<any> => {
  throw new Error('Forgot password not implemented');
};

export const confirmForgotPassword = async (
  email: string,
  code: string,
  newPassword: string
): Promise<string> => {
  throw new Error('Password reset not implemented');
};

export const changePassword = async (
  oldPassword: string,
  newPassword: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const cognitoUser = userPool.getCurrentUser();

    if (!cognitoUser) {
      reject(new Error('No user found'));
      return;
    }

    cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session) {
        reject(err || new Error('No session found'));
        return;
      }

      cognitoUser.changePassword(oldPassword, newPassword, (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(result);
      });
    });
  });
};

export const deleteUser = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    const cognitoUser = userPool.getCurrentUser();

    if (!cognitoUser) {
      reject(new Error('No user found'));
      return;
    }

    cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session) {
        reject(err || new Error('No session found'));
        return;
      }

      cognitoUser.deleteUser((err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve('User deleted successfully');
      });
    });
  });
};

export default {
  signUp,
  signIn,
  signOut,
  getCurrentUser,
  isAuthenticated,
  getAccessToken,
  refreshSession,
  confirmSignUp,
  resendConfirmationCode,
  forgotPassword,
  confirmForgotPassword,
  changePassword,
  deleteUser,
};
