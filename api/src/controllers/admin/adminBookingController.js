const pool = require('../../config/db');

// Get all bookings with filtering, sorting, and pagination
exports.getAllBookings = async (req, res) => {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  try {
    const { page = 1, limit = 10, status, sort = 'created_at', order = 'desc', search } = req.query;
    const offset = (page - 1) * limit;
    
    // Build query conditions
    let conditions = [];
    let params = [];
    let paramIndex = 1;
    
    // Add status filter if provided
    if (status && status !== 'all') {
      conditions.push(`b.status = $${paramIndex++}`);
      params.push(status);
    }
    
    // Add search filter if provided
    if (search) {
      conditions.push(`(
        s.name ILIKE $${paramIndex} OR
        u_user.full_name ILIKE $${paramIndex} OR
        u_vendor.full_name ILIKE $${paramIndex}
      )`);
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    // Build WHERE clause
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) 
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN users u_user ON b.user_id = u_user.id
      JOIN users u_vendor ON b.vendor_id = u_vendor.id
      ${whereClause}
    `;
    
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);
    
    // Get bookings with pagination, sorting
    const bookingsQuery = `
      SELECT 
        b.*,
        s.name AS service_name, s.price AS service_price,
        u_user.full_name AS user_name, u_user.email AS user_email,
        u_vendor.full_name AS vendor_name, u_vendor.email AS vendor_email
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN users u_user ON b.user_id = u_user.id
      JOIN users u_vendor ON b.vendor_id = u_vendor.id
      ${whereClause}
      ORDER BY b.${sort} ${order.toUpperCase()}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    
    params.push(parseInt(limit), parseInt(offset));
    const bookingsResult = await pool.query(bookingsQuery, params);
    
    // Get booking statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = 'disputed' THEN 1 ELSE 0 END) as disputed
      FROM bookings
    `;
    
    const statsResult = await pool.query(statsQuery);
    
    
    res.status(200).json({
      success: true,
      total,
      bookings: bookingsResult.rows,
      statistics: statsResult.rows[0],
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error(`Error fetching admin bookings:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message
    });
  }
};

// Get booking details by ID
exports.getBookingDetails = async (req, res) => {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  try {
    const { bookingId } = req.params;
    
    const result = await pool.query(
      `SELECT 
        b.*,
        s.name AS service_name, s.description AS service_description,
        u_user.full_name AS user_name, u_user.email AS user_email,
        u_vendor.full_name AS vendor_name, u_vendor.email AS vendor_email
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN users u_user ON b.user_id = u_user.id
      JOIN users u_vendor ON b.vendor_id = u_vendor.id
      WHERE b.id = $1`,
      [bookingId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    console.log(`[${timestamp}] Admin viewed booking details for ID: ${bookingId}`);
    
    res.status(200).json({
      success: true,
      booking: result.rows[0]
    });
  } catch (error) {
    console.error(`[${timestamp}] Error fetching booking details:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking details',
      error: error.message
    });
  }
};

// Update booking status
exports.updateBookingStatus = async (req, res) => {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  try {
    const { bookingId } = req.params;
    const { status } = req.body;
    
    if (!['pending', 'accepted', 'completed', 'cancelled', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }
    
    // Start a transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get current booking info
      const currentBookingQuery = await client.query(
        'SELECT status, service_id FROM bookings WHERE id = $1',
        [bookingId]
      );
      
      if (currentBookingQuery.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }
      
      const currentBooking = currentBookingQuery.rows[0];
      
      // Update the booking status
      const updateResult = await client.query(
        `UPDATE bookings 
         SET status = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2 
         RETURNING *`,
        [status, bookingId]
      );
      
      // If status is changed to accepted, reject any other pending bookings for the same service
      if (status === 'accepted') {
        await client.query(
          `UPDATE bookings
           SET status = 'rejected', updated_at = CURRENT_TIMESTAMP
           WHERE service_id = $1 AND id != $2 AND status = 'pending'`,
          [currentBooking.service_id, bookingId]
        );
      }
      
      await client.query('COMMIT');
      
      console.log(`[${timestamp}] Admin updated booking ${bookingId} status from ${currentBooking.status} to ${status}`);
      
      res.status(200).json({
        success: true,
        message: `Booking status updated to ${status}`,
        booking: updateResult.rows[0]
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`[${timestamp}] Error updating booking status:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking status',
      error: error.message
    });
  }
};