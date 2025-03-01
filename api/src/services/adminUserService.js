const pool = require('../config/db');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

class AdminUserService {
  // Get all users (only regular users)
  static async getAllUsers() {
    const client = await pool.connect();
    try {
      const query = `
        SELECT 
          id, 
          full_name, 
          email, 
          phone_number, 
          address,
          profile_picture,
          is_active,
          created_at
        FROM users
        WHERE role = 'user'
        ORDER BY created_at DESC
      `;
      const result = await client.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Create user (with hardcoded role as 'user')
  static async createUser(userData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Ensure is_active is provided
      if (userData.isActive === undefined) {
        throw new Error('Status (active/inactive) is required');
      }

      // Check if email already exists
      const emailCheck = await client.query(
        'SELECT * FROM users WHERE email = $1',
        [userData.email]
      );
      if (emailCheck.rows.length > 0) {
        throw new Error('Email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Handle profile picture upload
      let profilePicturePath = null;
      if (userData.profilePicture) {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const filename = `${uuidv4()}-${userData.profilePicture.originalname}`;
        const filepath = path.join(uploadDir, filename);
        fs.writeFileSync(filepath, userData.profilePicture.buffer);
        profilePicturePath = `/uploads/${filename}`;
      }

      // Insert new user
      const query = `
        INSERT INTO users (
          id, 
          full_name, 
          email, 
          password, 
          phone_number, 
          address, 
          role, 
          is_active,
          profile_picture
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, full_name, email, phone_number, address, is_active, created_at, profile_picture
      `;

      const values = [
        uuidv4(),
        userData.fullName,
        userData.email,
        hashedPassword,
        userData.phoneNumber || '',
        userData.address || '',
        'user',
        userData.isActive,
        profilePicturePath
      ];

      const result = await client.query(query, values);

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating user:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Update user method
  static async updateUser(userId, userData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      console.log('Updating user with data:', userData);

      // Ensure is_active is provided
      if (userData.isActive === undefined) {
        throw new Error('Status (active/inactive) is required');
      }

      // Prepare update fields
      const updateFields = [];
      const values = [];
      let valueIndex = 1;

      if (userData.fullName) {
        updateFields.push(`full_name = $${valueIndex}`);
        values.push(userData.fullName);
        valueIndex++;
      }

      if (userData.email) {
        updateFields.push(`email = $${valueIndex}`);
        values.push(userData.email);
        valueIndex++;
      }

      if (userData.phoneNumber) {
        updateFields.push(`phone_number = $${valueIndex}`);
        values.push(userData.phoneNumber);
        valueIndex++;
      }

      if (userData.address) {
        updateFields.push(`address = $${valueIndex}`);
        values.push(userData.address);
        valueIndex++;
      }

      if (userData.password) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        updateFields.push(`password = $${valueIndex}`);
        values.push(hashedPassword);
        valueIndex++;
      }

      if (userData.profilePicture) {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const filename = `${uuidv4()}-${userData.profilePicture.originalname}`;
        const filepath = path.join(uploadDir, filename);
        fs.writeFileSync(filepath, userData.profilePicture.buffer);
        const profilePicturePath = `/uploads/${filename}`;
        updateFields.push(`profile_picture = $${valueIndex}`);
        values.push(profilePicturePath);
        valueIndex++;
      }

      // Add is_active field
      updateFields.push(`is_active = $${valueIndex}`);
      values.push(userData.isActive);
      valueIndex++;

      // Add user ID
      values.push(userId);

      // Construct the update query
      const query = `
        UPDATE users 
        SET 
          ${updateFields.join(', ')}, 
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $${valueIndex} AND role = 'user'
        RETURNING id, full_name, email, phone_number, address, is_active, profile_picture
      `;

      const result = await client.query(query, values);

      await client.query('COMMIT');

      if (result.rows.length === 0) {
        throw new Error('User not found or not authorized');
      }

      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating user:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Delete user method
  static async deleteUser(userId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const query = `
        DELETE FROM users 
        WHERE id = $1 AND role = 'user'
        RETURNING id, full_name, email
      `;

      const result = await client.query(query, [userId]);

      await client.query('COMMIT');

      if (result.rows.length === 0) {
        throw new Error('User not found or not authorized');
      }

      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error deleting user:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Check if email exists
  static async checkEmailExists(email) {
    const client = await pool.connect();
    try {
      const query = `
        SELECT id FROM users 
        WHERE email = $1 AND role = 'user'
      `;
      const result = await client.query(query, [email]);
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error checking email:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = AdminUserService;