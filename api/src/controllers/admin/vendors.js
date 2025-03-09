const pool = require('../../config/db');
const bcrypt = require('bcrypt'); // Import bcrypt
const { createVendor, getVendors, updateVendor, deleteVendor } = require('./adminQueries');

// Add a new vendor
const addVendor = async (req, res) => {
  const { full_name, email, password, phone_number, address, profile_picture, role, is_active } = req.body;

  if (!full_name || !email || !password || !phone_number || !address) {
    return res.status(400).json({ message: 'Required fields are missing' });
  }

  let client;
  try {
    client = await pool.connect();

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await createVendor(client, { 
      full_name, 
      email, 
      password: hashedPassword, // Store hashed password
      phone_number, 
      address, 
      profile_picture, 
      role: role || 'vendor', 
      is_active: is_active || 'active' 
    });
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding vendor:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  } finally {
    if (client) client.release();
  }
};

// Get all vendors
const getAllVendors = async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const result = await getVendors(client);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No vendors found' });
    }
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    if (client) client.release();
  }
};

// Update vendor by ID
const updateVendorById = async (req, res) => {
  const { id } = req.params;
  const { full_name, email, password, phone_number, address, profile_picture, role, is_active } = req.body;

  if (!full_name || !email || !phone_number || !address) {
    return res.status(400).json({ message: 'Required fields are missing' });
  }

  let client;
  try {
    client = await pool.connect();
    const updateData = { 
      full_name, 
      email, 
      phone_number, 
      address, 
      profile_picture, 
      role: role || 'vendor', 
      is_active 
    };
    
    // Only hash and include password if it was provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    
    const result = await updateVendor(client, id, updateData);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error updating vendor:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    if (client) client.release();
  }
};

// Delete vendor by ID
const deleteVendorById = async (req, res) => {
  const { id } = req.params;
  let client;
  try {
    client = await pool.connect();
    const result = await deleteVendor(client, id);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    res.status(200).json({ message: 'Vendor deleted successfully' });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    if (client) client.release();
  }
};

module.exports = {
  addVendor,
  getAllVendors,
  updateVendorById,
  deleteVendorById
};
