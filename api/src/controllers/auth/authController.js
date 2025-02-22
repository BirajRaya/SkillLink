const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { Pool } = require('pg');
require('dotenv').config();

const { sendVerificationEmail } = require('../../services/emailService');
const generateVerificationCode = require('../../utils/codeGenerator');
const { validateSignupInput } = require('./validation');
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
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const signup = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Validate input
    const validationErrors = validateSignupInput(req.body);
    if (validationErrors.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        message: 'Validation Failed',
        errors: validationErrors
      });
    }

    // Check if email exists in main users table
    const emailCheck = await findUserByEmail(client, req.body.email);
    if (emailCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Email already registered' });
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
      ...req.body,
      hashedPassword,
      profilePictureUrl: req.body.profilePicture ? `/uploads/${req.body.profilePicture}` : null,
      verificationCode,
      verificationExpiry
    };

    // Create temporary user
    const result = await createTempUser(client, userData);
    await client.query('COMMIT');

    // Send verification email
    await sendVerificationEmail(req.body.email, verificationCode).catch(error => {
      console.error('Verification Email Sending Failed:', error);
    });

    res.status(201).json({
      message: 'Registration initiated. Please check your email for verification code.',
      email: result.rows[0].email,
      requiresVerification: true
    });

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};


/**
 * Handle user sign-in
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const signin = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { email, password } = req.body;

    // Validate input (check for missing fields)
    if (!email || !password) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Email and password are required' });
    }

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

    // Send response with token and user info
    res.status(200).json({
      message: 'Sign-in successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role
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

module.exports = {
  signin
};



/**
 * Handle email verification
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const verifyEmail = async (req, res) => {
  console.log('Verification request:', req.body);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { email, code } = req.body;

    // Add debugging logs
    console.log('Verification attempt:', { email, code });

    // Check temporary user and verification data with debug info
    const tempUserCheck = await findTempUserByEmail(client, email);
    console.log('Raw temp user data:', tempUserCheck.rows[0]);
    console.log('Current server time:', new Date());
    console.log('Verification expiry:', tempUserCheck.rows[0]?.verification_code_expires_at);

    if (tempUserCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        message: 'No pending verification found or code expired',
        debug: { 
          time: new Date(),
          foundRows: tempUserCheck.rows.length
        }
      });
    }

    const tempUserData = tempUserCheck.rows[0];

    // Add code comparison debug
    console.log('Code comparison:', {
      provided: code,
      stored: tempUserData.verification_code,
      matches: tempUserData.verification_code === code
    });

    // Validate verification code
    if (tempUserData.verification_code !== code) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Move user from temporary to main table
    const result = await moveTempUserToMain(client, email);
    
    // Generate JWT
    const token = jwt.sign(
      { userId: result.rows[0].id, email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    await client.query('COMMIT');

    res.status(200).json({
      message: 'Email verified successfully',
      token,
      user: {
        id: result.rows[0].id,
        email,
        fullName: result.rows[0].full_name,
        isVerified: true
      }
    });

  } catch (error) {
    console.error('Verification error details:', error);
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Resend verification code
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
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
    throw error;
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
