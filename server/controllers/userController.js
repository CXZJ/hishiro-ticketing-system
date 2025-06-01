import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// @desc    Register a new user from Firebase Auth
// @route   POST /api/users
// @access  Public
const registerFirebaseUser = async (req, res) => {
  console.log('Received registration request:', req.body);
  const { uid, email, username, gender, phone, address, authProvider } = req.body;

  if (!uid || !email) {
    console.log('Missing required fields:', { uid, email });
    return res.status(400).json({ message: 'Missing uid or email' });
  }

  try {
    // Check if user already exists
    const userExists = await User.findOne({ uid });
    if (userExists) {
      console.log('User already exists:', userExists);
      return res.status(200).json({
        message: 'User already exists',
        user: userExists
      });
    }

    // Create user
    const user = new User({ uid, email, username, gender, phone, address, authProvider });
    const savedUser = await user.save();
    console.log('User created successfully:', savedUser);
    
    return res.status(201).json({
      message: 'User registered successfully',
      user: savedUser
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ 
      message: 'Error creating user',
      error: error.message 
    });
  }
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
    photoURL: user.photoURL,
    isAdmin: user.isAdmin,
  });
};

// @desc    Update current user
// @route   PATCH /api/users/me
// @access  Private
const updateMe = async (req, res) => {
  const user = req.user; // Populated by auth middleware
  const { username, gender, phone, address, photoURL } = req.body;

  if (username !== undefined) user.username = username;
  if (gender !== undefined) user.gender = gender;
  if (phone !== undefined) user.phone = phone;
  if (address !== undefined) user.address = address;
  if (photoURL !== undefined) user.photoURL = photoURL;

  await user.save();

  res.status(200).json({
    id: user._id,
    email: user.email,
    username: user.username,
    gender: user.gender,
    phone: user.phone,
    address: user.address,
    photoURL: user.photoURL,
    isAdmin: user.isAdmin,
  });
};

// Generate token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    // Only allow admin
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized as admin' });
    }
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users', error: err.message });
  }
};

// @desc    Update any user by ID (admin only)
// @route   PATCH /api/users/:id
// @access  Private/Admin
const updateUserById = async (req, res) => {
  try {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized as admin' });
    }
    const { id } = req.params;
    // Try to find by _id or uid
    let user = await User.findById(id);
    if (!user) {
      user = await User.findOne({ uid: id });
    }
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const { username, gender, phone, address, photoURL } = req.body;
    if (username !== undefined) user.username = username;
    if (gender !== undefined) user.gender = gender;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (photoURL !== undefined) user.photoURL = photoURL;
    await user.save();
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update user', error: err.message });
  }
};

export {
  loginUser,
  getMe,
  registerFirebaseUser,
  updateMe,
  getAllUsers,
  updateUserById,
};