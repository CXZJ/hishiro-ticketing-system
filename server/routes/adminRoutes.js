import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import admin from '../config/firebase-admin.js';

const router = express.Router();

// Check if user is admin
router.get('/check', protect, async (req, res) => {
  try {
    console.log('Checking admin status for user:', req.user.uid);
    
    // Check only MongoDB for admin status
    const user = await User.findOne({ uid: req.user.uid });
    console.log('Found user:', user);
    
    if (user?.isAdmin) {
      console.log('User is admin');
      res.json({ isAdmin: true });
    } else {
      console.log('User is not admin');
      res.status(403).json({ isAdmin: false });
    }
  } catch (error) {
    console.error('Error checking admin status:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all users (admin only)
router.get('/users', protect, async (req, res) => {
  try {
    // Check if the requesting user is an admin
    const requestingUser = await User.findOne({ uid: req.user.uid });
    if (!requestingUser?.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to view users' });
    }

    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new user (admin only)
router.post('/users', protect, async (req, res) => {
  try {
    // Check if the requesting user is an admin
    const requestingUser = await User.findOne({ uid: req.user.uid });
    if (!requestingUser?.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to create users' });
    }

    const { email, password, role } = req.body;

    // Create user in Firebase
    const userRecord = await admin.auth().createUser({
      email,
      password,
    });

    // Create user in MongoDB
    const user = new User({
      uid: userRecord.uid,
      email: userRecord.email,
      isAdmin: role === 'admin'
    });

    await user.save();

    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete user (admin only)
router.delete('/users/:uid', protect, async (req, res) => {
  try {
    // Check if the requesting user is an admin
    const requestingUser = await User.findOne({ uid: req.user.uid });
    if (!requestingUser?.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete users' });
    }

    // Delete user from Firebase
    await admin.auth().deleteUser(req.params.uid);

    // Delete user from MongoDB
    await User.findOneAndDelete({ uid: req.params.uid });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Set admin status for a user
router.post('/set-admin/:uid', protect, async (req, res) => {
  try {
    // Check if the requesting user is an admin
    const requestingUser = await User.findOne({ uid: req.user.uid });
    if (!requestingUser?.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to set admin status' });
    }

    // Update user in database
    const updatedUser = await User.findOneAndUpdate(
      { uid: req.params.uid },
      { isAdmin: true },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'Admin status set successfully', user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Remove admin status from a user
router.post('/remove-admin/:uid', protect, async (req, res) => {
  try {
    // Check if the requesting user is an admin
    const requestingUser = await User.findOne({ uid: req.user.uid });
    if (!requestingUser?.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to remove admin status' });
    }

    // Update user in database
    const updatedUser = await User.findOneAndUpdate(
      { uid: req.params.uid },
      { isAdmin: false },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'Admin status removed successfully', user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router; 