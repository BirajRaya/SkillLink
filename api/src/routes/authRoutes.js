const express = require('express');
const router = express.Router();

const { 
  signup, 
  verifyEmail, 
  resendVerification,
  checkVerification 
} = require('../controllers/authController');

// Middleware to handle async route handlers
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Signup Route
router.post('/signup', asyncHandler(signup));


// Email Verification Routes
router.post('/verify-email', asyncHandler(verifyEmail));
router.get('/check-verification/:email', asyncHandler(checkVerification));
router.post('/resend-verification', asyncHandler(resendVerification));

// Global error handler
router.use((err, req, res, next) => {
  console.error('Route Error:', err);
  res.status(500).json({ 
    message: 'An unexpected error occurred', 
    error: process.env.NODE_ENV === 'production' ? {} : err.message 
  });
});

module.exports = router;