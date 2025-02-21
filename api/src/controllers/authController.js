const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
require('dotenv').config();

const { sendVerificationEmail } = require('../services/emailService');
const generateVerificationCode = require('../utils/codeGenerator');
const { v4: uuidv4 } = require('uuid');

// Create a new pool instance
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Signup handler
const signup = async (req, res) => {
  const client = await pool.connect();
  
  try {
    console.log('Signup Request Body:', req.body);

    await client.query('BEGIN');

    const { fullName, email, password, phone, address, profilePicture, role } = req.body;

    // Comprehensive input validation
    const validationErrors = [];
    if (!fullName) validationErrors.push('Full Name is required');
    if (!email) validationErrors.push('Email is required');
    if (!password) validationErrors.push('Password is required');
    if (!phone) validationErrors.push('Phone number is required');
    if (!address) validationErrors.push('Address is required');

    if (validationErrors.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        message: 'Validation Failed',
        errors: validationErrors
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        message: 'Invalid email format'
      });
    }

    // Check if email exists
    const checkEmailQuery = 'SELECT * FROM users WHERE email = $1';
    const emailCheck = await client.query(checkEmailQuery, [email]);
    
    if (emailCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const verificationExpiry = new Date();
    verificationExpiry.setMinutes(verificationExpiry.getMinutes() + 10);

    // Hash password
    let hashedPassword;
    try {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    } catch (hashError) {
      console.error('Password Hashing Error:', hashError);
      await client.query('ROLLBACK');
      return res.status(500).json({ 
        message: 'Error processing password',
        error: hashError.message 
      });
    }

    // Prepare file upload path (if applicable)
    const profilePictureUrl = profilePicture ? `/uploads/${profilePicture}` : null;

    // Insert user query
    const insertUserQuery = `
      INSERT INTO users (
        id,
        full_name,
        email,
        password,
        phone_number,
        address,
        profile_picture,
        role,
        is_verified,
        verification_code,
        verification_code_expires_at,
        is_active,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, email, full_name`;

    const values = [
      uuidv4(),
      fullName,
      email,
      hashedPassword,
      phone,
      address,
      profilePictureUrl,
      role || 'user',
      false,
      verificationCode,
      verificationExpiry,
      true
    ];

    let result;
    try {
      result = await client.query(insertUserQuery, values);
      await client.query('COMMIT');
    } catch (insertError) {
      console.error('User Insertion Error:', insertError);
      await client.query('ROLLBACK');
      return res.status(500).json({ 
        message: 'Registration failed',
        error: insertError.message 
      });
    }

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationCode);
    } catch (emailError) {
      console.error('Verification Email Sending Failed:', emailError);
      // Non-critical error, registration still succeeds
    }

    res.status(201).json({
      message: 'Registration successful. Please check your email for verification code.',
      email: result.rows[0].email,
      requiresVerification: true
    });

  } catch (error) {
    console.error('Signup Error:', error);
    await client.query('ROLLBACK');
    res.status(500).json({ 
      message: 'Registration failed',
      error: error.message 
    });
  } finally {
    client.release();
  }
};

// Email verification handler
const verifyEmail = async (req, res) => {
  const client = await pool.connect();
  try {
    const { email, code } = req.body;

    console.log('Starting verification process for:', { email, code });

    // Check if user exists and get their verification data
    const userCheckQuery = `
      SELECT 
        verification_code,
        verification_code_expires_at,
        is_verified,
        id,
        full_name
      FROM users 
      WHERE email = $1`;

    const userCheck = await client.query(userCheckQuery, [email]);
    
    console.log('User verification data:', {
      found: userCheck.rows.length > 0,
      storedCode: userCheck.rows[0]?.verification_code,
      inputCode: code,
      storedExpiry: userCheck.rows[0]?.verification_code_expires_at,
      isVerified: userCheck.rows[0]?.is_verified,
      currentTime: new Date()
    });

    if (userCheck.rows.length === 0) {
      return res.status(400).json({
        message: 'User not found'
      });
    }

    const userData = userCheck.rows[0];

    // Check if already verified
    if (userData.is_verified) {
      return res.status(400).json({
        message: 'Email is already verified'
      });
    }

    // Check if code matches
    if (userData.verification_code !== code) {
      return res.status(400).json({
        message: 'Invalid verification code'
      });
    }

    // Check if code is expired
    if (new Date() > new Date(userData.verification_code_expires_at)) {
      return res.status(400).json({
        message: 'Verification code has expired. Please request a new code.'
      });
    }

    console.log('All verification checks passed, updating user status...');

    // Update user as verified
    const updateQuery = `
      UPDATE users 
      SET is_verified = true,
          verification_code = null,
          verification_code_expires_at = null,
          updated_at = CURRENT_TIMESTAMP
      WHERE email = $1
      RETURNING id, email, full_name, is_verified`;

    const updateResult = await client.query(updateQuery, [email]);

    console.log('User update result:', {
      success: updateResult.rows.length > 0,
      verified: updateResult.rows[0]?.is_verified
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: userData.id,
        email: email
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Email verified successfully',
      token,
      user: {
        id: userData.id,
        email: email,
        fullName: userData.full_name,
        isVerified: true
      }
    });

  } catch (error) {
    console.error('Email Verification Error:', {
      error: error,
      stack: error.stack,
      requestBody: req.body
    });
    
    res.status(500).json({
      message: 'Verification failed',
      error: error.message
    });
  } finally {
    client.release();
  }
};

const checkVerification = async (req, res) => {
  const client = await pool.connect();
  try {
    const { email } = req.params;

    const result = await client.query(
      'SELECT is_verified FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    res.json({
      isVerified: result.rows[0].is_verified
    });

  } catch (error) {
    console.error('Check Verification Error:', error);
    res.status(500).json({
      message: 'Failed to check verification status',
      error: error.message
    });
  } finally {
    client.release();
  }
};

const resendVerification = async (req, res) => {
  const client = await pool.connect();
  try {
    const { email } = req.body;

    const userQuery = 'SELECT * FROM users WHERE email = $1 AND is_verified = false';
    const result = await client.query(userQuery, [email]);

    if (result.rows.length === 0) {
      return res.status(400).json({
        message: 'User not found or already verified'
      });
    }

    const verificationCode = generateVerificationCode();
    const verificationExpiry = new Date();
    verificationExpiry.setMinutes(verificationExpiry.getMinutes() + 10);

    await client.query(`
      UPDATE users 
      SET verification_code = $1,
          verification_code_expires_at = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE email = $3
    `, [verificationCode, verificationExpiry, email]);

    await sendVerificationEmail(email, verificationCode);

    res.status(200).json({
      message: 'New verification code sent successfully'
    });

  } catch (error) {
    console.error('Resend Verification Error:', error);
    res.status(500).json({
      message: 'Failed to resend verification code',
      error: error.message
    });
  } finally {
    client.release();
  }
};

module.exports = {
  signup,
  verifyEmail,
  resendVerification
};