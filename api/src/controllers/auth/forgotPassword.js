const pool = require('../../config/db');
const { findUserByEmail, saveOTP } = require('./userQueries');
const sgMail = require('@sendgrid/mail');
const crypto = require('crypto');

const { sendVerificationEmail } = require('../../services/emailService');
const generateVerificationCode = require('../../utils/codeGenerator');

// Set SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);



// Forgot password handler
const forgotPassword = async (req, res) => {
  const client = await pool.connect();
  const { email } = req.body;
  console.log('Processing forgot password for:', email);

  try {
    // Find user by email
    const user = await findUserByEmail(client, email);
    if (!user) {
      return res.status(400).json({ message: 'Email not found' });
    }

    // Generate OTP (One Time Password)
    const verificationCode = generateVerificationCode();
    const expirationTime = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

    // Save OTP to the database
    await saveOTP(client, email, verificationCode, expirationTime);

      // Send verification email
      await sendVerificationEmail(email, verificationCode);

    // Respond back with success
    res.status(200).json({ message: 'OTP sent to your email' });

  } catch (err) {
    console.error('Error in forgot password process:', err);
    res.status(500).json({ message: 'Error processing forgot password request' });
  } finally {
    client.release(); // Always release the database connection
  }
};

module.exports = { forgotPassword };
