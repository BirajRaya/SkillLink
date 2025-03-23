const bcrypt = require('bcrypt');
const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

class AdminUserService {
  // Check if email already exists
  static async checkEmailExists(email) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT COUNT(*) as count FROM users WHERE email = $1',
        [email]
      );
      return result.rows[0].count > 0;
    } finally {
      client.release();
    }
  }

  // Create new user
static async createUser(userData) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if email already exists
    const emailExists = await AdminUserService.checkEmailExists(userData.email);
    if (emailExists) {
      throw new Error('Email already in use');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    // Prepare profile picture if provided
    const profilePicture = userData.profilePicture || null;
    
    // Insert user
    const userId = uuidv4();
    const insertQuery = `
      INSERT INTO users (
        id, full_name, email, phone_number, address, 
        password, profile_picture, is_active, role
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, full_name, email, phone_number, address, is_active, created_at
    `;
    
    const result = await client.query(insertQuery, [
      userId,
      userData.fullName,
      userData.email,
      userData.phoneNumber,
      userData.address,
      hashedPassword,
      profilePicture,
      userData.isActive || 'active',
      'user'
    ]);
    
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

  // Get all users without full profile pictures
  static async getAllUsersWithoutPictures() {
    const client = await pool.connect();
    try {
      const query = `
        SELECT 
          id, 
          full_name, 
          email, 
          phone_number, 
          address,
          CASE 
            WHEN profile_picture IS NOT NULL THEN 'has-image'
            ELSE NULL
          END as profile_picture,
          is_active,
          created_at
        FROM users
        WHERE role = 'user'
        ORDER BY created_at DESC
      `;
      const result = await client.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error fetching users without pictures:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Get a single user's profile picture
  static async getUserProfilePicture(userId) {
    const client = await pool.connect();
    try {
      const query = `
        SELECT profile_picture
        FROM users
        WHERE id = $1 AND role = 'user'
      `;
      const result = await client.query(query, [userId]);
      
      if (result.rows.length === 0) {
        throw new Error('User not found or not authorized');
      }
      
      return result.rows[0].profile_picture;
    } catch (error) {
      console.error('Error fetching user profile picture:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Update user (without profile picture)
  static async updateUser(userId, userData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Ensure is_active is provided
      if (userData.isActive === undefined) {
        throw new Error('Status (active/inactive) is required');
      }

      // Check if email is being changed and if it already exists
      if (userData.email) {
        const currentUserQuery = 'SELECT email FROM users WHERE id = $1';
        const currentUserResult = await client.query(currentUserQuery, [userId]);
        
        if (currentUserResult.rows.length === 0) {
          throw new Error('User not found');
        }
        
        const currentEmail = currentUserResult.rows[0].email;
        
        if (currentEmail !== userData.email) {
          const emailExists = await AdminUserService.checkEmailExists(userData.email);
          if (emailExists) {
            throw new Error('Email already in use');
          }
        }
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
        RETURNING id, full_name, email, phone_number, address, is_active
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

  // Update user's profile picture (separate method)
  static async updateUserProfilePicture(userId, profilePicture) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const query = `
        UPDATE users 
        SET 
          profile_picture = $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND role = 'user'
        RETURNING id, full_name, email
      `;

      const result = await client.query(query, [profilePicture, userId]);

      await client.query('COMMIT');

      if (result.rows.length === 0) {
        throw new Error('User not found or not authorized');
      }

      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating profile picture:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Delete user
  static async deleteUser(userId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // First get user info for return value
      const selectQuery = `
        SELECT id, full_name, email
        FROM users
        WHERE id = $1 AND role = 'user'
      `;
      const selectResult = await client.query(selectQuery, [userId]);
      
      if (selectResult.rows.length === 0) {
        throw new Error('User not found or not authorized');
      }
      
      // Then delete
      const deleteQuery = `
        DELETE FROM users
        WHERE id = $1 AND role = 'user'
      `;
      
      await client.query(deleteQuery, [userId]);
      await client.query('COMMIT');
      
      return selectResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error deleting user:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = AdminUserService;