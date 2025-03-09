const pool = require('../../config/db');
const { createService, getServices, updateService, deleteService, getActiveVendors, getActiveCategories, getVendorServices } = require('../admin/adminQueries')
const { authenticateJWT } = require('../auth/authController');

// Add a new service
const addService = async (req, res) => {
  const { name, description, category_id, price, location, image_url, status } = req.body;
  
  // Get the vendor_id from the logged-in user
  const vendor_id = req.user.id;

  if (!name || !category_id || !price) {
    return res.status(400).json({ message: 'Required fields are missing' });
  }

  let client;
  try {
    client = await pool.connect();
    const result = await createService(client, { name, description, category_id, vendor_id, price, location, image_url, status });
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding service:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  } finally {
    if (client) client.release();
  }
};

// Get services for logged-in user only
const getUserServices = async (req, res) => {
  let client;
  try {
    const userId = req.user.id; // Get the user ID from the JWT payload
    
    client = await pool.connect();
    const result = await client.query(
      'SELECT services.*, categories.category_name FROM services ' +
      'LEFT JOIN categories ON services.category_id = categories.id ' +
      'WHERE services.vendor_id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No services found' });
    }
    
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching user services:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    if (client) client.release();
  }
};

// Get all services (for admin only)
const getAllServices = async (req, res) => {
  let client;
  try {
    // Check if user is admin before allowing access to all services
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    
    client = await pool.connect();
    const result = await getServices(client);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No services found' });
    }
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    if (client) client.release();
  }
};

// Update service by ID - verify ownership
const updateServiceById = async (req, res) => {
  const { id } = req.params;
  const { name, description, category_id, price, location, image_url, status } = req.body;
  const userId = req.user.id;

  if (!name || !category_id || !price) {
    return res.status(400).json({ message: 'Required fields are missing' });
  }

  let client;
  try {
    client = await pool.connect();
    
    // Check if the service belongs to the logged-in user
    const serviceCheck = await client.query(
      'SELECT * FROM services WHERE id = $1 AND vendor_id = $2',
      [id, userId]
    );
    
    if (serviceCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Access denied. You do not own this service.' });
    }
    
    // Use the logged-in user's ID as the vendor_id
    const result = await updateService(client, id, { 
      name, 
      description, 
      category_id, 
      vendor_id: userId,  // Ensure the vendor ID is the logged-in user
      price, 
      location, 
      image_url, 
      status 
    });

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    if (client) client.release();
  }
};

// Delete service by ID - verify ownership
const deleteServiceById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  let client;
  try {
    client = await pool.connect();
    
    // Check if the service belongs to the logged-in user
    const serviceCheck = await client.query(
      'SELECT * FROM services WHERE id = $1 AND vendor_id = $2',
      [id, userId]
    );
    
    if (serviceCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Access denied. You do not own this service.' });
    }
    
    const result = await deleteService(client, id);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }
    res.status(200).json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    if (client) client.release();
  }
};

const getAllActiveCategories = async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const categories = await getActiveCategories(client);
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    if (client) client.release();
  }
};

const getAllActiveVendors = async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const vendors = await getActiveVendors(client);
    res.json(vendors);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    if (client) client.release();
  }
};

module.exports = {
  addService,
  getAllServices,
  getUserServices,
  updateServiceById,
  deleteServiceById,
  getAllActiveCategories,
  getAllActiveVendors
};