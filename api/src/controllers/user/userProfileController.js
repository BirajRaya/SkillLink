const pool = require('../../config/db');
const { updateUser } = require('../../services/adminUserService');
const { findUserByEmail, updatePassword } = require('../auth/userQueries');
const bcrypt = require('bcrypt');  // Import bcrypt

const updateProfile = async (req, res) => {
    console.log('inside update profile');
    const client = await pool.connect();
    console.log(req.body);
    const { fullName, profilePicture, email, phone, currentPassword, newPassword, address } = req.body;
    try {
        const { rows } = await findUserByEmail(client, email);
        const user = rows[0];
        console.log(user.full_name);
        if (!user) {
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





        const userResult = await findUserByEmail(client, email);
        if (userResult.rows.length === 0) {
            return res.status(400).json({ message: 'User not found' });
        }

        if (newPassword || newPassword.length > 0) {
            const isPasswordValid = await bcrypt.compare(currentPassword, userResult.rows[0].password);
            if (!isPasswordValid) {
                return res.status(400).json({ message: 'Invalid current password' });
            }



            const hashedPassword = await bcrypt.hash(newPassword, 10);// Hash the new password

            await updatePassword(client, email, hashedPassword);

        }
        const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE email = $${index} RETURNING *`;
        values.push(email);
        // Execute the update
        const updatedUser = await pool.query(updateQuery, values);
        console.log(updatedUser.rows[0]);
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
    }
    catch (err) {
        console.error('Error in profile update process:', err);
        res.status(500).json({ message: 'Error profile update request' });
    } finally {
        client.release(); // Always release the database connection
    }

}

module.exports = { updateProfile };