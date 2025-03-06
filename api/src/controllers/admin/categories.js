const pool = require('../../config/db');
const { createCategory, getCategories, updateCategory, deleteCategory } = require('./adminQueries');

// Add a new category
const addCategory = async (req, res) => {
  const { category_name, description, is_active } = req.body;

  if (!category_name || !description || !is_active) {
    return res.status(400).json({ message: 'Category name, description, and status are required' });
  }

  

  try {
    const client = await pool.connect();

    // Check if the category already exists (case-insensitive)
    const existingCategory = await client.query(
      'SELECT * FROM categories WHERE LOWER(category_name) = LOWER($1)', 
      [category_name]
    );

    if (existingCategory.rows.length > 0) {
      client.release();
      return res.status(400).json({ message: 'Category already exists' });
    }

    // If not exist, create a new category with the correct boolean value for is_active
    const result = await createCategory(client, { category_name, description, is_active});
    client.release();
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding category:', error);
    res.status(500).json({ message: 'Server error' });
  }
};




// Get all categories
const getAllCategories = async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await getCategories(client);
    client.release();
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update category by ID
const updateCategoryById = async (req, res) => {
  const { id } = req.params;
  const { category_name, description, is_active  } = req.body;

  if (!category_name || !description || !is_active ) {
    return res.status(400).json({ message: 'Category name, description, and status are required' });
  }

  try {
    const client = await pool.connect();
    const result = await updateCategory(client, id, { category_name, description, is_active  });
    client.release();
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


// Delete category by ID
const deleteCategoryById = async (req, res) => {
  const { id } = req.params;
  try {
    const client = await pool.connect();
    const result = await deleteCategory(client, id);
    client.release();
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  addCategory,
  getAllCategories,
  updateCategoryById,
  deleteCategoryById,
};
