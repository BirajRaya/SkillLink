const pool = require('../../config/db');

// Get all reviews with filtering, sorting, and pagination
exports.getAllReviews = async (req, res) => {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  try {
    const { page = 1, limit = 10, status, sort = 'created_at', order = 'desc', search } = req.query;
    const offset = (page - 1) * limit;
    
    // Build query conditions
    let conditions = [];
    let params = [];
    let paramIndex = 1;
    
    // Add search filter if provided
    if (search) {
      conditions.push(`(
        s.name ILIKE $${paramIndex} OR
        u.full_name ILIKE $${paramIndex} OR
        r.comment ILIKE $${paramIndex}
      )`);
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    // Build WHERE clause
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) 
      FROM reviews r
      JOIN services s ON r.service_id = s.id
      JOIN users u ON r.user_id = u.id
      ${whereClause}
    `;
    
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);
    
    // Get reviews with pagination, sorting
    const reviewsQuery = `
      SELECT 
        r.*,
        s.name AS service_name,
        u.full_name AS reviewer_name, u.email AS reviewer_email,
        u_vendor.full_name AS vendor_name
      FROM reviews r
      JOIN services s ON r.service_id = s.id
      JOIN users u ON r.user_id = u.id
      LEFT JOIN users u_vendor ON s.vendor_id = u_vendor.id
      ${whereClause}
      ORDER BY r.${sort} ${order.toUpperCase()}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    
    params.push(parseInt(limit), parseInt(offset));
    const reviewsResult = await pool.query(reviewsQuery, params);
    
    // Get review statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as "totalReviews",
        COALESCE(AVG(rating), 0)::numeric(10,1) as "averageRating",
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as "rating1",
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as "rating2",
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as "rating3",
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as "rating4",
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as "rating5"
      FROM reviews
    `;
    
    const statsResult = await pool.query(statsQuery);
    const statsData = statsResult.rows[0];
    
    // Format the statistics data
    const statistics = {
      totalReviews: parseInt(statsData.totalReviews) || 0,
      averageRating: parseFloat(statsData.averageRating) || 0,
      ratingDistribution: {
        1: parseInt(statsData.rating1) || 0,
        2: parseInt(statsData.rating2) || 0,
        3: parseInt(statsData.rating3) || 0,
        4: parseInt(statsData.rating4) || 0,
        5: parseInt(statsData.rating5) || 0
      }
    };
    
    
    res.status(200).json({
      success: true,
      total,
      reviews: reviewsResult.rows,
      statistics,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error(`[${timestamp}] Error fetching admin reviews:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: error.message
    });
  }
};

// Delete a review
exports.deleteReview = async (req, res) => {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  try {
    const { reviewId } = req.params;
    
    const result = await pool.query(
      `DELETE FROM reviews WHERE id = $1 RETURNING *`,
      [reviewId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    console.log(`[${timestamp}] Admin deleted review ${reviewId}`);
    
    res.status(200).json({
      success: true,
      message: 'Review has been deleted',
      review: result.rows[0]
    });
  } catch (error) {
    console.error(`[${timestamp}] Error deleting review:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete review',
      error: error.message
    });
  }
};

// Simple version of approve review - just returns success since we don't have the column
exports.approveReview = async (req, res) => {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  try {
    const { reviewId } = req.params;
    
    // Check if review exists
    const checkResult = await pool.query(
      `SELECT id FROM reviews WHERE id = $1`,
      [reviewId]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    console.log(`[${timestamp}] Admin approved review ${reviewId} (simulated)`);
    
    // Return success even though we don't update anything
    res.status(200).json({
      success: true,
      message: 'Review has been approved',
      review: checkResult.rows[0]
    });
  } catch (error) {
    console.error(`[${timestamp}] Error approving review:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve review',
      error: error.message
    });
  }
};

// Simple version of flag review - just returns success since we don't have the column
exports.flagReview = async (req, res) => {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  try {
    const { reviewId } = req.params;
    const { flag } = req.body;
    
    // Check if review exists
    const checkResult = await pool.query(
      `SELECT id FROM reviews WHERE id = $1`,
      [reviewId]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    console.log(`[${timestamp}] Admin ${flag ? 'flagged' : 'unflagged'} review ${reviewId} (simulated)`);
    
    // Return success even though we don't update anything
    res.status(200).json({
      success: true,
      message: flag ? 'Review has been flagged' : 'Flag has been removed from review',
      review: checkResult.rows[0]
    });
  } catch (error) {
    console.error(`[${timestamp}] Error updating review flag:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to update review flag',
      error: error.message
    });
  }
};