import {
  Plus,
  Briefcase,
  Edit,
  Trash2,
  Search,
  PlusCircle,
  MapPin,
  X,
  ChevronRight,
  ChevronLeft,
  Filter,
} from "lucide-react";
import PropTypes from "prop-types";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect, useId } from "react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

const ServicesTab = ({
  setShowNewServiceDialog,
  serviceInsights,
  formatCurrency,
  isMobile,
}) => {
  // State Management for services data
  const { toast } = useToast();
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
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
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [isEditServiceModalOpen, setIsEditServiceModalOpen] = useState(false);
  const [viewingServiceDetails, setViewingServiceDetails] = useState(null);
  const userData = JSON.parse(localStorage.getItem("user"));
  const userId = userData.id;

  // Location options array
  const locationOptions = ["Mississauga", "Brampton", "Toronto"];

  const fetchCategories = async () => {
    try {
      const categoriesResponse = await api.get("/services/active");
      setCategories(categoriesResponse.data);
    } catch (error) {
      console.error("Error fetching categories/vendors:", error);
      toast({
        title: "Error",
        description:
          "Failed to load categories and vendors. Please refresh the page.",
        variant: "destructive",
        className:
          "bg-red-500 text-white font-medium border-l-4 border-red-700",
      });
    }
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
    setImage(service.image_url);
    setImagePreview(service.image_url);
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
            variant: "success",
            className:
              "bg-green-500 text-white font-medium border-l-4 border-green-700",
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
          className:
            "bg-red-500 text-white font-medium border-l-4 border-red-700",
        });
      }
    }
  };

  const [errors, setErrors] = useState({
    serviceName: "",
    description: "",
    price: "",
    serviceLocation: "",
    categoryId: "",
    vendorId: "",
    image: "",
  });
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

  const handleOpenAddModal = () => {
    resetForm();
    setIsAddServiceModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddServiceModalOpen(false);
    setIsEditServiceModalOpen(false);
    resetForm();
  };

  const handleViewServiceDetails = (service) => {
    setViewingServiceDetails(service);
  };

  const closeServiceDetails = () => {
    setViewingServiceDetails(null);
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      serviceName: "",
      description: "",
      price: "",
      serviceLocation: "",
      categoryId: "",
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
    } else if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
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
            vendor_id: userId,
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
              variant: "success",
              className:
                "bg-green-500 text-white font-medium border-l-4 border-green-700",
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
        className:
          "bg-red-500 text-white font-medium border-l-4 border-red-700",
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
            fetchServices();
            setIsEditServiceModalOpen(false);
            resetForm();
            toast({
              title: "Success",
              description: `Service ${serviceName} has been updated successfully`,
              variant: "success",
              className:
                "bg-green-500 text-white font-medium border-l-4 border-green-700",
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
            variant: "success",
            className:
              "bg-green-500 text-white font-medium border-l-4 border-green-700",
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
        className:
          "bg-red-500 text-white font-medium border-l-4 border-red-700",
      });
    }
  };

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

  // Fetch services from backend
  // Alternative approach using vendor email
  const fetchServices = async () => {
    setIsLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      // Get the current user's ID from localStorage (or auth context)

      // Call the endpoint with the userId as a URL parameter
      const response = await api.get(`/services/user/${userId}`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response && response.data) {
        setServices(response.data);
      } else {
        throw new Error("No data received from the server.");
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      // Handle error (e.g., show a notification or message)
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
    fetchCategories();
  }, []);

  // Filter services based on search term
  const filteredServices = services.filter((service) => {
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

  // Filter active services only
  const activeServices = services.filter((service) => service.status === true);

  // Filter draft/inactive services
  const draftServices = services.filter((service) => service.status === false);

  // Mobile service card component
  const ServiceCard = ({ service }) => (
    <div
      key={service.id}
      className="bg-white border rounded-lg shadow-sm overflow-hidden"
      onClick={() => handleViewServiceDetails(service)}
    >
      <div className="h-36 relative">
        {service.image_url ? (
          <img
            src={`${service.image_url}`}
            alt={service.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100' fill='%23f3f4f6'%3E%3Crect width='100' height='100' rx='8' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' font-size='42' font-family='sans-serif' fill='%23d1d5db' text-anchor='middle' dominant-baseline='middle'%3E?%3C/text%3E%3C/svg%3E`;
            }}
          />
        ) : (
          <div className="h-full w-full bg-blue-50 flex items-center justify-center">
            <span className="text-blue-500 text-2xl font-semibold">
              {service.name && service.name.length > 0
                ? service.name.charAt(0).toUpperCase()
                : "?"}
            </span>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              service.status
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {service.status ? "Active" : "Inactive"}
          </span>
        </div>
      </div>
      <div className="p-3 space-y-2">
        <h3 className="font-semibold text-sm truncate">{service.name}</h3>
        <div className="flex justify-between items-center">
          <div className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
            {service.category_name}
          </div>
          <div className="font-medium text-sm">
            {formatPrice(service.price)}
          </div>
        </div>
        <div className="flex justify-between items-center pt-2 border-t mt-2">
          <div className="text-xs text-gray-500 flex items-center">
            <MapPin className="h-3 w-3 mr-1" />
            {service.location}
          </div>
          <div className="flex space-x-1">
            <button
              className="text-blue-500 p-1.5 hover:bg-blue-50 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(service);
              }}
            >
              <Edit className="h-3.5 w-3.5" />
            </button>
            <button
              className="text-red-500 p-1.5 hover:bg-red-50 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(service.id);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="y-6">
      {/* Service Details Modal for Mobile */}
      {isMobile && viewingServiceDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="relative h-48">
              {viewingServiceDetails.image_url ? (
                <img
                  src={`${viewingServiceDetails.image_url}`}
                  alt={viewingServiceDetails.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-blue-50 flex items-center justify-center">
                  <span className="text-blue-500 text-4xl font-semibold">
                    {viewingServiceDetails.name &&
                    viewingServiceDetails.name.length > 0
                      ? viewingServiceDetails.name.charAt(0).toUpperCase()
                      : "?"}
                  </span>
                </div>
              )}
              <button
                className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-1.5 rounded-full"
                onClick={closeServiceDetails}
              >
                <X className="h-4 w-4" />
              </button>
              <div className="absolute bottom-2 right-2">
                <span
                  className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                    viewingServiceDetails.status
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {viewingServiceDetails.status ? "Active" : "Inactive"}
                </span>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <h2 className="text-xl font-bold">
                  {viewingServiceDetails.name}
                </h2>
                <div className="flex items-center mt-1 space-x-2">
                  <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">
                    {viewingServiceDetails.category_name}
                  </span>
                  <span className="text-gray-500 text-xs flex items-center">
                    <MapPin className="h-3 w-3 mr-0.5" />
                    {viewingServiceDetails.location}
                  </span>
                </div>
              </div>

              <div className="py-3 border-t border-b">
                <div className="font-medium text-lg">
                  {formatPrice(viewingServiceDetails.price)}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">
                  Description
                </h3>
                <p className="text-sm text-gray-600">
                  {viewingServiceDetails.description}
                </p>
              </div>

              <div className="text-xs text-gray-500">
                Created: {formatDate(viewingServiceDetails.created_at)}
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    closeServiceDetails();
                    handleEdit(viewingServiceDetails);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => {
                    closeServiceDetails();
                    handleDelete(viewingServiceDetails.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        {/* Header section with title on left, search and button on right */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
          <h2 className="text-lg sm:text-xl font-semibold">
            Services Management
          </h2>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:space-x-4 w-full sm:w-auto">
            {/* Search bar */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                className="pl-9 pr-4 py-2 w-full rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="Search services"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search
                className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={16}
              />
            </div>

            {/* Add New Service button */}
            <Button
              onClick={() => handleOpenAddModal(true)}
              className="w-full sm:w-auto text-sm"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add New Service
            </Button>
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <div className={isMobile ? "overflow-x-auto -mx-4 px-4 pb-1" : ""}>
            <TabsList className="mb-4 sm:mb-6 h-8 sm:h-9 w-full sm:w-auto">
              <TabsTrigger
                value="all"
                className="text-xs sm:text-sm h-7 sm:h-8"
              >
                All Services
              </TabsTrigger>
              <TabsTrigger
                value="active"
                className="text-xs sm:text-sm h-7 sm:h-8"
              >
                Active
              </TabsTrigger>
              <TabsTrigger
                value="draft"
                className="text-xs sm:text-sm h-7 sm:h-8"
              >
                Inactive
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all">
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-sm">Loading services...</span>
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="flex justify-center items-center h-40 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center p-4">
                  <Briefcase className="mx-auto h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                  <h3 className="mt-2 text-xs sm:text-sm font-medium text-gray-900">
                    No services yet
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-gray-500">
                    Get started by creating a new service.
                  </p>
                  <div className="mt-4 sm:mt-6">
                    <Button
                      onClick={() => handleOpenAddModal(true)}
                      className="text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4"
                    >
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Add New Service
                    </Button>
                  </div>
                </div>
              </div>
            ) : isMobile ? (
              <div className="grid grid-cols-1 gap-4">
                {filteredServices.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <div className="overflow-hidden border rounded-lg shadow">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Image
                          </th>
                          <th
                            scope="col"
                            className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Service Details
                          </th>
                          <th
                            scope="col"
                            className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Location
                          </th>
                          <th
                            scope="col"
                            className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Category
                          </th>
                          <th
                            scope="col"
                            className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Price
                          </th>
                          <th
                            scope="col"
                            className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Status
                          </th>
                          <th
                            scope="col"
                            className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Created At
                          </th>
                          <th
                            scope="col"
                            className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredServices.map((service) => (
                          <tr
                            key={service.id}
                            className="hover:bg-gray-50 transition-colors duration-150"
                          >
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                              <div className="flex-shrink-0 h-10 w-10 sm:h-16 sm:w-16">
                                {service.image_url ? (
                                  <img
                                    src={`${service.image_url}`}
                                    alt={service.name}
                                    className="h-10 w-10 sm:h-16 sm:w-16 rounded-md object-cover border border-gray-200 shadow-sm"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64' fill='%23f3f4f6'%3E%3Crect width='64' height='64' rx='6' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' font-size='24' font-family='sans-serif' fill='%23d1d5db' text-anchor='middle' dominant-baseline='middle'%3E?%3C/text%3E%3C/svg%3E`;
                                    }}
                                  />
                                ) : (
                                  <div className="h-10 w-10 sm:h-16 sm:w-16 rounded-md bg-blue-50 flex items-center justify-center">
                                    <span className="text-blue-500 text-sm sm:text-lg font-semibold">
                                      {service.name && service.name.length > 0
                                        ? service.name.charAt(0).toUpperCase()
                                        : "?"}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4">
                              <div className="text-xs sm:text-sm font-medium text-gray-900">
                                {service.name}
                              </div>
                              <div
                                className="text-xs sm:text-sm text-gray-500 max-w-[150px] sm:max-w-[200px] line-clamp-2"
                                title={service.description}
                              >
                                {service.description}
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4">
                              <div
                                className="text-xs sm:text-sm text-gray-900 max-w-[80px] sm:max-w-[150px] truncate"
                                title={service.location}
                              >
                                {service.location}
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4">
                              <div className="text-xs sm:text-sm text-gray-900">
                                {service.category_name}
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4">
                              <div className="text-xs sm:text-sm font-medium text-gray-900">
                                {formatPrice(service.price)}
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4">
                              <span
                                className={`px-2 py-0.5 sm:px-3 sm:py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  service.status
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {service.status ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-500">
                              {service.created_at
                                ? formatDate(service.created_at)
                                : "N/A"}
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4">
                              <div className="flex space-x-2">
                                <button
                                  className="text-blue-500 hover:text-blue-700 transition-colors duration-150"
                                  title="Edit Service"
                                  onClick={() => handleEdit(service)}
                                >
                                  <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                                </button>
                                <button
                                  className="text-red-500 hover:text-red-700 transition-colors duration-150"
                                  title="Delete Service"
                                  onClick={() => handleDelete(service.id)}
                                >
                                  <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="active">
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-xs sm:text-sm">
                  Loading services...
                </span>
              </div>
            ) : activeServices.length === 0 ? (
              <div className="flex justify-center items-center h-40 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-900">
                    No active services
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-gray-500">
                    Your active services will appear here.
                  </p>
                  <div className="mt-4">
                    <Button
                      onClick={() => handleOpenAddModal(true)}
                      className="text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4"
                    >
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Add New Service
                    </Button>
                  </div>
                </div>
              </div>
            ) : isMobile ? (
              <div className="grid grid-cols-1 gap-4">
                {activeServices.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <div className="overflow-hidden border rounded-lg shadow">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Image
                          </th>
                          <th
                            scope="col"
                            className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Service Details
                          </th>
                          <th
                            scope="col"
                            className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Location
                          </th>
                          <th
                            scope="col"
                            className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Category
                          </th>
                          <th
                            scope="col"
                            className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Price
                          </th>
                          <th
                            scope="col"
                            className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Created At
                          </th>
                          <th
                            scope="col"
                            className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {activeServices.map((service) => (
                          <tr
                            key={service.id}
                            className="hover:bg-gray-50 transition-colors duration-150"
                          >
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                              <div className="flex-shrink-0 h-10 w-10 sm:h-16 sm:w-16">
                                {service.image_url ? (
                                  <img
                                    src={`${service.image_url}`}
                                    alt={service.name}
                                    className="h-10 w-10 sm:h-16 sm:w-16 rounded-md object-cover border border-gray-200 shadow-sm"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64' fill='%23f3f4f6'%3E%3Crect width='64' height='64' rx='6' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' font-size='24' font-family='sans-serif' fill='%23d1d5db' text-anchor='middle' dominant-baseline='middle'%3E?%3C/text%3E%3C/svg%3E`;
                                    }}
                                  />
                                ) : (
                                  <div className="h-10 w-10 sm:h-16 sm:w-16 rounded-md bg-blue-50 flex items-center justify-center">
                                    <span className="text-blue-500 text-sm sm:text-lg font-semibold">
                                      {service.name && service.name.length > 0
                                        ? service.name.charAt(0).toUpperCase()
                                        : "?"}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4">
                              <div className="text-xs sm:text-sm font-medium text-gray-900">
                                {service.name}
                              </div>
                              <div
                                className="text-xs sm:text-sm text-gray-500 max-w-[150px] sm:max-w-[200px] line-clamp-2"
                                title={service.description}
                              >
                                {service.description}
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4">
                              <div
                                className="text-xs sm:text-sm text-gray-900 max-w-[80px] sm:max-w-[150px] truncate"
                                title={service.location}
                              >
                                {service.location}
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4">
                              <div className="text-xs sm:text-sm text-gray-900">
                                {service.category_name}
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4">
                              <div className="text-xs sm:text-sm font-medium text-gray-900">
                                {formatPrice(service.price)}
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-500">
                              {service.created_at
                                ? formatDate(service.created_at)
                                : "N/A"}
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4">
                              <div className="flex space-x-2">
                                <button
                                  className="text-blue-500 hover:text-blue-700 transition-colors duration-150"
                                  title="Edit Service"
                                  onClick={() => handleEdit(service)}
                                >
                                  <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                                </button>
                                <button
                                  className="text-red-500 hover:text-red-700 transition-colors duration-150"
                                  title="Delete Service"
                                  onClick={() => handleDelete(service.id)}
                                >
                                  <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="draft">
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-xs sm:text-sm">
                  Loading services...
                </span>
              </div>
            ) : draftServices.length === 0 ? (
              <div className="flex justify-center items-center h-40 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-900">
                    No inactive services
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-gray-500">
                    Your inactive services will appear here.
                  </p>
                </div>
              </div>
            ) : isMobile ? (
              <div className="grid grid-cols-1 gap-4">
                {draftServices.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <div className="overflow-hidden border rounded-lg shadow">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Image
                          </th>
                          <th
                            scope="col"
                            className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Service Details
                          </th>
                          <th
                            scope="col"
                            className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Location
                          </th>
                          <th
                            scope="col"
                            className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Category
                          </th>
                          <th
                            scope="col"
                            className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Price
                          </th>
                          <th
                            scope="col"
                            className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Created At
                          </th>
                          <th
                            scope="col"
                            className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {draftServices.map((service) => (
                          <tr
                            key={service.id}
                            className="hover:bg-gray-50 transition-colors duration-150"
                          >
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                              <div className="flex-shrink-0 h-10 w-10 sm:h-16 sm:w-16">
                                {service.image_url ? (
                                  <img
                                    src={`${service.image_url}`}
                                    alt={service.name}
                                    className="h-10 w-10 sm:h-16 sm:w-16 rounded-md object-cover border border-gray-200 shadow-sm"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64' fill='%23f3f4f6'%3E%3Crect width='64' height='64' rx='6' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' font-size='24' font-family='sans-serif' fill='%23d1d5db' text-anchor='middle' dominant-baseline='middle'%3E?%3C/text%3E%3C/svg%3E`;
                                    }}
                                  />
                                ) : (
                                  <div className="h-10 w-10 sm:h-16 sm:w-16 rounded-md bg-blue-50 flex items-center justify-center">
                                    <span className="text-blue-500 text-sm sm:text-lg font-semibold">
                                      {service.name && service.name.length > 0
                                        ? service.name.charAt(0).toUpperCase()
                                        : "?"}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4">
                              <div className="text-xs sm:text-sm font-medium text-gray-900">
                                {service.name}
                              </div>
                              <div
                                className="text-xs sm:text-sm text-gray-500 max-w-[150px] sm:max-w-[200px] line-clamp-2"
                                title={service.description}
                              >
                                {service.description}
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4">
                              <div
                                className="text-xs sm:text-sm text-gray-900 max-w-[80px] sm:max-w-[150px] truncate"
                                title={service.location}
                              >
                                {service.location}
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4">
                              <div className="text-xs sm:text-sm text-gray-900">
                                {service.category_name}
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4">
                              <div className="text-xs sm:text-sm font-medium text-gray-900">
                                {formatPrice(service.price)}
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-500">
                              {service.created_at
                                ? formatDate(service.created_at)
                                : "N/A"}
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4">
                              <div className="flex space-x-2">
                                <button
                                  className="text-blue-500 hover:text-blue-700 transition-colors duration-150"
                                  title="Edit Service"
                                  onClick={() => handleEdit(service)}
                                >
                                  <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                                </button>
                                <button
                                  className="text-red-500 hover:text-red-700 transition-colors duration-150"
                                  title="Delete Service"
                                  onClick={() => handleDelete(service.id)}
                                >
                                  <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Service Insights - Responsive Layout */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8 mt-6 sm:mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800">
              Service Insights
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Track your top-performing services
            </p>
          </div>
          <div className="mt-2 sm:mt-0">
            <span className="inline-flex items-center px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
              <svg
                className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path
                  fillRule="evenodd"
                  d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                  clipRule="evenodd"
                />
              </svg>
              Live data
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Most Booked Service */}
          <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-blue-100 border-b p-3 sm:p-4">
              <CardTitle className="text-xs sm:text-sm font-semibold text-blue-700 flex items-center">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                </svg>
                Most Booked
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 sm:pt-4 p-3 sm:p-4">
              {serviceInsights?.mostBooked ? (
                <div>
                  <div className="relative mb-2 sm:mb-3 h-20 sm:h-24 rounded-lg overflow-hidden">
                    <img
                      src={serviceInsights.mostBooked.image_url}
                      alt="Most Booked"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100' fill='%23f3f4f6'%3E%3Crect width='100' height='100' rx='8' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' font-size='42' font-family='sans-serif' fill='%23d1d5db' text-anchor='middle' dominant-baseline='middle'%3E?%3C/text%3E%3C/svg%3E`;
                      }}
                    />
                    <div className="absolute bottom-0 right-0 bg-blue-600 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 text-xs font-bold rounded-tl-lg">
                      {serviceInsights.mostBooked.booking_count} bookings
                    </div>
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-gray-800 truncate">
                    {serviceInsights.mostBooked.name}
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Popular choice among customers
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 sm:h-40 text-center">
                  <svg
                    className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-xs sm:text-sm text-gray-400 mt-2">
                    No booking data yet
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Highest Rated Service */}
          <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-2 bg-gradient-to-r from-yellow-50 to-yellow-100 border-b p-3 sm:p-4">
              <CardTitle className="text-xs sm:text-sm font-semibold text-yellow-700 flex items-center">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Highest Rated
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 sm:pt-4 p-3 sm:p-4">
              {serviceInsights?.highestRated ? (
                <div>
                  <div className="relative mb-2 sm:mb-3 h-20 sm:h-24 rounded-lg overflow-hidden">
                    <img
                      src={serviceInsights.highestRated.image_url}
                      alt="Highest Rated"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100' fill='%23f3f4f6'%3E%3Crect width='100' height='100' rx='8' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' font-size='42' font-family='sans-serif' fill='%23d1d5db' text-anchor='middle' dominant-baseline='middle'%3E?%3C/text%3E%3C/svg%3E`;
                      }}
                    />
                    <div className="absolute bottom-0 right-0 bg-yellow-600 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 text-xs font-bold rounded-tl-lg">
                      {Number(
                        serviceInsights.highestRated.average_rating || 0
                      ).toFixed(1)}{" "}
                      ⭐
                    </div>
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-gray-800 truncate">
                    {serviceInsights.highestRated.name}
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    {serviceInsights.highestRated.review_count} customer reviews
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 sm:h-40 text-center">
                  <svg
                    className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    />
                  </svg>
                  <p className="text-xs sm:text-sm text-gray-400 mt-2">
                    No rating data yet
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Most Profitable Service */}
          <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-2 bg-gradient-to-r from-green-50 to-green-100 border-b p-3 sm:p-4">
              <CardTitle className="text-xs sm:text-sm font-semibold text-green-700 flex items-center">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
                Most Profitable
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 sm:pt-4 p-3 sm:p-4">
              {serviceInsights?.mostProfitable ? (
                <div>
                  <div className="relative mb-2 sm:mb-3 h-20 sm:h-24 rounded-lg overflow-hidden">
                    <img
                      src={serviceInsights.mostProfitable.image_url}
                      alt="Most Profitable"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100' fill='%23f3f4f6'%3E%3Crect width='100' height='100' rx='8' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' font-size='42' font-family='sans-serif' fill='%23d1d5db' text-anchor='middle' dominant-baseline='middle'%3E?%3C/text%3E%3C/svg%3E`;
                      }}
                    />
                    <div className="absolute bottom-0 right-0 bg-green-600 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 text-xs font-bold rounded-tl-lg">
                      {formatCurrency
                        ? formatCurrency(
                            serviceInsights.mostProfitable.total_revenue
                          )
                        : `$${serviceInsights.mostProfitable.total_revenue}`}
                    </div>
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-gray-800 truncate">
                    {serviceInsights.mostProfitable.name}
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Highest revenue generator
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 sm:h-40 text-center">
                  <svg
                    className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-xs sm:text-sm text-gray-400 mt-2">
                    No revenue data yet
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add/Edit Service Modal - Responsive */}
      {(isAddServiceModalOpen || isEditServiceModalOpen) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-base sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center">
              {isEditServiceModalOpen ? (
                <>
                  <Edit className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 text-blue-500" />
                  <span className="truncate">
                    Edit Service: {selectedService?.name}
                  </span>
                </>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 text-blue-500" />
                  Add New Service
                </>
              )}
            </h2>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="space-y-3 sm:space-y-4"
            >
              {isEditServiceModalOpen && (
                <div className="space-y-2 text-center mb-3 sm:mb-4">
                  <Label
                    htmlFor="image_url"
                    className="text-xs sm:text-sm font-medium text-gray-700"
                  >
                    Service Image
                  </Label>
                  <div className="relative w-24 h-24 sm:w-32 sm:h-32 mx-auto">
                    <img
                      src={imagePreview || `${image}`}
                      alt="Service"
                      className="w-24 h-24 sm:w-32 sm:h-32 rounded-md object-cover border border-gray-200 shadow-sm"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100' fill='%23f3f4f6'%3E%3Crect width='100' height='100' rx='8' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' font-size='36' font-family='sans-serif' fill='%23d1d5db' text-anchor='middle' dominant-baseline='middle'%3E?%3C/text%3E%3C/svg%3E`;
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
                    <p className="mt-1 text-xs text-red-500">{errors.image}</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Service Name*
                </label>
                <input
                  type="text"
                  className={`w-full px-3 py-2 text-xs sm:text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                    errors.serviceName ? "border-red-500" : "border-gray-300"
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
                  <p className="mt-1 text-xs text-red-500">
                    {errors.serviceName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Description*
                </label>
                <textarea
                  className={`w-full px-3 py-2 text-xs sm:text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                    errors.description ? "border-red-500" : "border-gray-300"
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
                  rows="3"
                />
                {errors.description && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.description}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Location*
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                  </div>
                  <select
                    className={`w-full pl-8 sm:pl-9 pr-3 py-2 text-xs sm:text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                      errors.serviceLocation
                        ? "border-red-500"
                        : "border-gray-300"
                    } appearance-none`}
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
                  <p className="mt-1 text-xs text-red-500">
                    {errors.serviceLocation}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Price ($)*
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className={`w-full px-3 py-2 text-xs sm:text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                    errors.price ? "border-red-500" : "border-gray-300"
                  }`}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  onBlur={() => {
                    if (!price) {
                      setErrors({ ...errors, price: "Price is required" });
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
                  placeholder="Enter service price"
                />
                {errors.price && (
                  <p className="mt-1 text-xs text-red-500">{errors.price}</p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Category*
                </label>
                <select
                  className={`w-full px-3 py-2 text-xs sm:text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                    errors.categoryId ? "border-red-500" : "border-gray-300"
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
                  <p className="mt-1 text-xs text-red-500">
                    {errors.categoryId}
                  </p>
                )}
              </div>

              {!isEditServiceModalOpen && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Service Image*
                  </label>
                  <div className="mt-1 flex flex-col sm:flex-row sm:items-center sm:space-x-4">
                    <div className="flex-shrink-0 mb-3 sm:mb-0">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Service Preview"
                          className="w-24 h-24 sm:w-32 sm:h-32 rounded-md object-cover border border-gray-200 shadow-sm mx-auto sm:mx-0"
                        />
                      ) : (
                        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-md bg-gray-100 flex items-center justify-center border border-gray-200 mx-auto sm:mx-0">
                          <svg
                            className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v14a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col w-full text-center sm:text-left">
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-2 px-4 rounded-md transition-colors duration-200 text-xs sm:text-sm inline-block"
                      >
                        <span>Choose file</span>
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
                    <p className="mt-1 text-xs text-red-500">{errors.image}</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <div className="mt-1 space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio text-blue-600 h-3.5 w-3.5 sm:h-4 sm:w-4"
                      name="status"
                      checked={isActive === true}
                      onChange={() => setIsActive(true)}
                    />
                    <span className="ml-2 text-xs sm:text-sm text-gray-700">
                      Active
                    </span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio text-blue-600 h-3.5 w-3.5 sm:h-4 sm:w-4"
                      name="status"
                      checked={isActive === false}
                      onChange={() => setIsActive(false)}
                    />
                    <span className="ml-2 text-xs sm:text-sm text-gray-700">
                      Inactive
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-5 sm:mt-6 pt-2 sm:pt-3 border-t">
                <button
                  type="button"
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                  onClick={handleCloseModal}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-black text-white rounded-md hover:bg-gray-800 transition-colors duration-200"
                  onClick={
                    isEditServiceModalOpen
                      ? handleEditService
                      : handleAddService
                  }
                >
                  {isEditServiceModalOpen ? "Update Service" : "Add Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

ServicesTab.propTypes = {
  setShowNewServiceDialog: PropTypes.func.isRequired,
  serviceInsights: PropTypes.shape({
    mostBooked: PropTypes.shape({
      name: PropTypes.string,
      booking_count: PropTypes.number,
      image_url: PropTypes.string,
    }),
    highestRated: PropTypes.shape({
      name: PropTypes.string,
      average_rating: PropTypes.number,
      review_count: PropTypes.number,
      image_url: PropTypes.string,
    }),
    mostProfitable: PropTypes.shape({
      name: PropTypes.string,
      total_revenue: PropTypes.number,
      image_url: PropTypes.string,
    }),
  }),
  formatCurrency: PropTypes.func.isRequired,
  isMobile: PropTypes.bool,
};

export default ServicesTab;
