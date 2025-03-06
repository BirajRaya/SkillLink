import { useState, useEffect } from 'react';
import { Edit, Trash2, Search, PlusCircle } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";


const Services = () => {
  // State Management
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [isEditServiceModalOpen, setIsEditServiceModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [serviceName, setServiceName] = useState('');
  const [description, setDescription] = useState('');
  const [serviceLocation, setServiceLocation] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [image, setImage] = useState(null); // Image field
  const [isActive, setIsActive] = useState(true); // Default to 'active'
  const [message, setMessage] = useState(null); // Error message state
  const [successMessage, setSuccessMessage] = useState(""); // Success message state for toast
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [base64Image, setBase64Image] = useState(null);
  const { toast } = useToast();
  // Form validation states
  const [errors, setErrors] = useState({
    serviceName: '',
    description: '',
    price: '',
    serviceLocation: '',
    categoryId: '',
    vendorId: '',
    image: ''
  });
  
  // Validation function
  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      serviceName: '',
      description: '',
      price: '',
      serviceLocation: '',
      categoryId: '',
      vendorId: '',
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
    
    // Vendor validation
    if (!vendorId) {
      newErrors.vendorId = 'Vendor is required';
      isValid = false;
    }
    
    // Image validation for new services (not required during edit)
    if (!isEditServiceModalOpen && !image) {
      newErrors.image = 'Image is required for new services';
      isValid = false;
    } else if (image) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(image.type)) {
        newErrors.image = 'Only JPG, PNG, GIF, and WEBP formats are supported';
        isValid = false;
      } else if (image.size > 5 * 1024 * 1024) { // 5MB max size
        newErrors.image = 'Image size must be less than 5MB';
        isValid = false;
      }
    }
    
    setErrors(newErrors);
    return isValid;
  };

  // Fetch services from backend
  const fetchServices = async () => {
    setIsLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // Increased timeout to 15 seconds
  
      // Send request with abort signal
      const response = await api.get('/services/getAllServices', {
        signal: controller.signal, // link the controller to the request
      });
  
      clearTimeout(timeoutId); // Clear the timeout once the response is received
  
      if (response && response.data) {
        setServices(response.data); // Set services if response.data is available
      } else {
        throw new Error("No data received from the server.");
      }
    } catch (error) {
      let errorMsg = "Failed to fetch services";
  
      if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
        // Specific error handling for timeout
        errorMsg = "Request timed out while loading services. Please refresh the page.";
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message; // Use error message from the server
      } else if (error.message) {
        errorMsg = error.message; // Log other errors
      }
  
      setMessage({
        type: 'error',
        text: errorMsg,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch categories and vendors for dropdowns
  const fetchCategoriesAndVendors = async () => {
    try {
      const [categoriesResponse, vendorsResponse] = await Promise.all([
        api.get('/services/active'),
        api.get('/services/users/vendors')
      ]);
  
      setCategories(categoriesResponse.data);
      setVendors(vendorsResponse.data);
  
    } catch (error) {
      console.error("Error fetching categories/vendors:", error);
    }
  };
  
  useEffect(() => {
    fetchServices();
    fetchCategoriesAndVendors();
  }, []);
  
  // Reset form and errors
  const resetForm = () => {
    setServiceName('');
    setDescription('');
    setPrice('');
    setCategoryId('');
    setVendorId('');
    setImage(null);
    setServiceLocation('');
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
    setIsEditServiceModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this service?")) {
      try {
        const response = await api.delete(`/services/delete-service/${id}`);
        if (response.status === 200) {
          fetchServices(); // Refresh services after deletion
          toast({
            title: "Success",
            description: `Service  has been Deleted successfully`
          });
        }
      } catch (error) {
        console.error("Error deleting service:", error);
        setMessage({
          type: 'error',
          text: error.response?.data?.message || "Error deleting service"
        });
      }
    }
  };

  const handleAddService = async () => {
    if (!validateForm()) {
      return; // Stop if validation fails
    }
  
    try {
      // Convert image to base64 before sending
      let base64Image = null;
      if (image) {
        const reader = new FileReader();
        reader.readAsDataURL(image); // Convert image to base64
        reader.onload = async () => {
          base64Image = reader.result; // Store base64 image
          const newService = {
            name: serviceName,
            description,
            price,
            category_id: categoryId,
            vendor_id: vendorId,
            image_url: base64Image, // Add base64 image here
            location: serviceLocation,
            status: isActive,
          };
  
          const formData = new FormData();
          formData.append('name', newService.name);
          formData.append('description', newService.description);
          formData.append('price', newService.price);
          formData.append('category_id', newService.category_id);
          formData.append('vendor_id', newService.vendor_id);
          formData.append('location', newService.location);
          formData.append('status', newService.status);
          if (image) formData.append('image', image);
  
          // Send base64Image in the API request
          const response = await api.post('/services/add-service', newService);
  
          if (response.status === 201) {
            fetchServices();
            setIsAddServiceModalOpen(false);
            resetForm();
            toast({
              title: "Success",
              description: `Service ${response.data.name} has been added successfully`,
            });
  
            setTimeout(() => setSuccessMessage(""), 3000);
          }
        };
      }
    } catch (error) {
      console.error("Error adding service:", error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || "Error adding service",
      });
    }
  };
  

  const handleEditService = async () => {
    if (!validateForm()) {
      return; // Stop if validation fails
    }
    
    try {
      const updatedService = {
        name: serviceName,
        description,
        price,
        category_id: categoryId,
        vendor_id: vendorId,
        image: image ? image.name : null,
        location: serviceLocation,
        status:isActive === true
      };

      const formData = new FormData();
      formData.append('name', updatedService.name);
      formData.append('description', updatedService.description);
      formData.append('price', updatedService.price);
      formData.append('category_id', updatedService.category_id);
      formData.append('vendor_id', updatedService.vendor_id);
      formData.append('location', updatedService.location);
      formData.append('status', updatedService.status);
      if (image) formData.append('image', image);

      const response = await api.put(`/services/update-service/${selectedService.id}`, updatedService);

      if (response.status === 200) {
        fetchServices();
        setIsEditServiceModalOpen(false);
        resetForm();

        toast({
          title: "Success",
          description: `Category ${response.data.name} has been Updated successfully`
        });

        
      }
    } catch (error) {
      console.error("Error editing service:", error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || "Error updating service"
      });
    }
  };

  // Close modals and reset form
  const handleCloseModal = () => {
    setIsAddServiceModalOpen(false);
    setIsEditServiceModalOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-4">   

      {/* Header with search bar and Add Service button */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Services</h1>
        <div className="flex space-x-2 items-center">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              className="pl-10 pr-4 py-2 rounded-md border border-gray-300"
              placeholder="Search services"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>

          {/* Add New Service Button */}
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center"
            onClick={handleOpenAddModal}
          >
            <PlusCircle className="mr-2 h-5 w-5" />
            Add New Service
          </button>
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
  <table className="min-w-full divide-y divide-gray-200">
    <thead className="bg-gray-50">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Name</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th> {/* New Image Column */}
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200">
      {isLoading ? (
        <tr>
          <td colSpan="9" className="text-center py-4">Loading...</td> {/* Update colSpan to 9 */}
        </tr>
      ) : services.length > 0 ? (
        services
          .filter((service) =>
            service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            service.description.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .map((service) => (
            <tr key={service.id}>
              <td className="px-6 py-4 text-sm font-medium text-gray-900">{service.name}</td>
              <td className="px-6 py-4 text-sm text-gray-900 max-w-[200px] truncate" title={service.description}>{service.description}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{service.location}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{service.category_name}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{service.vendor_name}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{service.price}</td>
              <td className="px-6 py-4">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  service.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {service.status ? 'Active' : 'Inactive'}
                </span>
              </td>
              
              {/* Image Column */}
              <td className="px-6 py-4">
                {service.image_url ? (
                  <img
                    src={`data:image/jpeg;base64,${service.image_url}`} // Assuming the base64 string is for a JPEG image
                    alt="Service"
                    className="h-10 w-10 object-cover rounded"
                  />
                ) : (
                  <span>No Image</span>
                )}
              </td>

              <td className="px-6 py-4">
                <div className="flex space-x-2">
                  <button
                    className="text-blue-500 hover:text-blue-700"
                    onClick={() => handleEdit(service)}
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    className="text-red-500 hover:text-red-700"
                    onClick={() => handleDelete(service.id)}
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </td>
            </tr>
          ))
      ) : (
        <tr>
          <td colSpan="9" className="text-center py-4">No services available</td> {/* Update colSpan to 9 */}
        </tr>
      )}
    </tbody>
  </table>
</div>



      {/* Add/Edit Service Modal */}
      {isAddServiceModalOpen || isEditServiceModalOpen ? (
        <div className="fixed inset-0 flex justify-center items-center bg-gray-800 bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 shadow-lg w-full max-w-lg">
            <h2 className="text-xl font-semibold mb-4">
              {isEditServiceModalOpen ? 'Edit Service' : 'Add New Service'}
            </h2>
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Service Name *</label>
                <input
                  type="text"
                  className={`w-full mt-1 px-3 py-2 border rounded-md ${
                    errors.serviceName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  onBlur={() => {
                    if (!serviceName.trim()) {
                      setErrors({...errors, serviceName: 'Service name is required'});
                    } else if (serviceName.length < 3) {
                      setErrors({...errors, serviceName: 'Service name must be at least 3 characters'});
                    } else {
                      setErrors({...errors, serviceName: ''});
                    }
                  }}
                />
                {errors.serviceName && <p className="mt-1 text-xs text-red-500">{errors.serviceName}</p>}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Description *</label>
                <textarea
                  className={`w-full mt-1 px-3 py-2 border rounded-md ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={() => {
                    if (!description.trim()) {
                      setErrors({...errors, description: 'Description is required'});
                    } else if (description.length < 10) {
                      setErrors({...errors, description: 'Description must be at least 10 characters'});
                    } else {
                      setErrors({...errors, description: ''});
                    }
                  }}
                />
                {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Price *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className={`w-full mt-1 px-3 py-2 border rounded-md ${
                    errors.price ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  
                />
                {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price}</p>}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Location *</label>
                <textarea
                  className={`w-full mt-1 px-3 py-2 border rounded-md ${
                    errors.serviceLocation ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={serviceLocation}
                  onChange={(e) => setServiceLocation(e.target.value)}
                  onBlur={() => {
                    if (!serviceLocation.trim()) {
                      setErrors({...errors, serviceLocation: 'Location is required'});
                    } else {
                      setErrors({...errors, serviceLocation: ''});
                    }
                  }}
                />
                {errors.serviceLocation && <p className="mt-1 text-xs text-red-500">{errors.serviceLocation}</p>}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Category *</label>
                <select
                  className={`w-full mt-1 px-3 py-2 border rounded-md ${
                    errors.categoryId ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  onBlur={() => {
                    if (!categoryId) {
                      setErrors({...errors, categoryId: 'Category is required'});
                    } else {
                      setErrors({...errors, categoryId: ''});
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

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Vendor *</label>
                <select
                  className={`w-full mt-1 px-3 py-2 border rounded-md ${
                    errors.vendorId ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                  onBlur={() => {
                    if (!vendorId) {
                      setErrors({...errors, vendorId: 'Vendor is required'});
                    } else {
                      setErrors({...errors, vendorId: ''});
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
                {errors.vendorId && <p className="mt-1 text-xs text-red-500">{errors.vendorId}</p>}
              </div>

              <div className="mb-4">
  <label className="block text-sm font-medium text-gray-700">
    Service Image {!isEditServiceModalOpen && '*'}
  </label>
  <input
    type="file"
    accept="image/jpeg, image/png, image/gif, image/webp"
    className={`w-full mt-1 px-3 py-2 border rounded-md ${
      errors.image ? 'border-red-500' : 'border-gray-300'
    }`}
    onChange={(e) => {
      const file = e.target.files[0];
      setImage(file);

      // Validate file on change
      if (!isEditServiceModalOpen && !file) {
        setErrors({...errors, image: 'Image is required for new services'});
      } else if (file) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        
        if (!allowedTypes.includes(file.type)) {
          setErrors({...errors, image: 'Only JPG, PNG, GIF, and WEBP formats are supported'});
        } else if (file.size > 5 * 1024 * 1024) { // 5MB max size
          setErrors({...errors, image: 'Image size must be less than 5MB'});
        } else {
          setErrors({...errors, image: ''}); // Clear any previous error

          // Convert image to base64
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            setBase64Image(reader.result); // Store base64 image string
          };
        }
      }
    }}
  />
  {errors.image && <p className="mt-1 text-xs text-red-500">{errors.image}</p>}
  <p className="mt-1 text-xs text-gray-500">Recommended: JPG, PNG, GIF or WEBP (max. 5MB)</p>
</div>


              <div className="mb-4">
              <label htmlFor="is_active" className="block text-sm font-medium text-gray-700">Status</label>
              <select
                id="is_active"
                value={isActive}
                onChange={(e) => setIsActive(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                  onClick={isEditServiceModalOpen ? handleEditService : handleAddService}
                >
                  {isEditServiceModalOpen ? 'Save Changes' : 'Add Service'}
                </button>
                <button
                  type="button"
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                  onClick={handleCloseModal}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Services;