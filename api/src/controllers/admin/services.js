const pool = require('../../config/db');
const { createService, getServices, updateService, deleteService, getActiveVendors, getActiveCategories } = require('./adminQueries');

// Add a new service
const addService = async (req, res) => {
  const { name, description, category_id, vendor_id, price, location, image_url,status } = req.body;
  

  if (!name || !category_id || !vendor_id || !price) {
    return res.status(400).json({ message: 'Required fields are missing' });
  }

  // if (typeof price !== 'number' || price <= 0) {
  //   return res.status(400).json({ message: 'Price must be a positive number' });
  // }

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

// Get all services
const getAllServices = async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    
    // Modified query to return 'has-image' instead of full base64 data
    const optimizedQuery = `
      SELECT 
        s.id, 
        s.name, 
        s.description, 
        s.vendor_id,
        s.category_id,
        c.category_name, 
        u.full_name AS vendor_name, 
        s.price, 
        s.location, 
        s.status, 
        CASE 
          WHEN s.image_url IS NOT NULL THEN 'has-image'
          ELSE NULL
        END as image_url,
        s.created_at, 
        s.updated_at
      FROM services s
      JOIN categories c ON s.category_id = c.id
      JOIN users u ON s.vendor_id = u.id
      ORDER BY s.created_at DESC
    `;
    
    const result = await client.query(optimizedQuery);
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

// Update service by ID
const updateServiceById = async (req, res) => {
  const { id } = req.params;
  const { name, description, category_id, vendor_id, price, location, image_url, status } = req.body;


  if (!name || !category_id || !price || !vendor_id) {
        return res.status(400).json({ message: 'Required fields are missing' });
      }

  let client;
  try {
    client = await pool.connect();
    const result = await updateService(client, id, { 
      name, 
      description, 
      category_id, 
      vendor_id, // Pass vendor_id to the update function
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
// Delete service by ID
const deleteServiceById = async (req, res) => {
  const { id } = req.params;
  let client;
  try {
    client = await pool.connect();
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


// Get service details by ID
const getServiceDetailsById = async (req, res) => {
  const { id } = req.params;
  let client;
  try {
    client = await pool.connect();
    const result = await getServiceDetails(client, id);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching service details:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    if (client) client.release();
  }
};

// Add a new review
const addReview = async (req, res) => {
  const { service_id, rating, comment } = req.body;
  const user_id = req.user.id;

  if (!service_id || !rating) {
    return res.status(400).json({ message: 'Service ID and rating are required' });
  }

  let client;
  try {
    client = await pool.connect();
    const result = await createReview(client, { service_id, user_id, rating, comment });
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    if (client) client.release();
  }
};

// Get reviews by service ID
const getReviewsByServiceId = async (req, res) => {
  const { id } = req.params;
  let client;
  try {
    client = await pool.connect();
    const result = await getReviewsByServiceId(client, id);
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  } finally {
    if (client) client.release();
  }
};

// Fetch services from backend for current user only
const fetchServices = async (req, res) => {
  let client;
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' }); // Unauthorized if no userId
    }
    
    client = await pool.connect(); 
    
    const result = await client.query(
      'SELECT services.*, categories.category_name AS category_name  FROM services JOIN categories ON services.category_id = categories.id  WHERE vendor_id = $1',
      [userId] // Filters services based on vendor ID and 'Active' status
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No services found' }); // No services found for this user
    }
    
    res.status(200).json(result.rows); // Return services in response
  } catch (error) {
    console.error('Error fetching user services:', error);
    res.status(500).json({ message: 'Server error' }); // Internal server error
  } finally {
    if (client) client.release(); // Ensure the client connection is released after use
  }
};

module.exports = {
  addService,
  getAllServices,
  updateServiceById,
  deleteServiceById,
  getAllActiveCategories,
  getAllActiveVendors,
  getServiceDetailsById,
  addReview,
  getReviewsByServiceId,
  fetchServices
};
