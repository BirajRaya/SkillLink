const express = require('express');
const router = express.Router();
const multer = require('multer');
const AdminUserService = require('../services/adminUserService');
const adminBookingController = require('../controllers/admin/adminBookingController');
const adminReviewController = require('../controllers/admin/adminReviewController');

// Configure multer for file upload
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB file size limit
  }
});

// Logging helper - include current user and timestamp
const logAction = (action, details = {}) => {
  console.log(`[2025-03-18 13:55:46] Admin (sudeepbanjade21) ${action}`, details);
};

// USER MANAGEMENT ROUTES
// Add route for checking email
router.get('/users/check-email', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const emailExists = await AdminUserService.checkEmailExists(email);
    logAction(`checked if email exists: ${email}`, { exists: emailExists });
    
    res.json({ 
      exists: emailExists 
    });
  } catch (error) {
    logAction('encountered error checking email', { error: error.message });
    res.status(500).json({ 
      message: 'Error checking email', 
      error: error.message 
    });
  }
});

// Create user route with file upload handling
router.post('/users', upload.single('profilePicture'), async (req, res) => {
  logAction('received request to create user', {
    body: { ...req.body, password: '[REDACTED]' },
    hasFile: !!req.file
  });

  try {
    const userData = {
      fullName: req.body.fullName,
      email: req.body.email,
      phoneNumber: req.body.phoneNumber,
      address: req.body.address,
      password: req.body.password,
      isActive: req.body.isActive,
      profilePicture: req.file ? {
        buffer: req.file.buffer,
        originalname: req.file.originalname
      } : null
    };

    const newUser = await AdminUserService.createUser(userData);
    logAction('created new user', { userId: newUser.id, email: newUser.email });
    
    res.status(201).json({
      message: 'User created successfully',
      user: newUser
    });
  } catch (error) {
    logAction('failed to create user', { error: error.message });
    res.status(400).json({ 
      message: error.message || 'Error creating user', 
      error: error.toString()
    });
  }
});

// Get all users route
router.get('/users', async (req, res) => {
  try {
    const users = await AdminUserService.getAllUsers();
    logAction('fetched all users', { count: users.length });
    res.json(users);
  } catch (error) {
    logAction('error fetching users', { error: error.message });
    res.status(500).json({ 
      message: 'Error fetching users', 
      error: error.message 
    });
  }
});

// UPDATE user route with file upload handling
router.put('/users/:id', upload.single('profilePicture'), async (req, res) => {
  logAction('received request to update user', {
    userId: req.params.id,
    body: { ...req.body, password: req.body.password ? '[REDACTED]' : undefined },
    hasFile: !!req.file
  });

  try {
    const userId = req.params.id;
    const userData = {
      fullName: req.body.fullName,
      email: req.body.email,
      phoneNumber: req.body.phoneNumber,
      address: req.body.address,
      password: req.body.password || undefined,
      isActive: req.body.isActive,
      profilePicture: req.file ? {
        buffer: req.file.buffer,
        originalname: req.file.originalname
      } : undefined
    };

    const updatedUser = await AdminUserService.updateUser(userId, userData);
    logAction('updated user', { userId, email: updatedUser.email });
    
    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    logAction('error updating user', { userId: req.params.id, error: error.message });
    res.status(error.message === 'User not found or not authorized' ? 404 : 400).json({ 
      message: error.message || 'Error updating user', 
      error: error.toString()
    });
  }
});

// DELETE user route
router.delete('/users/:id', async (req, res) => {
  logAction('received request to delete user', {
    userId: req.params.id
  });

  try {
    const userId = req.params.id;
    const deletedUser = await AdminUserService.deleteUser(userId);
    logAction('deleted user', { userId, email: deletedUser.email });
    
    res.json({
      message: 'User deleted successfully',
      user: deletedUser
    });
  } catch (error) {
    logAction('error deleting user', { userId: req.params.id, error: error.message });
    res.status(error.message === 'User not found or not authorized' ? 404 : 500).json({ 
      message: error.message || 'Error deleting user', 
      error: error.toString()
    });
  }
});

