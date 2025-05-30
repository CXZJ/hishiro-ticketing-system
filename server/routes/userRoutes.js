import express from 'express';
import { registerFirebaseUser, getMe, updateMe } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', registerFirebaseUser);
router.get('/me', protect, getMe);
router.patch('/me', protect, updateMe);

export default router;