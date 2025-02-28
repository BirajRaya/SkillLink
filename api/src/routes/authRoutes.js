const express = require('express');
const router = express.Router();
const { validateOTP } = require('../controllers/auth/otpverification');
const { resetPassword } = require('../controllers/auth/resetPasswordController');
const { forgotPassword } = require('../controllers/auth/forgotPassword');
const adminAuthMiddleware = require('../middleware/adminAuth');
const { 
  signup, 
  signin, 
  verifyEmail, 
  resendVerification 
} = require('../controllers/auth/authController');

// Middleware to handle async route handlers
const asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Signup Route
router.post('/signup', asyncHandler(signup));

// SignIn Route
router.post('/signin', asyncHandler(signin));

// Email Verification Routes
router.post('/verify-email', asyncHandler(verifyEmail));
router.post('/resend-verification', asyncHandler(resendVerification));

router.post('/otp',asyncHandler(validateOTP));
router.post('/reset-password', asyncHandler(resetPassword));
router.post('/forgot-password', asyncHandler(forgotPassword));



// Global error handler
router.use((err, req, res, next) => {
  console.error('Route Error:', err);
  res.status(500).json({
    message: 'An unexpected error occurred',
    error: process.env.NODE_ENV === 'production' ? {} : err.message
  });
});

// Apply to admin routes
router.use('/admin', adminAuthMiddleware);

module.exports = router;