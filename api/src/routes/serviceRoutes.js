const express = require('express');
const router = express.Router();
const { addService, getAllServices, updateServiceById, deleteServiceById,getAllActiveCategories,getAllActiveVendors } = require('../controllers/admin/services');

// Route to add a new service
router.post('/add-service', addService);

// Route to get all services
router.get('/getAllServices', getAllServices);

// Route to update a service by ID
router.put('/update-service/:id', updateServiceById);

// Route to delete a service by ID
router.delete('/delete-service/:id', deleteServiceById);

router.get('/active',getAllActiveCategories);
router.get('/users/vendors',getAllActiveVendors);

module.exports = router;
