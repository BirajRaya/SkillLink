/**
 * Database queries for user authentication
 */
const createTempUser = async (client, userData) => {
  const {
    id, fullName, email, hashedPassword, phone, address,
    profilePicture, role, verificationCode, verificationExpiry
  } = userData;

  const query = `
    INSERT INTO temp_users (
      id, full_name, email, password, phone_number, address,
      profile_picture, role, verification_code,
      verification_code_expires_at, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
    RETURNING id, email, full_name`;

  const values = [
    id,                 // UUID
    fullName,           // VARCHAR(255)
    email,             // VARCHAR(255)
    hashedPassword,    // VARCHAR(255)
    phone,             // VARCHAR(20)
    address,           // TEXT
    profilePicture,    // VARCHAR(255)
    role || 'user',    // VARCHAR(50)
    verificationCode,  // VARCHAR(6)
    verificationExpiry // TIMESTAMP
  ];

  return client.query(query, values);
};

const findTempUserByEmail = async (client, email) => {
  const query = `
    SELECT * 
    FROM temp_users 
    WHERE email = $1
  `;
  return client.query(query, [email]);
};

const moveTempUserToMain = async (client, email) => {
  // First, get the temp user data
  const getTempUserQuery = `
    SELECT * FROM temp_users 
    WHERE email = $1
  `;

  const tempUser = await client.query(getTempUserQuery, [email]);

  if (tempUser.rows.length === 0) {
    throw new Error('No valid temporary user found');
  }

  const user = tempUser.rows[0];

  // Insert into main users table
  const insertUserQuery = `
    INSERT INTO users (
      id, full_name, email, password, phone_number, address,
      profile_picture, role, is_active, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
    RETURNING id, email, full_name`;

  const result = await client.query(insertUserQuery, [
    user.id,
    user.full_name,
    user.email,
    user.password,
    user.phone_number,
    user.address,
    user.profile_picture,
    user.role,
    'active'
  ]);

  // If successful, delete from temp_users
  if (result.rows.length > 0) {
    await client.query('DELETE FROM temp_users WHERE email = $1', [email]);
  }

  return result;
};

const findUserByEmail = async (client, email) => {
  const query = 'SELECT * FROM users WHERE email = $1';
  return client.query(query, [email]);
};

const checkOTP = async (client,email, otp) => {
  return client.query(
    'SELECT * FROM otpRequests WHERE email = $1 AND otp = $2 AND expiresAt < NOW()',
    [email, otp]
  );
};

 const deleteOTP = async (client,email, otp) => {
  return client.query('DELETE FROM otpRequests WHERE email = $1 AND otp = $2', [email, otp]);
};


const updatePassword = async (client, email, newPassword) => {
  const query = `
    UPDATE users 
    SET password = $1, updated_at = CURRENT_TIMESTAMP
    WHERE email = $2
    RETURNING id, email, full_name;
  `;
  const values = [newPassword, email];
  return client.query(query, values);
};

const saveOTP = async (client, email, otp, expiresAt) => {
  await client.query(
    'INSERT INTO otprequests (email, otp, expiresAt) VALUES ($1, $2, $3)',
    [email, otp, expiresAt]
  );
};

module.exports = {
  createTempUser,
  moveTempUserToMain,
  findTempUserByEmail,
  findUserByEmail,
  checkOTP,
    updatePassword,
    deleteOTP,
    saveOTP
};