const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { findOrCreateGoogleCitizen, verifyGoogleCredential } = require('../services/googleAuth');

function createLoginResponse(user) {
  const token = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  return {
    message: 'Login successful!',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
}

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, village } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      phone,
      village
    });

    await user.save();

    res.status(201).json({ message: 'User registered successfully!' });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = user.password ? await bcrypt.compare(password, user.password) : false;
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    res.json(createLoginResponse(user));

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/google', async (req, res) => {
  try {
    const profile = await verifyGoogleCredential(req.body?.idToken);
    const user = await findOrCreateGoogleCitizen(profile);
    res.json(createLoginResponse(user));
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error('Google sign-in failed:', error.message);
    res.status(500).json({ message: 'Google sign-in failed. Please try again.' });
  }
});

module.exports = router;