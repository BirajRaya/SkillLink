const pool = require('../../config/db');
const { checkOTP, deleteOTP } = require('./userQueries');



const validateOTP = async (req, res) => {
  const client = await pool.connect();

  const { email, otp } = req.body;
  console.log('Validating OTP for:', email);

  try {
    const result = await checkOTP(client, email, otp);

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    await deleteOTP(client, email, otp);
    res.status(200).json({ message: 'OTP validated successfully, you can reset your password' });

  } catch (err) {
    console.error('Error validating OTP:', err);
    res.status(500).json({ message: 'Error validating OTP' });
  } finally {
    client.release(); // Important: Release the client back to the pool
  }
};

module.exports = { validateOTP };