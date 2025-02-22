const express = require('express');
const router = express.Router();

const { 
  signup, 
  signin,
  verifyEmail, 
  resendVerification,
} = require('../controllers/auth/authController'); 

// Middleware to handle async route handlers
const asyncHandler = (fn) => (req, res, next) => {
  // Only call next if the function is valid and returns a promise
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Signup Route
router.post('/signup', asyncHandler(signup));

// SignIn Route
router.post('/signin', asyncHandler(signin));

// Email Verification Routes
router.post('/verify-email', asyncHandler(verifyEmail));
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
