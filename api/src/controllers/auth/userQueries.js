/**
 * Database queries for user authentication
 */
const createTempUser = async (client, userData) => {
    const {
      id, fullName, email, hashedPassword, phone, address,
      profilePictureUrl, role, verificationCode, verificationExpiry
    } = userData;
  
    const query = `
      INSERT INTO temp_users (
        id, full_name, email, password, phone_number, address,
        profile_picture, role, verification_code,
        verification_code_expires_at, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
      RETURNING id, email, full_name`;
  
    const values = [
      id, fullName, email, hashedPassword, phone, address,
      profilePictureUrl, role || 'user', verificationCode,
      verificationExpiry
    ];
  
    return client.query(query, values);
  };
  
  const moveTempUserToMain = async (client, email) => {
    // First, get the temp user data
    const getTempUserQuery = `
  SELECT * FROM temp_users 
  WHERE email = $1 AND 
  verification_code_expires_at > $2`;

  const tempUser = await client.query(getTempUserQuery, [email, new Date()]);
    console.log('Temp user:',tempUser);
    
    if (tempUser.rows.length === 0) {
      throw new Error('No valid temporary user found');
    }
  
    const user = tempUser.rows[0];
  
    // Insert into main users table
    const insertUserQuery = `
      INSERT INTO users (
        id, full_name, email, password, phone_number, address,
        profile_picture, role
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, email, full_name`;
  
    const result = await client.query(insertUserQuery, [
      user.id,
      user.full_name,
      user.email,
      user.password,
      user.phone_number,
      user.address,
      user.profile_picture,
      user.role
    ]);
  
    // Delete from temp_users
    await client.query('DELETE FROM temp_users WHERE email = $1', [email]);
  
    return result;
  };
  
  const findTempUserByEmail = async (client, email) => {
    const query = `
      SELECT *, 
      CASE 
        WHEN verification_code_expires_at > CURRENT_TIMESTAMP THEN true
        ELSE false
      END as is_valid
      FROM temp_users 
      WHERE email = $1
    `;
    
    console.log('Running query with email:', email);
    const result = await client.query(query, [email]);
    
    console.log('Query result:', {
      rowCount: result.rows.length,
      expiryTime: result.rows[0]?.verification_code_expires_at,
      currentTime: new Date()
    });
    
    return result;
  };
  
  const findUserByEmail = async (client, email) => {
    return client.query('SELECT * FROM users WHERE email = $1', [email]);
  };
  
  module.exports = {
    createTempUser,
    moveTempUserToMain,
    findTempUserByEmail,
    findUserByEmail
  };