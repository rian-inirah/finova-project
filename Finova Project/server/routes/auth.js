const express = require('express');
const rateLimit = require('express-rate-limit');
const { authenticateToken } = require('../middleware/auth');
const { 
  login, 
  getProfile, 
  verifyToken,
  loginValidation 
} = require('../controllers/authController');

const router = express.Router();

// Rate limiting for login attempts
const loginLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_ATTEMPTS) || 5, // 5 attempts per window
  message: {
    error: 'Too many login attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Routes
router.post('/login', loginLimiter, loginValidation, login);
router.get('/profile', authenticateToken, getProfile);
router.get('/verify', authenticateToken, verifyToken);

module.exports = router;
