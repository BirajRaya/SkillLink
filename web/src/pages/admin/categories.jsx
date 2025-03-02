import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Search, PlusCircle } from "lucide-react";
import api from "@/lib/api";

const Categories = () => {
  // State Management
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState(null); // Error message state
  const [successMessage, setSuccessMessage] = useState(""); // Success message state for toast
  const [errorMessages, setErrorMessages] = useState({}); // Validation error messages

  // Fetch categories from backend
  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await api.get('/categories/categories', {
        signal: controller.signal,
      });

      clearTimeout(timeoutId); // Clear the timeout once the response is received
      setCategories(response.data);

    } catch (error) {
      let errorMsg = "Failed to fetch categories";

      if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
        errorMsg = "Request timed out while loading categories. Please refresh the page.";
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message; // Use error message from the server
      }

      setMessage({
        type: 'error',
        text: errorMsg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleEdit = (category) => {
    setSelectedCategory(category);
    setCategoryName(category.category_name);
    setDescription(category.description);
    setIsEditCategoryModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      const response = await api.delete(`/categories/delete-category/${id}`);
      if (response.status === 200) {
        fetchCategories(); // Refresh categories after deletion
      }
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!categoryName.trim()) {
      errors.categoryName = "Category name is required";
    } else if (categoryName.trim().length < 3) {
      errors.categoryName = "Category name must be at least 3 characters long";
    }

    if (!description.trim()) {
      errors.description = "Description is required";
    } else if (description.trim().length < 10) {
      errors.description = "Description must be at least 10 characters long";
    }

    setErrorMessages(errors);

    // If there are errors, return false, otherwise return true
    return Object.keys(errors).length === 0;
  };

  const handleAddCategory = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const newCategory = { category_name: categoryName, description };
      const response = await api.post('/categories/add-category', newCategory);
      if (response.status === 201) {
        fetchCategories(); // Refresh categories after adding
        setIsAddCategoryModalOpen(false); // Close modal
        setCategoryName(''); // Clear the form inputs
        setDescription('');

        // Display success toast
        setSuccessMessage("Category added successfully!");

        // Hide the toast after 3 seconds
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error adding category:", error);
    }
  };

  const handleEditCategory = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const updatedCategory = { category_name: categoryName, description };
      const response = await api.put(`/categories/update-category/${selectedCategory.id}`, updatedCategory);
      if (response.status === 200) {
        fetchCategories(); // Refresh categories after editing
        setIsEditCategoryModalOpen(false); // Close modal
        setCategoryName(''); // Clear the form inputs
        setDescription('');

        // Display success toast
        setSuccessMessage("Category updated successfully!");

        // Hide the toast after 3 seconds
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error editing category:", error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Success Toast */}
      {successMessage && (
        <div id="status-message" className="mb-4 p-4 rounded-md flex items-center bg-green-100 border border-green-300 text-green-800">
          <div className="w-6 h-6 mr-3 rounded-full flex items-center justify-center bg-green-500 text-white">
            ✓
          </div>
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {/* Header with search bar and Add Category button */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Categories</h1>
        <div className="flex space-x-2 items-center">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              className="pl-10 pr-4 py-2 rounded-md border border-gray-300"
              placeholder="Search categories"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>

          {/* Add New Category Button */}
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center"
            onClick={() => setIsAddCategoryModalOpen(true)}
          >
            <PlusCircle className="mr-2 h-5 w-5" />
            Add New Category
          </button>
        </div>
      </div>

      {/* Categories Table */}
      <div className="overflow-x-auto bg-white shadow rounded-lg p-4">
        <table className="min-w-full text-sm text-left">
          <thead>
            <tr className="bg-gray-200">
              <th className="py-2 px-4">Category Name</th>
              <th className="py-2 px-4">Description</th>
              <th className="py-2 px-4">Active</th>
              <th className="py-2 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="4" className="py-2 px-4 text-center">Loading...</td>
              </tr>
            ) : categories.length > 0 ? (
              categories
                .filter((category) =>
                  category.category_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  category.description.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((category) => (
                  <tr key={category.id}>
                    <td className="py-2 px-4">{category.category_name}</td>
                    <td className="py-2 px-4">{category.description}</td>
                    <td className="py-2 px-4">
                      {category.is_active ? 'Yes' : 'No'}
                    </td>
                    <td className="py-2 px-4 flex space-x-2">
                      <button
                        className="text-blue-500 hover:text-blue-600"
                        onClick={() => handleEdit(category)}
                      >
                        <Edit />
                      </button>
                      <button
                        className="text-red-500 hover:text-red-600"
                        onClick={() => handleDelete(category.id)}
                      >
                        <Trash2 />
                      </button>
                    </td>
                  </tr>
                ))
            ) : (
              <tr>
                <td colSpan="4" className="py-2 px-4 text-center">No categories available</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Category Modal */}
      {isAddCategoryModalOpen || isEditCategoryModalOpen ? (
        <div className="fixed inset-0 flex justify-center items-center bg-gray-800 bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 shadow-lg w-96">
            <h2 className="text-xl font-semibold mb-4">
              {isEditCategoryModalOpen ? 'Edit Category' : 'Add New Category'}
            </h2>
            <form>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Category Name</label>
                <input
                  type="text"
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                />
                {errorMessages.categoryName && (
                  <span className="text-red-500 text-xs">{errorMessages.categoryName}</span>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                {errorMessages.description && (
                  <span className="text-red-500 text-xs">{errorMessages.description}</span>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                  onClick={() => {
                    setIsAddCategoryModalOpen(false);
                    setIsEditCategoryModalOpen(false);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                  onClick={isEditCategoryModalOpen ? handleEditCategory : handleAddCategory}
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Categories;
