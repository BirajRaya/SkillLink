import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Edit, 
  Trash2, 
  Search, 
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  User as UserIcon,
  X,
  Camera,
  Mail,
  Phone,
  Calendar,
  RefreshCcw
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
  const [loadedImages, setLoadedImages] = useState({});
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

  // Function to load individual profile pictures
  const loadProfilePicture = async (userId) => {
    if (loadedImages[userId]) return; // Already loaded or loading
    
    try {
      // Mark as loading to prevent duplicate requests
      setLoadedImages(prev => ({
        ...prev,
        [userId]: 'loading'
      }));
      
      const response = await api.get(`/admin/users/${userId}/profile-picture`);
      if (response.data && response.data.profilePicture) {
        setLoadedImages(prev => ({
          ...prev,
          [userId]: response.data.profilePicture
        }));
      } else {
        // No picture found
        setLoadedImages(prev => ({
          ...prev,
          [userId]: null
        }));
      }
    } catch (error) {
      console.error(`Failed to load profile picture for user ${userId}:`, error);
      // Mark as failed so we don't try again
      setLoadedImages(prev => ({
        ...prev,
        [userId]: null
      }));
    }
  };

  // Image compression function
  const compressImage = (originalImage, maxWidth = 200, quality = 0.4) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = originalImage;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw image on canvas with new dimensions
        ctx.drawImage(img, 0, 0, width, height);
        
        // Get compressed image as base64 string
        const compressedImage = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedImage);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
    });
  };

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
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInputValue);
    }, 500);
    
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
      toast({
        variant: "destructive",
        title: "Error loading users",
        description: "There was a problem loading the user list. Please refresh the page."
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

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

  // Enhanced useEffect for better image loading
  useEffect(() => {
    // Check if we need to load profile images for visible users
    paginatedUsers.forEach(user => {
      if (user.profile_picture === 'has-image' && !loadedImages[user.id]) {
        loadProfilePicture(user.id);
      }
    });
  }, [paginatedUsers, loadedImages]);

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
      
      // Validate file type and size
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setFormErrors(prev => ({
          ...prev,
          profilePicture: 'Only JPG, PNG, GIF, and WEBP formats are supported'
        }));
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB max size
        setFormErrors(prev => ({
          ...prev,
          profilePicture: 'Image size must be less than 5MB'
        }));
        return;
      }
      
      // Read file as base64
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        try {
          // Compress the image before storing
          const compressedImage = await compressImage(reader.result);
          
          setUserForm(prev => ({
            ...prev,
            profilePicture: compressedImage
          }));
          
          setFormErrors(prev => ({
            ...prev,
            profilePicture: ''
          }));
        } catch (error) {
          console.error("Image compression error:", error);
          // Fallback to original image if compression fails
          setUserForm(prev => ({
            ...prev,
            profilePicture: reader.result
          }));
        }
      };
      
      reader.onerror = () => {
        setFormErrors(prev => ({
          ...prev,
          profilePicture: 'Error reading the image file'
        }));
      };
      
      reader.readAsDataURL(file);
      return;
    }

    // Handle regular input fields
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

  // Add user
  const handleAddUser = async (e) => {
    e.preventDefault();
    
    // Final check to validate any unfilled fields
    const formFields = ['fullName', 'email', 'phoneNumber', 'address', 'password'];
    let hasErrors = false;
    
    if (!userForm.profilePicture) {
      setFormErrors(prev => ({...prev, profilePicture: 'Profile picture is required'}));
      hasErrors = true;
    }
    
    formFields.forEach(field => {
      if (!userForm[field]) {
        setFormErrors(prev => ({...prev, [field]: `${field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')} is required`}));
        hasErrors = true;
      }
    });
    
    if (hasErrors) return;
    
    setIsSubmitting(true);

    try {
      // Step 1: Create user with basic information first
      const basicUserData = {
        fullName: userForm.fullName,
        email: userForm.email.trim().toLowerCase(),
        phoneNumber: userForm.phoneNumber,
        address: userForm.address,
        password: userForm.password,
        isActive: userForm.isActive
      };

      // Create user without profile picture first
      const response = await api.post('/admin/users', basicUserData);
      const newUserId = response.data.user.id;
      
      // Step 2: If there's a profile picture, handle it separately
      if (userForm.profilePicture && typeof userForm.profilePicture === 'string' && 
          userForm.profilePicture.startsWith('data:')) {
        try {
          // Convert base64 to blob
          const base64Response = await fetch(userForm.profilePicture);
          const blob = await base64Response.blob();
          
          // Create form data
          const formData = new FormData();
          formData.append('profilePicture', blob, 'profile.jpg');
          
          // Send the profile picture update
          await api.post(`/admin/users/${newUserId}/profile-picture`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          
          // Update loaded images cache
          setLoadedImages(prev => ({
            ...prev,
            [newUserId]: userForm.profilePicture
          }));
          
        } catch (pictureError) {
          console.error("Failed to upload profile picture for new user:", pictureError);
          toast({
            variant: "warning",
            title: "Partial Success",
            description: "User created but profile picture could not be uploaded."
          });
        }
      }
      
      fetchUsers();
      setIsAddUserModalOpen(false);
      clearForm();

      toast({
        title: "Success",
        description: `User ${response.data.user.full_name} has been created successfully`
      });
    } catch (error) {
      setFormModalError(error.response?.data?.message || "Failed to add user");
     
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit User with Split Profile Picture Update
  const handleEditUser = async (e) => {
    e.preventDefault();
    
    // Final check to validate any unfilled fields
    const formFields = ['fullName', 'email', 'phoneNumber', 'address'];
    let hasErrors = false;
    
    formFields.forEach(field => {
      if (!userForm[field]) {
        setFormErrors(prev => ({...prev, [field]: `${field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')} is required`}));
        hasErrors = true;
      }
    });
    
    if (userForm.password && userForm.password.length < 7) {
      setFormErrors(prev => ({...prev, password: 'Password must be at least 7 characters'}));
      hasErrors = true;
    }
    
    if (hasErrors) return;
    
    setIsSubmitting(true);

    try {
      // Step 1: Update basic user information first
      const basicUserData = {
        fullName: userForm.fullName,
        email: userForm.email.trim().toLowerCase(),
        phoneNumber: userForm.phoneNumber,
        address: userForm.address,
        isActive: userForm.isActive
      };
      
      if (userForm.password) {
        basicUserData.password = userForm.password;
      }
      
      // Update basic user info
      const response = await api.put(`/admin/users/${selectedUser.id}`, basicUserData);
      
      // Step 2: If there's a new profile picture, handle it separately
      const hasNewProfilePicture = userForm.profilePicture && 
                                typeof userForm.profilePicture === 'string' && 
                                userForm.profilePicture.startsWith('data:');
      
      if (hasNewProfilePicture) {
        try {
          // Convert base64 to blob
          const base64Response = await fetch(userForm.profilePicture);
          const blob = await base64Response.blob();
          
          // Create form data
          const formData = new FormData();
          formData.append('profilePicture', blob, 'profile.jpg');
          
          // Send the profile picture update
          await api.post(`/admin/users/${selectedUser.id}/profile-picture`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          
          // Update loaded images cache
          setLoadedImages(prev => ({
            ...prev,
            [selectedUser.id]: userForm.profilePicture
          }));
          
        } catch (pictureError) {
          console.error("Failed to update profile picture:", pictureError);
          toast({
            variant: "warning",
            title: "Partial Update",
            description: "User information updated but profile picture could not be saved."
          });
        }
      }
      
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
  const prepareEditUser = async (user) => {
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

  return (
    <div className="container px-3 sm:px-4 py-6 sm:py-8 mx-auto max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <UserIcon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">User Management</h1>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 items-center w-full sm:w-auto">
          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              className="pl-10 pr-4 py-2.5 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm"
              placeholder="Search users"
              value={searchInputValue}
              onChange={(e) => setSearchInputValue(e.target.value)}
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            {/* Add New User Button */}
            <button 
              className="bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center w-full sm:w-auto justify-center shadow-sm font-medium"
              onClick={() => setIsAddUserModalOpen(true)}
            >
              <PlusCircle className="mr-2 h-5 w-5" />
              <span>Add New User</span>
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User Details</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Address</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created At</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="text-center py-12">
                    <div className="flex flex-col justify-center items-center space-y-3">
                      <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                      <span className="text-gray-600 font-medium">Loading users data...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <UserIcon className="h-12 w-12 text-gray-300" />
                      <p className="text-gray-500 font-medium">No users found</p>
                      <p className="text-gray-400 text-sm">Try adjusting your search criteria or add new users</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user, index) => (
                  <tr 
                    key={user.id} 
                    className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                  >
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12">
                          {user.profile_picture === 'has-image' ? (
                            loadedImages[user.id] && loadedImages[user.id] !== 'loading' ? (
                              <img 
                                src={loadedImages[user.id]}
                                alt={user.full_name}
                                className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                                loading="lazy"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48' fill='%23e2e8f0'%3E%3Crect width='48' height='48' rx='24' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' font-size='20' font-family='Arial' fill='%23718096' text-anchor='middle' dominant-baseline='middle'%3E${user.full_name.charAt(0).toUpperCase()}%3C/text%3E%3C/svg%3E`;
                                }}
                              />
                            ) : (
                              <div 
                                className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-blue-50 border-2 border-blue-100 flex items-center justify-center cursor-pointer shadow-sm"
                                onClick={() => loadProfilePicture(user.id)}
                              >
                                {loadedImages[user.id] === 'loading' ? (
                                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-blue-500" />
                                ) : (
                                  <span className="text-blue-600 text-base sm:text-lg font-medium">
                                    {user.full_name.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                            )
                          ) : (
                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm">
                              <span className="text-gray-600 text-base sm:text-lg font-medium">
                                {user.full_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-3 sm:ml-4">
                          <div className="text-xs sm:text-sm font-medium text-gray-900">{user.full_name}</div>
                          <div className="text-xs text-gray-500 flex items-center mt-0.5 sm:mt-1">
                            <Mail className="h-3 w-3 mr-1 inline" />
                            <span className="truncate max-w-[120px] sm:max-w-[160px] inline-block">
                              {user.email}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 flex items-center mt-0.5">
                            <Phone className="h-3 w-3 mr-1 inline" />
                            {user.phone_number}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="text-xs sm:text-sm text-gray-700 max-w-[100px] sm:max-w-[200px] truncate" title={user.address}>
                        {user.address}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <span className={`px-2 py-1 sm:px-3 sm:py-1 inline-flex text-xs leading-5 font-medium rounded-full ${
                        user.is_active === 'active' 
                          ? 'bg-green-100 text-green-800 border border-green-200' 
                          : 'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        {user.is_active === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center text-xs sm:text-sm text-gray-500">
                        <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5 text-gray-400" />
                        {formatDate(user.created_at)}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="flex space-x-2 sm:space-x-3">
                        <button 
                          className="text-blue-600 hover:text-blue-800 transition-colors duration-150 p-1 sm:p-1.5 rounded-full hover:bg-blue-50"
                          onClick={() => prepareEditUser(user)}
                          title="Edit User"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          className="text-red-500 hover:text-red-700 transition-colors duration-150 p-1 sm:p-1.5 rounded-full hover:bg-red-50"
                          onClick={() => handleDeleteUser(user)}
                          title="Delete User"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination - Responsive Design */}
        {!isLoading && filteredUsers.length > 0 && (
          <div className="px-3 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between border-t border-gray-200 bg-gray-50 gap-3">
            <div className="text-xs sm:text-sm text-gray-500 flex items-center">
              <span className="hidden sm:inline">Showing</span>
              <span className="font-medium text-gray-700 mx-1">
                {(page - 1) * limit + 1}-{Math.min(page * limit, filteredUsers.length)}
              </span>
              <span className="hidden sm:inline">of</span>
              <span className="font-medium text-gray-700 ml-1">{filteredUsers.length}</span>
              <span className="hidden sm:inline ml-1">users</span>
            </div>
            
            <div className="flex gap-1 sm:gap-2">
              {/* Previous Button */}
              <button
                onClick={prevPage}
                disabled={page === 1}
                className={`relative inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-md border text-xs sm:text-sm font-medium ${
                  page === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" />
                <span className="hidden xs:inline">Previous</span>
              </button>
              
              {/* Simplified pagination for mobile */}
              <div className="flex items-center">
                <span className="px-3 py-1 text-xs sm:text-sm">
                  Page {page} of {totalPages}
                </span>
              </div>
              
              {/* Next Button */}
              <button
                onClick={nextPage}
                disabled={page >= totalPages}
                className={`relative inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-md border text-xs sm:text-sm font-medium ${
                  page >= totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="hidden xs:inline">Next</span>
                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-0.5 sm:ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal - Made Responsive */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-4 sm:mb-5 pb-2 sm:pb-3 border-b">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center">
                <PlusCircle className="h-5 w-5 mr-2 text-blue-600" />
                Add New User
              </h2>
              <button
                onClick={() => {
                  setIsAddUserModalOpen(false);
                  clearForm();
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddUser} className="space-y-4 sm:space-y-5" noValidate>
              {/* Profile Picture Section */}
              <div className="text-center mb-4 sm:mb-6">
                <div className="relative inline-block">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-full overflow-hidden border-4 border-gray-200 shadow-md bg-gray-100">
                    {userForm.profilePicture ? (
                      <img
                        src={userForm.profilePicture}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='112' height='112' viewBox='0 0 112 112' fill='%23e2e8f0'%3E%3Crect width='112' height='112' rx='56' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' font-size='40' font-family='Arial' fill='%23718096' text-anchor='middle' dominant-baseline='middle'%3E${userForm.fullName.charAt(0).toUpperCase() || 'U'}%3C/text%3E%3C/svg%3E`;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <UserIcon className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  <label htmlFor="profilePicture" className="absolute bottom-0 right-1 cursor-pointer">
                    <div className="bg-blue-600 text-white p-1.5 sm:p-2 rounded-full shadow-md hover:bg-blue-700 transition-colors">
                      <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </div>
                    <input
                      type="file"
                      id="profilePicture"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="hidden"
                      onChange={handleInputChange}
                    />
                  </label>
                </div>
                {formErrors.profilePicture && (
                  <p className="mt-2 text-xs text-red-500">{formErrors.profilePicture}</p>
                )}
              </div>
              
              {formModalError && (
                <div className="p-2.5 sm:p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md">
                  <div className="flex">
                    <div className="py-0.5 sm:py-1">
                      <svg className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mr-2 sm:mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="text-xs sm:text-sm">{formModalError}</div>
                  </div>
                </div>
              )}
              
              {/* Form Fields - Now more responsive */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div className="col-span-1">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Full Name*</label>
                  <input
                    type="text"
                    id="fullName"
                    className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${formErrors.fullName ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                    value={userForm.fullName}
                    onChange={(e) => {
                      handleInputChange(e);
                      if (formErrors.fullName) setFormErrors({...formErrors, fullName: ''});
                    }}
                    onBlur={() => {
                      if (!userForm.fullName.trim()) {
                        setFormErrors(prev => ({...prev, fullName: 'Full name is required'}));
                      } else {
                        setFormErrors(prev => ({...prev, fullName: ''}));
                      }
                    }}
                    placeholder="Enter full name"
                  />
                  {formErrors.fullName && <p className="mt-1 text-xs text-red-500">{formErrors.fullName}</p>}
                </div>

                <div className="col-span-1">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Email*</label>
                  <input
                    type="email"
                    id="email"
                    className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${formErrors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                    value={userForm.email}
                    onChange={(e) => {
                      handleInputChange(e);
                      if (formErrors.email) setFormErrors({...formErrors, email: ''});
                    }}
                    onBlur={() => {
                      const email = userForm.email.trim().toLowerCase();
                      if (!email) {
                        setFormErrors(prev => ({...prev, email: 'Email is required'}));
                      } else if (!/\S+@\S+\.\S+/.test(email)) {
                        setFormErrors(prev => ({...prev, email: 'Invalid email format'}));
                      } else if (!email.endsWith("@gmail.com")) {
                        setFormErrors(prev => ({...prev, email: 'Only Gmail addresses (@gmail.com) are allowed.'}));
                      } else {
                        setFormErrors(prev => ({...prev, email: ''}));
                      }
                    }}
                    placeholder="Enter email address"
                  />
                  {formErrors.email && <p className="mt-1 text-xs text-red-500">{formErrors.email}</p>}
                </div>

                <div className="col-span-1">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Password*
                  </label>
                  <input
                    type="password"
                    id="password"
                    className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${formErrors.password ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                    value={userForm.password}
                    onChange={(e) => {
                      handleInputChange(e);
                      if (formErrors.password) setFormErrors({...formErrors, password: ''});
                    }}
                    onBlur={() => {
                      if (!userForm.password) {
                        setFormErrors(prev => ({...prev, password: 'Password is required'}));
                      } else if (userForm.password.length < 7) {
                        setFormErrors(prev => ({...prev, password: 'Password must be at least 7 characters'}));
                      } else {
                        setFormErrors(prev => ({...prev, password: ''}));
                      }
                    }}
                    placeholder="Enter password"
                  />
                  {formErrors.password && <p className="mt-1 text-xs text-red-500">{formErrors.password}</p>}
                </div>

                <div className="col-span-1">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Phone Number*</label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${formErrors.phoneNumber ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                    value={userForm.phoneNumber}
                    onChange={(e) => {
                      handleInputChange(e);
                      if (formErrors.phoneNumber) setFormErrors({...formErrors, phoneNumber: ''});
                    }}
                    onBlur={() => {
                      if (!userForm.phoneNumber.trim()) {
                        setFormErrors(prev => ({...prev, phoneNumber: 'Phone number is required'}));
                      } else if (!/^\d{10}$/.test(userForm.phoneNumber.replace(/\D/g, ''))) {
                        setFormErrors(prev => ({...prev, phoneNumber: 'Phone number must be 10 digits'}));
                      } else {
                        setFormErrors(prev => ({...prev, phoneNumber: ''}));
                      }
                    }}
                    placeholder="Enter phone number"
                  />
                  {formErrors.phoneNumber && <p className="mt-1 text-xs text-red-500">{formErrors.phoneNumber}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Address*</label>
                <textarea
                  id="address"
                  className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${formErrors.address ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  rows="2"
                  value={userForm.address}
                  onChange={(e) => {
                    handleInputChange(e);
                    if (formErrors.address) setFormErrors({...formErrors, address: ''});
                  }}
                  onBlur={() => {
                    if (!userForm.address.trim()) {
                      setFormErrors(prev => ({...prev, address: 'Address is required'}));
                    } else {
                      setFormErrors(prev => ({...prev, address: ''}));
                    }
                  }}
                  placeholder="Enter address"
                />
                {formErrors.address && <p className="mt-1 text-xs text-red-500">{formErrors.address}</p>}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Status</label>
                <div className="flex space-x-3 sm:space-x-4 mt-1">
                  <div className={`flex-1 border rounded-lg p-2.5 sm:p-3 cursor-pointer flex items-center justify-center ${userForm.isActive === 'active' ? 'bg-green-50 border-green-300 ring-2 ring-green-200' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                      onClick={() => setUserForm(prev => ({ ...prev, isActive: 'active' }))}>
                    <input
                      type="radio"
                      className="form-radio h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 mr-1.5 sm:mr-2"
                      checked={userForm.isActive === 'active'}
                      onChange={() => setUserForm(prev => ({ ...prev, isActive: 'active' }))}
                    />
                    <span className={`text-xs sm:text-sm ${userForm.isActive === 'active' ? 'text-green-800 font-medium' : 'text-gray-700'}`}>Active</span>
                  </div>
                  
                  <div className={`flex-1 border rounded-lg p-2.5 sm:p-3 cursor-pointer flex items-center justify-center ${userForm.isActive === 'inactive' ? 'bg-red-50 border-red-300 ring-2 ring-red-200' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                      onClick={() => setUserForm(prev => ({ ...prev, isActive: 'inactive' }))}>
                    <input
                      type="radio"
                      className="form-radio h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600 mr-1.5 sm:mr-2"
                      checked={userForm.isActive === 'inactive'}
                      onChange={() => setUserForm(prev => ({ ...prev, isActive: 'inactive' }))}
                    />
                    <span className={`text-xs sm:text-sm ${userForm.isActive === 'inactive' ? 'text-red-800 font-medium' : 'text-gray-700'}`}>Inactive</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 sm:pt-5 mt-1 sm:mt-2 border-t">
                <button
                  type="button"
                  className="px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 shadow-sm"
                  onClick={() => {
                    setIsAddUserModalOpen(false);
                    clearForm();
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 shadow-sm flex items-center justify-center"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin mr-1.5 sm:mr-2" />
                      Adding...
                    </>
                  ) : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal - Also Made Responsive */}
      {isEditUserModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-4 sm:mb-5 pb-2 sm:pb-3 border-b">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center">
                <Edit className="h-5 w-5 mr-2 text-blue-600" />
                <span className="truncate">Edit: {selectedUser?.full_name}</span>
              </h2>
              <button 
                onClick={() => {
                  setIsEditUserModalOpen(false);
                  setSelectedUser(null);
                  clearForm();
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditUser} className="space-y-4 sm:space-y-5" noValidate>
              {/* Profile Picture Section */}
              <div className="text-center mb-4 sm:mb-6">
                <div className="relative inline-block">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-full overflow-hidden border-4 border-gray-200 shadow-md bg-gray-100">
                    {selectedUser && loadedImages[selectedUser.id] ? (
                      <img
                        src={loadedImages[selectedUser.id]}
                        alt={selectedUser.full_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='112' height='112' viewBox='0 0 112 112' fill='%23e2e8f0'%3E%3Crect width='112' height='112' rx='56' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' font-size='40' font-family='Arial' fill='%23718096' text-anchor='middle' dominant-baseline='middle'%3E${selectedUser.full_name.charAt(0).toUpperCase()}%3C/text%3E%3C/svg%3E`;
                        }}
                      />
                    ) : userForm.profilePicture ? (
                      <img
                        src={userForm.profilePicture}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <UserIcon className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  <label htmlFor="profilePicture" className="absolute bottom-0 right-1 cursor-pointer">
                    <div className="bg-blue-600 text-white p-1.5 sm:p-2 rounded-full shadow-md hover:bg-blue-700 transition-colors">
                      <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </div>
                    <input
                      type="file"
                      id="profilePicture"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="hidden"
                      onChange={handleInputChange}
                    />
                  </label>
                </div>
                {formErrors.profilePicture && (
                  <p className="mt-2 text-xs text-red-500">{formErrors.profilePicture}</p>
                )}
              </div>
              
              {formModalError && (
                <div className="p-2.5 sm:p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md">
                  <div className="flex">
                    <div className="py-0.5 sm:py-1">
                      <svg className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mr-2 sm:mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="text-xs sm:text-sm">{formModalError}</div>
                  </div>
                </div>
              )}
              
              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div className="col-span-1">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Full Name*</label>
                  <input
                    type="text"
                    id="fullName"
                    className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${formErrors.fullName ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                    value={userForm.fullName}
                    onChange={(e) => {
                      handleInputChange(e);
                      if (formErrors.fullName) setFormErrors({...formErrors, fullName: ''});
                    }}
                    onBlur={() => {
                      if (!userForm.fullName.trim()) {
                        setFormErrors(prev => ({...prev, fullName: 'Full name is required'}));
                      } else {
                        setFormErrors(prev => ({...prev, fullName: ''}));
                      }
                    }}
                    placeholder="Enter full name"
                  />
                  {formErrors.fullName && <p className="mt-1 text-xs text-red-500">{formErrors.fullName}</p>}
                </div>

                <div className="col-span-1">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Email*</label>
                  <input
                    type="email"
                    id="email"
                    className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${formErrors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                    value={userForm.email}
                    onChange={(e) => {
                      handleInputChange(e);
                      if (formErrors.email) setFormErrors({...formErrors, email: ''});
                    }}
                    onBlur={() => {
                      const email = userForm.email.trim().toLowerCase();
                      if (!email) {
                        setFormErrors(prev => ({...prev, email: 'Email is required'}));
                      } else if (!/\S+@\S+\.\S+/.test(email)) {
                        setFormErrors(prev => ({...prev, email: 'Invalid email format'}));
                      } else if (!email.endsWith("@gmail.com")) {
                        setFormErrors(prev => ({...prev, email: 'Only Gmail addresses (@gmail.com) are allowed.'}));
                      } else {
                        setFormErrors(prev => ({...prev, email: ''}));
                      }
                    }}
                    placeholder="Enter email address"
                  />
                  {formErrors.email && <p className="mt-1 text-xs text-red-500">{formErrors.email}</p>}
                </div>

                <div className="col-span-1">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Password (Leave blank to keep current)
                  </label>
                  <input
                    type="password"
                    id="password"
                    className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${formErrors.password ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                    value={userForm.password}
                    onChange={(e) => {
                      handleInputChange(e);
                      if (formErrors.password) setFormErrors({...formErrors, password: ''});
                    }}
                    onBlur={() => {
                      if (userForm.password && userForm.password.length < 7) {
                        setFormErrors(prev => ({...prev, password: 'Password must be at least 7 characters'}));
                      } else {
                        setFormErrors(prev => ({...prev, password: ''}));
                      }
                    }}
                    placeholder="Enter new password (optional)"
                  />
                  {formErrors.password && <p className="mt-1 text-xs text-red-500">{formErrors.password}</p>}
                </div>

                <div className="col-span-1">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Phone Number*</label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${formErrors.phoneNumber ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                    value={userForm.phoneNumber}
                    onChange={(e) => {
                      handleInputChange(e);
                      if (formErrors.phoneNumber) setFormErrors({...formErrors, phoneNumber: ''});
                    }}
                    onBlur={() => {
                      if (!userForm.phoneNumber.trim()) {
                        setFormErrors(prev => ({...prev, phoneNumber: 'Phone number is required'}));
                      } else if (!/^\d{10}$/.test(userForm.phoneNumber.replace(/\D/g, ''))) {
                        setFormErrors(prev => ({...prev, phoneNumber: 'Phone number must be 10 digits'}));
                      } else {
                        setFormErrors(prev => ({...prev, phoneNumber: ''}));
                      }
                    }}
                    placeholder="Enter phone number"
                  />
                  {formErrors.phoneNumber && <p className="mt-1 text-xs text-red-500">{formErrors.phoneNumber}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Address*</label>
                <textarea
                  id="address"
                  className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${formErrors.address ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  rows="2"
                  value={userForm.address}
                  onChange={(e) => {
                    handleInputChange(e);
                    if (formErrors.address) setFormErrors({...formErrors, address: ''});
                  }}
                  onBlur={() => {
                    if (!userForm.address.trim()) {
                      setFormErrors(prev => ({...prev, address: 'Address is required'}));
                    } else {
                      setFormErrors(prev => ({...prev, address: ''}));
                    }
                  }}
                  placeholder="Enter address"
                  />
                  {formErrors.address && <p className="mt-1 text-xs text-red-500">{formErrors.address}</p>}
                </div>
  
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Status</label>
                  <div className="flex space-x-3 sm:space-x-4 mt-1">
                    <div className={`flex-1 border rounded-lg p-2.5 sm:p-3 cursor-pointer flex items-center justify-center ${userForm.isActive === 'active' ? 'bg-green-50 border-green-300 ring-2 ring-green-200' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                        onClick={() => setUserForm(prev => ({ ...prev, isActive: 'active' }))}>
                      <input
                        type="radio"
                        className="form-radio h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 mr-1.5 sm:mr-2"
                        checked={userForm.isActive === 'active'}
                        onChange={() => setUserForm(prev => ({ ...prev, isActive: 'active' }))}
                      />
                      <span className={`text-xs sm:text-sm ${userForm.isActive === 'active' ? 'text-green-800 font-medium' : 'text-gray-700'}`}>Active</span>
                    </div>
                    
                    <div className={`flex-1 border rounded-lg p-2.5 sm:p-3 cursor-pointer flex items-center justify-center ${userForm.isActive === 'inactive' ? 'bg-red-50 border-red-300 ring-2 ring-red-200' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                        onClick={() => setUserForm(prev => ({ ...prev, isActive: 'inactive' }))}>
                      <input
                        type="radio"
                        className="form-radio h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600 mr-1.5 sm:mr-2"
                        checked={userForm.isActive === 'inactive'}
                        onChange={() => setUserForm(prev => ({ ...prev, isActive: 'inactive' }))}
                      />
                      <span className={`text-xs sm:text-sm ${userForm.isActive === 'inactive' ? 'text-red-800 font-medium' : 'text-gray-700'}`}>Inactive</span>
                    </div>
                  </div>
                </div>
  
                <div className="flex justify-end space-x-3 pt-4 sm:pt-5 mt-1 sm:mt-2 border-t">
                  <button
                    type="button"
                    className="px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 shadow-sm"
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
                    className="px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 shadow-sm flex items-center justify-center"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin mr-1.5 sm:mr-2" />
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