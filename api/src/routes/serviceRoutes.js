const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const { addService, getAllServices, updateServiceById, deleteServiceById, getAllActiveCategories, getAllActiveVendors, fetchServices } = require('../controllers/admin/services');

// Middleware for protecting review routes
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'Please log in to submit a review' });
  }

  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Invalid authentication format' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Add user data to request
    next();
  } catch (error) {
    console.error('JWT verification error:', error);
    return res.status(401).json({ message: 'Invalid or expired token, please log in again' });
  }
};

// Existing routes
router.get('/user/:userId', fetchServices);
router.post('/add-service', addService);
router.get('/getAllServices', getAllServices);
router.put('/update-service/:id', updateServiceById);
router.delete('/delete-service/:id', deleteServiceById);
router.get('/active', getAllActiveCategories);
router.get('/users/vendors', getAllActiveVendors);


// Get services created by a specific user/vendor
router.get('/user/:userId', authenticateJWT, async (req, res) => {
  const { userId } = req.params;
  const currentUser = req.user;
  
   // Helper function to get current formatted timestamp
   const CURRENT_TIMESTAMP = () => {
    const now = new Date();
    return now.toISOString().slice(0, 19).replace('T', ' ');
  };

  // Helper function to get current username
  const CURRENT_USER = () => {
    return currentUser?.username || currentUser?.email || 'unknown-user';
  };
  
  console.log(`[${CURRENT_TIMESTAMP}] Getting services for user/vendor ${userId}`);
  
  try {
    // For vendors, return their created services
    const result = await pool.query(
      `SELECT s.*, 
       c.category_name,
       COALESCE(AVG(r.rating), 0) AS average_rating,
       COUNT(r.id) AS review_count
       FROM services s
       LEFT JOIN categories c ON s.category_id = c.id
       LEFT JOIN reviews r ON s.id = r.service_id
       WHERE s.vendor_id = $1
       GROUP BY s.id, c.category_name
       ORDER BY s.created_at DESC`,
      [userId]
    );
    
    console.log(`[${CURRENT_TIMESTAMP}] Found ${result.rows.length} services for user ${userId}`);
    
    return res.status(200).json({
      success: true,
      services: result.rows
    });
  } catch (error) {
    console.error(`[${CURRENT_TIMESTAMP}] Error fetching user services:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch services',
      error: error.message
    });
  }
});

// Search endpoint
router.get('/search', async (req, res) => {
  const { q } = req.query;
  
  if (!q) {
    return res.status(400).json({ message: 'Search query is required' });
  }
  
  try {
    const query = `
      SELECT 
        s.id, 
        s.name, 
        s.description, 
        c.category_name, 
        s.vendor_id,
        u.full_name AS vendor_name, 
        s.price, 
        s.location, 
        s.image_url,
        COALESCE(AVG(r.rating), 0) AS average_rating,
        COUNT(r.id) AS review_count
      FROM services s
      JOIN categories c ON s.category_id = c.id
      JOIN users u ON s.vendor_id = u.id
      LEFT JOIN reviews r ON s.id = r.service_id
      WHERE s.status = true
        AND (
          s.name ILIKE $1 
          OR s.description ILIKE $1 
          OR c.category_name ILIKE $1
          OR s.location ILIKE $1
        )
      GROUP BY s.id, c.category_name, u.full_name
      ORDER BY s.created_at DESC
    `;
    
    const result = await pool.query(query, [`%${q}%`]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'An error occurred during search' });
  }
});

// Public service details endpoint - FIX: Removed reference to r.updated_at
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    // Get service details with category and vendor info
    const serviceQuery = `
      SELECT 
        s.id, 
        s.name, 
        s.description, 
        c.id AS category_id,
        c.category_name, 
        s.vendor_id,
        u.full_name AS vendor_name, 
        u.profile_picture AS vendor_image,
        s.price, 
        s.location, 
        s.status, 
        s.image_url, 
        s.created_at, 
        s.updated_at,
        COALESCE(AVG(r.rating), 0) AS average_rating,
        COUNT(r.id) AS review_count
      FROM services s
      JOIN categories c ON s.category_id = c.id
      JOIN users u ON s.vendor_id = u.id
      LEFT JOIN reviews r ON s.id = r.service_id
      WHERE s.id = $1
      GROUP BY s.id, c.id, c.category_name, u.full_name, u.profile_picture
    `;
    
    const serviceResult = await pool.query(serviceQuery, [id]);
    
    if (serviceResult.rows.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    const service = serviceResult.rows[0];
    
    // FIX: Removed reference to r.updated_at as it doesn't exist in the database
    const reviewsQuery = `
      SELECT 
        r.id,
        r.rating,
        r.comment,
        r.created_at,
        u.id AS reviewer_id,
        u.full_name AS reviewer_name,
        u.email AS reviewer_login
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.service_id = $1
      ORDER BY r.created_at DESC
    `;
    
    const reviewsResult = await pool.query(reviewsQuery, [id]);
    
    // Add reviews to service object
    service.reviews = reviewsResult.rows;
    
    res.status(200).json(service);
  } catch (error) {
    console.error('Error fetching service details:', error);
    res.status(500).json({ message: 'Error fetching service details' });
  }
});

// REVIEW ENDPOINTS - PROTECTED WITH AUTHENTICATION
// Add a review - protected
router.post('/:serviceId/reviews', authenticateJWT, async (req, res) => {
  const { serviceId } = req.params;
  const { rating, comment } = req.body;
  
  // Get user ID from the decoded token
  const userId = req.user.userId;
  
  if (!userId) {
    return res.status(401).json({ message: 'Invalid user identification' });
  }
  
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Rating is required and must be between 1 and 5' });
  }
  
  try {
    // Log authentication success for debugging
    console.log(`Authenticated review submission - User ID: ${userId}`);
    
    // Check if service exists
    const serviceCheck = await pool.query('SELECT id FROM services WHERE id = $1', [serviceId]);
    
    if (serviceCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    // Check if user has already reviewed this service
    const existingReview = await pool.query(
      'SELECT id FROM reviews WHERE service_id = $1 AND user_id = $2',
      [serviceId, userId]
    );
    
    if (existingReview.rows.length > 0) {
      return res.status(400).json({ message: 'You have already reviewed this service' });
    }
    
    // Add new review - FIX: removed updated_at reference
    const insertQuery = `
      INSERT INTO reviews (service_id, user_id, rating, comment, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id, service_id, user_id, rating, comment, created_at
    `;
    
    const values = [serviceId, userId, rating, comment || ''];
    const result = await pool.query(insertQuery, values);
    
    // Get user details for the response
    const userQuery = 'SELECT full_name, email FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, [userId]);
    
    // Combine review with user details
    const newReview = {
      ...result.rows[0],
      reviewer_id: userId,
      reviewer_name: userResult.rows[0].full_name,
      reviewer_login: userResult.rows[0].email
    };
    
    res.status(201).json({
      status: 'success',
      message: 'Review added successfully',
      data: {
        review: newReview
      }
    });
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ message: 'An error occurred while submitting your review' });
  }
});


router.get('/:serviceId/reviews/check', authenticateJWT, async (req, res) => {
  const { serviceId } = req.params;
  const userId = req.user.userId;
  
  try {
    // Check if user has already reviewed this service
    const existingReview = await pool.query(
      'SELECT id FROM reviews WHERE service_id = $1 AND user_id = $2',
      [serviceId, userId]
    );
    
    res.status(200).json({
      reviewed: existingReview.rows.length > 0
    });
  } catch (error) {
    console.error('Error checking review:', error);
    res.status(500).json({ message: 'An error occurred while checking your review' });
  }
});

// Update a review - protected
// FIX: Assume reviews table doesn't have an updated_at column
router.put('/:serviceId/reviews/:reviewId', authenticateJWT, async (req, res) => {
  const { serviceId, reviewId } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user.userId;
  
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Rating is required and must be between 1 and 5' });
  }
  
  try {
    // Check if review exists and belongs to the user
    const reviewCheck = await pool.query(
      'SELECT id FROM reviews WHERE id = $1 AND service_id = $2 AND user_id = $3',
      [reviewId, serviceId, userId]
    );
    
    if (reviewCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Review not found or you do not have permission to update it' });
    }
    
    // FIX: Update the review without updated_at column
    const updateQuery = `
      UPDATE reviews
      SET rating = $1, comment = $2
      WHERE id = $3
      RETURNING id, service_id, user_id, rating, comment, created_at
    `;
    
    const values = [rating, comment || '', reviewId];
    const result = await pool.query(updateQuery, values);
    
    // Get user details for the response
    const userQuery = 'SELECT full_name, email FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, [userId]);
    
    // Combine review with user details
    const updatedReview = {
      ...result.rows[0],
      reviewer_id: userId,
      reviewer_name: userResult.rows[0].full_name,
      reviewer_login: userResult.rows[0].email,
      // Add a client-side updated_at since DB doesn't have it
      updated_at: new Date().toISOString()
    };
    
    res.status(200).json({
      status: 'success',
      message: 'Review updated successfully',
      data: {
        review: updatedReview
      }
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ message: 'An error occurred while updating your review' });
  }
});

// Delete a review - protected
router.delete('/:serviceId/reviews/:reviewId', authenticateJWT, async (req, res) => {
  const { serviceId, reviewId } = req.params;
  const userId = req.user.userId;
  
  try {
    // Check if review exists and belongs to the user
    const reviewCheck = await pool.query(
      'SELECT id FROM reviews WHERE id = $1 AND service_id = $2 AND user_id = $3',
      [reviewId, serviceId, userId]
    );
    
    if (reviewCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Review not found or you do not have permission to delete it' });
    }
    
    // Delete the review
    await pool.query('DELETE FROM reviews WHERE id = $1', [reviewId]);
    
    res.status(200).json({
      status: 'success',
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: 'An error occurred while deleting your review' });
  }
});

// Public routes for categories 
router.get('/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories WHERE is_active = true');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Public services list with filtering
router.get('/public/services', async (req, res) => {
  try {
    const { search, category, location, minPrice, maxPrice, sortBy } = req.query;
    
    let query = `
      SELECT 
        s.id, 
        s.name, 
        s.description, 
        c.category_name, 
        s.vendor_id,
        s.category_id,
        u.full_name AS vendor_name, 
        s.price, 
        s.location, 
        s.status, 
        s.image_url, 
        s.created_at, 
        s.updated_at,
        COALESCE(AVG(r.rating), 0) AS average_rating,
        COUNT(r.id) AS review_count
      FROM services s
      JOIN categories c ON s.category_id = c.id
      JOIN users u ON s.vendor_id = u.id
      LEFT JOIN reviews r ON s.id = r.service_id
      WHERE s.status = true
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (search) {
      query += ` AND (s.name ILIKE $${paramIndex} OR s.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    if (category) {
      query += ` AND s.category_id = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }
    
    if (location) {
      query += ` AND s.location ILIKE $${paramIndex}`;
      params.push(`%${location}%`);
      paramIndex++;
    }
    
    if (minPrice) {
      query += ` AND s.price >= $${paramIndex}`;
      params.push(minPrice);
      paramIndex++;
    }
    
    if (maxPrice) {
      query += ` AND s.price <= $${paramIndex}`;
      params.push(maxPrice);
      paramIndex++;
    }
    
    // Group by needed fields for aggregation
    query += ` GROUP BY s.id, c.category_name, u.full_name`;
    
    // Add sorting
    if (sortBy) {
      switch(sortBy) {
        case 'price_low':
          query += ` ORDER BY s.price ASC`;
          break;
        case 'price_high':
          query += ` ORDER BY s.price DESC`;
          break;
        case 'rating':
          query += ` ORDER BY average_rating DESC NULLS LAST`;
          break;
        case 'popularity':
          query += ` ORDER BY review_count DESC NULLS LAST`;
          break;
        default:
          query += ` ORDER BY s.created_at DESC`;
      }
    } else {
      query += ` ORDER BY s.created_at DESC`;
    }
    
    const result = await pool.query(query, params);
    
    res.status(200).json({
      results: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    console.error('Error fetching public services:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;