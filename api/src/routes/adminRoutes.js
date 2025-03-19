const express = require('express');
const router = express.Router();
const multer = require('multer');
const AdminUserService = require('../services/adminUserService');
const adminBookingController = require('../controllers/admin/adminBookingController');
const adminReviewController = require('../controllers/admin/adminReviewController');
const pool = require('../config/db');
const jwt = require('jsonwebtoken');

// Authentication middleware for admin routes
const authenticateAdmin = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.'
      });
    }
    
    // Extract token from header
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Check if user exists and is an admin
    const userQuery = 'SELECT * FROM users WHERE id = $1 AND role = $2';
    const { rows } = await pool.query(userQuery, [decoded.userId, 'admin']);
    
    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Admin access required'
      });
    }
    
    // Add user to request object
    req.user = rows[0];
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

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

// Apply authentication middleware to all admin routes that need protection
router.use(['/dashboard-stats', '/users', '/users/:id'], authenticateAdmin);

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

// Fetch dashboard statistics for admin
router.get('/dashboard-stats', async (req, res) => {
  try {
    // Summary stats - Users, Vendors, Bookings, Revenue
    const summaryQuery = `
      SELECT
        (SELECT COUNT(*) FROM users WHERE role = 'user' AND is_active = 'active') as active_users,
        (SELECT COUNT(*) FROM users WHERE role = 'vendor' AND is_active = 'active') as active_vendors,
        (SELECT COUNT(*) FROM bookings) as total_bookings,
        (SELECT COALESCE(SUM(amount), 0) FROM bookings WHERE status = 'completed') as total_revenue,
        (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '30 days' AND role = 'user') as new_users_month,
        (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '30 days' AND role = 'vendor') as new_vendors_month,
        (SELECT COUNT(*) FROM bookings WHERE booking_date > NOW() - INTERVAL '30 days') as new_bookings_month,
        (SELECT COALESCE(SUM(amount), 0) FROM bookings WHERE booking_date > NOW() - INTERVAL '30 days' AND status = 'completed') as new_revenue_month
    `;

    // Monthly growth data for charts
    const monthlyGrowthQuery = `
      SELECT 
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') as month,
        COUNT(CASE WHEN role = 'user' THEN 1 END) as users,
        COUNT(CASE WHEN role = 'vendor' THEN 1 END) as vendors
      FROM users
      WHERE created_at > NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at)
    `;

    const monthlyBookingsQuery = `
      SELECT 
        TO_CHAR(DATE_TRUNC('month', booking_date), 'Mon') as month,
        COUNT(*) as bookings,
        SUM(amount) as revenue
      FROM bookings
      WHERE booking_date > NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', booking_date)
      ORDER BY DATE_TRUNC('month', booking_date)
    `;

    // Service categories data
    const serviceCategoriesQuery = `
      SELECT 
        c.category_name as name,
        COUNT(s.id) as value
      FROM services s
      JOIN categories c ON s.category_id = c.id
      GROUP BY c.category_name
      ORDER BY value DESC
      LIMIT 4
    `;

    // Weekly booking data
    const weeklyBookingQuery = `
      SELECT 
        TO_CHAR(booking_date, 'Dy') as day,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as canceled
      FROM bookings
      WHERE booking_date > NOW() - INTERVAL '7 days'
      GROUP BY TO_CHAR(booking_date, 'Dy'), DATE_PART('dow', booking_date)
      ORDER BY DATE_PART('dow', booking_date)
    `;

    // Top performing vendors
    const topVendorsQuery = `
      SELECT 
        u.id,
        u.full_name as name, 
        c.category_name as service,
        COALESCE(AVG(r.rating), 0) as rating,
        COUNT(b.id) as bookings,
        COALESCE(SUM(b.amount), 0) as revenue
      FROM users u
      JOIN services s ON u.id = s.vendor_id
      JOIN categories c ON s.category_id = c.id
      LEFT JOIN bookings b ON s.id = b.service_id
      LEFT JOIN reviews r ON s.id = r.service_id
      WHERE u.role = 'vendor'
      GROUP BY u.id, u.full_name, c.category_name
      ORDER BY bookings DESC, revenue DESC
      LIMIT 4
    `;

    // Recent activities
    const recentActivitiesQuery = `
      SELECT 
        CASE 
          WHEN b.id IS NOT NULL THEN 'Booking'
          WHEN u.id IS NOT NULL AND u.created_at > NOW() - INTERVAL '7 days' AND u.role = 'vendor' THEN 'Vendor Registration'
          WHEN u.id IS NOT NULL AND u.created_at > NOW() - INTERVAL '7 days' AND u.role = 'user' THEN 'New User'
          ELSE 'Other'
        END as activity,
        CASE
          WHEN b.id IS NOT NULL THEN u.full_name
          ELSE u.full_name
        END as user,
        CASE
          WHEN b.id IS NOT NULL THEN (SELECT name FROM services WHERE id = b.service_id)
          WHEN u.role = 'vendor' THEN 'Vendor Registration'
          WHEN u.role = 'user' THEN 'Account Creation'
          ELSE ''
        END as type,
        CASE
          WHEN b.id IS NOT NULL THEN b.created_at
          ELSE u.created_at
        END as date,
        CASE
          WHEN b.id IS NOT NULL THEN b.status
          WHEN u.is_active = 'active' THEN 'Active'
          ELSE 'Inactive'
        END as status
      FROM (
        SELECT id, user_id, service_id, status, created_at FROM bookings
        UNION ALL
        SELECT NULL as id, id as user_id, NULL as service_id, is_active as status, created_at FROM users
        WHERE created_at > NOW() - INTERVAL '7 days'
      ) events
      LEFT JOIN bookings b ON events.id = b.id
      LEFT JOIN users u ON events.user_id = u.id
      ORDER BY CASE WHEN b.id IS NOT NULL THEN b.created_at ELSE u.created_at END DESC
      LIMIT 5
    `;

    // Pending tasks
    const pendingTasksQuery = `
      SELECT
        (SELECT COUNT(*) FROM users WHERE role = 'vendor' AND is_active = 'inactive') as vendor_approvals,
        (SELECT COUNT(*) FROM dispute WHERE status = 'pending') as payment_disputes,
        (SELECT COUNT(*) FROM reviews WHERE created_at > NOW() - INTERVAL '7 days') as new_reviews
    `;

    // Execute all queries in parallel
    const [
      summaryResult,
      monthlyGrowthResult,
      monthlyBookingsResult,
      serviceCategoriesResult,
      weeklyBookingResult,
      topVendorsResult,
      recentActivitiesResult,
      pendingTasksResult
    ] = await Promise.all([
      pool.query(summaryQuery),
      pool.query(monthlyGrowthQuery),
      pool.query(monthlyBookingsQuery),
      pool.query(serviceCategoriesQuery),
      pool.query(weeklyBookingQuery),
      pool.query(topVendorsQuery),
      pool.query(recentActivitiesQuery),
      pool.query(pendingTasksQuery)
    ]);

    // Prepare user acquisition data - since we don't have actual referral source data
    // we'll create mock data based on user count
    const totalUsers = parseInt(summaryResult.rows[0].active_users);

    // Format top vendors data to include currency
    const formattedTopVendors = topVendorsResult.rows.map(vendor => ({
      ...vendor,
      rating: parseFloat(vendor.rating).toFixed(1),
      revenue: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(vendor.revenue)
    }));

    // Format recent activities date
    const formattedActivities = recentActivitiesResult.rows.map((activity, index) => ({
      id: index + 1,
      activity: activity.activity,
      user: activity.user,
      type: activity.type,
      date: activity.date.toISOString().split('T')[0],
      status: activity.status
    }));

    // Prepare monthly data by merging user growth and booking data
    const monthMap = {};
    
    monthlyGrowthResult.rows.forEach(row => {
      monthMap[row.month] = {
        month: row.month,
        users: parseInt(row.users),
        vendors: parseInt(row.vendors),
        bookings: 0,
        revenue: 0
      };
    });
    
    monthlyBookingsResult.rows.forEach(row => {
      if (monthMap[row.month]) {
        monthMap[row.month].bookings = parseInt(row.bookings);
        monthMap[row.month].revenue = parseFloat(row.revenue);
      } else {
        monthMap[row.month] = {
          month: row.month,
          users: 0,
          vendors: 0,
          bookings: parseInt(row.bookings),
          revenue: parseFloat(row.revenue)
        };
      }
    });

    const monthlyData = Object.values(monthMap);

    // Prepare pending tasks
    const pendingTasks = [
      {
        id:  1,
        title: 'Payment Disputes',
        description: `${pendingTasksResult.rows[0].payment_disputes} payment disputes requiring mediation`,
        status: parseInt(pendingTasksResult.rows[0].payment_disputes) > 5 ? 'urgent' : 'normal',
        dueDate: new Date(Date.now() + 172800000).toISOString().split('T')[0], // day after tomorrow
        count: parseInt(pendingTasksResult.rows[0].payment_disputes)
      },
      {
        id: 3,
        title: 'Customer Reviews',
        description: `There are ${pendingTasksResult.rows[0].new_reviews} new reviews`,
        status: 'normal',
        dueDate: new Date(Date.now() + 259200000).toISOString().split('T')[0], // 3 days from now
        count: parseInt(pendingTasksResult.rows[0].new_reviews)
      }
    ].filter(task => task.count > 0);

    // Compile all dashboard data
    const dashboardData = {
      summary: {
        totalUsers: parseInt(summaryResult.rows[0].active_users),
        registeredVendors: parseInt(summaryResult.rows[0].active_vendors),
        totalBookings: parseInt(summaryResult.rows[0].total_bookings),
        revenue: parseFloat(summaryResult.rows[0].total_revenue),
        newUsersGrowth: Math.round((parseInt(summaryResult.rows[0].new_users_month) / parseInt(summaryResult.rows[0].active_users)) * 100),
        newVendorsGrowth: Math.round((parseInt(summaryResult.rows[0].new_vendors_month) / parseInt(summaryResult.rows[0].active_vendors)) * 100),
        newBookingsGrowth: Math.round((parseInt(summaryResult.rows[0].new_bookings_month) / parseInt(summaryResult.rows[0].total_bookings)) * 100),
        revenueGrowth: Math.round((parseFloat(summaryResult.rows[0].new_revenue_month) / parseFloat(summaryResult.rows[0].total_revenue)) * 100)
      },
      monthlyData,
      serviceData: serviceCategoriesResult.rows.map(category => ({
        ...category,
        value: parseInt(category.value),
        color: ['#8884d8', '#82ca9d', '#ffc658', '#ff8042'][Math.floor(Math.random() * 4)]
      })),
      weeklyBookingData: weeklyBookingResult.rows.map(day => ({
        ...day,
        completed: parseInt(day.completed),
        canceled: parseInt(day.canceled)
      })),
      topVendors: formattedTopVendors,
      recentActivities: formattedActivities,
      pendingTasks
    };

    res.json({
      success: true,
      dashboardData
    });
  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
      error: error.message
    });
  }
});

module.exports = router;