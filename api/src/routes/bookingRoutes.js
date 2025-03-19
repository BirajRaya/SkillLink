const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookings/bookingController');
const { authenticate } = require('../middleware/authMiddleware');

// Apply the authentication middleware to all booking routes
router.use(authenticate);

// Create a new booking
router.post('/', bookingController.createBooking);

// Get all bookings for the current user
router.get('/user', bookingController.getUserBookings);

// Get all bookings for a vendor
router.get('/vendor', bookingController.getVendorBookings);

// Check service availability - IMPORTANT: This route needs to be BEFORE the /:bookingId route
router.get('/service/:serviceId/availability', bookingController.checkServiceAvailability);

// Check if user has a booking for a specific service - THIS NEEDS TO BE ABOVE THE /:bookingId ROUTE
router.get('/check/:serviceId', bookingController.checkServiceBooking);

// Alternative endpoint for checking service bookings
router.get('/check-service/:serviceId', bookingController.checkBookingByService);

// Get booking by ID
router.get('/:bookingId', bookingController.getBookingById);

// Cancel a booking
router.post('/:bookingId/cancel', bookingController.cancelBooking);

// Update booking status (for vendors)
router.put('/:bookingId/status', bookingController.updateBookingStatus);

module.exports = router;