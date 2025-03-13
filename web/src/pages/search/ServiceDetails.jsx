import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { 
    ArrowLeft, 
    Star, 
    MapPin,
    AlertCircle,
    Calendar,
    Eye,
    ChevronDown,
    ChevronUp,
    CheckCircle,
    Ban
} from "lucide-react";
import api from '@/lib/api';
import { useAuth } from '@/utils/AuthContext';
// Import components
import UserServiceReviews from './UserServiceReviews';
import BookingForm from './BookingForm';
import BookingDetails from './BookingDetails';

const ServiceDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, currentUser } = useAuth();
    
    // State Management
    const [service, setService] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showBookingForm, setShowBookingForm] = useState(false);
    const [existingBooking, setExistingBooking] = useState(null);
    const [userBookings, setUserBookings] = useState([]); // Added state for all user bookings
    const [bookingLoading, setBookingLoading] = useState(false);
    const [showBookingDetails, setShowBookingDetails] = useState(false); // Initially hidden
    const [showSuccessMessage, setShowSuccessMessage] = useState(false); // Success message visibility
    const [serviceAvailability, setServiceAvailability] = useState({
        isAvailable: true,
        booking: null,
        loading: false,
        error: null
    });

    // Check if the URL contains an action parameter to show booking form
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const action = queryParams.get('action');
        if (action === 'book') {
            setShowBookingForm(true);
        }
    }, [location]);

    // Check service availability
    const checkServiceAvailability = async () => {
        if (!id || !isAuthenticated) return;
        
        try {
            setServiceAvailability(prev => ({ ...prev, loading: true, error: null }));
            console.log(`Checking availability for service ${id}`);
            
            const response = await api.get(`/bookings/service/${id}/availability`);
            
            if (response.data) {
                console.log(`Service ${id} availability status: ${response.data.isAvailable ? 'Available' : 'Unavailable'}`);
                setServiceAvailability({
                    isAvailable: response.data.isAvailable,
                    booking: response.data.booking,
                    loading: false,
                    error: null
                });
            }
        } catch (error) {
            console.error('Error checking service availability:', error);
            setServiceAvailability(prev => ({
                ...prev,
                loading: false,
                error: 'Unable to check service availability'
            }));
        }
    };

    // Check localStorage for existing booking on initial render
    useEffect(() => {
        // Try to get booking information from localStorage
        const storedBookingInfo = localStorage.getItem(`booking_service_${id}`);
        if (storedBookingInfo) {
            try {
                const bookingInfo = JSON.parse(storedBookingInfo);
                // Only restore if not expired (24 hours)
                const now = new Date();
                const storedTime = new Date(bookingInfo.timestamp);
                const hoursDiff = (now - storedTime) / (1000 * 60 * 60);
                
                if (hoursDiff < 24) {
                    setExistingBooking(bookingInfo.booking);
                    // Don't show details automatically - keep them hidden until user clicks
                    setShowBookingDetails(false);
                } else {
                    // Clear expired data
                    localStorage.removeItem(`booking_service_${id}`);
                }
            } catch (e) {
                console.error('Error parsing stored booking data:', e);
                localStorage.removeItem(`booking_service_${id}`);
            }
        }
    }, [id]);

    // Fetch service details, check for existing booking, and verify service availability
    useEffect(() => {
        const fetchServiceDetails = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // Fetch service details
                const serviceResponse = await api.get(`/services/${id}`);
                if (serviceResponse.data) {
                    setService(serviceResponse.data);
                    
                    // Check service availability
                    await checkServiceAvailability();
                    
                    // If user is authenticated, check for existing bookings for this service
                    if (isAuthenticated && currentUser) {
                        setBookingLoading(true);
                        try {
                            // First, check current booking
                            const bookingResponse = await api.get(`/bookings/check/${id}`);
                            
                            if (bookingResponse.data && bookingResponse.data.hasBooking) {
                                const booking = bookingResponse.data.booking;
                                setExistingBooking(booking);
                                
                                // Save to localStorage with timestamp
                                localStorage.setItem(`booking_service_${id}`, JSON.stringify({
                                    booking,
                                    timestamp: new Date().toISOString()
                                }));
                            } else {
                                // No booking found - clear localStorage
                                localStorage.removeItem(`booking_service_${id}`);
                            }
                            
                            // NEW CODE: Fetch all user's bookings for this service (for review eligibility)
                            const userBookingsResponse = await api.get(`/bookings/user/${currentUser.id}/service/${id}`);
                            if (userBookingsResponse.data && userBookingsResponse.data.bookings) {
                                setUserBookings(userBookingsResponse.data.bookings);
                                console.log("User bookings for this service:", userBookingsResponse.data.bookings);
                            }
                        } catch (bookingError) {
                            console.error('Error checking for bookings:', bookingError);
                        } finally {
                            setBookingLoading(false);
                        }
                    }
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
    }, [id, isAuthenticated, currentUser]);

    // Update bookings data after a booking status change
    const updateUserBookings = async () => {
        if (!isAuthenticated || !currentUser || !id) return;
        
        try {
            const response = await api.get(`/bookings/user/${currentUser.id}/service/${id}`);
            if (response.data && response.data.bookings) {
                setUserBookings(response.data.bookings);
            }
        } catch (error) {
            console.error('Error updating user bookings:', error);
        }
    };

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

    // Handle new booking submission
    const handleBookingComplete = (booking) => {
        setExistingBooking(booking);
        setShowBookingForm(false);
        setShowBookingDetails(false); // Initially hide booking details
        setShowSuccessMessage(true); // Show success message instead
        
        // Save to localStorage with timestamp
        localStorage.setItem(`booking_service_${id}`, JSON.stringify({
            booking,
            timestamp: new Date().toISOString()
        }));
        
        // Hide success message after 5 seconds
        setTimeout(() => {
            setShowSuccessMessage(false);
        }, 5000);
        
        // Refresh service availability & update user bookings
        checkServiceAvailability();
        updateUserBookings();
    };

    // Handle booking cancellation
    const handleCancelBooking = () => {
        setExistingBooking(prev => ({
            ...prev,
            status: 'cancelled' // Update the status locally
        }));
        setShowBookingDetails(false); // Hide booking details after cancellation
        
        // Update localStorage with cancelled status
        if (existingBooking) {
            localStorage.setItem(`booking_service_${id}`, JSON.stringify({
                booking: {...existingBooking, status: 'cancelled'},
                timestamp: new Date().toISOString()
            }));
        }
        
        // Show success message for cancellation
        setShowSuccessMessage(true);
        setTimeout(() => {
            setShowSuccessMessage(false);
        }, 5000);
        
        // Refresh service availability & update user bookings
        checkServiceAvailability();
        updateUserBookings();
    };

    // Handle booking completion (when status changes to completed)
    const handleBookingStatusChange = (booking) => {
        setExistingBooking(booking);
        
        // Update localStorage with new status
        localStorage.setItem(`booking_service_${id}`, JSON.stringify({
            booking,
            timestamp: new Date().toISOString()
        }));
        
        // Refresh service availability & update user bookings
        checkServiceAvailability();
        updateUserBookings();
    };

    // Handle toggle booking details visibility
    const toggleBookingDetails = () => {
        setShowBookingDetails(prev => !prev);
        // Hide success message when showing details
        if (!showBookingDetails) {
            setShowSuccessMessage(false);
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

    // Determine if we should show booking button/details based on booking status
    const hasActiveBooking = existingBooking && existingBooking.status !== 'cancelled' && 
                             existingBooking.status !== 'rejected' && existingBooking.status !== 'completed';
                             
    // Check if user has any completed bookings (for review eligibility)
    const hasCompletedBooking = userBookings.some(booking => booking.status === 'completed');

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
                                    
                                    {/* Book Now / View Booking / Review Button */}
                                    {bookingLoading || serviceAvailability.loading ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                                    ) : hasActiveBooking ? (
                                        <Button 
                                            className={`bg-green-600 hover:bg-green-700 text-lg py-4 px-8 w-full md:w-auto transition-all duration-200 ease-in-out transform hover:scale-105 flex items-center ${showBookingDetails ? 'bg-green-700' : 'bg-green-600'}`}
                                            onClick={toggleBookingDetails}
                                        >
                                            <Eye className="mr-2 h-5 w-5" />
                                            {showBookingDetails ? 'Hide Details' : 'View Booking'}
                                            {showBookingDetails ? 
                                                <ChevronUp className="ml-2 h-5 w-5" /> : 
                                                <ChevronDown className="ml-2 h-5 w-5" />
                                            }
                                        </Button>
                                    ) : hasCompletedBooking ? (
                                        <div className="flex gap-2">
                                            <Button 
                                                className="bg-yellow-500 hover:bg-yellow-600 text-lg py-4 px-8 flex items-center"
                                                onClick={() => {
                                                    // Scroll to reviews section
                                                    document.getElementById('reviews-section').scrollIntoView({ 
                                                        behavior: 'smooth' 
                                                    });
                                                }}
                                            >
                                                <Star className="mr-2 h-5 w-5" fill="white" />
                                                Leave a Review
                                            </Button>
                                            {!serviceAvailability.isAvailable ? null : (
                                                <Button 
                                                    className="bg-blue-600 hover:bg-blue-700 text-lg py-4 px-8"
                                                    onClick={() => {
                                                        if (isAuthenticated) {
                                                            setShowBookingForm(!showBookingForm);
                                                        } else {
                                                            navigate('/login', { state: { from: `/services/${id}` } });
                                                        }
                                                    }}
                                                >
                                                    <Calendar className="mr-2 h-5 w-5" />
                                                    Book Again
                                                </Button>
                                            )}
                                        </div>
                                    ) : !serviceAvailability.isAvailable ? (
                                        <Button 
                                            className="bg-gray-400 text-lg py-4 px-8 w-full md:w-auto cursor-not-allowed"
                                            disabled={true}
                                        >
                                            <Ban className="mr-2 h-5 w-5" />
                                            Currently Unavailable
                                        </Button>
                                    ) : (
                                        <Button 
                                            className="bg-blue-600 hover:bg-blue-700 text-lg py-4 px-8 w-full md:w-auto transition-all duration-200 ease-in-out transform hover:scale-105"
                                            onClick={() => {
                                                if (isAuthenticated) {
                                                    setShowBookingForm(!showBookingForm);
                                                } else {
                                                    navigate('/login', { state: { from: `/services/${id}` } });
                                                }
                                            }}
                                        >
                                            <Calendar className="mr-2 h-5 w-5" />
                                            {showBookingForm ? 'Hide Booking Form' : 'Book Now'}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {/* Service Unavailability Message */}
                        {!serviceAvailability.isAvailable && !hasActiveBooking && (
                            <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-6">
                                <div className="flex items-start space-x-4">
                                    <AlertCircle className="h-6 w-6 text-amber-600 mt-1" />
                                    <div>
                                        <h3 className="text-lg font-semibold text-amber-800">
                                            This service is currently booked
                                        </h3>
                                        <p className="text-amber-700 mt-1">
                                            The service provider has accepted another booking. This service will become available
                                            again once the current booking is completed or cancelled.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Success Message */}
                        {showSuccessMessage && (
                            <div className="mb-10 bg-green-50 border border-green-200 rounded-xl p-6 flex items-center">
                                <CheckCircle className="h-8 w-8 text-green-600 mr-4" />
                                <div>
                                    <h3 className="text-xl font-semibold text-green-800">
                                        {existingBooking && existingBooking.status === 'cancelled' 
                                            ? 'Booking Cancelled!'
                                            : 'Booking Successful!'}
                                    </h3>
                                    <p className="text-green-700">
                                        {existingBooking && existingBooking.status === 'cancelled'
                                            ? 'Your booking has been cancelled.'
                                            : 'Your booking has been confirmed. Click "View Booking" to see details.'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Book Now Form */}
                        {showBookingForm && !hasActiveBooking && serviceAvailability.isAvailable && (
                            <div className="mb-10">
                                <BookingForm 
                                    service={service} 
                                    onBookingComplete={handleBookingComplete}
                                />
                            </div>
                        )}

                        {/* Existing Booking Details */}
                        {existingBooking && showBookingDetails && (
                            <div className="mb-10">
                                <BookingDetails 
                                    booking={existingBooking} 
                                    onCancelBooking={handleCancelBooking}
                                    onStatusChange={handleBookingStatusChange}
                                />
                            </div>
                        )}

                        {/* Description */}
                        <div className="mb-10">
                            <h2 className="text-2xl font-semibold mb-4 text-gray-800">About This Service</h2>
                            <div className="prose max-w-none text-gray-600">
                                <p className="whitespace-pre-line">
                                    {service.description}
                                </p>
                            </div>
                        </div>

                        {/* Reviews Section - Modified to pass bookings data and add ID for scrolling */}
                        <div id="reviews-section">
                            <UserServiceReviews 
                                serviceId={id} 
                                reviews={service.reviews} 
                                onReviewUpdate={handleReviewUpdate}
                                bookings={userBookings} 
                            />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ServiceDetails;