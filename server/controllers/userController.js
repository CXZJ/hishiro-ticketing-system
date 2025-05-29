import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// @desc    Register a new user from Firebase Auth
// @route   POST /api/users
// @access  Public
const registerFirebaseUser = async (req, res) => {
  const { uid, email, username, gender, phone, address, authProvider } = req.body;

  if (!uid || !email) {
    return res.status(400).json({ message: 'Missing uid or email' });
  }

  // Check if user already exists
  const userExists = await User.findOne({ uid });
  if (userExists) {
    return res.status(200).json(userExists); // Return already registered user
  }

  // Create user
  const user = new User({ uid, email, username, gender, phone, address, authProvider });
  await user.save();
  res.status(201).json(user);
};

//This part below (loginUser) is not needed, firebase handles user authentication, 
// but we can keep if we want to do some custom login logic

// @desc    Login a user
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  // Check user and passwords match
  if (user && (await bcrypt.compare(password, user.password))) {
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error('Invalid credentials');
  }
};

/// fix this ?/ for user settings
// @desc    Get current user
// @route   GET /api/users/me
// @access  Private
const getMe = async (req, res) => {
  const user = req.user; // Populated by auth middleware
  res.status(200).json({
    id: user._id,
    email: user.email,
    username: user.username,
    gender: user.gender,
    phone: user.phone,
    address: user.address,
    isAdmin: user.isAdmin,
    // add any other fields you want to expose
  });
};

// Generate token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

export {
  loginUser,
  getMe,
  registerFirebaseUser,
};