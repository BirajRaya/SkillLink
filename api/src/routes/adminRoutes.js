const express = require('express');
const router = express.Router();
const multer = require('multer');
const AdminUserService = require('../services/adminUserService');

// Configure multer for file upload
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB file size limit
  }
});

// Add route for checking email
router.get('/users/check-email', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const emailExists = await AdminUserService.checkEmailExists(email);
    
    res.json({ 
      exists: emailExists 
    });
  } catch (error) {
    console.error('Email check error:', error);
    res.status(500).json({ 
      message: 'Error checking email', 
      error: error.message 
    });
  }
});

// Create user route with file upload handling
router.post('/users', upload.single('profilePicture'), async (req, res) => {
  console.log('Received POST request to create user', {
    body: req.body,
    file: req.file
  });

  try {
    const userData = {
      fullName: req.body.fullName,
      email: req.body.email,
      phoneNumber: req.body.phoneNumber,
      address: req.body.address,
      password: req.body.password,
      isActive: req.body.isActive, // Add this line to include the isActive field
      profilePicture: req.file ? {
        buffer: req.file.buffer,
        originalname: req.file.originalname
      } : null
    };

    const newUser = await AdminUserService.createUser(userData);
    
    res.status(201).json({
      message: 'User created successfully',
      user: newUser
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(400).json({ 
      message: error.message || 'Error creating user', 
      error: error.toString()
    });
  }
});

// Get all users route
router.get('/users', async (req, res) => {
  try {
    const users = await AdminUserService.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      message: 'Error fetching users', 
      error: error.message 
    });
  }
});

// UPDATE user route with file upload handling
router.put('/users/:id', upload.single('profilePicture'), async (req, res) => {
  console.log('Received PUT request to update user', {
    userId: req.params.id,
    body: req.body,
    file: req.file
  });

  try {
    const userId = req.params.id;
    const userData = {
      fullName: req.body.fullName,
      email: req.body.email,
      phoneNumber: req.body.phoneNumber,
      address: req.body.address,
      password: req.body.password || undefined, // Only update if provided
      isActive: req.body.isActive, // Add this line to include the isActive field
      profilePicture: req.file ? {
        buffer: req.file.buffer,
        originalname: req.file.originalname
      } : undefined
    };

    const updatedUser = await AdminUserService.updateUser(userId, userData);
    
    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(error.message === 'User not found or not authorized' ? 404 : 400).json({ 
      message: error.message || 'Error updating user', 
      error: error.toString()
    });
  }
});

// DELETE user route
router.delete('/users/:id', async (req, res) => {
  console.log('Received DELETE request for user', {
    userId: req.params.id
  });

  try {
    const userId = req.params.id;
    const deletedUser = await AdminUserService.deleteUser(userId);
    
    res.json({
      message: 'User deleted successfully',
      user: deletedUser
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(error.message === 'User not found or not authorized' ? 404 : 500).json({ 
      message: error.message || 'Error deleting user', 
      error: error.toString()
    });
  }
});

module.exports = router;