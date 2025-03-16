const pool = require('../../config/db');
const { v4: uuidv4 } = require('uuid');

// Helper function to get current formatted timestamp
const getCurrentTimestamp = () => {
  return "2025-03-13 02:29:57"; // Use the provided timestamp
};

// Helper function to get username from user object
const getUserIdentifier = (userObj) => {
  if (!userObj) return 'unknown-user';
  return userObj.username || userObj.email || userObj.userId || userObj.id || 'sudeepbanjade21';
};

// Create a new booking
exports.createBooking = async (req, res) => {
  const {
    serviceId,
    vendorId,
    bookingDate,
    amount,
    notes,
    address,
    postalCode,
    city,
    province = 'Ontario',
    country = 'Canada'
  } = req.body;
  
  // Debug information
  console.log(`[${getCurrentTimestamp()}] Request user object:`, req.user);
  
  // Check if user ID exists in the request
  let userId;
  if (req.user && req.user.id) {
    userId = req.user.id;
  } else if (req.user && req.user.userId) {
    // Some auth middleware store user ID as userId instead of id
    userId = req.user.userId;
  } else if (req.user && req.user.sub) {
    // JWT sometimes stores user ID as sub
    userId = req.user.sub;
  } else {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated or session expired'
    });
  }
  
  console.log(`[${getCurrentTimestamp()}] Using user ID: ${userId} (${getUserIdentifier(req.user)})`);
  
  // Validate required fields
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated or session expired'
    });
  }
  
  if (!address) {
    return res.status(400).json({
      success: false,
      message: 'Address is required'
    });
  }

  if (!postalCode) {
    return res.status(400).json({
      success: false,
      message: 'Postal code is required'
    });
  }

  if (!city) {
    return res.status(400).json({
      success: false,
      message: 'City is required'
    });
  }

  try {
    // Start a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Check if service is already booked (has an accepted booking)
      const availabilityResult = await client.query(
        `SELECT id FROM bookings
         WHERE service_id = $1 
         AND status = 'accepted'
         LIMIT 1`,
        [serviceId]
      );
      
      if (availabilityResult.rows.length > 0) {
        console.log(`[${getCurrentTimestamp()}] Service ${serviceId} already has an accepted booking`);
        await client.query('ROLLBACK');
        return res.status(409).json({
          success: false,
          message: 'This service is currently unavailable for booking as it has been accepted by another user'
        });
      }
      
      // Insert the booking - ensure user_id is being properly passed
      const result = await client.query(
        `INSERT INTO bookings 
          (user_id, service_id, vendor_id, booking_date, amount, notes, 
           address, postal_code, city, province, country) 
         VALUES 
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
         RETURNING *`,
        [
          userId, 
          serviceId, 
          vendorId, 
          bookingDate, 
          amount, 
          notes, 
          address,
          postalCode,
          city, 
          province, 
          country
        ]
      );

      await client.query('COMMIT');
      
      const booking = result.rows[0];
      console.log(`[${getCurrentTimestamp()}] User ${getUserIdentifier(req.user)} created booking: ID ${booking.id}`);
      
      res.status(201).json({
        success: true,
        message: 'Booking created successfully',
        booking
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`[${getCurrentTimestamp()}] Error creating booking:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: error.message
    });
  }
};

// Get all bookings for the current user
exports.getUserBookings = async (req, res) => {
  const userId = req.user.id || req.user.userId;
  console.log(`[${getCurrentTimestamp()}] Getting bookings for user: ${getUserIdentifier(req.user)} (${userId})`);
  
  try {
    const result = await pool.query(
      `SELECT b.*, 
              s.name AS service_name, s.price AS service_price, s.image_url AS service_image,
              u.full_name AS vendor_name, u.profile_picture AS vendor_image
       FROM bookings b
       JOIN services s ON b.service_id = s.id
       JOIN users u ON b.vendor_id = u.id
       WHERE b.user_id = $1
       ORDER BY b.booking_date DESC`,
      [userId]
    );
    
    console.log(`[${getCurrentTimestamp()}] Found ${result.rows.length} bookings for user ${getUserIdentifier(req.user)}`);
    
    res.status(200).json({
      success: true,
      bookings: result.rows
    });
  } catch (error) {
    console.error(`[${getCurrentTimestamp()}] Error fetching bookings:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message
    });
  }
};

