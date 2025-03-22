import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Edit, 
  Trash2, 
  Search, 
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  Loader2
} from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

const Users = () => {
  // State Management
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInputValue, setSearchInputValue] = useState('');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formModalError, setFormModalError] = useState('');
  const { toast } = useToast();

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);

  // Form Data State
  const [userForm, setUserForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    address: '',
    password: '',
    profilePicture: null,
    isActive: 'active'
  });

  // Form validation errors
  const [formErrors, setFormErrors] = useState({});

  // Clear form function
  const clearForm = () => {
    setUserForm({
      fullName: '',
      email: '',
      phoneNumber: '',
      address: '',
      password: '',
      profilePicture: null,
      isActive: 'active'
    });
    setFormErrors({});
    setFormModalError('');
  };

  // Format date to YYYY-MM-DD HH:MM:SS
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 19).replace('T', ' ');
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInputValue);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [searchInputValue]);


  
  // Fetch Users with client-side filtering
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
      setTotalUsers(response.data.length);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Filter and paginate users
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    
    return users.filter(user => 
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone_number.includes(searchTerm)
    );
  }, [users, searchTerm]);

  // Paginated users
  const paginatedUsers = useMemo(() => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, page, limit]);

  // Total pages
  const totalPages = useMemo(() => {
    return Math.ceil(filteredUsers.length / limit);
  }, [filteredUsers, limit]);

  // Handle Input Changes
  const handleInputChange = (e) => {
    const { id, value, files } = e.target;

    setFormModalError('');
    
    // Handle file input separately - convert to base64
    if (id === 'profilePicture' && files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      
      reader.onloadend = () => {
        // Store the complete data URL including the prefix
        setUserForm(prev => ({
          ...prev,
          [id]: reader.result // This already includes the "data:image/..." prefix
        }));
      };
      
      reader.readAsDataURL(file);
      return;
    }

    if (formErrors[id]) {
      setFormErrors(prev => ({
        ...prev,
        [id]: ''
      }));
    }

    setUserForm(prev => ({
      ...prev,
      [id]: value
    }));
  };

  // Form validation
  const validateForm = () => {
    const errors = {};
    let isValid = true;

    if (!userForm.fullName.trim()) {
      errors.fullName = 'Full name is required';
      isValid = false;
    }

    const email = userForm.email.trim().toLowerCase();

    if (!email) {
      errors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Invalid email format";
      isValid = false;
    } else if (!email.endsWith("@gmail.com")) {
      errors.email = "Only Gmail addresses (@gmail.com) are allowed.";
      isValid = false;
    }

    if (!userForm.phoneNumber.trim()) {
      errors.phoneNumber = 'Phone number is required';
      isValid = false;
    } else if (!/^\d{10}$/.test(userForm.phoneNumber.replace(/\D/g, ''))) {
      errors.phoneNumber = 'Phone number must be 10 digits';
      isValid = false;
    }

    if (!userForm.address.trim()) {
      errors.address = 'Address is required';
      isValid = false;
    }

    if (!isEditUserModalOpen && !userForm.password) {
      errors.password = 'Password is required';
      isValid = false;
    } else if (userForm.password && userForm.password.length < 7) {
      errors.password = 'Password must be at least 7 characters';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  // Add User
  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmitting(true);

    try {
      // Create a JSON object with user data
      const userData = {
        fullName: userForm.fullName,
        email: userForm.email.trim().toLowerCase(),
        phoneNumber: userForm.phoneNumber,
        address: userForm.address,
        password: userForm.password,
        isActive: userForm.isActive
      };
      
      if (userForm.profilePicture) {
        userData.profilePicture = userForm.profilePicture;
      }

      const response = await api.post('/admin/users', userData);
      
      fetchUsers();
      setIsAddUserModalOpen(false);
      clearForm();

      toast({
        title: "Success",
        description: `User ${response.data.user.full_name} has been added successfully`
      });
    } catch (error) {
      setFormModalError(error.response?.data?.message || "Failed to add user");
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to add user"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit User
  const handleEditUser = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmitting(true);

    try {
      // Create a JSON object with user data
      const userData = {
        fullName: userForm.fullName,
        email: userForm.email.trim().toLowerCase(),
        phoneNumber: userForm.phoneNumber,
        address: userForm.address,
        isActive: userForm.isActive
      };
      
      if (userForm.password) {
        userData.password = userForm.password;
      }
      
      // Only include profilePicture if it's a new base64 image
      if (userForm.profilePicture && typeof userForm.profilePicture === 'string' && 
          userForm.profilePicture.startsWith('data:image')) {
        userData.profilePicture = userForm.profilePicture;
      }

      const response = await api.put(`/admin/users/${selectedUser.id}`, userData);
      
      fetchUsers();
      setIsEditUserModalOpen(false);
      setSelectedUser(null);
      clearForm();

      toast({
        title: "Success",
        description: `User ${response.data.user.full_name} has been updated successfully`
      });
    } catch (error) {
      setFormModalError(error.response?.data?.message || "Failed to update user");
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to update user"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete User
  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to delete ${user.full_name}?`)) {
      return;
    }

    try {
      await api.delete(`/admin/users/${user.id}`);
      fetchUsers();
      toast({
        title: "Success",
        description: `User ${user.full_name} has been deleted successfully`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to delete user"
      });
    }
  };

  // Prepare Edit User
  const prepareEditUser = (user) => {
    setSelectedUser(user);
    setUserForm({
      fullName: user.full_name,
      email: user.email,
      phoneNumber: user.phone_number,
      address: user.address,
      password: '',
      profilePicture: user.profile_picture || null,
      isActive: user.is_active
    });
    setIsEditUserModalOpen(true);
  };

  // Pagination controls
  const nextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  const prevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  // Render Status Dropdown
  const renderStatusDropdown = () => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Status *
      </label>
      <Select
        value={userForm.isActive}
        onValueChange={(value) => {
          setUserForm(prev => ({
            ...prev,
            isActive: value
          }));
          setFormErrors(prev => ({
            ...prev,
            isActive: ''
          }));
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>
      {formErrors.isActive && (
        <p className="text-red-500 text-xs mt-1">{formErrors.isActive}</p>
      )}
    </div>
  );

  // Form inputs - extracted as a reusable component
  const renderFormInputs = () => (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Full Name *
        </label>
        <input
          type="text"
          id="fullName"
          className={`mt-1 block w-full rounded-md border ${
            formErrors.fullName ? 'border-red-500' : 'border-gray-300'
          } shadow-sm p-2`}
          value={userForm.fullName}
          onChange={handleInputChange}
        />
        {formErrors.fullName && (
          <p className="mt-1 text-xs text-red-500">{formErrors.fullName}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Email *
        </label>
        <input
          type="email"
          id="email"
          className={`mt-1 block w-full rounded-md border ${
            formErrors.email ? 'border-red-500' : 'border-gray-300'
          } shadow-sm p-2`}
          value={userForm.email}
          onChange={handleInputChange}
        />
        {formErrors.email && (
          <p className="mt-1 text-xs text-red-500">{formErrors.email}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Phone Number *
        </label>
        <input
          type="tel"
          id="phoneNumber"
          className={`mt-1 block w-full rounded-md border ${
            formErrors.phoneNumber ? 'border-red-500' : 'border-gray-300'
          } shadow-sm p-2`}
          value={userForm.phoneNumber}
          onChange={handleInputChange}
          placeholder="10-digit number"
        />
        {formErrors.phoneNumber && (
          <p className="mt-1 text-xs text-red-500">{formErrors.phoneNumber}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Address *
        </label>
        <input
          type="text"
          id="address"
          className={`mt-1 block w-full rounded-md border ${
            formErrors.address ? 'border-red-500' : 'border-gray-300'
          } shadow-sm p-2`}
          value={userForm.address}
          onChange={handleInputChange}
        />
        {formErrors.address && (
          <p className="mt-1 text-xs text-red-500">{formErrors.address}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Password {!isEditUserModalOpen ? '*' : ''}
        </label>
        <input
          type="password"
          id="password"
          className={`mt-1 block w-full rounded-md border ${
            formErrors.password ? 'border-red-500' : 'border-gray-300'
          } shadow-sm p-2`}
          value={userForm.password}
          onChange={handleInputChange}
          minLength="7"
          placeholder={isEditUserModalOpen ? "Leave blank to keep current password" : ""}
        />
        {formErrors.password && (
          <p className="mt-1 text-xs text-red-500">{formErrors.password}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Profile Picture
        </label>
        <input
          type="file"
          id="profilePicture"
          accept="image/*"
          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          onChange={handleInputChange}
        />
        {userForm.profilePicture && typeof userForm.profilePicture === 'string' && 
         userForm.profilePicture.startsWith('data:image') && (
          <div className="mt-2">
            <img 
              src={userForm.profilePicture} 
              alt="Preview" 
              className="h-20 w-20 object-cover rounded-full" 
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}
      </div>

      {renderStatusDropdown()}
    </>
  );

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header and Search */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Users</h1>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search users..."
              className="pl-10 pr-4 py-2 border rounded-md w-64"
              value={searchInputValue}
              onChange={(e) => setSearchInputValue(e.target.value)}
            />
          </div>
          <button 
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center"
            onClick={() => setIsAddUserModalOpen(true)}
          >
            <PlusCircle className="mr-2 h-5 w-5" />
            Add New User
          </button>
        </div>
      </div>
      {/* Users Table */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan="5" className="text-center py-8">
                  <div className="flex justify-center items-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    <span className="ml-2 text-gray-600">Loading users...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-4">No users found</td>
              </tr>
            ) : (
              paginatedUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {user.profile_picture ? (
                          <img 
                            src={user.profile_picture.startsWith('data:image') 
                              ? user.profile_picture
                              : `${import.meta.env.VITE_API_URL}${user.profile_picture}`}
                            alt={user.full_name}
                            className="h-10 w-10 rounded-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40' fill='%23e2e8f0'%3E%3Crect width='40' height='40' rx='20' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' font-size='16' font-family='Arial' fill='%23718096' text-anchor='middle' dominant-baseline='middle'%3E${user.full_name.charAt(0).toUpperCase()}%3C/text%3E%3C/svg%3E`;
                            }}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-500 text-sm">
                              {user.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        <div className="text-sm text-gray-500">{user.phone_number}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-[200px] truncate" title={user.address}>
                      {user.address}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.is_active === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.is_active === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button 
                        className="text-blue-500 hover:text-blue-700"
                        onClick={() => prepareEditUser(user)}
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button 
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleDeleteUser(user)}
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

        {/* Pagination */}
        {!isLoading && filteredUsers.length > 0 && (
          <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={prevPage}
                disabled={page === 1}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  page === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Previous
              </button>
              <button
                onClick={nextPage}
                disabled={page >= totalPages}
                className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  page >= totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(page * limit, filteredUsers.length)}
                  </span>{' '}
                  of <span className="font-medium">{filteredUsers.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={prevPage}
                    disabled={page === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                      page === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  
                  {/* Page numbers */}
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setPage(i + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === i + 1
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  
                  <button
                    onClick={nextPage}
                    disabled={page >= totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                      page >= totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Next</span>
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-height-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Add New User</h2>
            <form onSubmit={handleAddUser} className="space-y-4">
              {formModalError && (
                <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
                  {formModalError}
                </div>
              )}
              
              {renderFormInputs()}

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50"
                  onClick={() => {
                    setIsAddUserModalOpen(false);
                    clearForm();
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center justify-center"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Adding...
                    </>
                  ) : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditUserModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-height-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Edit User</h2>
            <form onSubmit={handleEditUser} className="space-y-4">
              {formModalError && (
                <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
                  {formModalError}
                </div>
              )}
              
              {renderFormInputs()}

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50"
                  onClick={() => {
                    setIsEditUserModalOpen(false);
                    setSelectedUser(null);
                    clearForm();
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center justify-center"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Updating...
                    </>
                  ) : 'Update User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;