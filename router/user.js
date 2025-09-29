const express = require('express');
const User = require('../models/users');
const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { admin, firstName, lastName, email, password, phoneNumber, imageUrl } = req.body;
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const user = new User({ admin, firstName, lastName, email, password, phoneNumber, imageUrl });
    await user.save();
    res.status(201).json({ message: 'User registered successfully', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
