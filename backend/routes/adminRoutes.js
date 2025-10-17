const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const User = require('../models/UserModel');

// All admin routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// List all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;