// Get all bookings for a vendor
exports.getVendorBookings = async (req, res) => {
  const vendorId = req.user.id || req.user.userId;
  console.log(`[${getCurrentTimestamp()}] Getting bookings for vendor: ${getUserIdentifier(req.user)} (${vendorId})`);
  
  try {
    const result = await pool.query(
      `SELECT b.*, 
              s.name AS service_name, s.price AS service_price, s.image_url AS service_image,
              u.full_name AS user_name, u.profile_picture AS user_image
       FROM bookings b
       JOIN services s ON b.service_id = s.id
       JOIN users u ON b.user_id = u.id
       WHERE b.vendor_id = $1
       ORDER BY b.booking_date DESC`,
      [vendorId]
    );
    
    console.log(`[${getCurrentTimestamp()}] Vendor ${getUserIdentifier(req.user)} fetched ${result.rows.length} bookings`);
    
    res.status(200).json({
      success: true,
      bookings: result.rows
    });
  } catch (error) {
    console.error(`[${getCurrentTimestamp()}] Error fetching vendor bookings:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message
    });
  }
};
// Check if user has a booking for a specific service with status pending or accepted
exports.checkServiceBookingdate = async (req, res) => { 
  const { serviceId } = req.params;
  
  console.log(`[${getCurrentTimestamp()}] Checking if user ${getUserIdentifier(req.user)} has booking for service ${serviceId}`);
  
  try {
    const result = await pool.query(
      `SELECT * FROM bookings
       WHERE  service_id = $1
       AND status IN ('pending', 'accepted') 
       ORDER BY booking_date DESC
       LIMIT 1`,
      [serviceId]
    );
    
    if (result.rows.length > 0) {
      console.log(`[${getCurrentTimestamp()}] Found booking ${result.rows[0].id} for service ${serviceId}`);
      res.status(200).json({
        success: true,
        hasBooking: true,
        booking: result.rows[0]
      });
    } else {
      console.log(`[${getCurrentTimestamp()}] No booking found for service ${serviceId}`);
      res.status(200).json({
        success: true,
        hasBooking: false,
        booking: null
      });
    }
  } catch (error) {
    console.error(`[${getCurrentTimestamp()}] Error checking service booking:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to check booking',
      error: error.message
    });
  }
};

// Check if user has a booking for a specific service
exports.checkServiceBooking = async (req, res) => {
  const userId = req.user.id || req.user.userId;
  const { serviceId } = req.params;
  
  console.log(`[${getCurrentTimestamp()}] Checking if user ${getUserIdentifier(req.user)} has booking for service ${serviceId}`);
  
  try {
    const result = await pool.query(
      `SELECT * FROM bookings
       WHERE user_id = $1 AND service_id = $2 
       ORDER BY booking_date DESC
       LIMIT 1`,
      [userId, serviceId]
    );
    
    if (result.rows.length > 0) {
      console.log(`[${getCurrentTimestamp()}] Found booking ${result.rows[0].id} for service ${serviceId}`);
      res.status(200).json({
        success: true,
        hasBooking: true,
        booking: result.rows[0]
      });
    } else {
      console.log(`[${getCurrentTimestamp()}] No booking found for service ${serviceId}`);
      res.status(200).json({
        success: true,
        hasBooking: false,
        booking: null
      });
    }
  } catch (error) {
    console.error(`[${getCurrentTimestamp()}] Error checking service booking:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to check booking',
      error: error.message
    });
  }
};

// Get booking by ID
exports.getBookingById = async (req, res) => {
  const { bookingId } = req.params;
  const userId = req.user.id || req.user.userId;
  
  console.log(`[${getCurrentTimestamp()}] Getting booking ${bookingId} for user ${getUserIdentifier(req.user)}`);
  
  try {
    // Query that allows either the user or vendor to view the booking
    const result = await pool.query(
      `SELECT b.*,
              s.name AS service_name, s.description AS service_description, s.price AS service_price,
              u_vendor.full_name AS vendor_name, u_vendor.email AS vendor_email, u_vendor.profile_picture AS vendor_image,
              u_user.full_name AS user_name, u_user.email AS user_email, u_user.profile_picture AS user_image
       FROM bookings b
       JOIN services s ON b.service_id = s.id
       JOIN users u_vendor ON b.vendor_id = u_vendor.id
       JOIN users u_user ON b.user_id = u_user.id
       WHERE b.id = $1 AND (b.user_id = $2 OR b.vendor_id = $2)`,
      [bookingId, userId]
    );
    
    if (result.rows.length === 0) {
      console.log(`[${getCurrentTimestamp()}] Booking ${bookingId} not found or unauthorized access`);
      return res.status(404).json({
        success: false,
        message: 'Booking not found or you do not have permission to view it'
      });
    }
    
    console.log(`[${getCurrentTimestamp()}] Found booking ${bookingId}`);
    res.status(200).json({
      success: true,
      booking: result.rows[0]
    });
  } catch (error) {
    console.error(`[${getCurrentTimestamp()}] Error fetching booking details:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking details',
      error: error.message
    });
  }
};

