import express from 'express';
import { registerFirebaseUser } from '../controllers/userController.js';

const router = express.Router();

router.post('/', registerFirebaseUser);

export default router;