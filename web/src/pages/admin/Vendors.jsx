import { useState, useEffect } from 'react';
import { Edit, Trash2, Search, PlusCircle } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

const Vendors = () => {
  // State Management
  const [vendors, setVendors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddVendorModalOpen, setIsAddVendorModalOpen] = useState(false);
  const [isEditVendorModalOpen, setIsEditVendorModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [imagePreview, setImagePreview] = useState(null); // New state for image preview
  const [isActive, setIsActive] = useState('active');
  const [message, setMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const { toast } = useToast();
  
  // Form validation states
  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    password: '',
    phoneNumber: '',
    address: '',
    profilePicture: ''
  });

  // Helper function for date formatting
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
      fullName: '',
      email: '',
      password: '',
      phoneNumber: '',
      address: '',
      profilePicture: ''
    };

    // Full name validation
    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
      isValid = false;
    } else if (fullName.length < 3) {
      newErrors.fullName = 'Full name must be at least 3 characters';
      isValid = false;
    }

    // Email validation
    if (!email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    // Password validation (only for adding new vendors)
    if (!isEditVendorModalOpen) {
      if (!password) {
        newErrors.password = 'Password is required';
        isValid = false;
      } else if (password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
        isValid = false;
      }
    } else if (password && password.length > 0 && password.length < 8) {
      // For edit mode, only validate if password is provided
      newErrors.password = 'Password must be at least 8 characters';
      isValid = false;
    }

    // Phone number validation
    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
      isValid = false;
    } else if (!/^\d{10,15}$/.test(phoneNumber.replace(/\D/g, ''))) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
      isValid = false;
    }

    // Address validation
    if (!address.trim()) {
      newErrors.address = 'Address is required';
      isValid = false;
    }

    // Profile picture validation for new vendors
    if (!isEditVendorModalOpen && !profilePicture) {
      newErrors.profilePicture = 'Profile picture is required for new vendors';
      isValid = false;
    } else if (profilePicture && selectedImage) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(selectedImage.type)) {
        newErrors.profilePicture = 'Only JPG, PNG, GIF, and WEBP formats are supported';
        isValid = false;
      } else if (selectedImage.size > 5 * 1024 * 1024) { // 5MB max size
        newErrors.profilePicture = 'Image size must be less than 5MB';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  // Fetch vendors from backend
  const fetchVendors = async () => {
    setIsLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await api.get('/vendors/getAllVendors', {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response && response.data) {
        setVendors(response.data);
      } else {
        throw new Error("No data received from the server.");
      }
    } catch (error) {
      let errorMsg = "Failed to fetch vendors";

      if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
        errorMsg = "Request timed out while loading vendors. Please refresh the page.";
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.message) {
        errorMsg = error.message;
      }

      setMessage({
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
    fetchVendors();
  }, []);

  // Create image preview when file is selected
  const handleImageChange = (file) => {
    if (file) {
      // Validate file
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      
      if (!allowedTypes.includes(file.type)) {
        setErrors({ ...errors, profilePicture: 'Only JPG, PNG, GIF, and WEBP formats are supported' });
      } else if (file.size > 5 * 1024 * 1024) { // 5MB max size
        setErrors({ ...errors, profilePicture: 'Image size must be less than 5MB' });
      } else {
        setErrors({ ...errors, profilePicture: '' }); // Clear any previous error
        
        // Create and set image preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
        
        setProfilePicture(file);
        setSelectedImage(file);
      }
    }
  };

  // Reset form and errors
  const resetForm = () => {
    setFullName('');
    setEmail('');
    setPassword('');
    setPhoneNumber('');
    setAddress('');
    setProfilePicture(null);
    setSelectedImage(null);
    setImagePreview(null); // Clear image preview
    setIsActive('active');
    setErrors({
      fullName: '',
      email: '',
      password: '',
      phoneNumber: '',
      address: '',
      profilePicture: ''
    });
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsAddVendorModalOpen(true);
  };

  const handleEdit = (vendor) => {
    resetForm();
    setSelectedVendor(vendor);
    setFullName(vendor.full_name);
    setEmail(vendor.email);
    setPassword(''); // Don't populate password for security
    setPhoneNumber(vendor.phone_number);
    setAddress(vendor.address);
    setProfilePicture(vendor.profile_picture);
    setImagePreview(vendor.profile_picture); // Set initial preview from existing image
    setIsActive(vendor.is_active);
    setIsEditVendorModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this vendor?")) {
      try {
        const response = await api.delete(`/vendors/delete-vendor/${id}`);
        if (response.status === 200) {
          fetchVendors();
          toast({
            title: "Success",
            description: `Vendor has been deleted successfully`,
            variant: "success",
            className: "bg-green-500 text-white font-medium border-l-4 border-green-700"
          });
        }
      } catch (error) {
        console.error("Error deleting vendor:", error);
        const errorMsg = error.response?.data?.message || "Error deleting vendor";
        setMessage({
          type: 'error',
          text: errorMsg
        });
        
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive",
          className: "bg-red-500 text-white font-medium border-l-4 border-red-700"
        });
      }
    }
  };

  const handleAddVendor = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      if (profilePicture && selectedImage instanceof File) {
        const reader = new FileReader();
        reader.readAsDataURL(selectedImage);
        reader.onload = async () => {
          const base64Image = reader.result;
          const newVendor = {
            full_name: fullName,
            email,
            password,
            phone_number: phoneNumber,
            address,
            profile_picture: base64Image,
            role: 'vendor',
            is_active: isActive
          };

          const response = await api.post('/vendors/add-vendor', newVendor);

          if (response.status === 201) {
            fetchVendors();
            setIsAddVendorModalOpen(false);
            resetForm();
            toast({
              title: "Success",
              description: `Vendor ${newVendor.full_name} has been added successfully`,
              variant: "success",
              className: "bg-green-500 text-white font-medium border-l-4 border-green-700"
            });
          }
        };
      }
    } catch (error) {
      console.error("Error adding vendor:", error);
      const errorMsg = error.response?.data?.message || "Error adding vendor";
      setMessage({
        type: 'error',
        text: errorMsg,
      });
      
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
        className: "bg-red-500 text-white font-medium border-l-4 border-red-700"
      });
    }
  };

  const handleEditVendor = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      let updatedVendor = {
        full_name: fullName,
        email,
        phone_number: phoneNumber,
        address,
        role: 'vendor',
        is_active: isActive
      };

      // Only include password if it was changed
      if (password) {
        updatedVendor.password = password;
      }

      // If a new image was selected, convert to base64
      if (selectedImage && selectedImage instanceof File) {
        const readImageAsBase64 = () => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(selectedImage);
          });
        };

        try {
          // Convert image to base64
          const base64Image = await readImageAsBase64();
          updatedVendor.profile_picture = base64Image;
        } catch (error) {
          console.error("Error converting image to base64:", error);
          throw new Error("Failed to process the image");
        }
      } else if (imagePreview && typeof imagePreview === 'string' && imagePreview.startsWith('data:image')) {
        // If we already have a base64 image in the preview (e.g., from a previous edit)
        updatedVendor.profile_picture = imagePreview;
      } else if (profilePicture && typeof profilePicture === 'string') {
        // Use existing profile picture if it's already in base64 format
        if (profilePicture.startsWith('data:image')) {
          updatedVendor.profile_picture = profilePicture;
        } else {
          // If it's a URL/path, we need to keep the existing one
          updatedVendor.profile_picture = profilePicture;
        }
      }

      const response = await api.put(`/vendors/update-vendor/${selectedVendor.id}`, updatedVendor);
        
      if (response.status === 200) {
        fetchVendors();
        setIsEditVendorModalOpen(false);
        resetForm();
        toast({
          title: "Success",
          description: `Vendor ${updatedVendor.full_name} has been updated successfully`,
          variant: "success",
          className: "bg-green-500 text-white font-medium border-l-4 border-green-700"
        });
      }
    } catch (error) {
      console.error("Error editing vendor:", error);
      const errorMsg = error.response?.data?.message || "Error updating vendor";
      setMessage({
        type: 'error',
        text: errorMsg
      });
      
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
        className: "bg-red-500 text-white font-medium border-l-4 border-red-700"
      });
    }
  };

  // Close modals and reset form
  const handleCloseModal = () => {
    setIsAddVendorModalOpen(false);
    setIsEditVendorModalOpen(false);
    resetForm();
  };

  // Filter vendors based on search term
  const filteredVendors = vendors.filter((vendor) =>
    vendor.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.phone_number.includes(searchTerm)
  );

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header with search bar and Add Vendor button */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-semibold">Vendors Management</h1>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 items-center w-full md:w-auto">
          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              className="pl-10 pr-4 py-2 w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Search vendors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>

          {/* Add New Vendor Button */}
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors duration-200 flex items-center w-full sm:w-auto justify-center"
            onClick={handleOpenAddModal}
          >
            <PlusCircle className="mr-2 h-5 w-5" />
            Add New Vendor
          </button>
        </div>
      </div>

      {/* Vendors Table */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor Details</th>
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
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      <span className="ml-2">Loading vendors...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <svg className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <p className="text-lg font-medium">No vendors found</p>
                      <p className="text-sm mt-1">
                        {searchTerm ? "Try adjusting your search terms" : "Add a new vendor to get started"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredVendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          {vendor.profile_picture ? (
                            <img 
                              src={vendor.profile_picture.startsWith('data:image') ? vendor.profile_picture : `${vendor.profile_picture}`}
                              alt={vendor.full_name}
                              className="h-12 w-12 rounded-full object-cover border border-gray-200 shadow-sm"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-blue-500 text-lg font-semibold">
                                {vendor.full_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{vendor.full_name}</div>
                          <div className="text-sm text-gray-500">{vendor.email}</div>
                          <div className="text-sm text-gray-500">{vendor.phone_number}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-[200px] truncate" title={vendor.address}>
                        {vendor.address}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        vendor.is_active === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {vendor.is_active === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {vendor.created_at ? formatDate(vendor.created_at) : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button 
                          className="text-blue-500 hover:text-blue-700 transition-colors duration-150"
                          onClick={() => handleEdit(vendor)}
                          title="Edit Vendor"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button 
                          className="text-red-500 hover:text-red-700 transition-colors duration-150"
                          onClick={() => handleDelete(vendor.id)}
                          title="Delete Vendor"
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

      {/* Add/Edit Vendor Modal */}
      {(isAddVendorModalOpen || isEditVendorModalOpen) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              {isEditVendorModalOpen ? (
                <>
                  <Edit className="h-5 w-5 mr-2 text-blue-500" />
                  Edit Vendor: {selectedVendor?.full_name}
                </>
              ) : (
                <>
                  <PlusCircle className="h-5 w-5 mr-2 text-blue-500" />
                  Add New Vendor
                </>
              )}
            </h2>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
              {isEditVendorModalOpen && (
                <div className="space-y-2 text-center mb-4">
                  <Label htmlFor="profile_picture" className="text-sm font-medium text-gray-700">Profile Picture</Label>
                  <div className="relative w-24 h-24 mx-auto">
                    <img
                      src={imagePreview || profilePicture}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover border border-gray-200 shadow-sm"
                    />
                    <label htmlFor="profilePictureInput" className="cursor-pointer">
                      <div className="absolute bottom-1 right-1 bg-gray-800 text-white p-1 rounded-full cursor-pointer hover:bg-gray-700 transition-colors duration-150">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13.5V17h3.5l7.5-7.5a2.121 2.121 0 000-3l-3-3a2.121 2.121 0 00-3 0L9 10.5z" />
                        </svg>
                      </div>
                    </label>
                    <input
                      type="file"
                      id="profilePictureInput"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          handleImageChange(file);
                        }
                      }}
                    />
                  </div>
                  {errors.profilePicture && <p className="mt-1 text-xs text-red-500">{errors.profilePicture}</p>}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name*</label>
                <input
                  type="text"
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${errors.fullName ? 'border-red-500' : 'border-gray-300'}`}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onBlur={() => {
                    if (!fullName.trim()) {
                      setErrors({ ...errors, fullName: 'Full name is required' });
                    } else if (fullName.length < 3) {
                      setErrors({ ...errors, fullName: 'Full name must be at least 3 characters' });
                    } else {
                      setErrors({ ...errors, fullName: '' });
                    }
                  }}
                  placeholder="Enter full name"
                />
                {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email*</label>
                <input
                  type="email"
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => {
                    if (!email.trim()) {
                      setErrors({ ...errors, email: 'Email is required' });
                    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
                      setErrors({ ...errors, email: 'Please enter a valid email address' });
                    } else {
                      setErrors({ ...errors, email: '' });
                    }
                  }}
                  placeholder="Enter email address"
                />
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password{!isEditVendorModalOpen && '*'}
                  {isEditVendorModalOpen && ' (Leave blank to keep current password)'}
                </label>
                <input
                  type="password"
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => {
                    if (!isEditVendorModalOpen && !password) {
                      setErrors({ ...errors, password: 'Password is required' });
                    } else if (password && password.length < 8) {
                      setErrors({ ...errors, password: 'Password must be at least 8 characters' });
                    } else {
                      setErrors({ ...errors, password: '' });
                    }
                  }}
                  placeholder={isEditVendorModalOpen ? "Enter new password (optional)" : "Enter password"}
                />
                {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number*</label>
                <input
                  type="tel"
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'}`}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  onBlur={() => {
                    if (!phoneNumber.trim()) {
                      setErrors({ ...errors, phoneNumber: 'Phone number is required' });
                    } else if (!/^\d{10,15}$/.test(phoneNumber.replace(/\D/g, ''))) {
                      setErrors({ ...errors, phoneNumber: 'Please enter a valid phone number' });
                    } else {
                      setErrors({ ...errors, phoneNumber: '' });
                    }
                  }}
                  placeholder="Enter phone number"
                />
                {errors.phoneNumber && <p className="mt-1 text-xs text-red-500">{errors.phoneNumber}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address*</label>
                <textarea
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
                  rows="3"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onBlur={() => {
                    if (!address.trim()) {
                      setErrors({ ...errors, address: 'Address is required' });
                    } else {
                      setErrors({ ...errors, address: '' });
                    }
                  }}
                  placeholder="Enter address"
                />
                {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address}</p>}
              </div>

              {!isEditVendorModalOpen && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture*</label>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <input
                        type="file"
                        id="profilePicture"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            handleImageChange(file);
                          }
                        }}
                      />
                      <label
                        htmlFor="profilePicture"
                        className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Choose File
                      </label>
                    </div>
                    {imagePreview && (
                      <div className="h-16 w-16 relative">
                        <img
                          src={imagePreview}
                          alt="Profile preview"
                          className="h-16 w-16 object-cover rounded-md"
                        />
                      </div>
                    )}
                    {selectedImage && (
                      <span className="text-sm text-gray-500">
                        {selectedImage.name}
                      </span>
                    )}
                  </div>
                  {errors.profilePicture && <p className="mt-1 text-xs text-red-500">{errors.profilePicture}</p>}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio h-4 w-4 text-blue-600"
                      checked={isActive === 'active'}
                      onChange={() => setIsActive('active')}
                    />
                    <span className="ml-2 text-sm text-gray-700">Active</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio h-4 w-4 text-blue-600"
                      checked={isActive === 'inactive'}
                      onChange={() => setIsActive('inactive')}
                    />
                    <span className="ml-2 text-sm text-gray-700">Inactive</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                  onClick={handleCloseModal}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                  onClick={isEditVendorModalOpen ? handleEditVendor : handleAddVendor}
                >
                  {isEditVendorModalOpen ? 'Update Vendor' : 'Add Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vendors;