// BOOKING MANAGEMENT ROUTES
// Get all bookings with filtering and pagination
router.get('/bookings', async (req, res) => {
  
  await adminBookingController.getAllBookings(req, res);
});

// Get booking details by ID
router.get('/bookings/:bookingId', async (req, res) => {
  logAction('fetching booking details', { bookingId: req.params.bookingId });
  await adminBookingController.getBookingDetails(req, res);
});

// Update booking status
router.put('/bookings/:bookingId/status', async (req, res) => {
  logAction('updating booking status', { 
    bookingId: req.params.bookingId, 
    newStatus: req.body.status 
  });
  await adminBookingController.updateBookingStatus(req, res);
});

// REVIEW MANAGEMENT ROUTES
// Get all reviews with filtering and pagination
router.get('/reviews', async (req, res) => {
  await adminReviewController.getAllReviews(req, res);
});

// Approve a review
router.put('/reviews/:reviewId/approve', async (req, res) => {
  logAction('approving review', { reviewId: req.params.reviewId });
  await adminReviewController.approveReview(req, res);
});

// Flag or unflag a review
router.put('/reviews/:reviewId/flag', async (req, res) => {
  logAction('updating review flag status', { 
    reviewId: req.params.reviewId, 
    flag: req.body.flag 
  });
  await adminReviewController.flagReview(req, res);
});

// Delete a review
router.delete('/reviews/:reviewId', async (req, res) => {
  logAction('deleting review', { reviewId: req.params.reviewId });
  await adminReviewController.deleteReview(req, res);
});

// DASHBOARD STATISTICS
router.get('/dashboard/stats', async (req, res) => {
  logAction('fetching dashboard statistics');
  try {
    // This would normally be handled by a controller function
    // For now we're implementing it directly here
    const pool = require('../config/db');
    
    // Get user counts
    const userCountQuery = await pool.query(
      `SELECT COUNT(*) as total_users, 
        SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as regular_users,
        SUM(CASE WHEN role = 'vendor' THEN 1 ELSE 0 END) as vendors
      FROM users`
    );
    
    // Get booking statistics
    const bookingStatsQuery = await pool.query(
      `SELECT 
        COUNT(*) as total_bookings,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM bookings`
    );
    
    // Get review stats
    const reviewStatsQuery = await pool.query(
      `SELECT 
        COUNT(*) as total_reviews,
        AVG(rating)::numeric(10,1) as average_rating,
        SUM(CASE WHEN is_flagged = TRUE THEN 1 ELSE 0 END) as flagged_reviews
      FROM reviews`
    );
    
    // Get service stats
    const serviceStatsQuery = await pool.query(
      `SELECT 
        COUNT(*) as total_services,
        COUNT(DISTINCT category_id) as categories_used
      FROM services`
    );
    
    // Get recent activity
    const recentActivityQuery = await pool.query(
      `(SELECT 
          'booking' as type, 
          id, 
          created_at, 
          status as activity_status,
          NULL as details
        FROM bookings
        ORDER BY created_at DESC
        LIMIT 5)
      UNION ALL
      (SELECT 
          'review' as type, 
          id, 
          created_at, 
          CASE 
            WHEN is_flagged THEN 'flagged'
            WHEN is_approved THEN 'approved'
            ELSE 'pending'
          END as activity_status,
          comment as details
        FROM reviews
        ORDER BY created_at DESC
        LIMIT 5)
      ORDER BY created_at DESC
      LIMIT 10`
    );
    
    res.status(200).json({
      success: true,
      stats: {
        users: userCountQuery.rows[0],
        bookings: bookingStatsQuery.rows[0],
        reviews: reviewStatsQuery.rows[0],
        services: serviceStatsQuery.rows[0],
        recentActivity: recentActivityQuery.rows
      }
    });
  } catch (error) {
    logAction('error fetching dashboard stats', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
});

module.exports = router;