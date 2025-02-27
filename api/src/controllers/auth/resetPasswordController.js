const pool = require('../../config/db');
const bcrypt = require('bcrypt');  // Import bcrypt
const { checkOTP, deleteOTP, updatePassword, findUserByEmail } = require('./userQueries');



const resetPassword = async (req, res, next) => {
  const { email, newPassword } = req.body;

  const client = await pool.connect();  // Create a client to interact with the database

  try {
    // 1. Find user by email
    const userResult = await findUserByEmail(client, email);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'User not found' });
    }

    // 2. Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);  // Hash the new password

    // 3. Update password
    const updateResult = await updatePassword(client, email, hashedPassword);
    console.log('Password updated successfully');

    // 4. Respond with success message
    res.status(200).json({
      message: 'Password updated successfully',
      user: updateResult.rows[0],
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    next(error);
  } finally {
    client.release(); // Always release the client after the operation
  }
};

module.exports = { resetPassword };
