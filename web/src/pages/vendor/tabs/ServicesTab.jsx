import { Plus, Briefcase, Edit, Trash2, Search, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect, useId } from 'react';
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

const ServicesTab = ({ setShowNewServiceDialog }) => {
  // State Management for services data

  const { toast } = useToast();
  const [services, setServices] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedService, setSelectedService] = useState(null);
    const [serviceName, setServiceName] = useState('');
    const [description, setDescription] = useState('');
    const [serviceLocation, setServiceLocation] = useState('');
    const [price, setPrice] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [vendorId, setVendorId] = useState('');
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isActive, setIsActive] = useState(true);
    const [categories, setCategories] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null);
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [isEditServiceModalOpen, setIsEditServiceModalOpen] = useState(false);
  const userData = JSON.parse(localStorage.getItem('user'));
  const userId = userData.id;
  const fetchCategories = async () => {
    try {
      const categoriesResponse = await api.get('/services/active');
      setCategories(categoriesResponse.data);
    } catch (error) {
      console.error("Error fetching categories/vendors:", error);
      toast({
        title: "Error",
        description: "Failed to load categories and vendors. Please refresh the page.",
        variant: "destructive",
        className: "bg-red-500 text-white font-medium border-l-4 border-red-700"
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
            className: "bg-green-500 text-white font-medium border-l-4 border-green-700"
          });
        }
      } catch (error) {
        console.error("Error deleting service:", error);
        const errorMsg = error.response?.data?.message || "Error deleting service";
        
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive",
        className: "bg-red-500 text-white font-medium border-l-4 border-red-700"
        });
      }
    }
  };

  const [errors, setErrors] = useState({
      serviceName: '',
      description: '',
      price: '',
      serviceLocation: '',
      categoryId: '',
      vendorId: '',
      image: ''
    });
  const resetForm = () => {
    setServiceName('');
    setDescription('');
    setServiceLocation('');
    setPrice('');
    setCategoryId('');
    setVendorId('');
    setImage(null);
    setSelectedImage(null);
    setImagePreview(null);
    setIsActive(true);
    setErrors({
      serviceName: '',
      description: '',
      price: '',
      serviceLocation: '',
      categoryId: '',
      vendorId: '',
      image: ''
    });
  };

  const handleImageChange = (file) => {
    if (file) {
      // Validate file
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      
      if (!allowedTypes.includes(file.type)) {
        setErrors({ ...errors, image: 'Only JPG, PNG, GIF, and WEBP formats are supported' });
      } else if (file.size > 5 * 1024 * 1024) { // 5MB max size
        setErrors({ ...errors, image: 'Image size must be less than 5MB' });
      } else {
        setErrors({ ...errors, image: '' }); // Clear any previous error
        
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

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      serviceName: '',
      description: '',
      price: '',
      serviceLocation: '',
      categoryId: '',
      image: ''
    };

    // Service name validation
    if (!serviceName.trim()) {
      newErrors.serviceName = 'Service name is required';
      isValid = false;
    } else if (serviceName.length < 3) {
      newErrors.serviceName = 'Service name must be at least 3 characters';
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

    // Price validation
    if (!price) {
      newErrors.price = 'Price is required';
      isValid = false;
    } else if (isNaN(price) || parseFloat(price) <= 0) {
      newErrors.price = 'Price must be a positive number';
      isValid = false;
    }

    // Location validation
    if (!serviceLocation.trim()) {
      newErrors.serviceLocation = 'Location is required';
      isValid = false;
    }

    // Category validation
    if (!categoryId) {
      newErrors.categoryId = 'Category is required';
      isValid = false;
    }
    // Image validation for new services
    if (!isEditServiceModalOpen && !image) {
      newErrors.image = 'Image is required for new services';
      isValid = false;
    } else if (image && selectedImage instanceof File) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(selectedImage.type)) {
        newErrors.image = 'Only JPG, PNG, GIF, and WEBP formats are supported';
        isValid = false;
      } else if (selectedImage.size > 5 * 1024 * 1024) { // 5MB max size
        newErrors.image = 'Image size must be less than 5MB';
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
            status: isActive
          };

          const response = await api.post('/services/add-service', newService);

          if (response.status === 201) {
            fetchServices();
            setIsAddServiceModalOpen(false);
            resetForm();
            toast({
              title: "Success",
              description: `Service ${serviceName} has been added successfully`,
              variant: "success",
            className: "bg-green-500 text-white font-medium border-l-4 border-green-700"
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
        className: "bg-red-500 text-white font-medium border-l-4 border-red-700"
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
        status: isActive
      };

      // If a new image was selected
      if (selectedImage instanceof File) {
        const reader = new FileReader();
        reader.readAsDataURL(selectedImage);
        reader.onload = async () => {
          updatedService.image_url = reader.result;
          
          const response = await api.put(`/services/update-service/${selectedService.id}`, updatedService);
          
          if (response.status === 200) {
            fetchServices();
            setIsEditServiceModalOpen(false);
            resetForm();
            toast({
              title: "Success",
              description: `Service ${serviceName} has been updated successfully`,
              variant: "success",
            className: "bg-green-500 text-white font-medium border-l-4 border-green-700"
            });
          }
        };
      } else {
        // If no new image
        const response = await api.put(`/services/update-service/${selectedService.id}`, updatedService);
        
        if (response.status === 200) {
          fetchServices();
          setIsEditServiceModalOpen(false);
          resetForm();
          toast({
            title: "Success",
            description: `Service ${serviceName} has been updated successfully`,
            variant: "success",
            className: "bg-green-500 text-white font-medium border-l-4 border-green-700"
          });
        }
      }
    } catch (error) {
      console.error("Error editing service:", error);
      const errorMsg = error.response?.data?.message || "Error updating service";
      
      toast({
        title: "Error",
        description: errorMsg,
        vvariant: "destructive",
        className: "bg-red-500 text-white font-medium border-l-4 border-red-700"
      });
    }
  };

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

  // Format price as currency
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
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
    const name = service.name || '';
    const desc = service.description || '';
    const location = service.location || '';
    const category = service.category_name || '';
    
    return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
           location.toLowerCase().includes(searchTerm.toLowerCase()) ||
           category.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Filter active services only
  const activeServices = services.filter(service => service.status === true);
  
  // Filter draft/inactive services
  const draftServices = services.filter(service => service.status === false);

  return (
<div className="y-6">
  <div className="bg-white rounded-lg shadow-md p-6">
    {/* Header section with title on left, search and button on right */}
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-semibold">Services Management</h2>
      
      <div className="flex items-center space-x-4">
        {/* Search bar */}
        <div className="relative">
          <input
            type="text"
            className="pl-10 pr-4 py-2 w-64 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Search services"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        </div>
        
        {/* Add New Service button */}
        <Button onClick={() => handleOpenAddModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Service
        </Button>
      </div>
    </div>
        
        <Tabs defaultValue="all">
          <TabsList className="mb-6">
            <TabsTrigger value="all">All Services</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="draft">Inactive</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2">Loading services...</span>
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="flex justify-center items-center h-40 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <Briefcase className="mx-auto h-8 w-8 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No services yet</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by creating a new service.</p>
                  <div className="mt-6">
                    <Button onClick={() => handleOpenAddModal(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add New Service
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="max-h-96 overflow-y-auto border rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Details</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredServices.map((service) => (
                      <tr key={service.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4">
                          <div className="flex-shrink-0 h-16 w-16">
                            {service.image_url ? (
                              <img 
                                src={`${service.image_url}`}
                                alt={service.name}
                                className="h-16 w-16 rounded-md object-cover border border-gray-200 shadow-sm"
                              />
                            ) : (
                              <div className="h-16 w-16 rounded-md bg-blue-100 flex items-center justify-center">
                                <span className="text-blue-500 text-lg font-semibold">
                                  {(service.name && service.name.length > 0) 
                                    ? service.name.charAt(0).toUpperCase() 
                                    : '?'}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{service.name}</div>
                          <div className="text-sm text-gray-500 max-w-[200px] line-clamp-2" title={service.description}>
                            {service.description}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-[150px] truncate" title={service.location}>
                            {service.location}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{service.category_name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{formatPrice(service.price)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            service.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {service.status ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {service.created_at ? formatDate(service.created_at) : 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button 
                              className="text-blue-500 hover:text-blue-700 transition-colors duration-150"
                              title="Edit Service"
                              onClick={() => handleEdit(service)}
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                            <button 
                              className="text-red-500 hover:text-red-700 transition-colors duration-150"
                              title="Delete Service"
                              onClick={() => handleDelete(service.id)}
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="active">
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2">Loading services...</span>
              </div>
            ) : activeServices.length === 0 ? (
              <div className="flex justify-center items-center h-40 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No active services</h3>
                  <p className="mt-1 text-sm text-gray-500">Your active services will appear here.</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Details</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {activeServices.map((service) => (
                      <tr key={service.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4">
                          <div className="flex-shrink-0 h-16 w-16">
                            {service.image_url ? (
                              <img 
                                src={`${service.image_url}`}
                                alt={service.name}
                                className="h-16 w-16 rounded-md object-cover border border-gray-200 shadow-sm"
                              />
                            ) : (
                              <div className="h-16 w-16 rounded-md bg-blue-100 flex items-center justify-center">
                                <span className="text-blue-500 text-lg font-semibold">
                                  {(service.name && service.name.length > 0) 
                                    ? service.name.charAt(0).toUpperCase() 
                                    : '?'}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{service.name}</div>
                          <div className="text-sm text-gray-500 max-w-[200px] line-clamp-2" title={service.description}>
                            {service.description}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-[150px] truncate" title={service.location}>
                            {service.location}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{service.category_name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{formatPrice(service.price)}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {service.created_at ? formatDate(service.created_at) : 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button 
                              className="text-blue-500 hover:text-blue-700 transition-colors duration-150"
                              title="Edit Service"
                              onClick={() => handleEdit(service)}
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                            <button 
                              className="text-red-500 hover:text-red-700 transition-colors duration-150"
                              title="Delete Service"
                              onClick={() => handleDelete(service.id)}
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="draft">
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2">Loading services...</span>
              </div>
            ) : draftServices.length === 0 ? (
              <div className="flex justify-center items-center h-40 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No draft services</h3>
                  <p className="mt-1 text-sm text-gray-500">Your draft services will appear here.</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Details</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {draftServices.map((service) => (
                      <tr key={service.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4">
                          <div className="flex-shrink-0 h-16 w-16">
                            {service.image_url ? (
                              <img 
                                src={`${service.image_url}`}
                                alt={service.name}
                                className="h-16 w-16 rounded-md object-cover border border-gray-200 shadow-sm"
                              />
                            ) : (
                              <div className="h-16 w-16 rounded-md bg-blue-100 flex items-center justify-center">
                                <span className="text-blue-500 text-lg font-semibold">
                                  {(service.name && service.name.length > 0) 
                                    ? service.name.charAt(0).toUpperCase() 
                                    : '?'}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{service.name}</div>
                          <div className="text-sm text-gray-500 max-w-[200px] line-clamp-2" title={service.description}>
                            {service.description}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-[150px] truncate" title={service.location}>
                            {service.location}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{service.category_name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{formatPrice(service.price)}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {service.created_at ? formatDate(service.created_at) : 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button 
                              className="text-blue-500 hover:text-blue-700 transition-colors duration-150"
                              title="Edit Service"
                              onClick={() => handleEdit(service)}
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                            <button 
                              className="text-red-500 hover:text-red-700 transition-colors duration-150"
                              title="Delete Service"
                              onClick={() => handleDelete(service.id)}
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <h3 className="text-lg font-semibold mb-4">Service Insights</h3>
        <p className="text-gray-600 mb-6">
          See how your services are performing
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Most Booked</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">No data yet</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Highest Rated</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">No data yet</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Most Profitable</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">No data yet</div>
            </CardContent>
          </Card>
        </div>
      </div>
       {(isAddServiceModalOpen || isEditServiceModalOpen) && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 m-0">
                <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                  <h2 className="text-xl font-semibold mb-4 flex items-center">
                    {isEditServiceModalOpen ? (
                      <>
                        <Edit className="h-5 w-5 mr-2 text-blue-500" />
                        Edit Service: {selectedService?.name}
                      </>
                    ) : (
                      <>
                        <PlusCircle className="h-5 w-5 mr-2 text-blue-500" />
                        Add New Service
                      </>
                    )}
                  </h2>
                  <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                    {isEditServiceModalOpen && (
                      <div className="space-y-2 text-center mb-4">
                        <Label htmlFor="image_url" className="text-sm font-medium text-gray-700">Service Image</Label>
                        <div className="relative w-32 h-32 mx-auto">
                          <img
                            src={imagePreview || `${image}`}
                            alt="Service"
                            className="w-32 h-32 rounded-md object-cover border border-gray-200 shadow-sm"
                          />
                          <label htmlFor="serviceImageInput" className="cursor-pointer">
                            <div className="absolute bottom-1 right-1 bg-gray-800 text-white p-1 rounded-full cursor-pointer hover:bg-gray-700 transition-colors duration-150">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13.5V17h3.5l7.5-7.5a2.121 2.121 0 000-3l-3-3a2.121 2.121 0 00-3 0L9 10.5z" />
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
                        {errors.image && <p className="mt-1 text-xs text-red-500">{errors.image}</p>}
                      </div>
                    )}
      
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Service Name*</label>
                      <input
                        type="text"
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${errors.serviceName ? 'border-red-500' : 'border-gray-300'}`}
                        value={serviceName}
                        onChange={(e) => setServiceName(e.target.value)}
                        onBlur={() => {
                          if (!serviceName.trim()) {
                            setErrors({ ...errors, serviceName: 'Service name is required' });
                          } else if (serviceName.length < 3) {
                            setErrors({ ...errors, serviceName: 'Service name must be at least 3 characters' });
                          } else {
                            setErrors({ ...errors, serviceName: '' });
                          }
                        }}
                        placeholder="Enter service name"
                      />
                      {errors.serviceName && <p className="mt-1 text-xs text-red-500">{errors.serviceName}</p>}
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
                        placeholder="Enter service description"
                        rows="3"
                      />
                      {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
                    </div>
      
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location*</label>
                      <textarea
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${errors.serviceLocation ? 'border-red-500' : 'border-gray-300'}`}
                        value={serviceLocation}
                        onChange={(e) => setServiceLocation(e.target.value)}
                        onBlur={() => {
                          if (!serviceLocation.trim()) {
                            setErrors({ ...errors, serviceLocation: 'Location is required' });
                          } else {
                            setErrors({ ...errors, serviceLocation: '' });
                          }
                        }}
                        placeholder="Enter service location"
                        rows="2"
                      />
                      {errors.serviceLocation && <p className="mt-1 text-xs text-red-500">{errors.serviceLocation}</p>}
                    </div>
      
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)*</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${errors.price ? 'border-red-500' : 'border-gray-300'}`}
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        onBlur={() => {
                          if (!price) {
                            setErrors({ ...errors, price: 'Price is required' });
                          } else if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
                            setErrors({ ...errors, price: 'Price must be a positive number' });
                          } else {
                            setErrors({ ...errors, price: '' });
                          }
                        }}
                        placeholder="Enter service price"
                      />
                      {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price}</p>}
                    </div>
      
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category*</label>
                      <select
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${errors.categoryId ? 'border-red-500' : 'border-gray-300'}`}
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        onBlur={() => {
                          if (!categoryId) {
                            setErrors({ ...errors, categoryId: 'Category is required' });
                          } else {
                            setErrors({ ...errors, categoryId: '' });
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
                      {errors.categoryId && <p className="mt-1 text-xs text-red-500">{errors.categoryId}</p>}
                    </div>
      
                    {!isEditServiceModalOpen && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Service Image*</label>
                        <div className="mt-1 flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            {imagePreview ? (
                              <img
                                src={imagePreview}
                                alt="Service Preview"
                                className="w-32 h-32 rounded-md object-cover border border-gray-200 shadow-sm"
                              />
                            ) : (
                              <div className="w-32 h-32 rounded-md bg-gray-100 flex items-center justify-center border border-gray-200">
                                <svg className="h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <label htmlFor="file-upload" className="cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-2 px-4 rounded-md transition-colors duration-200">
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
                            <p className="text-xs text-gray-500 mt-1">JPG, PNG, GIF or WEBP. Max 5MB.</p>
                          </div>
                        </div>
                        {errors.image && <p className="mt-1 text-xs text-red-500">{errors.image}</p>}
                      </div>
                    )}
      
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <div className="mt-1 space-x-4">
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            className="form-radio text-blue-600"
                            name="status"
                            checked={isActive === true}
                            onChange={() => setIsActive(true)}
                          />
                          <span className="ml-2 text-gray-700">Active</span>
                        </label>
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            className="form-radio text-blue-600"
                            name="status"
                            checked={isActive === false}
                            onChange={() => setIsActive(false)}
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
                        className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors duration-200"
                        onClick={isEditServiceModalOpen ? handleEditService : handleAddService}
                      >
                        {isEditServiceModalOpen ? 'Update Service' : 'Add Service'}
                      </button>

                    </div>
                  </form>
                </div>
              </div>
            )} {(isAddServiceModalOpen || isEditServiceModalOpen) && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 m-0">
                <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                  <h2 className="text-xl font-semibold mb-4 flex items-center">
                    {isEditServiceModalOpen ? (
                      <>
                        <Edit className="h-5 w-5 mr-2 text-blue-500" />
                        Edit Service: {selectedService?.name}
                      </>
                    ) : (
                      <>
                        <PlusCircle className="h-5 w-5 mr-2 text-blue-500" />
                        Add New Service
                      </>
                    )}
                  </h2>
                  <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                    {isEditServiceModalOpen && (
                      <div className="space-y-2 text-center mb-4">
                        <Label htmlFor="image_url" className="text-sm font-medium text-gray-700">Service Image</Label>
                        <div className="relative w-32 h-32 mx-auto">
                          <img
                            src={imagePreview || `${image}`}
                            alt="Service"
                            className="w-32 h-32 rounded-md object-cover border border-gray-200 shadow-sm"
                          />
                          <label htmlFor="serviceImageInput" className="cursor-pointer">
                            <div className="absolute bottom-1 right-1 bg-gray-800 text-white p-1 rounded-full cursor-pointer hover:bg-gray-700 transition-colors duration-150">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13.5V17h3.5l7.5-7.5a2.121 2.121 0 000-3l-3-3a2.121 2.121 0 00-3 0L9 10.5z" />
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
                        {errors.image && <p className="mt-1 text-xs text-red-500">{errors.image}</p>}
                      </div>
                    )}
      
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Service Name*</label>
                      <input
                        type="text"
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${errors.serviceName ? 'border-red-500' : 'border-gray-300'}`}
                        value={serviceName}
                        onChange={(e) => setServiceName(e.target.value)}
                        onBlur={() => {
                          if (!serviceName.trim()) {
                            setErrors({ ...errors, serviceName: 'Service name is required' });
                          } else if (serviceName.length < 3) {
                            setErrors({ ...errors, serviceName: 'Service name must be at least 3 characters' });
                          } else {
                            setErrors({ ...errors, serviceName: '' });
                          }
                        }}
                        placeholder="Enter service name"
                      />
                      {errors.serviceName && <p className="mt-1 text-xs text-red-500">{errors.serviceName}</p>}
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
                        placeholder="Enter service description"
                        rows="3"
                      />
                      {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
                    </div>
      
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location*</label>
                      <textarea
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${errors.serviceLocation ? 'border-red-500' : 'border-gray-300'}`}
                        value={serviceLocation}
                        onChange={(e) => setServiceLocation(e.target.value)}
                        onBlur={() => {
                          if (!serviceLocation.trim()) {
                            setErrors({ ...errors, serviceLocation: 'Location is required' });
                          } else {
                            setErrors({ ...errors, serviceLocation: '' });
                          }
                        }}
                        placeholder="Enter service location"
                        rows="2"
                      />
                      {errors.serviceLocation && <p className="mt-1 text-xs text-red-500">{errors.serviceLocation}</p>}
                    </div>
      
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)*</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${errors.price ? 'border-red-500' : 'border-gray-300'}`}
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        onBlur={() => {
                          if (!price) {
                            setErrors({ ...errors, price: 'Price is required' });
                          } else if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
                            setErrors({ ...errors, price: 'Price must be a positive number' });
                          } else {
                            setErrors({ ...errors, price: '' });
                          }
                        }}
                        placeholder="Enter service price"
                      />
                      {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price}</p>}
                    </div>
      
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category*</label>
                      <select
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${errors.categoryId ? 'border-red-500' : 'border-gray-300'}`}
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        onBlur={() => {
                          if (!categoryId) {
                            setErrors({ ...errors, categoryId: 'Category is required' });
                          } else {
                            setErrors({ ...errors, categoryId: '' });
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
                      {errors.categoryId && <p className="mt-1 text-xs text-red-500">{errors.categoryId}</p>}
                    </div>
      
                    {!isEditServiceModalOpen && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Service Image*</label>
                        <div className="mt-1 flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            {imagePreview ? (
                              <img
                                src={imagePreview}
                                alt="Service Preview"
                                className="w-32 h-32 rounded-md object-cover border border-gray-200 shadow-sm"
                              />
                            ) : (
                              <div className="w-32 h-32 rounded-md bg-gray-100 flex items-center justify-center border border-gray-200">
                                <svg className="h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <label htmlFor="file-upload" className="cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-2 px-4 rounded-md transition-colors duration-200">
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
                            <p className="text-xs text-gray-500 mt-1">JPG, PNG, GIF or WEBP. Max 5MB.</p>
                          </div>
                        </div>
                        {errors.image && <p className="mt-1 text-xs text-red-500">{errors.image}</p>}
                      </div>
                    )}
      
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <div className="mt-1 space-x-4">
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            className="form-radio text-blue-600"
                            name="status"
                            checked={isActive === true}
                            onChange={() => setIsActive(true)}
                          />
                          <span className="ml-2 text-gray-700">Active</span>
                        </label>
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            className="form-radio text-blue-600"
                            name="status"
                            checked={isActive === false}
                            onChange={() => setIsActive(false)}
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
                        className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors duration-200"
                        onClick={isEditServiceModalOpen ? handleEditService : handleAddService}
                      >
                        {isEditServiceModalOpen ? 'Update Service' : 'Add Service'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
    </div>
  );
};

export default ServicesTab;