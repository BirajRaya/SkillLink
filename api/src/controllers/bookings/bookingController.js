const pool = require('../../config/db');
const { v4: uuidv4 } = require('uuid');
const { sendBookingStatusNotification } = require('../../services/bookingNotificationService');

// Helper function to get username from user object
const getUserIdentifier = (userObj) => {
  if (!userObj) return 'unknown-user';
  return userObj.username || userObj.email || userObj.userId || userObj.id;
};

// Adapter function to transform field names for notification service
const adaptBookingDataForNotification = (bookingData) => {
  return {
    bookingId: bookingData.id,
    status: bookingData.status,
    serviceName: bookingData.service_name,
    bookingDate: bookingData.booking_date,
    bookingTime: bookingData.displayTime,
    amount: bookingData.amount,
    address: bookingData.address,
    city: bookingData.city,
    province: bookingData.province,
    postal_code: bookingData.postal_code,
    country: bookingData.country,
    notes: bookingData.notes,
    user: {
      name: bookingData.user_name,
      email: bookingData.user_email
    },
    vendor: {
      name: bookingData.vendor_name,
      email: bookingData.vendor_email
    }
  };
};

// Helper function to prepare booking notification data
const prepareNotificationData = async (bookingId, client) => {
  // Use the provided client if in a transaction, otherwise use pool
  const dbClient = client || pool;
  
  const result = await dbClient.query(
    `SELECT b.*,
            s.name AS service_name, s.description AS service_description, 
            u_vendor.full_name AS vendor_name, u_vendor.email AS vendor_email,
            u_user.full_name AS user_name, u_user.email AS user_email
     FROM bookings b
     JOIN services s ON b.service_id = s.id
     JOIN users u_vendor ON b.vendor_id = u_vendor.id
     JOIN users u_user ON b.user_id = u_user.id
     WHERE b.id = $1`,
    [bookingId]
  );
  
  if (result.rows.length === 0) return null;
  
  const booking = result.rows[0];
  
  // Format booking date using displayTime if available
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Extract time from booking_date 
  const getDisplayTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };
  
  return {
    id: booking.id,
    status: booking.status,
    service_name: booking.service_name,
    booking_date: formatDate(booking.booking_date),
    displayTime: getDisplayTime(booking.booking_date),
    amount: booking.amount,
    address: booking.address,
    city: booking.city,
    province: booking.province,
    postal_code: booking.postal_code,
    country: booking.country,
    notes: booking.notes,
    user_name: booking.user_name,
    user_email: booking.user_email,
    vendor_name: booking.vendor_name,
    vendor_email: booking.vendor_email
  };
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
        console.log(`Service ${serviceId} already has an accepted booking`);
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

      const booking = result.rows[0];
      
      // Prepare notification data while still in transaction
      const notificationData = await prepareNotificationData(booking.id, client);
      
      // Commit the transaction
      await client.query('COMMIT');
      
      // Send notification after transaction is committed
      if (notificationData) {
        try {
          // Use adapter to transform data for notification service
          const adaptedData = adaptBookingDataForNotification(notificationData);
          // Log data before sending for debugging
          console.log('Sending notification with data:', {
            bookingId: adaptedData.bookingId,
            status: adaptedData.status,
            userEmail: adaptedData.user.email,
            vendorEmail: adaptedData.vendor.email
          });
          
          await sendBookingStatusNotification(adaptedData);
          console.log(`Sent 'pending' notifications for booking ${booking.id}`);
        } catch (notifError) {
          console.error(`Failed to send notification for booking ${booking.id}:`, {
            error: notifError.message,
            stack: notifError.stack,
            responseBody: notifError.response?.body
          });
          // Don't fail the request if notification fails
        }
      }
      
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
    console.error(`Error creating booking:`, error);
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
        
    res.status(200).json({
      success: true,
      bookings: result.rows
    });
  } catch (error) {
    
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
        
    res.status(200).json({
      success: true,
      bookings: result.rows
    });
  } catch (error) {
    console.error(`Error fetching vendor bookings:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message
    });
  }
};

// Check if user has a booking for a specific service
exports.checkServiceBooking = async (req, res) => {
  const userId = req.user.id || req.user.userId;
  const { serviceId } = req.params;
    
  try {
    const result = await pool.query(
      `SELECT * FROM bookings
       WHERE user_id = $1 AND service_id = $2 AND status != 'cancelled'
       ORDER BY booking_date DESC
       LIMIT 1`,
      [userId, serviceId]
    );
    
    if (result.rows.length > 0) {
      console.log(`Found booking ${result.rows[0].id} for service ${serviceId}`);
      res.status(200).json({
        success: true,
        hasBooking: true,
        booking: result.rows[0]
      });
    } else {
      res.status(200).json({
        success: true,
        hasBooking: false,
        booking: null
      });
    }
  } catch (error) {
    console.error(`Error checking service booking:`, error);
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
  
  console.log(`Getting booking ${bookingId} for user ${getUserIdentifier(req.user)}`);
  
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
      console.log(`Booking ${bookingId} not found or unauthorized access`);
      return res.status(404).json({
        success: false,
        message: 'Booking not found or you do not have permission to view it'
      });
    }
    
    console.log(`Found booking ${bookingId}`);
    res.status(200).json({
      success: true,
      booking: result.rows[0]
    });
  } catch (error) {
    console.error(`Error fetching booking details:`, error);
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
      console.log(`[2025-03-15 18:49:04] Booking ${bookingId} not found`);
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    const booking = checkResult.rows[0];
    console.log(`[2025-03-15 18:49:04] Found booking ${bookingId}, status: ${booking.status}, user_id: ${booking.user_id}`);
    
    // Check if this user owns the booking
    if (booking.user_id !== userId) {
      console.log(`[2025-03-15 18:49:04] User ${getUserIdentifier(req.user)} not authorized for booking ${bookingId} (owner: ${booking.user_id})`);
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to cancel this booking'
      });
    }
    
    // Check if the booking can be cancelled
    if (booking.status !== 'pending') {
      console.log(`[2025-03-15 18:49:04] Cannot cancel booking with status ${booking.status}`);
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a booking with status '${booking.status}'`
      });
    }
    
    // Update the booking status
    const updateResult = await pool.query(
      `UPDATE bookings 
       SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING *`,
      [bookingId]
    );
    
    if (updateResult.rows.length > 0) {
      console.log(`[2025-03-15 18:49:04] Successfully cancelled booking ${bookingId}`);
      
      // Prepare and send notification for cancelled booking
      try {
        const notificationData = await prepareNotificationData(bookingId);
        if (notificationData) {
          // Use adapter to transform data for notification service
          const adaptedData = adaptBookingDataForNotification(notificationData);
          console.log('[2025-03-15 18:49:04] Sending cancellation notification with data:', {
            bookingId: adaptedData.bookingId,
            status: adaptedData.status,
            userEmail: adaptedData.user.email,
            vendorEmail: adaptedData.vendor.email
          });
          
          await sendBookingStatusNotification(adaptedData);
          console.log(`[2025-03-15 18:49:04] Sent 'cancelled' notifications for booking ${bookingId}`);
        }
      } catch (notifError) {
        console.error(`[2025-03-15 18:49:04] Failed to send cancellation notification for booking ${bookingId}:`, {
          error: notifError.message,
          stack: notifError.stack,
          responseBody: notifError.response?.body
        });
        // Don't fail the request if notification fails
      }
      
      res.status(200).json({
        success: true,
        message: 'Booking cancelled successfully',
        booking: updateResult.rows[0]
      });
    } else {
      console.log(`[2025-03-15 18:49:04] Failed to update booking ${bookingId}`);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel booking, database did not update'
      });
    }
  } catch (error) {
    console.error(`[2025-03-15 18:49:04] Error cancelling booking:`, error);
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
  
  console.log(`[2025-03-15 18:49:04] Vendor ${getUserIdentifier(req.user)} updating booking ${bookingId} to status '${status}'`);
  
  // Validate status
  const validStatuses = ['accepted', 'rejected', 'completed'];
  if (!validStatuses.includes(status)) {
    console.log(`[2025-03-15 18:49:04] Invalid status: ${status}`);
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
        console.log(`[2025-03-15 18:49:04] Booking ${bookingId} not found or not owned by vendor ${getUserIdentifier(req.user)}`);
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
        console.log(`[2025-03-15 18:49:04] Cannot update cancelled booking ${bookingId}`);
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'Cannot update a cancelled booking'
        });
      }
      
      if (booking.status === 'completed' && status !== 'completed') {
        console.log(`[2025-03-15 18:49:04] Cannot change status of completed booking ${bookingId}`);
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
          console.log(`[2025-03-15 18:49:04] Service ${serviceId} already has an accepted booking`);
          await client.query('ROLLBACK');
          return res.status(409).json({
            success: false,
            message: 'This service is already booked. It cannot be double-booked.'
          });
        }
      }
      
      // Update the booking status
      console.log(`[2025-03-15 18:49:04] Updating booking ${bookingId} to status '${status}'`);
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
        console.log(`[2025-03-15 18:49:04] Rejecting other pending bookings for service ${serviceId}`);
        await client.query(
          `UPDATE bookings
           SET status = 'rejected', updated_at = CURRENT_TIMESTAMP
           WHERE service_id = $1 
           AND id != $2 
           AND status = 'pending'`,
          [serviceId, bookingId]
        );
      }
      
      // Prepare notification data while still in transaction
      const notificationData = await prepareNotificationData(bookingId, client);
      
      // Commit transaction
      await client.query('COMMIT');
      
      // Send notification after transaction is committed
      if (notificationData) {
        try {
          // Use adapter to transform data for notification service
          const adaptedData = adaptBookingDataForNotification(notificationData);
          console.log('[2025-03-15 18:49:04] Sending status update notification with data:', {
            bookingId: adaptedData.bookingId,
            status: adaptedData.status,
            userEmail: adaptedData.user.email,
            vendorEmail: adaptedData.vendor.email
          });
          
          await sendBookingStatusNotification(adaptedData);
          console.log(`[2025-03-15 18:49:04] Sent '${status}' notifications for booking ${bookingId}`);
        } catch (notifError) {
          console.error(`[2025-03-15 18:49:04] Failed to send status notification for booking ${bookingId}:`, {
            error: notifError.message,
            stack: notifError.stack,
            responseBody: notifError.response?.body
          });
          // Don't fail the request if notification fails
        }
      }
      
      console.log(`[2025-03-15 18:49:04] Successfully updated booking ${bookingId} to status '${status}'`);
      
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
    console.error(`[2025-03-15 18:49:04] Error updating booking status:`, error);
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
  
  try {
    const result = await pool.query(
      `SELECT * FROM bookings
       WHERE user_id = $1 AND service_id = $2 AND status != 'cancelled'
       ORDER BY booking_date DESC
       LIMIT 1`,
      [userId, serviceId]
    );
    
    if (result.rows.length > 0) {
      console.log(`[2025-03-15 18:49:04] Found booking ${result.rows[0].id} for service ${serviceId}`);
      res.status(200).json({
        success: true,
        booking: result.rows[0]
      });
    } else {
      console.log(`[2025-03-15 18:49:04] No booking found for service ${serviceId}`);
      res.status(200).json({
        success: true,
        booking: null
      });
    }
  } catch (error) {
    console.error(`[2025-03-15 18:49:04] Error checking service booking:`, error);
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
      `SELECT b.* 
       FROM bookings b
       WHERE b.service_id = $1 
       AND b.status = 'accepted'
       LIMIT 1`,
      [serviceId]
    );
    
    const isAvailable = result.rows.length === 0;
    
    console.log(`[2025-03-15 18:49:04] Service ${serviceId} availability check: ${isAvailable ? 'Available' : 'Unavailable'}`);
    
    res.status(200).json({
      success: true,
      isAvailable,
      booking: isAvailable ? null : result.rows[0]
    });
  } catch (error) {
    console.error(`[2025-03-15 18:49:04] Error checking service availability:`, error);
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
  checkServiceAvailability: exports.checkServiceAvailability
};