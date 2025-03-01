import React, { useState, useEffect, useRef } from 'react';
import { 
  Edit, 
  Trash2, 
  Search, 
  PlusCircle,
  Clock,
  User
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
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEmailChecking, setIsEmailChecking] = useState(false);
  const emailInputRef = useRef(null);
  const [formModalError, setFormModalError] = useState('');
  const { toast } = useToast();

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
  const [formErrors, setFormErrors] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    address: '',
    password: '',
    isActive: ''
  });

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

  // Check if email exists
  const checkEmailExists = async (email) => {
    setIsEmailChecking(true);
    try {
      const response = await api.get(`/admin/users/check-email?email=${encodeURIComponent(email)}`);
      return response.data.exists;
    } catch (error) {
      console.error('Email check error:', error);
      return users.some(user => 
        user.email.toLowerCase() === email.toLowerCase() && 
        (!selectedUser || user.id !== selectedUser.id)
      );
    } finally {
      setIsEmailChecking(false);
    }
  };

  // Fetch Users
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch users"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle Input Changes
  const handleInputChange = (e) => {
    const { id, value, files } = e.target;
    setFormModalError('');
    
    if (id === 'profilePicture' && files) {
      setUserForm(prev => ({
        ...prev,
        profilePicture: files[0]
      }));
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

  // Handle email validation
  const handleEmailBlur = async () => {
    if (userForm.email && /\S+@\S+\.\S+/.test(userForm.email)) {
      if (isEditUserModalOpen && selectedUser && 
          userForm.email.toLowerCase() === selectedUser.email.toLowerCase()) {
        return;
      }
      
      const emailExists = await checkEmailExists(userForm.email);
      if (emailExists) {
        setFormErrors(prev => ({
          ...prev, 
          email: "This email is already registered"
        }));
      }
    }
  };

  // Form validation
  const validateForm = () => {
    const errors = {};
    let isValid = true;

    if (!userForm.fullName.trim()) {
      errors.fullName = 'Full name is required';
      isValid = false;
    }

    if (!userForm.email.trim()) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(userForm.email)) {
      errors.email = 'Invalid email format';
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

    try {
      const formData = new FormData();
      Object.keys(userForm).forEach(key => {
        if (userForm[key] !== null) {
          formData.append(key, userForm[key]);
        }
      });

      const response = await api.post('/admin/users', formData);
      
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
    }
  };

  // Edit User
  const handleEditUser = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const formData = new FormData();
      Object.keys(userForm).forEach(key => {
        if (userForm[key] !== null && (key !== 'password' || userForm[key] !== '')) {
          formData.append(key, userForm[key]);
        }
      });

      const response = await api.put(`/admin/users/${selectedUser.id}`, formData);
      
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
      profilePicture: null,
      isActive: user.is_active
    });
    setIsEditUserModalOpen(true);
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone_number.includes(searchTerm)
  );

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

  return (
    <div className="container mx-auto">


      {/* Header and Search */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold">Users</h1>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search users..."
              className="pl-10 pr-4 py-2 border rounded-md w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
                <td colSpan="5" className="text-center py-4">Loading users...</td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-4">No users found</td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {user.profile_picture ? (
                          <img 
                            src={`${import.meta.env.VITE_API_URL}${user.profile_picture}`}
                            alt={user.full_name}
                            className="h-10 w-10 rounded-full object-cover"
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
    </div>

    {/* Add User Modal */}
    {isAddUserModalOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h2 className="text-xl font-semibold mb-4">Add New User</h2>
          {formModalError && (
            <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
              {formModalError}
            </div>
          )}
          <form onSubmit={handleAddUser} className="space-y-4">
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
                onBlur={handleEmailBlur}
                ref={emailInputRef}
              />
              {formErrors.email && (
                <p className="mt-1 text-xs text-red-500">{formErrors.email}</p>
              )}
              {isEmailChecking && (
                <p className="mt-1 text-xs text-blue-500">Checking email availability...</p>
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
                Password *
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
            </div>

            {renderStatusDropdown()}

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
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                disabled={isLoading || isEmailChecking}
              >
                {isLoading ? 'Adding...' : 'Add User'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* Edit User Modal */}
    {isEditUserModalOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h2 className="text-xl font-semibold mb-4">Edit User</h2>
          {formModalError && (
            <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
              {formModalError}
            </div>
          )}
          <form onSubmit={handleEditUser} className="space-y-4">
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
                onBlur={handleEmailBlur}
              />
              {formErrors.email && (
                <p className="mt-1 text-xs text-red-500">{formErrors.email}</p>
              )}
              {isEmailChecking && (
                <p className="mt-1 text-xs text-blue-500">Checking email availability...</p>
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
                Password {!isEditUserModalOpen && '*'}
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
                placeholder="Leave blank to keep current password"
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
            </div>

            {renderStatusDropdown()}

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
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                disabled={isLoading || isEmailChecking}
              >
                {isLoading ? 'Updating...' : 'Update User'}
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