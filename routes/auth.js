const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/User'); // Adjust path as needed

// Replace this with your actual JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and check password (replace with your logic)
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set cookie with correct attributes for cross-origin
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'None', // Required for cross-site cookies
      secure: true,     // Required for HTTPS
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Send a 204 response (no content)
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