// Cancel a booking
exports.cancelBooking = async (req, res) => {
  const userId = req.user?.id || req.user?.userId;
  const { bookingId } = req.params;
  
  console.log(`[${getCurrentTimestamp()}] User ${getUserIdentifier(req.user)} attempting to cancel booking ${bookingId}`);
  
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated or session expired'
    });
  }
  
  try {
    // First check if the booking exists
    const checkResult = await pool.query(
      `SELECT * FROM bookings WHERE id = $1`,
      [bookingId]
    );
    
    if (checkResult.rows.length === 0) {
      console.log(`[${getCurrentTimestamp()}] Booking ${bookingId} not found`);
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    const booking = checkResult.rows[0];
    console.log(`[${getCurrentTimestamp()}] Found booking ${bookingId}, status: ${booking.status}, user_id: ${booking.user_id}`);
    
    // Check if this user owns the booking
    if (booking.user_id !== userId) {
      console.log(`[${getCurrentTimestamp()}] User ${getUserIdentifier(req.user)} not authorized for booking ${bookingId} (owner: ${booking.user_id})`);
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to cancel this booking'
      });
    }
    
    // Check if the booking can be cancelled
    if (booking.status !== 'pending') {
      console.log(`[${getCurrentTimestamp()}] Cannot cancel booking with status ${booking.status}`);
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a booking with status '${booking.status}'`
      });
    }
    
    // Update the booking status
    console.log(`[${getCurrentTimestamp()}] Updating booking ${bookingId} status to 'cancelled'`);
    const updateResult = await pool.query(
      `UPDATE bookings 
       SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING *`,
      [bookingId]
    );
    
    if (updateResult.rows.length > 0) {
      console.log(`[${getCurrentTimestamp()}] Successfully cancelled booking ${bookingId}`);
      
      res.status(200).json({
        success: true,
        message: 'Booking cancelled successfully',
        booking: updateResult.rows[0]
      });
    } else {
      console.log(`[${getCurrentTimestamp()}] Failed to update booking ${bookingId}`);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel booking, database did not update'
      });
    }
  } catch (error) {
    console.error(`[${getCurrentTimestamp()}] Error cancelling booking:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
      error: error.message
    });
  }
};

