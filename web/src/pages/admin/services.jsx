import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Search, PlusCircle } from "lucide-react";
import api from "@/lib/api";

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
  const [message, setMessage] = useState(null); // Error message state
  const [successMessage, setSuccessMessage] = useState(""); // Success message state for toast
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  

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
      console.log(categoriesResponse.data);
      setVendors(vendorsResponse.data);
  
    } catch (error) {
      console.error("Error fetching categories/vendors:", error);
    }
  };
  
  useEffect(() => {
    fetchServices();
    fetchCategoriesAndVendors();
  }, []);
  

  const handleEdit = (service) => {
    setSelectedService(service);
    setServiceName(service.name);
    setDescription(service.description);
    setPrice(service.price);
    setCategoryId(service.category_id);
    setVendorId(service.vendor_id);
    setIsEditServiceModalOpen(true);
    setServiceLocation(service.location);
  };

  const handleDelete = async (id) => {
    try {
      const response = await api.delete(`/services/delete-service/${id}`);
      if (response.status === 200) {
        setSuccessMessage("Service deleted successfully!");
        fetchServices(); // Refresh services after deletion
      }
    } catch (error) {
      console.error("Error deleting service:", error);
    }
  };

  const handleAddService = async () => {
    
    
    try {
      const newService = {
        name: serviceName,
        description,
        price,
        category_id: categoryId,
        vendor_id: vendorId,
        image: image ? image.name : null, // Send the image name if selected,
        location:serviceLocation
      };

      const formData = new FormData();
      formData.append('name', newService.name);
      formData.append('description', newService.description);
      formData.append('price', newService.price);
      formData.append('category_id', newService.category_id);
      formData.append('vendor_id', newService.vendor_id);
      if (image) formData.append('image', image); // Append image if provided

      const response = await api.post('/services/add-service', newService, {
      });

      if (response.status === 201) {
        fetchServices(); // Refresh services after adding
        setIsAddServiceModalOpen(false); // Close modal
        setServiceName(''); // Clear the form inputs
        setDescription('');
        setPrice('');
        setCategoryId('');
        setVendorId('');
        setImage(null);
        setServiceLocation('');

        // Display success toast
        setSuccessMessage("Service added successfully!");

        // Hide the toast after 3 seconds
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error adding service:", error);
    }
  };

  const handleEditService = async () => {
    try {
      const updatedService = {
        name: serviceName,
        description,
        price,
        category_id: categoryId,
        vendor_id: vendorId,
        image: image ? image.name : null, // Send the image name if selected,
        location:serviceLocation
      };

      const formData = new FormData();
      formData.append('name', updatedService.name);
      formData.append('description', updatedService.description);
      formData.append('price', updatedService.price);
      formData.append('category_id', updatedService.category_id);
      formData.append('vendor_id', updatedService.vendor_id);
      if (image) formData.append('image', image); // Append image if provided

      const response = await api.put(`/services/update-service/${selectedService.id}`, updatedService, {
      });

      if (response.status === 200) {
        fetchServices(); // Refresh services after editing
        setIsEditServiceModalOpen(false); // Close modal
        setServiceName(''); // Clear the form inputs
        setDescription('');
        setPrice('');
        setCategoryId('');
        setVendorId('');
        setImage(null);
        setServiceLocation('');

        // Display success toast
        setSuccessMessage("Service updated successfully!");

        // Hide the toast after 3 seconds
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error editing service:", error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Success Toast */}
      {successMessage && (
        <div id="status-message" className="mb-4 p-4 rounded-md flex items-center bg-green-100 border border-green-300 text-green-800">
          <div className="w-6 h-6 mr-3 rounded-full flex items-center justify-center bg-green-500 text-white">
            ✓
          </div>
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

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
            onClick={() => setIsAddServiceModalOpen(true)}
          >
            <PlusCircle className="mr-2 h-5 w-5" />
            Add New Service
          </button>
        </div>
      </div>

      {/* Services Table */}
      <div className="overflow-x-auto bg-white shadow rounded-lg p-4">
      <table className="min-w-full text-sm text-left">
  <thead>
    <tr className="bg-gray-200">
      <th className="py-2 px-4">Service Name</th>
      <th className="py-2 px-4">Description</th>
      <th className="py-2 px-4">Location</th>
      <th className="py-2 px-4">Category</th>
      <th className="py-2 px-4">Vendor</th>
      <th className="py-2 px-4">Price</th>
      <th className="py-2 px-4">Active</th>
      <th className="py-2 px-4">Actions</th>
    </tr>
  </thead>
  <tbody>
    {isLoading ? (
      <tr>
        <td colSpan="5" className="py-2 px-4 text-center">Loading...</td>
      </tr>
    ) : services.length > 0 ? (
      services
        .filter((service) =>
          service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .map((service) => (
          <tr key={service.id}>
            <td className="py-2 px-4">{service.name}</td>
            <td className="py-2 px-4">{service.description}</td>
            <td className="py-2 px-4">{service.location}</td>
            <td className="py-2 px-4">{service.category_name}</td>
            <td className="py-2 px-4">{service.vendor_name}</td>
            <td className="py-2 px-4">{service.price}</td>
            <td className="py-2 px-4">
              <span
                className={`px-2 py-1 text-xs font-semibold rounded ${
                  service.status === "Active" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                }`}
              >
                {service.status}
              </span>
            </td>
            <td className="py-2 px-4 flex space-x-2">
              {/* Edit Button */}
              <button
                className="text-blue-500 hover:text-blue-600"
                onClick={() => handleEdit(service)}
              >
                <Edit />
              </button>

              {/* Update Button */}
              <button
                className="text-yellow-500 hover:text-yellow-600"
                onClick={() => handleUpdate(service)}
              >
                {/* <Save /> */}
              </button>

              {/* Activate/Deactivate Button */}
              <button
                className={`${
                  service.status === "Active" ? "text-red-500 hover:text-red-600" : "text-green-500 hover:text-green-600"
                }`}
                onClick={() => toggleServiceStatus(service.id, service.status)}
              >
                {/* {service.status === "Active" ? <XCircle /> : <CheckCircle />} */}
              </button>
              <button
                  className="text-red-500 hover:text-red-600"
                  onClick={() => handleDelete(service.id)}
                >
                  <Trash2 />
                </button>
            </td>
          </tr>
        ))
    ) : (
      <tr>
        <td colSpan="5" className="py-2 px-4 text-center">No services available</td>
      </tr>
    )}
  </tbody>
</table>

      </div>

      {/* Add/Edit Service Modal */}
       {isAddServiceModalOpen || isEditServiceModalOpen ? (
        <div className="fixed inset-0 flex justify-center items-center bg-gray-800 bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 shadow-lg w-96">
            <h2 className="text-xl font-semibold mb-4">
              {isEditServiceModalOpen ? 'Edit Service' : 'Add New Service'}
            </h2>
            <form>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Service Name</label>
                <input
                  type="text"
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Price</label>
                <input
                  type="number"
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <textarea
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                  value={serviceLocation}
                  onChange={(e) => setServiceLocation(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.category_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Vendor</label>
                <select
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                >
                  <option value="">Select Vendor</option>
                  {vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Service Image</label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                  onChange={(e) => setImage(e.target.files[0])}
                />
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  className="bg-blue-500 text-white px-4 py-2 rounded-md"
                  onClick={isEditServiceModalOpen ? handleEditService : handleAddService}
                >
                  {isEditServiceModalOpen ? 'Save Changes' : 'Add Service'}
                </button>
                <button
                  type="button"
                  className="bg-gray-500 text-white px-4 py-2 rounded-md"
                  onClick={() => {
                    setIsAddServiceModalOpen(false);
                    setIsEditServiceModalOpen(false);
                  }}
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
