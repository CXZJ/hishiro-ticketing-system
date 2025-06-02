import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import admin from '../config/firebase-admin.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Administrative operations (admin access required)
 */

/**
 * @swagger
 * /api/admin/check:
 *   get:
 *     summary: Check if current user has admin privileges
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin status check successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isAdmin:
 *                   type: boolean
 *                   description: Whether the user has admin privileges
 *                   example: true
 *       403:
 *         description: User is not an admin
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isAdmin:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Access denied"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/admin/set-admin/{uid}:
 *   post:
 *     summary: Grant admin privileges to a user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: Firebase UID of the user to grant admin privileges to
 *         example: "firebase-uid-123"
 *     responses:
 *       200:
 *         description: Admin status granted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Admin status set successfully"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       403:
 *         description: Not authorized to set admin status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Not authorized to set admin status"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User not found"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/admin/remove-admin/{uid}:
 *   post:
 *     summary: Remove admin privileges from a user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: Firebase UID of the user to remove admin privileges from
 *         example: "firebase-uid-123"
 *     responses:
 *       200:
 *         description: Admin status removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Admin status removed successfully"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       403:
 *         description: Not authorized to remove admin status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Not authorized to remove admin status"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User not found"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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