// Update booking status (for vendors)
exports.updateBookingStatus = async (req, res) => {
  const vendorId = req.user.id || req.user.userId;
  const { bookingId } = req.params;
  const { status } = req.body;
  
  console.log(`[${getCurrentTimestamp()}] Vendor ${getUserIdentifier(req.user)} updating booking ${bookingId} to status '${status}'`);
  
  // Validate status
  const validStatuses = ['accepted', 'rejected', 'completed'];
  if (!validStatuses.includes(status)) {
    console.log(`[${getCurrentTimestamp()}] Invalid status: ${status}`);
    return res.status(400).json({
      success: false,
      message: `Invalid status. Status must be one of: ${validStatuses.join(', ')}`
    });
  }
  
  try {
    // Get a client from the connection pool for transaction
    const client = await pool.connect();
    
    try {
      // Start transaction
      await client.query('BEGIN');
      
      // Check if the booking exists and belongs to this vendor
      const checkResult = await client.query(
        `SELECT b.*, u.full_name as user_name, s.name as service_name, s.id as service_id
         FROM bookings b 
         JOIN users u ON b.user_id = u.id
         JOIN services s ON b.service_id = s.id
         WHERE b.id = $1 AND b.vendor_id = $2`,
        [bookingId, vendorId]
      );
      
      if (checkResult.rows.length === 0) {
        console.log(`[${getCurrentTimestamp()}] Booking ${bookingId} not found or not owned by vendor ${getUserIdentifier(req.user)}`);
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Booking not found or you are not authorized to update it'
        });
      }
      
      const booking = checkResult.rows[0];
      const serviceId = booking.service_id;
      
      // Prevent certain status transitions
      if (booking.status === 'cancelled') {
        console.log(`[${getCurrentTimestamp()}] Cannot update cancelled booking ${bookingId}`);
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'Cannot update a cancelled booking'
        });
      }
      
      if (booking.status === 'completed' && status !== 'completed') {
        console.log(`[${getCurrentTimestamp()}] Cannot change status of completed booking ${bookingId}`);
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'Cannot change status of a completed booking'
        });
      }
      
      // If accepting the booking, check if the service is already booked
      if (status === 'accepted') {
        // Check if there are any other accepted bookings for this service
        const availabilityResult = await client.query(
          `SELECT id FROM bookings
           WHERE service_id = $1 
           AND status = 'accepted' 
           AND id != $2
           LIMIT 1`,
          [serviceId, bookingId]
        );
        
        if (availabilityResult.rows.length > 0) {
          console.log(`[${getCurrentTimestamp()}] Service ${serviceId} already has an accepted booking`);
          await client.query('ROLLBACK');
          return res.status(409).json({
            success: false,
            message: 'This service is already booked. It cannot be double-booked.'
          });
        }
      }
      
      // Update the booking status
      console.log(`[${getCurrentTimestamp()}] Updating booking ${bookingId} to status '${status}'`);
      const updateResult = await client.query(
        `UPDATE bookings 
         SET status = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2 
         RETURNING *`,
        [status, bookingId]
      );
      
      const updatedBooking = updateResult.rows[0];
      
      // If status is accepted, reject any other pending bookings for the same service
      if (status === 'accepted') {
        console.log(`[${getCurrentTimestamp()}] Rejecting other pending bookings for service ${serviceId}`);
        await client.query(
          `UPDATE bookings
           SET status = 'rejected', updated_at = CURRENT_TIMESTAMP
           WHERE service_id = $1 
           AND id != $2 
           AND status = 'pending'`,
          [serviceId, bookingId]
        );
      }
      
      // Commit transaction
      await client.query('COMMIT');
      
      console.log(`[${getCurrentTimestamp()}] Successfully updated booking ${bookingId} to status '${status}'`);
      
      res.status(200).json({
        success: true,
        message: `Booking status updated to ${status}`,
        booking: updatedBooking
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error(`[${getCurrentTimestamp()}] Error updating booking status:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking status',
      error: error.message
    });
  }
};

// Create route handler for checking if a user has a booking for a specific service
exports.checkBookingByService = async (req, res) => {
  const userId = req.user.id || req.user.userId;
  const { serviceId } = req.params;
  
  console.log(`[${getCurrentTimestamp()}] Checking if user ${getUserIdentifier(req.user)} has booking for service ${serviceId}`);
  
  try {
    const result = await pool.query(
      `SELECT * FROM bookings
       WHERE user_id = $1 AND service_id = $2 AND status != 'cancelled'
       ORDER BY booking_date DESC
       LIMIT 1`,
      [userId, serviceId]
    );
    
    if (result.rows.length > 0) {
      console.log(`[${getCurrentTimestamp()}] Found booking ${result.rows[0].id} for service ${serviceId}`);
      res.status(200).json({
        success: true,
        booking: result.rows[0]
      });
    } else {
      console.log(`[${getCurrentTimestamp()}] No booking found for service ${serviceId}`);
      res.status(200).json({
        success: true,
        booking: null
      });
    }
  } catch (error) {
    console.error(`[${getCurrentTimestamp()}] Error checking service booking:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to check booking',
      error: error.message
    });
  }
};

// Add new function to check if a service is currently booked
exports.checkServiceAvailability = async (req, res) => {
  const { serviceId } = req.params;
  
  try {
    // Check if this service has any accepted bookings that haven't been completed/cancelled/rejected
    const result = await pool.query(
      `SELECT b.booking_date, b.user_id
       FROM bookings b
       WHERE b.service_id = $1 
       AND b.status = 'accepted'
       LIMIT 1`,
      [serviceId]
    );
    
    const isAvailable = result.rows.length === 0;
  
    res.status(200).json({
      success: true,
      isAvailable,
      booking: isAvailable ? null : {
        booking_date: result.rows[0].booking_date,
        user_id: result.rows[0].user_id
      }
    });
  } catch (error) {
    console.error(`[${getCurrentTimestamp()}] Error checking service availability:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to check service availability',
      error: error.message
    });
  }
};

module.exports = {
  createBooking: exports.createBooking,
  getUserBookings: exports.getUserBookings,
  getVendorBookings: exports.getVendorBookings,
  checkServiceBooking: exports.checkServiceBooking,
  getBookingById: exports.getBookingById,
  cancelBooking: exports.cancelBooking,
  updateBookingStatus: exports.updateBookingStatus,
  checkBookingByService: exports.checkBookingByService,
  checkServiceAvailability: exports.checkServiceAvailability,
  checkServiceBookingdate: exports.checkServiceBookingdate
};