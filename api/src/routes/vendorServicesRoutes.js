// routes/vendorServicesRoutes.js
const express = require('express');
const router = express.Router();
const { 
  addVendorService,
  getVendorServices,
  getVendorActiveServices,
  getVendorInactiveServices,
  updateVendorService,
  deleteVendorService,
  toggleVendorServiceStatus
} = require('../controllers/user/vendorServicesController')
// Import the authenticate middleware
const { authenticate } = require('../controllers/auth/authController');

// Apply authentication middleware to all routes
router.use(authenticate);

// Route to add a new service - match the frontend POST to /vendorservices
router.post('/', addVendorService);

// Routes to get services - match the frontend GET to /vendorservices/getVendorServices
router.get('/getVendorServices', getVendorServices);
router.get('/active', getVendorActiveServices);
router.get('/inactive', getVendorInactiveServices);

// Route to update a service
router.put('/:id', updateVendorService);

// Route to delete a service - match the frontend DELETE to /vendorservices/:id
router.delete('/:id', deleteVendorService);

// Route to toggle service status - match the frontend PUT to /vendorservices/:id/toggle-status
router.put('/:id/toggle-status', toggleVendorServiceStatus);

module.exports = router;