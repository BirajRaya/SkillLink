import { useState, useEffect, useMemo } from "react";
import {
  Edit,
  Trash2,
  Search,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  User,
  X,
  Camera,
  Store,
  Calendar,
  Phone,
  Mail,
  CalendarDays,
  Clock,
} from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

const Vendors = () => {
  // State Management
  const [vendors, setVendors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddVendorModalOpen, setIsAddVendorModalOpen] = useState(false);
  const [isEditVendorModalOpen, setIsEditVendorModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isActive, setIsActive] = useState("active");
  const [message, setMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [loadedImages, setLoadedImages] = useState({});
  const { toast } = useToast();

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalVendors, setTotalVendors] = useState(0);

  // Function to load individual profile pictures
  const loadProfilePicture = async (vendorId) => {
    if (loadedImages[vendorId]) return; // Already loaded or loading

    try {
      // Mark as loading to prevent duplicate requests
      setLoadedImages((prev) => ({
        ...prev,
        [vendorId]: "loading",
      }));

      const response = await api.get(`/vendors/${vendorId}/profile-picture`);
      if (response.data && response.data.profilePicture) {
        setLoadedImages((prev) => ({
          ...prev,
          [vendorId]: response.data.profilePicture,
        }));
      } else {
        // No picture found
        setLoadedImages((prev) => ({
          ...prev,
          [vendorId]: null,
        }));
      }
    } catch (error) {
      console.error(
        `Failed to load profile picture for vendor ${vendorId}:`,
        error
      );
      // Mark as failed so we don't try again
      setLoadedImages((prev) => ({
        ...prev,
        [vendorId]: null,
      }));
    }
  };

  // Form validation states
  const [errors, setErrors] = useState({
    fullName: "",
    email: "",
    password: "",
    phoneNumber: "",
    address: "",
    profilePicture: "",
  });

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
      fullName: "",
      email: "",
      password: "",
      phoneNumber: "",
      address: "",
      profilePicture: "",
    };

    // Full name validation
    if (!fullName.trim()) {
      newErrors.fullName = "Full name is required";
      isValid = false;
    } else if (fullName.length < 3) {
      newErrors.fullName = "Full name must be at least 3 characters";
      isValid = false;
    }

    // Email validation
    if (!email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
      isValid = false;
    } else if (!email.trim().toLowerCase().endsWith("@gmail.com")) {
      newErrors.email = "Only Gmail addresses (@gmail.com) are allowed";
      isValid = false;
    }

    // Password validation (only for adding new vendors)
    if (!isEditVendorModalOpen) {
      if (!password) {
        newErrors.password = "Password is required";
        isValid = false;
      } else if (password.length < 8) {
        newErrors.password = "Password must be at least 8 characters";
        isValid = false;
      }
    } else if (password && password.length > 0 && password.length < 8) {
      // For edit mode, only validate if password is provided
      newErrors.password = "Password must be at least 8 characters";
      isValid = false;
    }

    // Phone number validation
    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
      isValid = false;
    } else if (!/^\d{10,15}$/.test(phoneNumber.replace(/\D/g, ""))) {
      newErrors.phoneNumber = "Please enter a valid phone number";
      isValid = false;
    }

    // Address validation
    if (!address.trim()) {
      newErrors.address = "Address is required";
      isValid = false;
    }

    // Profile picture validation for new vendors
    if (!isEditVendorModalOpen && !profilePicture) {
      newErrors.profilePicture = "Profile picture is required for new vendors";
      isValid = false;
    } else if (profilePicture && selectedImage) {
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(selectedImage.type)) {
        newErrors.profilePicture =
          "Only JPG, PNG, GIF, and WEBP formats are supported";
        isValid = false;
      } else if (selectedImage.size > 5 * 1024 * 1024) {
        // 5MB max size
        newErrors.profilePicture = "Image size must be less than 5MB";
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  // Fetch vendors from backend
  // const fetchVendors = async () => {
  //   setIsLoading(true);
  //   try {
  //     const controller = new AbortController();
  //     const timeoutId = setTimeout(() => controller.abort(), 100000);

  //     const response = await api.get("/vendors/getAllVendors", {
  //       signal: controller.signal,
  //     });

  //     clearTimeout(timeoutId);

  //     if (response && response.data) {
  //       setVendors(response.data);
  //       setTotalVendors(response.data.length);
  //     } else {
  //       throw new Error("No data received from the server.");
  //     }
  //   } catch (error) {
  //     let errorMsg = "Failed to fetch vendors";

  //     if (error.name === "AbortError" || error.code === "ECONNABORTED") {
  //       errorMsg =
  //         "Request timed out while loading vendors. Please refresh the page.";
  //     } else if (error.response?.data?.message) {
  //       errorMsg = error.response.data.message;
  //     } else if (error.message) {
  //       errorMsg = error.message;
  //     }

  //     setMessage({
  //       type: "error",
  //       text: errorMsg,
  //     });

  //     toast({
  //       title: "Error",
  //       description: errorMsg,
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const fetchVendors = async () => {
    setIsLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 100000);
  
      const response = await api.get("/vendors/getAllVendors", {
        signal: controller.signal,
      });
  
      clearTimeout(timeoutId);
  
      if (response && response.data) {
        setVendors(response.data);
        setTotalVendors(response.data.length);
      } else {
        throw new Error("No data received from the server.");
      }
    } catch (error) {
      // Specifically handle 404 with "No vendors found"
      if (error.response && error.response.status === 404 && 
          error.response.data.message === 'No vendors found') {
        // This is not really an error, just no vendors exist
        setVendors([]);
        setTotalVendors(0);
        
        // Optional: Show an informative message
        toast({
          title: "No Vendors",
          description: "There are currently no vendors in the system.",
          variant: "default" // or use a different variant that fits your design
        });
        
        return; // Exit the catch block
      }
  
      // Handle other types of errors
      let errorMsg = "Failed to fetch vendors";
  
      if (error.name === "AbortError" || error.code === "ECONNABORTED") {
        errorMsg = "Request timed out while loading vendors. Please refresh the page.";
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.message) {
        errorMsg = error.message;
      }
  
      setMessage({
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
    fetchVendors();
  }, []);

  // Filter vendors based on search term
  const filteredVendors = vendors.filter(
    (vendor) =>
      vendor.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.phone_number.includes(searchTerm)
  );

  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.ceil(filteredVendors.length / limit);
  }, [filteredVendors, limit]);

  // Get paginated vendors
  const paginatedVendors = useMemo(() => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return filteredVendors.slice(startIndex, endIndex);
  }, [filteredVendors, page, limit]);

  // Add useEffect to load profile pictures as needed for visible vendors
  useEffect(() => {
    // Check if we need to load profile images for visible vendors
    paginatedVendors.forEach((vendor) => {
      if (vendor.profile_picture === "has-image" && !loadedImages[vendor.id]) {
        loadProfilePicture(vendor.id);
      }
    });
  }, [paginatedVendors, loadedImages]);

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

  // Create image preview when file is selected
  const handleImageChange = (file) => {
    if (file) {
      // Validate file
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];

      if (!allowedTypes.includes(file.type)) {
        setErrors({
          ...errors,
          profilePicture: "Only JPG, PNG, GIF, and WEBP formats are supported",
        });
      } else if (file.size > 5 * 1024 * 1024) {
        // 5MB max size
        setErrors({
          ...errors,
          profilePicture: "Image size must be less than 5MB",
        });
      } else {
        setErrors({ ...errors, profilePicture: "" }); // Clear any previous error

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
    setFullName("");
    setEmail("");
    setPassword("");
    setPhoneNumber("");
    setAddress("");
    setProfilePicture(null);
    setSelectedImage(null);
    setImagePreview(null); // Clear image preview
    setIsActive("active");
    setErrors({
      fullName: "",
      email: "",
      password: "",
      phoneNumber: "",
      address: "",
      profilePicture: "",
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
    setPassword(""); // Don't populate password for security
    setPhoneNumber(vendor.phone_number);
    setAddress(vendor.address);
    setProfilePicture(vendor.profile_picture);

    // If we already have this profile picture loaded in our cache, use that for the preview
    if (vendor.profile_picture === "has-image" && loadedImages[vendor.id]) {
      setImagePreview(loadedImages[vendor.id]);
    } else if (
      vendor.profile_picture &&
      typeof vendor.profile_picture === "string" &&
      vendor.profile_picture.startsWith("data:")
    ) {
      setImagePreview(vendor.profile_picture);
    } else {
      setImagePreview(null);
    }

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
          });
        }
      } catch (error) {
        console.error("Error deleting vendor:", error);
        const errorMsg =
          error.response?.data?.message || "Error deleting vendor";
        setMessage({
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

  const handleAddVendor = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      // Step 1: Create vendor with basic information only (without profile picture)
      const basicVendorData = {
        full_name: fullName,
        email,
        password,
        phone_number: phoneNumber,
        address,
        role: "vendor",
        is_active: isActive,
      };

      const response = await api.post("/vendors/add-vendor", basicVendorData);

      if (response.status === 201) {
        const newVendorId = response.data.id;

        // Step 2: Upload profile picture separately if provided
        if (selectedImage && selectedImage instanceof File) {
          try {
            // Create FormData for multipart upload
            const formData = new FormData();
            formData.append("profilePicture", selectedImage);

            // Upload profile picture in separate request
            await api.post(
              `/vendors/${newVendorId}/profile-picture`,
              formData,
              {
                headers: {
                  "Content-Type": "multipart/form-data",
                },
              }
            );

            // Update loaded images cache
            setLoadedImages((prev) => ({
              ...prev,
              [newVendorId]: imagePreview,
            }));
          } catch (pictureError) {
            console.error(
              "Failed to upload vendor profile picture:",
              pictureError
            );
            toast({
              title: "Partial Success",
              description:
                "Vendor was created but the profile picture couldn't be uploaded.",
              variant: "warning",
            });
          }
        }

        // Refresh vendor list and clean up
        fetchVendors();
        setIsAddVendorModalOpen(false);
        resetForm();

        toast({
          title: "Success",
          description: `Vendor ${basicVendorData.full_name} has been added successfully`,
          variant: "success",
        });
      }
    } catch (error) {
      console.error("Error adding vendor:", error);

      // Check if the email already exists by comparing with existing vendors
      const emailAlreadyExists = vendors.some(
        (vendor) => vendor.email.toLowerCase() === email.toLowerCase()
      );

      if (emailAlreadyExists) {
        // Show error in the form for duplicate email
        setErrors((prev) => ({
          ...prev,
          email: "This email address is already registered in the system.",
        }));

        // Don't show toast for duplicate email errors
        return;
      }

      // For all other errors, show a toast notification
      const errorMsg =
        error.response?.data?.message || error.message || "Error adding vendor";
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    }
  };

  const handleEditVendor = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      // Step 1: Update basic vendor information
      const basicVendorData = {
        full_name: fullName,
        email,
        phone_number: phoneNumber,
        address,
        role: "vendor",
        is_active: isActive,
      };

      // Only include password if it was changed
      if (password) {
        basicVendorData.password = password;
      }

      // Update basic information first
      const response = await api.put(
        `/vendors/update-vendor/${selectedVendor.id}`,
        basicVendorData
      );

      if (response.status === 200) {
        // Step 2: Upload new profile picture separately if provided
        if (selectedImage && selectedImage instanceof File) {
          try {
            // Create FormData for multipart upload
            const formData = new FormData();
            formData.append("profilePicture", selectedImage);

            // Upload profile picture in separate request
            await api.post(
              `/vendors/${selectedVendor.id}/profile-picture`,
              formData,
              {
                headers: {
                  "Content-Type": "multipart/form-data",
                },
              }
            );

            // Update loaded images cache
            setLoadedImages((prev) => ({
              ...prev,
              [selectedVendor.id]: imagePreview,
            }));
          } catch (pictureError) {
            console.error(
              "Failed to upload vendor profile picture:",
              pictureError
            );
            toast({
              title: "Partial Update",
              description:
                "Vendor information was updated but the profile picture couldn't be saved.",
              variant: "warning",
            });
          }
        }

        // Refresh vendor list and clean up
        fetchVendors();
        setIsEditVendorModalOpen(false);
        resetForm();

        toast({
          title: "Success",
          description: `Vendor ${basicVendorData.full_name} has been updated successfully`,
          variant: "success",
        });
      }
    } catch (error) {
      console.error("Error editing vendor:", error);

      // Check if the email already exists in another vendor record
      const emailAlreadyExists = vendors.some(
        (vendor) =>
          vendor.email.toLowerCase() === email.toLowerCase() &&
          vendor.id !== selectedVendor.id
      );

      if (emailAlreadyExists) {
        // Show error in the form for duplicate email
        setErrors((prev) => ({
          ...prev,
          email: "This email address is already registered in the system.",
        }));

        // Don't show toast for duplicate email errors
        return;
      }

      // For all other errors, show a toast notification
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Error updating vendor";
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    }
  };

  // Close modals and reset form
  const handleCloseModal = () => {
    setIsAddVendorModalOpen(false);
    setIsEditVendorModalOpen(false);
    resetForm();
  };

  return (
    <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
      {/* Header with search bar and Add Vendor button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <Store className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Vendor Management
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 items-center w-full sm:w-auto">
          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              className="pl-10 pr-4 py-2.5 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm"
              placeholder="Search vendors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Add New Vendor Button */}
          <button
            className="bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center w-full sm:w-auto justify-center shadow-sm font-medium"
            onClick={handleOpenAddModal}
          >
            <PlusCircle className="mr-2 h-5 w-5" />
            <span>Add New Vendor</span>
          </button>
        </div>
      </div>

      {/* Vendors Table */}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Vendor Details
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Created At
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="text-center py-12">
                    <div className="flex flex-col justify-center items-center space-y-3">
                      <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                      <span className="text-gray-600 font-medium">
                        Loading vendors data...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Store className="h-12 w-12 text-gray-300" />
                      <p className="text-gray-500 font-medium">
                        No vendors found
                      </p>
                      <p className="text-gray-400 text-sm">
                        Try adjusting your search criteria or add new vendors
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedVendors.map((vendor, index) => (
                  <tr
                    key={vendor.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                    }`}
                  >
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12">
                          {vendor.profile_picture === "has-image" ? (
                            loadedImages[vendor.id] &&
                            loadedImages[vendor.id] !== "loading" ? (
                              <img
                                src={loadedImages[vendor.id]}
                                alt={vendor.full_name}
                                className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                                loading="lazy"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48' fill='%23e2e8f0'%3E%3Crect width='48' height='48' rx='24' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' font-size='20' font-family='Arial' fill='%23718096' text-anchor='middle' dominant-baseline='middle'%3E${vendor.full_name
                                    .charAt(0)
                                    .toUpperCase()}%3C/text%3E%3C/svg%3E`;
                                }}
                              />
                            ) : (
                              <div
                                className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-blue-50 border-2 border-blue-100 flex items-center justify-center cursor-pointer shadow-sm"
                                onClick={() => loadProfilePicture(vendor.id)}
                              >
                                {loadedImages[vendor.id] === "loading" ? (
                                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-blue-500" />
                                ) : (
                                  <span className="text-blue-600 text-base sm:text-lg font-medium">
                                    {vendor.full_name.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                            )
                          ) : (
                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center shadow-sm">
                              <span className="text-gray-600 text-base sm:text-lg font-medium">
                                {vendor.full_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-3 sm:ml-4">
                          <div className="text-xs sm:text-sm font-medium text-gray-900 flex items-center">
                            {vendor.full_name}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center mt-0.5 sm:mt-1">
                            <Mail className="h-3 w-3 mr-1 inline" />
                            <span className="truncate max-w-[120px] sm:max-w-[160px] inline-block">
                              {vendor.email}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 flex items-center mt-0.5">
                            <Phone className="h-3 w-3 mr-1 inline" />
                            {vendor.phone_number}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div
                        className="text-xs sm:text-sm text-gray-700 max-w-[100px] sm:max-w-[200px] truncate"
                        title={vendor.address}
                      >
                        {vendor.address}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <span
                        className={`px-2 py-1 sm:px-3 sm:py-1 inline-flex text-xs leading-5 font-medium rounded-full ${
                          vendor.is_active === "active"
                            ? "bg-green-100 text-green-800 border border-green-200"
                            : "bg-red-100 text-red-800 border border-red-200"
                        }`}
                      >
                        {vendor.is_active === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="text-xs sm:text-sm text-gray-500 flex items-center">
                        <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5 inline text-gray-400" />
                        {vendor.created_at
                          ? formatDate(vendor.created_at)
                          : "N/A"}
                      </div>
                    </td>

                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="flex space-x-2 sm:space-x-3">
                        <button
                          className="text-blue-600 hover:text-blue-800 transition-colors duration-150 p-1 sm:p-1.5 rounded-full hover:bg-blue-50"
                          onClick={() => handleEdit(vendor)}
                          title="Edit Vendor"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          className="text-red-500 hover:text-red-700 transition-colors duration-150 p-1 sm:p-1.5 rounded-full hover:bg-red-50"
                          onClick={() => handleDelete(vendor.id)}
                          title="Delete Vendor"
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
        {!isLoading && filteredVendors.length > 0 && (
          <div className="px-3 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between border-t border-gray-200 bg-gray-50 gap-3">
            <div className="text-xs sm:text-sm text-gray-500 flex items-center">
              <span className="hidden sm:inline">Showing</span>
              <span className="font-medium text-gray-700 mx-1">
                {filteredVendors.length > 0 ? (page - 1) * limit + 1 : 0}
              </span>
              <span className="hidden sm:inline">to</span>
              <span className="font-medium text-gray-700 ml-1">
                {Math.min(page * limit, filteredVendors.length)}
              </span>
              <span className="hidden sm:inline">of</span>
              <span className="font-medium text-gray-700 ml-1">
                {filteredVendors.length}
              </span>
              <span className="hidden sm:inline ml-1">vendors</span>
            </div>

            <div className="flex gap-1 sm:gap-2">
              {/* Previous Button */}
              <button
                onClick={prevPage}
                disabled={page === 1}
                className={`relative inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-md border text-xs sm:text-sm font-medium ${
                  page === 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 hover:bg-gray-50"
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
                  page >= totalPages
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="hidden xs:inline">Next</span>
                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-0.5 sm:ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Vendor Modal - Made Responsive */}
      {(isAddVendorModalOpen || isEditVendorModalOpen) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-4 sm:mb-5 pb-2 sm:pb-3 border-b">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center">
                {isEditVendorModalOpen ? (
                  <>
                    <Edit className="h-5 w-5 mr-2 text-blue-600" />
                    <span className="truncate">
                      Edit: {selectedVendor?.full_name}
                    </span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="h-5 w-5 mr-2 text-blue-600" />
                    Add New Vendor
                  </>
                )}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => e.preventDefault()}
              className="space-y-4 sm:space-y-5"
              noValidate
            >
              {/* Profile Picture Section */}
              <div className="text-center mb-4 sm:mb-6">
                <div className="relative inline-block">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-full overflow-hidden border-4 border-gray-200 shadow-md bg-gray-100">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='112' height='112' viewBox='0 0 112 112' fill='%23e2e8f0'%3E%3Crect width='112' height='112' rx='56' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' font-size='40' font-family='Arial' fill='%23718096' text-anchor='middle' dominant-baseline='middle'%3E${fullName
                            .charAt(0)
                            .toUpperCase()}%3C/text%3E%3C/svg%3E`;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                      </div>
                    )}
                  </div>

                  <label
                    htmlFor="profilePictureInput"
                    className="absolute bottom-0 right-1 cursor-pointer"
                  >
                    <div className="bg-blue-600 text-white p-1.5 sm:p-2 rounded-full shadow-md hover:bg-blue-700 transition-colors">
                      <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </div>
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
                  </label>
                </div>
                {errors.profilePicture && (
                  <p className="mt-2 text-xs text-red-500">
                    {errors.profilePicture}
                  </p>
                )}
                {selectedImage && (
                  <p className="mt-2 text-xs text-gray-500 truncate max-w-[200px] mx-auto">
                    Selected: {selectedImage.name}
                  </p>
                )}
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div className="col-span-1">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Full Name*
                  </label>
                  <input
                    type="text"
                    className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                      errors.fullName
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300"
                    }`}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onBlur={() => {
                      if (!fullName.trim()) {
                        setErrors({
                          ...errors,
                          fullName: "Full name is required",
                        });
                      } else if (fullName.length < 3) {
                        setErrors({
                          ...errors,
                          fullName: "Full name must be at least 3 characters",
                        });
                      } else {
                        setErrors({ ...errors, fullName: "" });
                      }
                    }}
                    placeholder="Enter full name"
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.fullName}
                    </p>
                  )}
                </div>

                <div className="col-span-1">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Email*
                  </label>
                  <input
                    type="email"
                    className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                      errors.email
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300"
                    }`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => {
                      if (!email.trim()) {
                        setErrors({ ...errors, email: "Email is required" });
                      } else if (!/^\S+@\S+\.\S+$/.test(email)) {
                        setErrors({
                          ...errors,
                          email: "Please enter a valid email address",
                        });
                      } else if (
                        !email.trim().toLowerCase().endsWith("@gmail.com")
                      ) {
                        setErrors({
                          ...errors,
                          email:
                            "Only Gmail addresses (@gmail.com) are allowed",
                        });
                      } else {
                        setErrors({ ...errors, email: "" });
                      }
                    }}
                    placeholder="Enter email address"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                  )}
                </div>

                <div className="col-span-1">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Password{!isEditVendorModalOpen && "*"}
                  </label>
                  <input
                    type="password"
                    className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                      errors.password
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300"
                    }`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => {
                      if (!isEditVendorModalOpen && !password) {
                        setErrors({
                          ...errors,
                          password: "Password is required",
                        });
                      } else if (password && password.length < 8) {
                        setErrors({
                          ...errors,
                          password: "Password must be at least 8 characters",
                        });
                      } else {
                        setErrors({ ...errors, password: "" });
                      }
                    }}
                    placeholder={
                      isEditVendorModalOpen
                        ? "Enter new password (optional)"
                        : "Enter password"
                    }
                  />
                  {errors.password && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.password}
                    </p>
                  )}
                </div>

                <div className="col-span-1">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Phone Number*
                  </label>
                  <input
                    type="tel"
                    className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                      errors.phoneNumber
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300"
                    }`}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    onBlur={() => {
                      if (!phoneNumber.trim()) {
                        setErrors({
                          ...errors,
                          phoneNumber: "Phone number is required",
                        });
                      } else if (
                        !/^\d{10,15}$/.test(phoneNumber.replace(/\D/g, ""))
                      ) {
                        setErrors({
                          ...errors,
                          phoneNumber: "Please enter a valid phone number",
                        });
                      } else {
                        setErrors({ ...errors, phoneNumber: "" });
                      }
                    }}
                    placeholder="Enter phone number"
                  />
                  {errors.phoneNumber && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.phoneNumber}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Address*
                </label>
                <textarea
                  className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                    errors.address
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300"
                  }`}
                  rows="2"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onBlur={() => {
                    if (!address.trim()) {
                      setErrors({ ...errors, address: "Address is required" });
                    } else {
                      setErrors({ ...errors, address: "" });
                    }
                  }}
                  placeholder="Enter address"
                />
                {errors.address && (
                  <p className="mt-1 text-xs text-red-500">{errors.address}</p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <div className="flex space-x-3 sm:space-x-4 mt-1">
                  <div
                    className={`flex-1 border rounded-lg p-2.5 sm:p-3 cursor-pointer flex items-center justify-center ${
                      isActive === "active"
                        ? "bg-green-50 border-green-300 ring-2 ring-green-200"
                        : "bg-white border-gray-200 hover:bg-gray-50"
                    }`}
                    onClick={() => setIsActive("active")}
                  >
                    <input
                      type="radio"
                      className="form-radio h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 mr-1.5 sm:mr-2"
                      checked={isActive === "active"}
                      onChange={() => setIsActive("active")}
                    />
                    <span
                      className={`text-xs sm:text-sm ${
                        isActive === "active"
                          ? "text-green-800 font-medium"
                          : "text-gray-700"
                      }`}
                    >
                      Active
                    </span>
                  </div>

                  <div
                    className={`flex-1 border rounded-lg p-2.5 sm:p-3 cursor-pointer flex items-center justify-center ${
                      isActive === "inactive"
                        ? "bg-red-50 border-red-300 ring-2 ring-red-200"
                        : "bg-white border-gray-200 hover:bg-gray-50"
                    }`}
                    onClick={() => setIsActive("inactive")}
                  >
                    <input
                      type="radio"
                      className="form-radio h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600 mr-1.5 sm:mr-2"
                      checked={isActive === "inactive"}
                      onChange={() => setIsActive("inactive")}
                    />
                    <span
                      className={`text-xs sm:text-sm ${
                        isActive === "inactive"
                          ? "text-red-800 font-medium"
                          : "text-gray-700"
                      }`}
                    >
                      Inactive
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 sm:pt-5 mt-1 sm:mt-2 border-t">
                <button
                  type="button"
                  className="px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 shadow-sm"
                  onClick={handleCloseModal}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 shadow-sm"
                  onClick={
                    isEditVendorModalOpen ? handleEditVendor : handleAddVendor
                  }
                >
                  {isEditVendorModalOpen ? "Update Vendor" : "Add Vendor"}
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
