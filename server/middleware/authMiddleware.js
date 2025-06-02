import admin from '../config/firebase-admin.js';
import User from '../models/User.js';

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      console.log('Received token:', token.substring(0, 50) + '...');
      
      // Verify Firebase token
      const decodedToken = await admin.auth().verifyIdToken(token);
      console.log('Firebase token verified successfully for UID:', decodedToken.uid);
      console.log('Token details:', { 
        email: decodedToken.email, 
        name: decodedToken.name,
        project: decodedToken.aud // This should be "testing-59e97"
      });
      
      // Get user from database using Firebase UID
      let user = await User.findOne({ uid: decodedToken.uid });

      if (!user) {
        console.log('User not found in MongoDB, creating new user record');
        
        // Get user info from Firebase
        const firebaseUser = await admin.auth().getUser(decodedToken.uid);
        
        // Create user in MongoDB
        user = new User({
          uid: decodedToken.uid,
          email: firebaseUser.email,
          username: firebaseUser.displayName || firebaseUser.email.split('@')[0],
          authProvider: 'firebase',
          isAdmin: false
        });
        
        await user.save();
        console.log('New user created in MongoDB:', user);
      } else {
        console.log('Found existing user in MongoDB:', user.email);
      }

      req.user = user;
      req.decodedToken = decodedToken; // Also pass the decoded token
      next();
    } catch (error) {
      console.error('Auth error details:', error);
      if (error.code === 'auth/id-token-expired') {
        console.error('Token expired');
        res.status(401).json({ message: 'Token expired', error: 'TOKEN_EXPIRED' });
      } else if (error.code === 'auth/invalid-id-token') {
        console.error('Invalid token');
        res.status(401).json({ message: 'Invalid token', error: 'INVALID_TOKEN' });
      } else if (error.code === 'auth/project-not-found') {
        console.error('Firebase project mismatch');
        res.status(401).json({ message: 'Project configuration error', error: 'PROJECT_MISMATCH' });
      } else {
        res.status(401).json({ message: 'Authentication failed', error: error.message });
      }
      return;
    }
  } else {
    console.log('No authorization header found');
    res.status(401).json({ message: 'Not authorized, no token' });
    return;
  }
};

// Admin middleware
const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as admin' });
  }
};

export { protect, adminMiddleware }; 