const pool = require('../../config/db');
const { createService, getServices, updateService, deleteService, getActiveVendors, getActiveCategories } = require('./adminQueries');

// Add a new service
const addService = async (req, res) => {
  const { name, description, category_id, vendor_id, price, location, image_url,status } = req.body;
  console.log(status);
  

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

// Update service by ID
const updateServiceById = async (req, res) => {
  const { id } = req.params;
  const { name, description, category_id, price, location, image_url, status } = req.body;

  if (!name || !category_id || !price) {
    return res.status(400).json({ message: 'Required fields are missing' });
  }

  let client;
  try {
    client = await pool.connect();
    const result = await updateService(client, id, { name, description, category_id, price, location, image_url, status });
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

module.exports = {
  addService,
  getAllServices,
  updateServiceById,
  deleteServiceById,
  getAllActiveCategories,
  getAllActiveVendors
};
