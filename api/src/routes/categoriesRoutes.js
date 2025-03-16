const express = require('express');
const router = express.Router();
const { addCategory, getAllCategories, updateCategoryById, deleteCategoryById, getAllCategoriesName } = require('../controllers/admin/categories');

// Route to add a new category
router.post('/add-category', addCategory);


// Route to get all categories
router.get('/categories', getAllCategories);

router.get('/name', getAllCategoriesName);

// Route to update a category by ID
router.put('/update-category/:id', updateCategoryById);

// Route to delete a category by ID
router.delete('/delete-category/:id', deleteCategoryById);

module.exports = router;
