const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { Pool } = require('pg');
require('dotenv').config();

const { sendVerificationEmail } = require('../../services/emailService');
const generateVerificationCode = require('../../utils/codeGenerator');


const { 
  createTempUser, 
  moveTempUserToMain, 
  findTempUserByEmail,
  findUserByEmail 
} = require('./userQueries');

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

/**
 * Handle user registration
 */
const signup = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // First check password length
    if (req.body.password.length < 7) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        message: 'Please lengthen this password to 7 characters long'
      });
    }

    // Check if email exists in main users table only
    const existingUser = await findUserByEmail(client, req.body.email);
    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        message: 'This email is already registered. Please use a different email.'
      });
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const verificationExpiry = new Date();
    verificationExpiry.setMinutes(verificationExpiry.getMinutes() + 10);

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // Prepare user data
    const userData = {
      id: uuidv4(),
      fullName: req.body.fullName,
      email: req.body.email,
      hashedPassword,
      phone: req.body.phone,
      address: req.body.address,
      profilePicture: req.body.profilePicture ? `/uploads/${req.body.profilePicture}` : null,
      role: req.body.role || 'user',
      verificationCode,
      verificationExpiry
    };

    // Create temporary user
    const result = await createTempUser(client, userData);
    await client.query('COMMIT');

    // Send verification email
    await sendVerificationEmail(req.body.email, verificationCode);

    res.status(201).json({
      message: 'Registration initiated. Please check your email for verification code.',
      email: result.rows[0].email,
      requiresVerification: true
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Signup error:', error);
    res.status(500).json({ message: 'An error occurred during registration' });
  } finally {
    client.release();
  }
};

/**
 * Handle user sign-in
 */
const signin = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { email, password } = req.body;

    // Check if user exists in the main users table
    const userCheck = await findUserByEmail(client, email);
    if (userCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = userCheck.rows[0];

    // Compare provided password with stored hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    await client.query('COMMIT');

    res.status(200).json({
      message: 'Sign-in successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone_number,
        profilePicture: user.profilePicture,
        role: user.role,
        address: user.address
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Sign-in error:', error);
    res.status(500).json({ message: 'An error occurred during sign-in' });
  } finally {
    client.release();
  }
};

/**
 * Handle email verification
 */
const verifyEmail = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { email, code } = req.body;

    // Check temporary user and verification data
    const tempUserCheck = await findTempUserByEmail(client, email);
    
    if (tempUserCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        message: 'No pending verification found'
      });
    }

    const tempUserData = tempUserCheck.rows[0];

    // Validate verification code
    if (tempUserData.verification_code !== code) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Check if code is expired
    if (new Date() > new Date(tempUserData.verification_code_expires_at)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Verification code has expired' });
    }

    // Move user from temporary to main table
    const result = await moveTempUserToMain(client, email);
    
    await client.query('COMMIT');

    res.status(200).json({
      message: 'Email verified successfully',
      user: {
        id: result.rows[0].id,
        email,
        fullName: result.rows[0].full_name,
        isVerified: true
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Verification error:', error);
    res.status(500).json({ message: 'An error occurred during verification' });
  } finally {
    client.release();
  }
};

/**
 * Resend verification code
 */
const resendVerification = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { email } = req.body;
    const result = await findTempUserByEmail(client, email);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'No pending verification found' });
    }

    const verificationCode = generateVerificationCode();
    const verificationExpiry = new Date();
    verificationExpiry.setMinutes(verificationExpiry.getMinutes() + 10);

    await client.query(`
      UPDATE temp_users 
      SET verification_code = $1,
          verification_code_expires_at = $2
      WHERE email = $3
    `, [verificationCode, verificationExpiry, email]);

    await sendVerificationEmail(email, verificationCode);
    
    await client.query('COMMIT');
    res.status(200).json({ message: 'New verification code sent successfully' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Resend verification error:', error);
    res.status(500).json({ message: 'An error occurred while resending verification code' });
  } finally {
    client.release();
  }
};

module.exports = {
  signup,
  signin,
  verifyEmail,
  resendVerification
};