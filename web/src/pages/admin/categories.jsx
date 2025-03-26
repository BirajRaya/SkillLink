import React, { useState, useEffect } from "react";
import {
  Edit,
  Trash2,
  Search,
  PlusCircle,
  Folder,
  FolderPlus,
  X,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

const Categories = () => {
  // State Management
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInputValue, setSearchInputValue] = useState(""); // For debounced search
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryName, setCategoryName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState("active"); // Store as string 'active' or 'inactive' for UI
  const [message, setMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const { toast } = useToast();
  // State for tracking viewing descriptions (modal approach)
  const [viewingDescription, setViewingDescription] = useState(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState({});


  // Form validation states
  const [errors, setErrors] = useState({
    categoryName: "",
    description: "",
  });

  const toggleDescription = (categoryId) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // Add debounced search like in Users page
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInputValue);
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchInputValue]);

  // Helper function for date formatting
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };

    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Validation function
  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      categoryName: "",
      description: "",
    };

    // Category name validation
    if (!categoryName.trim()) {
      newErrors.categoryName = "Category name is required";
      isValid = false;
    } else if (categoryName.length < 3) {
      newErrors.categoryName = "Category name must be at least 3 characters";
      isValid = false;
    } else if (
      categories.some(
        (category) =>
          category.category_name.toLowerCase() ===
            categoryName.trim().toLowerCase() &&
          category.id !== selectedCategory?.id
      )
    ) {
      newErrors.categoryName = "Category name already exists";
      isValid = false;
    }

    // Description validation
    if (!description.trim()) {
      newErrors.description = "Description is required";
      isValid = false;
    } else if (description.length < 10) {
      newErrors.description = "Description must be at least 10 characters";
      isValid = false;
    }

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

      const response = await api.get("/categories/categories", {
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

      if (error.name === "AbortError" || error.code === "ECONNABORTED") {
        errorMsg =
          "Request timed out while loading categories. Please refresh the page.";
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.message) {
        errorMsg = error.message;
      }

      setTemporaryMessage({
        type: "error",
        text: errorMsg,
      });

      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
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
    setCategoryName("");
    setDescription("");
    setIsActive("active"); // Reset to 'active'
    setErrors({
      categoryName: "",
      description: "",
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
    setIsActive(category.is_active ? "active" : "inactive"); // Convert boolean to string for UI
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
          });
        }
      } catch (error) {
        console.error("Error deleting category:", error);
        const errorMsg =
          error.response?.data?.message || "Error deleting category";
        setTemporaryMessage({
          type: "error",
          text: errorMsg,
        });

        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive",
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
        is_active: isActive === "active", // Convert string to boolean for API
      };

      const response = await api.post("/categories/add-category", newCategory);

      if (response.status === 201) {
        fetchCategories();
        setIsAddCategoryModalOpen(false);
        resetForm();
        setTemporarySuccessMessage(
          `Category ${categoryName} has been added successfully`
        );
        toast({
          title: "Success",
          description: `Category ${categoryName} has been added successfully`,
        });
      }
    } catch (error) {
      console.error("Error adding category:", error);
      const errorMsg = error.response?.data?.message || "Error adding category";
      setTemporaryMessage({
        type: "error",
        text: errorMsg,
      });

      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
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
        is_active: isActive === "active", // Convert string to boolean for API
      };

      const response = await api.put(
        `/categories/update-category/${selectedCategory.id}`,
        updatedCategory
      );

      if (response.status === 200) {
        fetchCategories();
        setIsEditCategoryModalOpen(false);
        resetForm();
        setTemporarySuccessMessage(
          `Category ${categoryName} has been updated successfully`
        );
        toast({
          title: "Success",
          description: `Category ${categoryName} has been updated successfully`,
        });
      }
    } catch (error) {
      console.error("Error editing category:", error);
      const errorMsg =
        error.response?.data?.message || "Error updating category";
      setTemporaryMessage({
        type: "error",
        text: errorMsg,
      });

      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    }
  };

  // Close modals and reset form
  const handleCloseModal = () => {
    setIsAddCategoryModalOpen(false);
    setIsEditCategoryModalOpen(false);
    resetForm();
  };

  // Function to truncate text properly with word breaks
  const truncateText = (text, maxLength) => {
    if (!text || text.length <= maxLength) return text;

    // Find the last space to avoid cutting words
    const truncated = text.substr(0, maxLength);
    const lastSpaceIndex = truncated.lastIndexOf(" ");
    return truncated.substr(0, lastSpaceIndex) + "...";
  };

  // Filter categories based on search term
  const filteredCategories = categories.filter(
    (category) =>
      category.category_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
      {/* Header with search bar and Add Category button - Made Responsive */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-5 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-3">
          <Folder className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Categories</h1>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center w-full sm:w-auto mt-3 sm:mt-0">
          {/* Search Bar */}
          <div className="relative flex-1 w-full">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              className="pl-10 pr-4 py-2.5 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm"
              placeholder="Search categories"
              value={searchInputValue}
              onChange={(e) => setSearchInputValue(e.target.value)}
            />
            {searchInputValue && (
              <button 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => {
                  setSearchInputValue("");
                  setSearchTerm("");
                }}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Add New Category Button */}
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-5 py-2.5 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 whitespace-nowrap shadow-sm text-sm sm:text-base w-full sm:w-auto"
            onClick={handleOpenAddModal}
          >
            <FolderPlus className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Categories Table - Made Responsive */}
      <div className="bg-white shadow-md rounded-lg border border-gray-200 overflow-hidden">
        {/* Table header */}
        <div className="p-3 sm:p-4 border-b bg-gray-50 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <h2 className="text-base sm:text-lg font-medium text-gray-700">All Categories</h2>
          <div className="text-xs sm:text-sm text-gray-500">
            Total: {filteredCategories.length} categories
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/4">
                  Category Name
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/2">
                  Description
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 sm:px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="text-center py-8 sm:py-12">
                    <div className="flex flex-col justify-center items-center space-y-3">
                      <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-blue-600" />
                      <span className="text-sm sm:text-base text-gray-600 font-medium">
                        Loading categories data...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-8 sm:py-12">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Folder className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mb-3 sm:mb-4" />
                      <p className="text-base sm:text-lg font-medium text-gray-900 mb-1">
                        No categories found
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500 max-w-sm px-4">
                        {searchTerm
                          ? "Try adjusting your search terms"
                          : "Add a new category to get started"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCategories.map((category, index) => (
                  <tr
                    key={category.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                    }`}
                  >
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center">
                        <Folder className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 mr-1.5 sm:mr-2" />
                        <span className="text-xs sm:text-sm font-medium text-gray-900">
                          {category.category_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="text-xs sm:text-sm text-gray-900 max-w-[150px] sm:max-w-[300px]">
                        {category.description.length > 50 ? (
                          <>
                            {expandedDescriptions[category.id] ? (
                              <>
                                {category.description}
                                <button
                                  className="text-blue-600 ml-1 text-xs hover:underline focus:outline-none"
                                  onClick={() => toggleDescription(category.id)}
                                >
                                  See less
                                </button>
                              </>
                            ) : (
                              <>
                                {truncateText(category.description, 50)}
                                <button
                                  className="text-blue-600 ml-1 text-xs hover:underline focus:outline-none"
                                  onClick={() => toggleDescription(category.id)}
                                >
                                  See more
                                </button>
                              </>
                            )}
                          </>
                        ) : (
                          category.description
                        )}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      {category.is_active ? (
                        <span className="px-1.5 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-green-100 text-green-800 border border-green-200 whitespace-nowrap">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="px-1.5 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-red-100 text-red-800 border border-red-200 whitespace-nowrap">
                          INACTIVE
                        </span>
                      )}
                    </td>

                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                      <div className="flex space-x-2 sm:space-x-3 justify-end">
                        <button
                          className="text-blue-600 hover:text-blue-800 transition-colors duration-150 p-1 sm:p-1.5 rounded-full hover:bg-blue-50"
                          onClick={() => handleEdit(category)}
                          title="Edit Category"
                        >
                          <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </button>
                        <button
                          className="text-red-500 hover:text-red-700 transition-colors duration-150 p-1 sm:p-1.5 rounded-full hover:bg-red-50"
                          onClick={() => handleDelete(category.id)}
                          title="Delete Category"
                        >
                          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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

      {/* Description View Modal - Made Responsive */}
      {viewingDescription && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4"
          onClick={() => setViewingDescription(null)}
        >
          <div
            className="bg-white rounded-lg max-w-md w-full p-3 sm:p-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-2 sm:mb-3">
              <h3 className="font-medium text-sm sm:text-base text-gray-900">Full Description</h3>
              <button
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setViewingDescription(null)}
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
            <div className="text-xs sm:text-sm text-gray-800 whitespace-pre-wrap break-words max-h-[50vh] sm:max-h-[60vh] overflow-y-auto p-2 sm:p-3 bg-gray-50 rounded-md">
              {viewingDescription}
            </div>
            <div className="mt-3 sm:mt-4 text-right">
              <button
                className="px-3 py-1.5 bg-blue-600 text-white text-xs sm:text-sm rounded-md hover:bg-blue-700"
                onClick={() => setViewingDescription(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Category Modal - Made Responsive */}
      {(isAddCategoryModalOpen || isEditCategoryModalOpen) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b px-4 sm:px-6 py-3 sm:py-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
                {isEditCategoryModalOpen ? (
                  <>
                    <Edit className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    Edit Category
                  </>
                ) : (
                  <>
                    <FolderPlus className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    Add New Category
                  </>
                )}
              </h2>
              <button
                className="text-gray-400 hover:text-gray-600 transition-colors"
                onClick={handleCloseModal}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6">
              <div className="space-y-4 sm:space-y-5">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Category Name*
                  </label>
                  <input
                    type="text"
                    className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      errors.categoryName
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300"
                    }`}
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    onBlur={() => {
                      if (!categoryName.trim()) {
                        setErrors({
                          ...errors,
                          categoryName: "Category name is required",
                        });
                      } else if (categoryName.length < 3) {
                        setErrors({
                          ...errors,
                          categoryName:
                            "Category name must be at least 3 characters",
                        });
                      } else if (
                        categories.some(
                          (category) =>
                            category.category_name.toLowerCase() ===
                              categoryName.trim().toLowerCase() &&
                            category.id !== selectedCategory?.id
                        )
                      ) {
                        setErrors({
                          ...errors,
                          categoryName: "Category name already exists",
                        });
                      } else {
                        setErrors({ ...errors, categoryName: "" });
                      }
                    }}
                    placeholder="Enter category name"
                  />
                  {errors.categoryName && (
                    <div className="flex items-center mt-1 text-xs text-red-500">
                      <AlertCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                      {errors.categoryName}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Description*
                  </label>
                  <textarea
                    className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      errors.description
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300"
                    }`}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onBlur={() => {
                      if (!description.trim()) {
                        setErrors({
                          ...errors,
                          description: "Description is required",
                        });
                      } else if (description.length < 10) {
                        setErrors({
                          ...errors,
                          description:
                            "Description must be at least 10 characters",
                        });
                      } else {
                        setErrors({ ...errors, description: "" });
                      }
                    }}
                    placeholder="Enter description"
                    rows="3"
                  />
                  {errors.description && (
                    <div className="flex items-center mt-1 text-xs text-red-500">
                      <AlertCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                      {errors.description}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                    Status
                  </label>
                  <div className="flex flex-col xs:flex-row space-y-3 xs:space-y-0 xs:space-x-6">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="form-radio h-4 w-4 sm:h-5 sm:w-5 text-blue-600"
                        name="status"
                        value="active"
                        checked={isActive === "active"}
                        onChange={() => setIsActive("active")}
                      />
                      <span className="ml-2 text-sm text-gray-700 flex items-center">
                        <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 mr-1" />
                        Active
                      </span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="form-radio h-4 w-4 sm:h-5 sm:w-5 text-red-600"
                        name="status"
                        value="inactive"
                        checked={isActive === "inactive"}
                        onChange={() => setIsActive("inactive")}
                      />
                      <span className="ml-2 text-sm text-gray-700 flex items-center">
                        <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500 mr-1" />
                        Inactive
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex flex-col xs:flex-row xs:justify-end space-y-2 xs:space-y-0 xs:space-x-3 pt-4 sm:pt-5 mt-2 border-t">
                <button
                  type="button"
                  className="px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 shadow-sm w-full xs:w-auto"
                  onClick={handleCloseModal}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 shadow-sm w-full xs:w-auto"
                  onClick={
                    isEditCategoryModalOpen
                      ? handleEditCategory
                      : handleAddCategory
                  }
                >
                  {isEditCategoryModalOpen ? "Update Category" : "Add Category"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;