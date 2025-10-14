const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

/**
 * Protect routes by requiring a valid JWT token. Attaches the user to req.user.
 */
exports.protect = async (req, res, next) => {
  let token;
  // Expect token in Authorization header as 'Bearer <token>'
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = await User.findById(decoded.id).select('-password');
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token invalid' });
  }
};

/**
 * Middleware to restrict access based on user roles.
 * Usage: router.use(authorize('teacher'))
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorised' });
    }
    next();
  };
};