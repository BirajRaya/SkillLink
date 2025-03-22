const pool = require('../../config/db');
const { updateUser } = require('../../services/adminUserService');
const { findUserByEmail, updatePassword } = require('../auth/userQueries');
const bcrypt = require('bcrypt');

const updateProfile = async (req, res) => {

    const client = await pool.connect();
    const { fullName, profilePicture, email, phone, currentPassword, newPassword, address } = req.body;

    try {
        const { rows } = await findUserByEmail(client, email);
        const user = rows[0];

        if (!user) {
            console.log('User not found');
            return res.status(400).json({ message: 'Email not found' });
        }

        let updateFields = [];
        let values = [];
        let index = 1;

        if (fullName && fullName !== user.full_name) {
            updateFields.push(`full_name = $${index++}`);
            values.push(fullName);
        }
        if (profilePicture && profilePicture !== user.profile_picture) {
            updateFields.push(`profile_picture = $${index++}`);
            values.push(profilePicture);
        }
        if (email && email !== user.email) {
            updateFields.push(`email = $${index++}`);
            values.push(email);
        }
        if (phone && phone !== user.phone) {
            updateFields.push(`phone_number = $${index++}`);
            values.push(phone);
        }
        if (address && address !== user.address) {
            updateFields.push(`address = $${index++}`);
            values.push(address);
        }

        // Prevent running empty SQL queries
        if (updateFields.length === 0 && !newPassword) {
            return res.status(400).json({ message: 'No updates were made' });
        }

        if (newPassword && newPassword.length > 0) {
            const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
            if (!isPasswordValid) {
                return res.status(400).json({ message: 'Invalid current password' });
            }
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await updatePassword(client, email, hashedPassword);
        }

        if (updateFields.length > 0) {
            values.push(email);
            const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE email = $${index} RETURNING *`;
            const updatedUser = await pool.query(updateQuery, values);
            res.status(200).json({
                message: 'Profile updated successfully',
                user: {
                    id: updatedUser.rows[0].id,
                    email: updatedUser.rows[0].email,
                    fullName: updatedUser.rows[0].full_name,
                    phone: updatedUser.rows[0].phone_number,
                    profilePicture: updatedUser.rows[0].profile_picture,
                    address: updatedUser.rows[0].address
                }
            });
        } else {
            res.status(200).json({ message: 'Password updated successfully' });
        }
    } catch (err) {
        console.error('Error in profile update process:', err);
        res.status(500).json({ message: 'Error processing profile update request' });
    } finally {
        client.release();
    }
};

module.exports = { updateProfile };
