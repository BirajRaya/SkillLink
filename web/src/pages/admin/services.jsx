import { useState, useEffect, useMemo } from "react";
import {
  Edit,
  Trash2,
  Search,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  PackageOpen,
  X,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ImageIcon,
  MapPin,
  DollarSign,
  Calendar,
  Building2,
  FolderOpen,
} from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

const Services = () => {
  // State Management
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInputValue, setSearchInputValue] = useState("");
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [isEditServiceModalOpen, setIsEditServiceModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [serviceName, setServiceName] = useState("");
  const [description, setDescription] = useState("");
  const [serviceLocation, setServiceLocation] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isActive, setIsActive] = useState(true);
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loadedImages, setLoadedImages] = useState({});
  const { toast } = useToast();
  const [viewingDescription, setViewingDescription] = useState(null);

  // Available locations
  const locationOptions = ["Mississauga", "Brampton", "Toronto"];

  // Add debounced search like in Users page
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInputValue);
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchInputValue]);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalServices, setTotalServices] = useState(0);

  // Function to load individual service images
  const loadServiceImage = async (serviceId) => {
    if (loadedImages[serviceId]) return; // Already loaded or loading

    try {
      // Mark as loading to prevent duplicate requests
      setLoadedImages((prev) => ({
        ...prev,
        [serviceId]: "loading",
      }));

      const response = await api.get(`/services/${serviceId}/image`);
      if (response.data && response.data.image) {
        setLoadedImages((prev) => ({
          ...prev,
          [serviceId]: response.data.image,
        }));
      } else {
        // No image found
        setLoadedImages((prev) => ({
          ...prev,
          [serviceId]: null,
        }));
      }
    } catch (error) {
      console.error(`Failed to load image for service ${serviceId}:`, error);
      // Mark as failed so we don't try again
      setLoadedImages((prev) => ({
        ...prev,
        [serviceId]: null,
      }));
    }
  };

  // Form validation states
  const [errors, setErrors] = useState({
    serviceName: "",
    description: "",
    price: "",
    serviceLocation: "",
    categoryId: "",
    vendorId: "",
    image: "",
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

  // Format price as currency
  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  // Validation function
  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      serviceName: "",
      description: "",
      price: "",
      serviceLocation: "",
      categoryId: "",
      vendorId: "",
      image: "",
    };

    // Service name validation
    if (!serviceName.trim()) {
      newErrors.serviceName = "Service name is required";
      isValid = false;
    } else if (serviceName.length < 3) {
      newErrors.serviceName = "Service name must be at least 3 characters";
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

    // Price validation
    if (!price) {
      newErrors.price = "Price is required";
      isValid = false;
    } else if (isNaN(price) || parseFloat(price) <= 0) {
      newErrors.price = "Price must be a positive number";
      isValid = false;
    }

    // Location validation
    if (!serviceLocation) {
      newErrors.serviceLocation = "Location is required";
      isValid = false;
    }

    // Category validation
    if (!categoryId) {
      newErrors.categoryId = "Category is required";
      isValid = false;
    }

    // Vendor validation
    if (!vendorId) {
      newErrors.vendorId = "Vendor is required";
      isValid = false;
    }

    // Image validation for new services
    if (!isEditServiceModalOpen && !image) {
      newErrors.image = "Image is required for new services";
      isValid = false;
    } else if (image && selectedImage instanceof File) {
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(selectedImage.type)) {
        newErrors.image = "Only JPG, PNG, GIF, and WEBP formats are supported";
        isValid = false;
      } else if (selectedImage.size > 5 * 1024 * 1024) {
        // 5MB max size
        newErrors.image = "Image size must be less than 5MB";
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  // Fetch services from backend
  // const fetchServices = async () => {
  //   setIsLoading(true);
  //   try {
  //     const controller = new AbortController();
  //     const timeoutId = setTimeout(() => controller.abort(), 40000);

  //     const response = await api.get("/services/getAllServices", {
  //       signal: controller.signal,
  //     });

  //     clearTimeout(timeoutId);

  //     if (response && response.data) {
  //       setServices(response.data);
  //       setTotalServices(response.data.length);
  //     } else {
  //       throw new Error("No data received from the server.");
  //     }
  //   } catch (error) {
  //     let errorMsg = "Failed to fetch services";

  //     if (error.name === "AbortError" || error.code === "ECONNABORTED") {
  //       errorMsg =
  //         "Request timed out while loading services. Please refresh the page.";
  //     } else if (error.response?.data?.message) {
  //       errorMsg = error.response.data.message;
  //     } else if (error.message) {
  //       errorMsg = error.message;
  //     }

  //     toast({
  //       title: "Error",
  //       description: errorMsg,
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const fetchServices = async () => {
    setIsLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 100000);
  
      const response = await api.get("/services/getAllServices", {
        signal: controller.signal,
      });
  
      clearTimeout(timeoutId);
  
      if (response && response.data) {
        setServices(response.data);
        setTotalServices(response.data.length);
      } else {
        throw new Error("No data received from the server.");
      }
    } catch (error) {
      // Specifically handle 404 with "No services found"
      if (error.response && error.response.status === 404 && 
          error.response.data.message === 'No services found') {
        // This is not really an error, just no services exist
        setServices([]);
        setTotalServices(0);
        
        // Optional: Show an informative message
        toast({
          title: "No Services",
          description: "There are currently no services in the system.",
          variant: "default" // or use a different variant that fits your design
        });
        
        return; // Exit the catch block
      }
  
      // Handle other types of errors
      let errorMsg = "Failed to fetch services";
  
      if (error.name === "AbortError" || error.code === "ECONNABORTED") {
        errorMsg = "Request timed out while loading services. Please refresh the page.";
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

  // Fetch categories and vendors for dropdowns
  const fetchCategoriesAndVendors = async () => {
    try {
      const [categoriesResponse, vendorsResponse] = await Promise.all([
        api.get("/services/active"),
        api.get("/services/users/vendors"),
      ]);

      setCategories(categoriesResponse.data);
      setVendors(vendorsResponse.data);
    } catch (error) {
      console.error("Error fetching categories/vendors:", error);
      toast({
        title: "Error",
        description:
          "Failed to load categories and vendors. Please refresh the page.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchServices();
    fetchCategoriesAndVendors();
  }, []);

  // Filter services based on search term
  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const name = service.name || "";
      const desc = service.description || "";
      const location = service.location || "";
      const category = service.category_name || "";

      return (
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
        location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [services, searchTerm]);

  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.ceil(filteredServices.length / limit);
  }, [filteredServices, limit]);

  // Get paginated services
  const paginatedServices = useMemo(() => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return filteredServices.slice(startIndex, endIndex);
  }, [filteredServices, page, limit]);

  // Reset to first page when search changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  // Load service images for visible services
  useEffect(() => {
    // Check if we need to load images for visible services
    paginatedServices.forEach((service) => {
      if (service.image_url === "has-image" && !loadedImages[service.id]) {
        loadServiceImage(service.id);
      }
    });
  }, [paginatedServices]);

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
          image: "Only JPG, PNG, GIF, and WEBP formats are supported",
        });
      } else if (file.size > 5 * 1024 * 1024) {
        // 5MB max size
        setErrors({ ...errors, image: "Image size must be less than 5MB" });
      } else {
        setErrors({ ...errors, image: "" }); // Clear any previous error

        // Create and set image preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);

        setImage(file);
        setSelectedImage(file);
      }
    }
  };

  // Reset form and errors
  const resetForm = () => {
    setServiceName("");
    setDescription("");
    setServiceLocation("");
    setPrice("");
    setCategoryId("");
    setVendorId("");
    setImage(null);
    setSelectedImage(null);
    setImagePreview(null);
    setIsActive(true);
    setErrors({
      serviceName: "",
      description: "",
      price: "",
      serviceLocation: "",
      categoryId: "",
      vendorId: "",
      image: "",
    });
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsAddServiceModalOpen(true);
  };

  const handleEdit = (service) => {
    resetForm();
    setSelectedService(service);
    setServiceName(service.name);
    setDescription(service.description);
    setPrice(service.price);
    setCategoryId(service.category_id);
    setVendorId(service.vendor_id);
    setServiceLocation(service.location);

    // If we have the image URL loaded in cache, use it
    if (service.image_url === "has-image" && loadedImages[service.id]) {
      setImage(loadedImages[service.id]);
      setImagePreview(loadedImages[service.id]);
    } else if (
      service.image_url &&
      typeof service.image_url === "string" &&
      service.image_url !== "has-image"
    ) {
      // For backward compatibility with existing image URLs
      setImage(service.image_url);
      setImagePreview(service.image_url);
    } else {
      // Need to fetch the image separately
      loadServiceImage(service.id).then(() => {
        if (loadedImages[service.id]) {
          setImage(loadedImages[service.id]);
          setImagePreview(loadedImages[service.id]);
        }
      });
    }

    setIsActive(service.status);
    setIsEditServiceModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this service?")) {
      try {
        const response = await api.delete(`/services/delete-service/${id}`);
        if (response.status === 200) {
          fetchServices();
          toast({
            title: "Success",
            description: `Service has been deleted successfully`,
          });
        }
      } catch (error) {
        console.error("Error deleting service:", error);
        const errorMsg =
          error.response?.data?.message || "Error deleting service";

        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive",
        });
      }
    }
  };

  const handleAddService = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      if (image && selectedImage instanceof File) {
        const reader = new FileReader();
        reader.readAsDataURL(selectedImage);
        reader.onload = async () => {
          const base64Image = reader.result;
          const newService = {
            name: serviceName,
            description,
            price,
            category_id: categoryId,
            vendor_id: vendorId,
            image_url: base64Image,
            location: serviceLocation,
            status: isActive,
          };

          const response = await api.post("/services/add-service", newService);

          if (response.status === 201) {
            fetchServices();
            setIsAddServiceModalOpen(false);
            resetForm();
            toast({
              title: "Success",
              description: `Service ${serviceName} has been added successfully`,
            });
          }
        };
      }
    } catch (error) {
      console.error("Error adding service:", error);
      const errorMsg = error.response?.data?.message || "Error adding service";

      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    }
  };

  const handleEditService = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const updatedService = {
        name: serviceName,
        description,
        price,
        category_id: categoryId,
        vendor_id: vendorId,
        image_url: image,
        location: serviceLocation,
        status: isActive,
      };

      // If a new image was selected
      if (selectedImage instanceof File) {
        const reader = new FileReader();
        reader.readAsDataURL(selectedImage);
        reader.onload = async () => {
          updatedService.image_url = reader.result;

          const response = await api.put(
            `/services/update-service/${selectedService.id}`,
            updatedService
          );

          if (response.status === 200) {
            // Update the loaded images cache with the new image
            setLoadedImages((prev) => ({
              ...prev,
              [selectedService.id]: reader.result,
            }));

            fetchServices();
            setIsEditServiceModalOpen(false);
            resetForm();
            toast({
              title: "Success",
              description: `Service ${serviceName} has been updated successfully`,
            });
          }
        };
      } else {
        // If no new image
        const response = await api.put(
          `/services/update-service/${selectedService.id}`,
          updatedService
        );

        if (response.status === 200) {
          fetchServices();
          setIsEditServiceModalOpen(false);
          resetForm();
          toast({
            title: "Success",
            description: `Service ${serviceName} has been updated successfully`,
          });
        }
      }
    } catch (error) {
      console.error("Error editing service:", error);
      const errorMsg =
        error.response?.data?.message || "Error updating service";

      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    }
  };

  // Close modals and reset form
  const handleCloseModal = () => {
    setIsAddServiceModalOpen(false);
    setIsEditServiceModalOpen(false);
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

  return (
    <div className="container px-3 sm:px-4 py-6 sm:py-8 mx-auto max-w-7xl">
      {/* Header with search bar and Add Service button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-3">
          <PackageOpen className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Services
            </h1>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center w-full sm:w-auto">
          {/* Search Bar */}
          <div className="relative flex-1 w-full sm:w-64">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              className="pl-10 pr-4 py-2.5 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm"
              placeholder="Search services"
              value={searchInputValue}
              onChange={(e) => setSearchInputValue(e.target.value)}
            />
          </div>

          {/* Add New Service Button */}
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-colors duration-200 flex items-center gap-2 justify-center shadow-sm w-full sm:w-auto"
            onClick={handleOpenAddModal}
          >
            <PlusCircle className="h-5 w-5" />
            <span>Add Service</span>
          </button>
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white shadow-md rounded-lg border border-gray-200 overflow-hidden">
        {/* Table header */}
        <div className="p-3 sm:p-4 border-b bg-gray-50 flex flex-col sm:flex-row justify-between sm:items-center">
          <h2 className="text-base sm:text-lg font-medium text-gray-700 mb-1 sm:mb-0">
            All Services
          </h2>
          <div className="text-xs sm:text-sm text-gray-500">
            Total: {filteredServices.length} services
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service Details
                </th>
                <th className="hidden sm:table-cell px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="hidden md:table-cell px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="hidden md:table-cell px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="hidden lg:table-cell px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created At
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 sm:py-12">
                    <div className="flex flex-col justify-center items-center space-y-3">
                      <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-blue-600" />
                      <span className="text-gray-600 font-medium text-sm sm:text-base">
                        Loading services data...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filteredServices.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 sm:py-12">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <PackageOpen className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mb-3 sm:mb-4" />
                      <p className="text-base sm:text-lg font-medium text-gray-900 mb-1">
                        No services found
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500 max-w-sm px-4">
                        {searchTerm
                          ? "Try adjusting your search terms"
                          : "Add a new service to get started"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedServices.map((service, index) => (
                  <tr
                    key={service.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                    }`}
                  >
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="flex-shrink-0 h-12 w-12 sm:h-16 sm:w-16">
                        {service.image_url === "has-image" ? (
                          loadedImages[service.id] &&
                          loadedImages[service.id] !== "loading" ? (
                            <img
                              src={loadedImages[service.id]}
                              alt={service.name}
                              className="h-12 w-12 sm:h-16 sm:w-16 rounded-md object-cover border-2 border-gray-200 shadow-sm"
                              loading="lazy"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64' fill='%23e2e8f0'%3E%3Crect width='64' height='64' rx='6' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' font-size='24' font-family='Arial' fill='%23718096' text-anchor='middle' dominant-baseline='middle'%3E${service.name
                                  .charAt(0)
                                  .toUpperCase()}%3C/text%3E%3C/svg%3E`;
                              }}
                            />
                          ) : (
                            <div
                              className="h-12 w-12 sm:h-16 sm:w-16 rounded-md bg-blue-50 border-2 border-blue-100 flex items-center justify-center cursor-pointer shadow-sm"
                              onClick={() => loadServiceImage(service.id)}
                            >
                              {loadedImages[service.id] === "loading" ? (
                                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-blue-500" />
                              ) : (
                                <ImageIcon className="h-4 w-4 sm:h-6 sm:w-6 text-blue-500" />
                              )}
                            </div>
                          )
                        ) : service.image_url ? (
                          // For backward compatibility with existing URLs
                          <img
                            src={`${service.image_url}`}
                            alt={service.name}
                            className="h-12 w-12 sm:h-16 sm:w-16 rounded-md object-cover border-2 border-gray-200 shadow-sm"
                            loading="lazy"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64' fill='%23e2e8f0'%3E%3Crect width='64' height='64' rx='6' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' font-size='24' font-family='Arial' fill='%23718096' text-anchor='middle' dominant-baseline='middle'%3E${service.name
                                .charAt(0)
                                .toUpperCase()}%3C/text%3E%3C/svg%3E`;
                            }}
                          />
                        ) : (
                          <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center">
                            <ImageIcon className="h-4 w-4 sm:h-6 sm:w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="text-xs sm:text-sm font-medium text-gray-900 mb-1">
                        {service.name}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500 max-w-[120px] sm:max-w-[200px]">
                        {service.description &&
                        service.description.length >
                          (window.innerWidth < 640 ? 50 : 100) ? (
                          <div>
                            {truncateText(
                              service.description,
                              window.innerWidth < 640 ? 50 : 100
                            )}
                            <button
                              className="text-blue-600 ml-1 text-xs hover:underline focus:outline-none"
                              onClick={() =>
                                setViewingDescription(service.description)
                              }
                            >
                              More
                            </button>
                          </div>
                        ) : (
                          service.description
                        )}
                      </div>

                      {/* Show location on mobile since the column is hidden */}
                      <div className="text-xs text-gray-500 mt-1 sm:hidden flex items-center">
                        <MapPin className="h-3 w-3 text-gray-400 mr-1 flex-shrink-0" />
                        <span className="truncate">{service.location}</span>
                      </div>

                      {/* Category and vendor for mobile */}
                      <div className="flex flex-wrap gap-x-3 mt-1 sm:hidden">
                        <div className="text-xs text-gray-500 flex items-center">
                          <FolderOpen className="h-3 w-3 text-gray-400 mr-1" />
                          <span>{service.category_name}</span>
                        </div>
                        <div className="text-xs text-gray-500 flex items-center">
                          <Building2 className="h-3 w-3 text-gray-400 mr-1" />
                          <span>{service.vendor_name}</span>
                        </div>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-3 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center">
                        <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 mr-1 sm:mr-2 flex-shrink-0" />
                        <span
                          className="text-xs sm:text-sm text-gray-900 max-w-[80px] sm:max-w-[150px] truncate"
                          title={service.location}
                        >
                          {service.location}
                        </span>
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-3 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center">
                        <FolderOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 mr-1 sm:mr-2" />
                        <span className="text-xs sm:text-sm text-gray-900">
                          {service.category_name}
                        </span>
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-3 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center">
                        <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 mr-1 sm:mr-2" />
                        <span className="text-xs sm:text-sm text-gray-900">
                          {service.vendor_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center">
                        <span className="text-xs sm:text-sm font-medium text-gray-900">
                          {formatPrice(service.price)}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      {service.status ? (
                        <span className="px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                          INACTIVE
                        </span>
                      )}
                    </td>
                    <td className="hidden lg:table-cell px-3 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center">
                        <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 mr-1 sm:mr-2" />
                        <span className="text-xs sm:text-sm text-gray-500">
                          {service.created_at
                            ? formatDate(service.created_at)
                            : "N/A"}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                      <div className="flex space-x-2 sm:space-x-3 justify-end">
                        <button
                          className="text-blue-600 hover:text-blue-800 transition-colors duration-150 p-1 sm:p-1.5 rounded-full hover:bg-blue-50"
                          onClick={() => handleEdit(service)}
                          title="Edit Service"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          className="text-red-500 hover:text-red-700 transition-colors duration-150 p-1 sm:p-1.5 rounded-full hover:bg-red-50"
                          onClick={() => handleDelete(service.id)}
                          title="Delete Service"
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

        {/* Responsive Pagination */}
        {!isLoading && filteredServices.length > 0 && (
          <div className="px-3 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between border-t border-gray-200 bg-gray-50 gap-3">
            <div className="text-xs sm:text-sm text-gray-500 flex items-center">
              <span className="hidden sm:inline">Showing</span>
              <span className="font-medium text-gray-700 mx-1">
                {filteredServices.length > 0 ? (page - 1) * limit + 1 : 0}
              </span>
              <span className="hidden sm:inline">to</span>
              <span className="font-medium text-gray-700 ml-1">
                {Math.min(page * limit, filteredServices.length)}
              </span>
              <span className="hidden sm:inline">of</span>
              <span className="font-medium text-gray-700 ml-1">
                {filteredServices.length}
              </span>
              <span className="hidden sm:inline ml-1">services</span>
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

      {/* View Description Modal */}
      {viewingDescription && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4 sm:p-0"
          onClick={() => setViewingDescription(null)}
        >
          <div
            className="bg-white rounded-lg max-w-md w-full p-4 shadow-lg m-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium text-gray-900 text-sm sm:text-base">
                Full Description
              </h3>
              <button
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setViewingDescription(null)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="text-xs sm:text-sm text-gray-800 whitespace-pre-wrap break-words max-h-[50vh] sm:max-h-[60vh] overflow-y-auto">
              {viewingDescription}
            </div>
            <div className="mt-4 text-right">
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

      {/* Add/Edit Service Modal */}
      {(isAddServiceModalOpen || isEditServiceModalOpen) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b px-4 sm:px-6 py-3 sm:py-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
                {isEditServiceModalOpen ? (
                  <>
                    <Edit className="h-5 w-5 text-blue-600" />
                    Edit Service
                  </>
                ) : (
                  <>
                    <PackageOpen className="h-5 w-5 text-blue-600" />
                    Add New Service
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
                {isEditServiceModalOpen && (
                  <div className="space-y-2 text-center mb-4">
                    <Label
                      htmlFor="image_url"
                      className="text-xs sm:text-sm font-medium text-gray-700"
                    >
                      Service Image
                    </Label>
                    <div className="relative w-28 h-28 sm:w-32 sm:h-32 mx-auto">
                      <img
                        src={imagePreview || `${image}`}
                        alt="Service"
                        className="w-28 h-28 sm:w-32 sm:h-32 rounded-lg object-cover border border-gray-200 shadow-sm"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128' fill='%23e2e8f0'%3E%3Crect width='128' height='128' rx='6' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' font-size='32' font-family='Arial' fill='%23718096' text-anchor='middle' dominant-baseline='middle'%3E${serviceName
                            .charAt(0)
                            .toUpperCase()}%3C/text%3E%3C/svg%3E`;
                        }}
                      />
                      <label
                        htmlFor="serviceImageInput"
                        className="cursor-pointer"
                      >
                        <div className="absolute bottom-1 right-1 bg-gray-800 text-white p-1 rounded-full cursor-pointer hover:bg-gray-700 transition-colors duration-150">
                          <svg
                            className="w-4 h-4 sm:w-5 sm:h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.232 5.232l3.536 3.536M9 13.5V17h3.5l7.5-7.5a2.121 2.121 0 000-3l-3-3a2.121 2.121 0 00-3 0L9 10.5z"
                            />
                          </svg>
                        </div>
                      </label>
                      <input
                        type="file"
                        id="serviceImageInput"
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
                    {errors.image && (
                      <div className="flex items-center mt-1 text-xs text-red-500">
                        <AlertCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                        {errors.image}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Service Name*
                  </label>
                  <input
                    type="text"
                    className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-xs sm:text-sm ${
                      errors.serviceName
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300"
                    }`}
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    onBlur={() => {
                      if (!serviceName.trim()) {
                        setErrors({
                          ...errors,
                          serviceName: "Service name is required",
                        });
                      } else if (serviceName.length < 3) {
                        setErrors({
                          ...errors,
                          serviceName:
                            "Service name must be at least 3 characters",
                        });
                      } else {
                        setErrors({ ...errors, serviceName: "" });
                      }
                    }}
                    placeholder="Enter service name"
                  />
                  {errors.serviceName && (
                    <div className="flex items-center mt-1 text-xs text-red-500">
                      <AlertCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                      {errors.serviceName}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Description*
                  </label>
                  <textarea
                    className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-xs sm:text-sm ${
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
                    placeholder="Enter service description"
                    rows="2"
                  />
                  {errors.description && (
                    <div className="flex items-center mt-1 text-xs text-red-500">
                      <AlertCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                      {errors.description}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Location*
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-4 w-4 text-gray-400" />
                    </div>
                    <select
                      className={`pl-9 w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-xs sm:text-sm appearance-none bg-white ${
                        errors.serviceLocation
                          ? "border-red-500 bg-red-50"
                          : "border-gray-300"
                      }`}
                      value={serviceLocation}
                      onChange={(e) => setServiceLocation(e.target.value)}
                      onBlur={() => {
                        if (!serviceLocation) {
                          setErrors({
                            ...errors,
                            serviceLocation: "Location is required",
                          });
                        } else {
                          setErrors({ ...errors, serviceLocation: "" });
                        }
                      }}
                    >
                      <option value="">Select Location</option>
                      {locationOptions.map((location) => (
                        <option key={location} value={location}>
                          {location}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.serviceLocation && (
                    <div className="flex items-center mt-1 text-xs text-red-500">
                      <AlertCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                      {errors.serviceLocation}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Price ($)*
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className={`w-full pl-8 sm:pl-9 pr-3 py-2 sm:py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-xs sm:text-sm ${
                          errors.price
                            ? "border-red-500 bg-red-50"
                            : "border-gray-300"
                        }`}
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        onBlur={() => {
                          if (!price) {
                            setErrors({
                              ...errors,
                              price: "Price is required",
                            });
                          } else if (
                            isNaN(parseFloat(price)) ||
                            parseFloat(price) <= 0
                          ) {
                            setErrors({
                              ...errors,
                              price: "Price must be a positive number",
                            });
                          } else {
                            setErrors({ ...errors, price: "" });
                          }
                        }}
                        placeholder="0.00"
                      />
                    </div>
                    {errors.price && (
                      <div className="flex items-center mt-1 text-xs text-red-500">
                        <AlertCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                        {errors.price}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <div className="flex space-x-4 sm:space-x-6 mt-2">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          className="form-radio h-4 w-4 sm:h-5 sm:w-5 text-blue-600"
                          name="status"
                          checked={isActive === true}
                          onChange={() => setIsActive(true)}
                        />
                        <span className="ml-1.5 sm:ml-2 text-xs sm:text-sm text-gray-700 flex items-center">
                          <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 mr-1" />
                          Active
                        </span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          className="form-radio h-4 w-4 sm:h-5 sm:w-5 text-red-600"
                          name="status"
                          checked={isActive === false}
                          onChange={() => setIsActive(false)}
                        />
                        <span className="ml-1.5 sm:ml-2 text-xs sm:text-sm text-gray-700 flex items-center">
                          <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500 mr-1" />
                          Inactive
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Category*
                    </label>
                    <select
                      className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-xs sm:text-sm ${
                        errors.categoryId
                          ? "border-red-500 bg-red-50"
                          : "border-gray-300"
                      }`}
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      onBlur={() => {
                        if (!categoryId) {
                          setErrors({
                            ...errors,
                            categoryId: "Category is required",
                          });
                        } else {
                          setErrors({ ...errors, categoryId: "" });
                        }
                      }}
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.category_name}
                        </option>
                      ))}
                    </select>
                    {errors.categoryId && (
                      <div className="flex items-center mt-1 text-xs text-red-500">
                        <AlertCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                        {errors.categoryId}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Vendor*
                    </label>
                    <select
                      className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-xs sm:text-sm ${
                        errors.vendorId
                          ? "border-red-500 bg-red-50"
                          : "border-gray-300"
                      }`}
                      value={vendorId}
                      onChange={(e) => setVendorId(e.target.value)}
                      onBlur={() => {
                        if (!vendorId) {
                          setErrors({
                            ...errors,
                            vendorId: "Vendor is required",
                          });
                        } else {
                          setErrors({ ...errors, vendorId: "" });
                        }
                      }}
                    >
                      <option value="">Select Vendor</option>
                      {vendors.map((vendor) => (
                        <option key={vendor.id} value={vendor.id}>
                          {vendor.full_name}
                        </option>
                      ))}
                    </select>
                    {errors.vendorId && (
                      <div className="flex items-center mt-1 text-xs text-red-500">
                        <AlertCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                        {errors.vendorId}
                      </div>
                    )}
                  </div>
                </div>

                {!isEditServiceModalOpen && (
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Service Image*
                    </label>
                    <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-3 sm:space-x-4">
                      <div className="flex-shrink-0 mx-auto sm:mx-0">
                        {imagePreview ? (
                          <img
                            src={imagePreview}
                            alt="Service Preview"
                            className="w-28 h-28 sm:w-32 sm:h-32 rounded-lg object-cover border-2 border-gray-200 shadow-sm"
                          />
                        ) : (
                          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-lg bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                            <ImageIcon className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col text-center sm:text-left">
                        <label
                          htmlFor="file-upload"
                          className="cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-2 px-4 rounded-md transition-colors duration-200 inline-flex items-center justify-center text-xs sm:text-sm"
                        >
                          <ImageIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          <span>Select Image</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                handleImageChange(file);
                              }
                            }}
                          />
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          JPG, PNG, GIF or WEBP. Max 5MB.
                        </p>
                      </div>
                    </div>
                    {errors.image && (
                      <div className="flex items-center mt-1 text-xs text-red-500">
                        <AlertCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                        {errors.image}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4 sm:pt-5 mt-4 sm:mt-5 border-t">
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
                    isEditServiceModalOpen
                      ? handleEditService
                      : handleAddService
                  }
                >
                  {isEditServiceModalOpen ? "Update Service" : "Add Service"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;
