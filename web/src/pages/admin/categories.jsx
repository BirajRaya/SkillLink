import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Search, PlusCircle } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";


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
  const [isActive, setIsActive] = useState(true); // Default to 'active'
  const [message, setMessage] = useState(null); // Error message state
  const [successMessage, setSuccessMessage] = useState(""); // Success message state for toast
  const [errorMessages, setErrorMessages] = useState({
    categoryName: '',
      description: '',
  }); 


   const { toast } = useToast();

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
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch categories"
      });

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
    setIsActive(category.is_active); // Set the selected category's is_active status
    setIsEditCategoryModalOpen(true);
  };
  
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      try {
        const response = await api.delete(`/categories/delete-category/${id}`);
        if (response.status === 200) {
          fetchCategories(); // Refresh categories after deletion
          toast({
            title: "Success",
            description: `Category  has been Deleted successfully`
          });
        }
      } catch (error) {
        console.error("Error deleting category:", error);
      }
    }
  };

  const validateForm = () => {
    let isValid = true;
    const errors = {
      categoryName: '',
      description: '',
    };
    
  
    if (!categoryName.trim()) {
      errors.categoryName = "Category name is required";
      isValid = false;
    } else if (categoryName.trim().length < 3) {
      errors.categoryName = "Category name must be at least 3 characters long";
      isValid = false;
    } else if (
      categories.some(
        (category) =>
          category.category_name.toLowerCase() === categoryName.trim().toLowerCase() &&
          category.id !== selectedCategory?.id // Exclude the currently selected category from the check
      )
    ) {
      errors.categoryName = "Category name already exists";
      isValid = false;
    }
  
    if (!description.trim()) {
      errors.description = "Description is required";
      isValid = false;
    } else if (description.trim().length < 10) {
      errors.description = "Description must be at least 10 characters long";
      isValid = false;
    } else{
      errors.description = "";
    }
  
    setErrorMessages(errors);
  
    return isValid;
  };
  
  

  const handleAddCategory = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const newCategory = { category_name: categoryName, description, is_active: isActive,};
      const response = await api.post('/categories/add-category', newCategory);
      if (response.status === 201) {
        fetchCategories(); // Refresh categories after adding
        setIsAddCategoryModalOpen(false); // Close modal
        setCategoryName(''); // Clear the form inputs
        setDescription('');
        setIsActive(true); // Reset the is_active value

        toast({
          title: "Success",
          description: `Category ${response.data.category_name} has been added successfully`
        });

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
      const updatedCategory = { category_name: categoryName, description, is_active: isActive };
      const response = await api.put(`/categories/update-category/${selectedCategory.id}`, updatedCategory);
      if (response.status === 200) {
        fetchCategories(); // Refresh categories after editing
        setIsEditCategoryModalOpen(false); // Close modal
        setCategoryName(''); // Clear the form inputs
        setDescription('');
        setIsActive(true); 

        toast({
          title: "Success",
          description: `Category ${response.data.category_name} has been Updated successfully`
        });

      }
    } catch (error) {
      console.error("Error editing category:", error);
    }
  };

  return (
    <div className="space-y-4">      

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
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan="4" className="text-center py-4">Loading categories...</td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-4">No categories available</td>
              </tr>
            ) : (
              categories
                .filter((category) =>
                  category.category_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  category.description.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((category) => (
                  <tr key={category.id}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{category.category_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-[200px] truncate" title={category.description}>
                        {category.description}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        category.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {category.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          className="text-blue-500 hover:text-blue-700"
                          onClick={() => handleEdit(category)}
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDelete(category.id)}
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Category Modal */}
      {isAddCategoryModalOpen || isEditCategoryModalOpen ? (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">{isEditCategoryModalOpen ? "Edit Category" : "Add New Category"}</h2>

            {/* Category Name Input */}
            <div className="mb-4">
              <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700">Category Name</label>
              <input
                type="text"
                id="categoryName"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                onBlur={() => {
                  if (!categoryName.trim()) {
                    setErrorMessages({...errorMessages, categoryName: 'Category name is required'});
                  } else if (categoryName.length < 3) {
                    setErrorMessages({...errorMessages, categoryName: 'Category name must be at least 3 characters'});
                  } else {
                    setErrorMessages({...errorMessages, categoryName: ''});
                  }
                }}
                className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              {errorMessages.categoryName && (
                <p className="text-red-500 text-sm mt-1">{errorMessages.categoryName}</p>
              )}
            </div>

            {/* Description Input */}
            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => {
                  if (!description.trim()) {
                    setErrorMessages({...errorMessages, description: 'Description is required'});
                  } else if (description.length < 10) {
                    setErrorMessages({...errorMessages, description: 'Description must be at least 10 characters'});
                  } else {
                    setErrorMessages({...errorMessages, description: ''});
                  }
                }}
                className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows="3"
              />
              {errorMessages.description && (
                <p className="text-red-500 text-sm mt-1">{errorMessages.description}</p>
              )}
            </div>

            {/* Active/Inactive Dropdown */}
            <div className="mb-4">
              <label htmlFor="is_active" className="block text-sm font-medium text-gray-700">Status</label>
              <select
                id="is_active"
                value={isActive}
                onChange={(e) => setIsActive(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            {/* Modal Buttons */}
            <div className="flex justify-between">
              <button
                onClick={isAddCategoryModalOpen ? handleAddCategory : handleEditCategory}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
              >
                {isAddCategoryModalOpen ? 'Add Category' : 'Update Category'}
              </button>
              <button
                onClick={() => {
                  setIsAddCategoryModalOpen(false);
                  setIsEditCategoryModalOpen(false);
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Categories;
