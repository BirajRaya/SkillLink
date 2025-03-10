import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { 
    ArrowLeft, 
    Star, 
    MapPin,
    AlertCircle
} from "lucide-react";
import api from '@/lib/api';
// Import the new component
import UserServiceReviews from './UserServiceReviews';

const ServiceDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    // State Management
    const [service, setService] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch service details
    useEffect(() => {
        const fetchServiceDetails = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const response = await api.get(`/services/${id}`);
                if (response.data) {
                    setService(response.data);
                } else {
                    setError('No data received from server');
                }
            } catch (error) {
                console.error('Error fetching service details:', error);
                setError(error.response?.data?.message || 'Failed to load service details');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchServiceDetails();
        }
    }, [id]);

    // Refresh service data when reviews change
    const handleReviewUpdate = async () => {
        try {
            const response = await api.get(`/services/${id}`);
            if (response.data) {
                setService(response.data);
            }
        } catch (error) {
            console.error('Error refreshing service data:', error);
        }
    };

    // Utility Functions
    const formatRating = (rating) => {
        if (!rating) return 'New';
        const numRating = parseFloat(rating);
        return isNaN(numRating) ? 'New' : numRating.toFixed(1);
    };

    // Loading State
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                <p className="ml-3 text-lg text-blue-600 font-medium">Loading service details...</p>
            </div>
        );
    }

    // Error State
    if (error || !service) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md p-8 bg-white rounded-xl shadow-lg">
                    <div className="inline-block p-3 bg-red-100 rounded-full mb-4">
                        <AlertCircle className="h-10 w-10 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Service not found</h2>
                    <p className="text-gray-600 mb-6">{error || "The service you're looking for doesn't exist or has been removed."}</p>
                    <Button onClick={() => navigate(-1)}>
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    // Main UI
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <button 
                        onClick={() => navigate(-1)}
                        className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5 mr-2" />
                        Back
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    {/* Service Image and Basic Info */}
                    <div className="relative h-72 md:h-96 lg:h-[30rem]">
                        <img
                            src={service.image_url || 'https://via.placeholder.com/1200x800'}
                            alt={service.name}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                                <div>
                                    <div className="bg-blue-600 text-white text-sm font-medium px-3 py-1 rounded-full inline-block mb-3">
                                        {service.category_name}
                                    </div>
                                    <h1 className="text-3xl md:text-4xl font-bold mb-2 text-shadow">{service.name}</h1>
                                    <div className="flex flex-wrap items-center gap-4">
                                        {service.location && (
                                            <div className="flex items-center">
                                                <MapPin className="h-5 w-5 mr-1" />
                                                {service.location}
                                            </div>
                                        )}
                                        <div className="flex items-center bg-black/30 px-3 py-1 rounded-full">
                                            <Star className="h-5 w-5 text-yellow-400 fill-current mr-1" />
                                            {formatRating(service.average_rating)}
                                            <span className="text-sm ml-1">
                                                ({service.review_count || 0} reviews)
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Service Details */}
                    <div className="p-6 md:p-8 lg:p-10">
                        {/* Vendor Info with Book Now button */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl mb-8 shadow-sm">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                                <div>
                                    <h3 className="text-lg font-semibold mb-4 text-blue-900">Service Provider</h3>
                                    <div className="flex items-center gap-4">
                                        <img 
                                            src={service.vendor_image || 'https://via.placeholder.com/60'} 
                                            alt={service.vendor_name}
                                            className="w-16 h-16 rounded-full border-4 border-white shadow-md" 
                                        />
                                        <div>
                                            <p className="text-xl font-medium text-gray-800">{service.vendor_name}</p>
                                            <p className="text-sm text-gray-600">{service.category_name} Provider</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="mt-4 md:mt-0 flex flex-col items-end">
                                    <div className="bg-white px-5 py-3 rounded-lg shadow-sm mb-4 border border-gray-100">
                                        <p className="text-sm text-gray-500 mb-1">Price</p>
                                        <p className="text-3xl font-bold text-blue-600">${service.price}</p>
                                    </div>
                                    <Button 
                                        className="bg-blue-600 hover:bg-blue-700 text-lg py-4 px-8 w-full md:w-auto transition-all duration-200 ease-in-out transform hover:scale-105"
                                    >
                                        Book Now
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="mb-10">
                            <h2 className="text-2xl font-semibold mb-4 text-gray-800">About This Service</h2>
                            <div className="prose max-w-none text-gray-600">
                                <p className="whitespace-pre-line">
                                    {service.description}
                                </p>
                            </div>
                        </div>

                        {/* Reviews Section - Using the UserServiceReviews component */}
                        <UserServiceReviews 
                            serviceId={id} 
                            reviews={service.reviews} 
                            onReviewUpdate={handleReviewUpdate} 
                        />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ServiceDetails;