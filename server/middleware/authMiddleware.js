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
      
      // Verify Firebase token
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      // Get user from database using Firebase UID
      const user = await User.findOne({ uid: decodedToken.uid });

      if (!user) {
        res.status(401);
        throw new Error('Not authorized');
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Auth error:', error);
      res.status(401);
      throw new Error('Not authorized');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized');
  }
};

// Admin middleware
const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401);
    throw new Error('Not authorized as admin');
  }
};

export { protect, adminMiddleware }; 