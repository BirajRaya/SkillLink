import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Search, PlusCircle } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

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
  const [isActive, setIsActive] = useState('active'); // Store as string 'active' or 'inactive' for UI
  const [message, setMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const { toast } = useToast();
  
  // Form validation states
  const [errors, setErrors] = useState({
    categoryName: '',
    description: ''
  });

  // Helper function for date formatting (same as in Vendors)
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Validation function
  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      categoryName: '',
      description: ''
    };

    // Category name validation
    if (!categoryName.trim()) {
      newErrors.categoryName = 'Category name is required';
      isValid = false;
    } else if (categoryName.length < 3) {
      newErrors.categoryName = 'Category name must be at least 3 characters';
      isValid = false;
    } else if (
      categories.some(
        (category) =>
          category.category_name.toLowerCase() === categoryName.trim().toLowerCase() &&
          category.id !== selectedCategory?.id
      )
    ) {
      newErrors.categoryName = "Category name already exists";
      isValid = false;
    }

    // Description validation
    if (!description.trim()) {
      newErrors.description = 'Description is required';
      isValid = false;
    } else if (description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
      isValid = false;
    }

    // Debug for when submitting the form
    console.log('Form values at validation:', {
      categoryName,
      description,
      isActive,
      isActiveType: typeof isActive,
      errors: newErrors
    });

    setErrors(newErrors);
    return isValid;
  };

  // Helper function to set temporary message (auto-dismiss after 3 seconds)
  const setTemporaryMessage = (messageObj) => {
    setMessage(messageObj);
    setTimeout(() => {
      setMessage(null);
    }, 3000); // 3 seconds
  };

  // Helper function to set temporary success message (auto-dismiss after 3 seconds)
  const setTemporarySuccessMessage = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => {
      setSuccessMessage("");
    }, 3000); // 3 seconds
  };

  // Fetch categories from backend
  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await api.get('/categories/categories', {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response && response.data) {
        setCategories(response.data);
      } else {
        throw new Error("No data received from the server.");
      }
    } catch (error) {
      let errorMsg = "Failed to fetch categories";

      if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
        errorMsg = "Request timed out while loading categories. Please refresh the page.";
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.message) {
        errorMsg = error.message;
      }

      setTemporaryMessage({
        type: 'error',
        text: errorMsg,
      });
      
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
        className: "bg-red-500 text-white font-medium border-l-4 border-red-700"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Reset form and errors
  const resetForm = () => {
    setCategoryName('');
    setDescription('');
    setIsActive('active'); // Reset to 'active'
    setErrors({
      categoryName: '',
      description: ''
    });
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsAddCategoryModalOpen(true);
  };

  const handleEdit = (category) => {
    resetForm();
    setSelectedCategory(category);
    setCategoryName(category.category_name);
    setDescription(category.description);
    setIsActive(category.is_active ? 'active' : 'inactive'); // Convert boolean to string for UI
    setIsEditCategoryModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      try {
        const response = await api.delete(`/categories/delete-category/${id}`);
        if (response.status === 200) {
          fetchCategories();
          setTemporarySuccessMessage(`Category has been deleted successfully`);
          toast({
            title: "Success",
            description: `Category has been deleted successfully`,
            variant: "success",
            className: "bg-green-500 text-white font-medium border-l-4 border-green-700"
          });
        }
      } catch (error) {
        console.error("Error deleting category:", error);
        const errorMsg = error.response?.data?.message || "Error deleting category";
        setTemporaryMessage({
          type: 'error',
          text: errorMsg
        });
        
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive"
        });
      }
    }
  };

  const handleAddCategory = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const newCategory = { 
        category_name: categoryName, 
        description, 
        is_active: isActive === 'active' // Convert string to boolean for API
      };
      
      const response = await api.post('/categories/add-category', newCategory);
      
      if (response.status === 201) {
        fetchCategories();
        setIsAddCategoryModalOpen(false);
        resetForm();
        setTemporarySuccessMessage(`Category ${categoryName} has been added successfully`);
        toast({
          title: "Success",
          description: `Category ${categoryName} has been added successfully`,
          variant: "success",
          className: "bg-green-500 text-white font-medium border-l-4 border-green-700"
        });
      }
    } catch (error) {
      console.error("Error adding category:", error);
      const errorMsg = error.response?.data?.message || "Error adding category";
      setTemporaryMessage({
        type: 'error',
        text: errorMsg,
      });
      
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive"
      });
    }
  };

  const handleEditCategory = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const updatedCategory = { 
        category_name: categoryName, 
        description, 
        is_active: isActive === 'active' // Convert string to boolean for API
      };
      
      const response = await api.put(`/categories/update-category/${selectedCategory.id}`, updatedCategory);
      
      if (response.status === 200) {
        fetchCategories();
        setIsEditCategoryModalOpen(false);
        resetForm();
        setTemporarySuccessMessage(`Category ${categoryName} has been updated successfully`);
        toast({
          title: "Success",
          description: `Category ${categoryName} has been updated successfully`,
          variant: "success",
          className: "bg-green-500 text-white font-medium border-l-4 border-green-700"
        });
      }
    } catch (error) {
      console.error("Error editing category:", error);
      const errorMsg = error.response?.data?.message || "Error updating category";
      setTemporaryMessage({
        type: 'error',
        text: errorMsg
      });
      
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive"
      });
    }
  };

  // Close modals and reset form
  const handleCloseModal = () => {
    setIsAddCategoryModalOpen(false);
    setIsEditCategoryModalOpen(false);
    resetForm();
  };

  // Filter categories based on search term
  const filteredCategories = categories.filter((category) =>
    category.category_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header with search bar and Add Category button */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-semibold">Categories Management</h1>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 items-center w-full md:w-auto">
          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              className="pl-10 pr-4 py-2 w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Search categories"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>

          {/* Add New Category Button */}
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors duration-200 flex items-center w-full sm:w-auto justify-center"
            onClick={handleOpenAddModal}
          >
            <PlusCircle className="mr-2 h-5 w-5" />
            Add New Category
          </button>
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="text-center py-8">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      <span className="ml-2">Loading categories...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-8">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <svg className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <p className="text-lg font-medium">No categories found</p>
                      <p className="text-sm mt-1">
                        {searchTerm ? "Try adjusting your search terms" : "Add a new category to get started"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCategories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{category.category_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-[200px] truncate" title={category.description}>
                        {category.description}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        category.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {category.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button 
                          className="text-blue-500 hover:text-blue-700 transition-colors duration-150"
                          onClick={() => handleEdit(category)}
                          title="Edit Category"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button 
                          className="text-red-500 hover:text-red-700 transition-colors duration-150"
                          onClick={() => handleDelete(category.id)}
                          title="Delete Category"
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
      </div>

      {/* Add/Edit Category Modal */}
      {(isAddCategoryModalOpen || isEditCategoryModalOpen) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              {isEditCategoryModalOpen ? (
                <>
                  <Edit className="h-5 w-5 mr-2 text-blue-500" />
                  Edit Category: {selectedCategory?.category_name}
                </>
              ) : (
                <>
                  <PlusCircle className="h-5 w-5 mr-2 text-blue-500" />
                  Add New Category
                </>
              )}
            </h2>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name*</label>
                <input
                  type="text"
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${errors.categoryName ? 'border-red-500' : 'border-gray-300'}`}
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  onBlur={() => {
                    if (!categoryName.trim()) {
                      setErrors({ ...errors, categoryName: 'Category name is required' });
                    } else if (categoryName.length < 3) {
                      setErrors({ ...errors, categoryName: 'Category name must be at least 3 characters' });
                    } else if (
                      categories.some(
                        (category) =>
                          category.category_name.toLowerCase() === categoryName.trim().toLowerCase() &&
                          category.id !== selectedCategory?.id // Exclude the currently selected category
                      )
                    ) {
                      setErrors({ ...errors, categoryName: 'Category name already exists' });
                    } else {
                      setErrors({ ...errors, categoryName: '' });
                    }
                  }}
                  placeholder="Enter category name"
                />
                {errors.categoryName && <p className="mt-1 text-xs text-red-500">{errors.categoryName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description*</label>
                <textarea
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={() => {
                    if (!description.trim()) {
                      setErrors({ ...errors, description: 'Description is required' });
                    } else if (description.length < 10) {
                      setErrors({ ...errors, description: 'Description must be at least 10 characters' });
                    } else {
                      setErrors({ ...errors, description: '' });
                    }
                  }}
                  placeholder="Enter description"
                  rows="4"
                />
                {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <div className="mt-1 space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio text-blue-600"
                      name="status"
                      value="active"
                      checked={isActive === 'active'}
                      onChange={() => setIsActive('active')}
                    />
                    <span className="ml-2 text-gray-700">Active</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio text-blue-600"
                      name="status"
                      value="inactive"
                      checked={isActive === 'inactive'}
                      onChange={() => setIsActive('inactive')}
                    />
                    <span className="ml-2 text-gray-700">Inactive</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                  onClick={handleCloseModal}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200"
                  onClick={isEditCategoryModalOpen ? handleEditCategory : handleAddCategory}
                >
                  {isEditCategoryModalOpen ? 'Update Category' : 'Add Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;