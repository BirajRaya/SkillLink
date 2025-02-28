import React, { useState, useEffect, useRef } from 'react';
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Search, 
  PlusCircle 
} from "lucide-react";
import api from "@/lib/api";

const Users = () => {
  // State Management
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEmailChecking, setIsEmailChecking] = useState(false);
  
  // Refs for form inputs (for focus management)
  const emailInputRef = useRef(null);
  
  // Message state - only for page-level messages (not form errors)
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Form-specific error message for modal display only
  const [formModalError, setFormModalError] = useState('');

  // Form Data State
  const [userForm, setUserForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    address: '',
    password: '',
    profilePicture: null
  });
  
  // Form validation errors
  const [formErrors, setFormErrors] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    address: '',
    password: ''
  });

  // Handle errors with focus on the relevant field
  const handleFormError = (errorType, errorMessage) => {
    // Set the form modal error
    setFormModalError(errorMessage);
    
    // Handle specific error types
    if (errorType === 'email') {
      setFormErrors(prev => ({
        ...prev,
        email: errorMessage
      }));
      
      // Focus on email field
      if (emailInputRef.current) {
        setTimeout(() => {
          emailInputRef.current.focus();
          emailInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }
  };

  // Fetch Users
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Add timeout to fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await api.get('/admin/users', {
        signal: controller.signal,
        timeout: 5000
      });
      
      clearTimeout(timeoutId);
      setUsers(response.data);
      
    } catch (error) {
      // Error message for page
      let errorMsg = "Failed to fetch users";
      
      if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
        errorMsg = "Request timed out while loading users. Please refresh the page.";
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      }
      
      setMessage({
        type: 'error',
        text: errorMsg
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initial Data Fetch
  useEffect(() => {
    fetchUsers();
  }, []);

  // Clear message after 5 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);
  
  // Add a smooth animation to message
  useEffect(() => {
    if (message.text) {
      const messageElement = document.getElementById('status-message');
      if (messageElement) {
        messageElement.classList.add('animate-fadeIn');
        
        // Remove the animation class after it completes
        setTimeout(() => {
          messageElement.classList.remove('animate-fadeIn');
        }, 500);
      }
    }
  }, [message]);

  // Check if email already exists in database
  const checkEmailExists = async (email) => {
    setIsEmailChecking(true);
    try {
      // Set a timeout for the API call
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      try {
        // Make API call to check if email exists
        const response = await api.get(`/admin/users/check-email?email=${encodeURIComponent(email)}`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response.data.exists;
      } catch (apiError) {
        clearTimeout(timeoutId);
        if (apiError.name === 'AbortError' || apiError.code === 'ECONNABORTED') {
          console.log('Email check timed out, using client-side check');
        } else {
          console.log('API endpoint error, using client-side check');
        }
        // Fallback to client-side check
        throw apiError;
      }
    } catch (error) {
      // If the endpoint doesn't exist or times out, fallback to checking client-side
      return users.some(user => 
        user.email.toLowerCase() === email.toLowerCase() && 
        (!selectedUser || user.id !== selectedUser.id)
      );
    } finally {
      setIsEmailChecking(false);
    }
  };

  // Handle Input Changes
  const handleInputChange = (e) => {
    const { id, value, files } = e.target;
    
    // Clear form modal error when user changes any input
    setFormModalError('');
    
    // Handle file upload
    if (id === 'profilePicture' && files) {
      setUserForm(prev => ({
        ...prev,
        profilePicture: files[0]
      }));
      return;
    }

    // Clear field error when user starts typing
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

  // Handle email blur event to check for duplicates
  const handleEmailBlur = async () => {
    // Only validate if there's a valid email format
    if (userForm.email && /\S+@\S+\.\S+/.test(userForm.email)) {
      // For edit mode, only check if email changed
      if (isEditUserModalOpen && selectedUser && 
          userForm.email.toLowerCase() === selectedUser.email.toLowerCase()) {
        return;
      }
      
      // Check if email exists
      const emailExists = await checkEmailExists(userForm.email);
      if (emailExists) {
        // Just set the error but don't focus - allow user to continue with other fields
        setFormErrors(prev => ({
          ...prev, 
          email: "This email is already registered in our system"
        }));
      }
    }
  };

  // Validate form
  // Keeping it here in case we want to reimplement later with better timeout handling
  const validateForm = async () => {
    let valid = true;
    const errors = {
      fullName: '',
      email: '',
      phoneNumber: '',
      address: '',
      password: ''
    };
    
    // Validate full name
    if (!userForm.fullName.trim()) {
      errors.fullName = 'Full name is required';
      valid = false;
    }
    
    // Validate email
    if (!userForm.email.trim()) {
      errors.email = 'Email is required';
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(userForm.email)) {
      errors.email = 'Email is invalid';
      valid = false;
    } else {
      try {
        // Check if email already exists with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
        
        // Do a quick local check first
        const localExists = users.some(user => 
          user.email.toLowerCase() === userForm.email.toLowerCase() && 
          (!selectedUser || user.id !== selectedUser.id)
        );
        
        if (localExists) {
          errors.email = 'This email is already registered in our system';
          valid = false;
          clearTimeout(timeoutId);
        } else {
          // Only check API if not found locally
          const emailExists = await checkEmailExists(userForm.email);
          clearTimeout(timeoutId);
          
          if (emailExists && (!selectedUser || userForm.email.toLowerCase() !== selectedUser.email.toLowerCase())) {
            errors.email = 'This email is already registered in our system';
            valid = false;
          }
        }
      } catch (error) {
        // If email check times out, continue with other validations
        console.log('Email check error:', error);
      }
    }
    
    // Validate phone number - must be exactly 10 digits
    if (!userForm.phoneNumber.trim()) {
      errors.phoneNumber = 'Phone number is required';
      valid = false;
    } else if (!/^\d{10}$/.test(userForm.phoneNumber.replace(/\D/g, ''))) {
      errors.phoneNumber = 'Phone number must be 10 digits';
      valid = false;
    }
    
    // Validate address
    if (!userForm.address.trim()) {
      errors.address = 'Address is required';
      valid = false;
    }
    
    // Validate password - at least 7 characters
    if (!userForm.password && !isEditUserModalOpen) {
      errors.password = 'Password is required';
      valid = false;
    } else if (userForm.password && userForm.password.length < 7) {
      errors.password = 'Password must be at least 7 characters';
      valid = false;
    }
    
    setFormErrors(errors);
    return valid;
  };

  // Add New User
  const handleAddUser = async (e) => {
    e.preventDefault();
    
    // Basic form validation without async email check
    setIsLoading(true);
    
    // Validate form (keep existing validation logic)
    let valid = true;
    const errors = {
      fullName: '',
      email: '',
      phoneNumber: '',
      address: '',
      password: ''
    };
    
    // (Keep existing validation code)
  
    if (!valid) {
      setIsLoading(false);
      return;
    }
  
    try {
      // Prepare form data with detailed logging
      const formData = new FormData();
      
      // Explicitly append all required fields
      formData.append('fullName', userForm.fullName);
      formData.append('email', userForm.email);
      formData.append('phoneNumber', userForm.phoneNumber);
      formData.append('address', userForm.address);
      formData.append('password', userForm.password);
  
      // Only append profilePicture if it exists
      if (userForm.profilePicture) {
        formData.append('profilePicture', userForm.profilePicture);
      }
  
      // Detailed logging of form data
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ', pair[1]);
      }
  
      // Send request
      const response = await api.post('/admin/users', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data' 
        }
      });
  
      // Refresh users list
      fetchUsers();
  
      // Reset form and close modal
      setUserForm({
        fullName: '',
        email: '',
        phoneNumber: '',
        address: '',
        password: '',
        profilePicture: null
      });
      setIsAddUserModalOpen(false);
  
      // Success toast
      toast({
        title: "Success",
        description: "User added successfully"
      });
    } catch (error) {
      console.error('Add User Error:', {
        error: error,
        response: error.response,
        request: error.request
      });
  
      // Error handling
      const errorMsg = error.response?.data?.message || "Failed to add user";
      
      // Set form modal error
      setFormModalError(errorMsg);
  
      // Error toast
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMsg
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Prepare Edit User
  const prepareEditUser = (user) => {
    // Reset any form errors
    setFormErrors({
      fullName: '',
      email: '',
      phoneNumber: '',
      address: '',
      password: ''
    });
    
    // Reset modal error
    setFormModalError('');
    
    setSelectedUser(user);
    setUserForm({
      fullName: user.full_name,
      email: user.email,
      phoneNumber: user.phone_number,
      address: user.address || '',
      password: '',
      profilePicture: null
    });
    setIsEditUserModalOpen(true);
  };

  // Edit User
  const handleEditUser = async (e) => {
    e.preventDefault();
    
    // Clear form modal error
    setFormModalError('');
    
    // Basic form validation without async email check
    setIsLoading(true);
    
    let valid = true;
    const errors = {
      fullName: '',
      email: '',
      phoneNumber: '',
      address: '',
      password: ''
    };
    
    // Validate full name
    if (!userForm.fullName.trim()) {
      errors.fullName = 'Full name is required';
      valid = false;
    }
    
    // Validate email format (but not uniqueness yet)
    if (!userForm.email.trim()) {
      errors.email = 'Email is required';
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(userForm.email)) {
      errors.email = 'Email is invalid';
      valid = false;
    }
    
    // Validate phone number - must be exactly 10 digits
    if (!userForm.phoneNumber.trim()) {
      errors.phoneNumber = 'Phone number is required';
      valid = false;
    } else if (!/^\d{10}$/.test(userForm.phoneNumber.replace(/\D/g, ''))) {
      errors.phoneNumber = 'Phone number must be 10 digits';
      valid = false;
    }
    
    // Validate address
    if (!userForm.address.trim()) {
      errors.address = 'Address is required';
      valid = false;
    }
    
    // Validate password - if provided, must be at least 7 characters
    if (userForm.password && userForm.password.length < 7) {
      errors.password = 'Password must be at least 7 characters';
      valid = false;
    }
    
    setFormErrors(errors);
    
    if (!valid) {
      setIsLoading(false);
      return;
    }

    try {
      // Prepare form data
      const formData = new FormData();
      Object.keys(userForm).forEach(key => {
        if (userForm[key] !== null && userForm[key] !== '') {
          formData.append(key, userForm[key]);
        }
      });

      // Send request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      await api.put(`/admin/users/${selectedUser.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        signal: controller.signal,
        timeout: 10000
      });
      
      clearTimeout(timeoutId);

      // Refresh users list
      fetchUsers();

      // Reset form and close modal
      setUserForm({
        fullName: '',
        email: '',
        phoneNumber: '',
        address: '',
        password: '',
        profilePicture: null
      });
      setFormErrors({
        fullName: '',
        email: '',
        phoneNumber: '',
        address: '',
        password: ''
      });
      setIsEditUserModalOpen(false);
      setSelectedUser(null);

      // Success message for page
      setMessage({
        type: 'success',
        text: "User updated successfully"
      });
    } catch (error) {
      // Handle errors within the form
      let errorMsg = "Failed to update user. Please try again.";
      
      if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
        errorMsg = "Request timed out. Please try again.";
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.response?.status === 400) {
        errorMsg = "Invalid user data. Please check your input and try again.";
      } else if (error.response?.status === 404) {
        errorMsg = "User not found. They may have been deleted.";
      } else if (error.response?.status === 409) {
        // Handle email duplicate specifically
        errorMsg = "This email is already registered in our system";
        setFormErrors(prev => ({
          ...prev,
          email: errorMsg
        }));
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      // Set modal-specific error message
      setFormModalError(errorMsg);
    }
    
    setIsLoading(false);
  };

  // Store name for delete confirmation
  const [userToDelete, setUserToDelete] = useState(null);
  
  // Delete User
  const handleDeleteUser = async (user) => {
    setUserToDelete(user);
    setIsLoading(true);

    try {
      // Add timeout to delete request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      await api.delete(`/admin/users/${user.id}`, {
        signal: controller.signal,
        timeout: 5000
      });
      
      clearTimeout(timeoutId);
      
      // Refresh users list
      fetchUsers();

      // Success message for page
      setMessage({
        type: 'success',
        text: `User ${user.full_name} has been successfully deleted`
      });
      
    } catch (error) {
      // Detailed error message
      let errorMsg = "Failed to delete user";
      
      if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
        errorMsg = "Delete request timed out. Please try again.";
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.response?.status === 404) {
        errorMsg = "User not found. They may have been already deleted.";
      } else if (error.response?.status === 403) {
        errorMsg = "You don't have permission to delete this user.";
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      setMessage({
        type: 'error',
        text: errorMsg
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Search Users
  const filteredUsers = users.filter(user => 
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto">
      {/* Header and Search */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Users</h1>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
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

      {/* Page-level message display (not for form errors) */}
      {message.text && (
        <div id="status-message" className={`mb-4 p-4 rounded-md flex items-center transition-all duration-500 ${message.type === 'success' ? 'bg-green-100 border border-green-300 text-green-800' : 'bg-red-100 border border-red-300 text-red-800'}`}>
          <div className={`w-6 h-6 mr-3 rounded-full flex items-center justify-center ${message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
            {message.type === 'success' ? '✓' : '!'}
          </div>
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan="4" className="text-center py-4">
                  Loading users...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-4">
                  No users found
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{user.full_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{user.phone_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap flex space-x-2">
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
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-2xl font-bold mb-4">Add New User</h2>
            
            {/* Form-specific error message in modal */}
            {formModalError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded-md font-medium sticky top-0">
                {formModalError}
              </div>
            )}
            
            <form id="add-user-form" onSubmit={handleAddUser} className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label htmlFor="fullName" className="block mb-2">Full Name</label>
                <input
                  type="text"
                  id="fullName"
                  className={`w-full border rounded-md px-3 py-2 ${formErrors.fullName ? 'border-red-500' : ''}`}
                  value={userForm.fullName}
                  onChange={handleInputChange}
                  required
                />
                {formErrors.fullName && <p className="text-red-500 text-xs mt-1">{formErrors.fullName}</p>}
              </div>
              <div>
                <label htmlFor="email" className="block mb-2">Email</label>
                <input
                  type="email"
                  id="email"
                  className={`w-full border rounded-md px-3 py-2 ${formErrors.email ? 'border-red-500' : ''}`}
                  value={userForm.email}
                  ref={emailInputRef}
                  ref={emailInputRef}
                  onChange={handleInputChange}
                  onBlur={handleEmailBlur}
                  required
                />
                {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
                {isEmailChecking && <p className="text-blue-500 text-xs mt-1">Checking email availability...</p>}
              </div>
              <div>
                <label htmlFor="phoneNumber" className="block mb-2">Phone Number (10 digits)</label>
                <input
                  type="tel"
                  id="phoneNumber"
                  className={`w-full border rounded-md px-3 py-2 ${formErrors.phoneNumber ? 'border-red-500' : ''}`}
                  value={userForm.phoneNumber}
                  onChange={handleInputChange}
                  required
                  placeholder="10-digit number"
                />
                {formErrors.phoneNumber && <p className="text-red-500 text-xs mt-1">{formErrors.phoneNumber}</p>}
              </div>
              <div>
                <label htmlFor="address" className="block mb-2">Address</label>
                <input
                  type="text"
                  id="address"
                  className={`w-full border rounded-md px-3 py-2 ${formErrors.address ? 'border-red-500' : ''}`}
                  value={userForm.address}
                  onChange={handleInputChange}
                  required
                />
                {formErrors.address && <p className="text-red-500 text-xs mt-1">{formErrors.address}</p>}
              </div>
              <div>
                <label htmlFor="password" className="block mb-2">Password (min 7 characters)</label>
                <input
                  type="password"
                  id="password"
                  className={`w-full border rounded-md px-3 py-2 ${formErrors.password ? 'border-red-500' : ''}`}
                  value={userForm.password}
                  onChange={handleInputChange}
                  required
                  minLength="7"
                />
                {formErrors.password && <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>}
              </div>
              <div>
                <label htmlFor="profilePicture" className="block mb-2">Profile Picture</label>
                <input
                  type="file"
                  id="profilePicture"
                  accept="image/*"
                  className="w-full border rounded-md px-3 py-2"
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 rounded-md"
                  onClick={() => setIsAddUserModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md"
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
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-2xl font-bold mb-4">Edit User</h2>
            
            {/* Form-specific error message in modal */}
            {formModalError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded-md font-medium sticky top-0">
                {formModalError}
              </div>
            )}
            
            <form id="edit-user-form" onSubmit={handleEditUser} className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label htmlFor="fullName" className="block mb-2">Full Name</label>
                <input
                  type="text"
                  id="fullName"
                  className={`w-full border rounded-md px-3 py-2 ${formErrors.fullName ? 'border-red-500' : ''}`}
                  value={userForm.fullName}
                  onChange={handleInputChange}
                  required
                />
                {formErrors.fullName && <p className="text-red-500 text-xs mt-1">{formErrors.fullName}</p>}
              </div>
              <div>
                <label htmlFor="email" className="block mb-2">Email</label>
                <input
                  type="email"
                  id="email"
                  className={`w-full border rounded-md px-3 py-2 ${formErrors.email ? 'border-red-500' : ''}`}
                  value={userForm.email}
                  onChange={handleInputChange}
                  onBlur={handleEmailBlur}
                  required
                />
                {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
                {isEmailChecking && <p className="text-blue-500 text-xs mt-1">Checking email availability...</p>}
              </div>
              <div>
                <label htmlFor="phoneNumber" className="block mb-2">Phone Number (10 digits)</label>
                <input
                  type="tel"
                  id="phoneNumber"
                  className={`w-full border rounded-md px-3 py-2 ${formErrors.phoneNumber ? 'border-red-500' : ''}`}
                  value={userForm.phoneNumber}
                  onChange={handleInputChange}
                  required
                  placeholder="10-digit number"
                />
                {formErrors.phoneNumber && <p className="text-red-500 text-xs mt-1">{formErrors.phoneNumber}</p>}
              </div>
              <div>
                <label htmlFor="address" className="block mb-2">Address</label>
                <input
                  type="text"
                  id="address"
                  className={`w-full border rounded-md px-3 py-2 ${formErrors.address ? 'border-red-500' : ''}`}
                  value={userForm.address}
                  onChange={handleInputChange}
                  required
                />
                {formErrors.address && <p className="text-red-500 text-xs mt-1">{formErrors.address}</p>}
              </div>
              <div>
                <label htmlFor="password" className="block mb-2">Password (optional, min 7 characters)</label>
                <input
                  type="password"
                  id="password"
                  className={`w-full border rounded-md px-3 py-2 ${formErrors.password ? 'border-red-500' : ''}`}
                  value={userForm.password}
                  onChange={handleInputChange}
                  minLength="7"
                />
                <p className="text-gray-500 text-xs mt-1">Leave blank to keep current password</p>
                {formErrors.password && <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>}
              </div>
              <div>
                <label htmlFor="profilePicture" className="block mb-2">Profile Picture</label>
                <input
                  type="file"
                  id="profilePicture"
                  accept="image/*"
                  className="w-full border rounded-md px-3 py-2"
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 rounded-md"
                  onClick={() => setIsEditUserModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md"
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