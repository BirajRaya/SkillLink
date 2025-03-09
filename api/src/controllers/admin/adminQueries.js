const createCategory = async (client, { category_name, description, is_active }) => {
  const query = `
    INSERT INTO categories (category_name, description, is_active)
    VALUES ($1, $2, $3)
    RETURNING id, category_name, description, is_active;
  `;
  const values = [category_name, description, is_active];
  return client.query(query, values);
};



const getCategories = async (client, category_name = null) => {
  const query = category_name 
    ? `SELECT * FROM categories WHERE category_name = $1` 
    : `SELECT * FROM categories`;
  const values = category_name ? [category_name] : [];
  return client.query(query, values);
};

const updateCategory = async (client, id, { category_name, description, is_active }) => {
  const query = `
    UPDATE categories
    SET category_name = $1, description = $2, is_active = $3
    WHERE id = $4
    RETURNING id, category_name, description, is_active;
  `;
  const values = [category_name, description, is_active, id];
  return client.query(query, values);
};


const deleteCategory = async (client, id) => {
  const query = 'DELETE FROM categories WHERE id = $1 RETURNING id';
  return client.query(query, [id]);
};

const createService = async (client, { name, description, category_id, vendor_id, price, location, image_url, status }) => {
  const query = `
    INSERT INTO services (name, description, category_id, vendor_id, price, location, image_url, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id, name, description, category_id, vendor_id, price, location, image_url, status;
  `;
  const values = [name, description, category_id, vendor_id, price, location, image_url, status];
  return client.query(query, values);
};

const getServices = async (client, searchTerm = '') => {
  const query = `
    SELECT 
      s.id, 
      s.name, 
      s.description, 
      c.category_name AS category_name, 
      s.vendor_id,
      s.category_id,
      u.full_name AS vendor_name, 
      s.price, 
      s.location, 
      s.status, 
      s.image_url, 
      s.created_at, 
      s.updated_at
    FROM services s
    JOIN categories c ON s.category_id = c.id
    JOIN users u ON s.vendor_id = u.id
    WHERE s.name ILIKE $1 OR c.category_name ILIKE $1;
  `;
  const values = [`%${searchTerm}%`];
  return client.query(query, values);
};

const getServiceDetails = async (client, serviceId) => {
  const query = `
    SELECT 
      s.id, 
      s.name, 
      s.description, 
      c.category_name AS category_name, 
      s.vendor_id,
      s.category_id,
      u.full_name AS vendor_name, 
      s.price, 
      s.location, 
      s.status, 
      s.image_url, 
      s.created_at, 
      s.updated_at
    FROM services s
    JOIN categories c ON s.category_id = c.id
    JOIN users u ON s.vendor_id = u.id
    WHERE s.id = $1;
  `;
  const values = [serviceId];
  return client.query(query, values);
};

const createReview = async (client, { service_id, user_id, rating, comment }) => {
  const query = `
    INSERT INTO reviews (service_id, user_id, rating, comment)
    VALUES ($1, $2, $3, $4)
    RETURNING id, service_id, user_id, rating, comment, created_at, updated_at;
  `;
  const values = [service_id, user_id, rating, comment];
  return client.query(query, values);
};

const getReviewsByServiceId = async (client, serviceId) => {
  const query = `
    SELECT 
      r.id, 
      r.service_id, 
      r.user_id, 
      r.rating, 
      r.comment, 
      r.created_at, 
      u.full_name AS user_name 
    FROM reviews r
    JOIN users u ON r.user_id = u.id
    WHERE r.service_id = $1;
  `;
  const values = [serviceId];
  return client.query(query, values);
};

const updateService = async (client, id, { name, description, category_id, price, location, image_url, status }) => {
  const query = `
    UPDATE services
    SET name = $1, description = $2, category_id = $3, price = $4, location = $5, image_url = $6, status = $7
    WHERE id = $8
    RETURNING id, name, description, category_id, vendor_id, price, location, image_url, status;
  `;
  const values = [name, description, category_id, price, location, image_url, status, id];
  return client.query(query, values);
};

const deleteService = async (client, id) => {
  const query = 'DELETE FROM services WHERE id = $1 RETURNING id';
  return client.query(query, [id]);
};

const getActiveCategories = async (client) => {
  const query = 'SELECT id, category_name FROM categories WHERE is_active = $1';
  const values = [true];  // Use boolean true, not 'Active'
  
  try {
    const result = await client.query(query, values);
    return result.rows;  // Return the active categories
  } catch (err) {
    console.error('Error fetching categories:', err);
    throw err;  // Propagate the error for further handling
  }
};


const getActiveVendors = async (client) => {
  const query = 'SELECT id, full_name FROM users WHERE role = $1 AND is_active = $2';
  const values = ['vendor', 'active']; // 'vendor' role and 'active' status as string
  try {
    const result = await client.query(query, values);
    return result.rows; // Return an array of active vendors
  } catch (err) {
    console.error('Error fetching active vendors:', err);
    throw err;  // Propagate the error for further handling
  }
};



module.exports = {
  createService,
  getServices,
  updateService,
  deleteService,
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
  getActiveCategories,
  getActiveVendors,
  getServiceDetails,
  createReview,
  getReviewsByServiceId
};
