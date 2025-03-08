/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { 
    ArrowLeft, 
    Star, 
    MapPin,
    CheckCircle,
    Edit,
    Trash,
    AlertCircle,
    AlertTriangle
} from "lucide-react";
import api from '@/lib/api';

const ServiceDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    // State Management
    const [service, setService] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [review, setReview] = useState({
        rating: 5,
        comment: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [userReview, setUserReview] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [reviewMessage, setReviewMessage] = useState({ type: '', text: '' });
    const [actionMessage, setActionMessage] = useState({ type: '', text: '' });

    // Improved user login detection
    const currentUser = localStorage.getItem('userLogin') || '';  // Get from your auth system
    const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' '); // Current UTC time
    // Check if user is logged in - ensuring empty strings don't count as logged in
    const isLoggedIn = Boolean(currentUser && currentUser.trim() !== '');

    // Fetch service details and user's review
    useEffect(() => {
        const fetchServiceDetails = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const response = await api.get(`/services/${id}`);
                if (response.data) {
                    setService(response.data);
                    // Check if user has already reviewed
                    if (isLoggedIn && response.data.reviews) {
                        const existingReview = response.data.reviews.find(
                            r => r.reviewer_login === currentUser
                        );
                        if (existingReview) {
                            setUserReview(existingReview);
                            setReview({
                                rating: existingReview.rating,
                                comment: existingReview.comment
                            });
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
    }, [id, isLoggedIn, currentUser]);

    // Utility Functions
    const formatRating = (rating) => {
        if (!rating) return 'New';
        const numRating = parseFloat(rating);
        return isNaN(numRating) ? 'New' : numRating.toFixed(1);
    };

    // Clear messages when form closes
    const clearMessages = () => {
        setReviewMessage({ type: '', text: '' });
        setActionMessage({ type: '', text: '' });
    };

    // Event Handlers
    const handleReviewChange = (e) => {
        const { name, value } = e.target;
        setReview(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleRatingChange = (newRating) => {
        setReview(prev => ({
            ...prev,
            rating: newRating
        }));
    };

    // For non-logged in users - shows only login message
    const handleNonLoggedInReview = () => {
        // User is not logged in
        setReviewMessage({
            type: 'error',
            text: 'Please log in to submit a review'
        });
        // Don't show the form
        setShowReviewForm(false);
    };

    // For logged-in users without existing review - shows form
    const handleNewReview = () => {
        clearMessages();
        setIsEditing(false);
        setShowReviewForm(true);
    };

    // For logged-in users with existing review - shows edit form
    const handleExistingReview = () => {
        clearMessages();
        setIsEditing(true);
        setShowReviewForm(true);
        // Set current review data
        if (userReview) {
            setReview({
                rating: userReview.rating,
                comment: userReview.comment
            });
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        
        if (!isLoggedIn) {
            setReviewMessage({ 
                type: 'error', 
                text: 'Please log in to submit a review' 
            });
            return;
        }
    
        // Clear previous messages
        setReviewMessage({ type: '', text: '' });
        
        // Client-side validation
        if (!review.comment.trim()) {
            setReviewMessage({ 
                type: 'error', 
                text: 'Please provide feedback in your review' 
            });
            return;
        }
    
        setSubmitting(true);
    
        try {
            let response;
            if (isEditing && userReview) {
                // Update existing review
                response = await api.put(`/services/${id}/reviews/${userReview.id}`, review, {
                    headers: {
                        'x-user-login': currentUser,
                        'x-current-time': currentTime
                    }
                });
            } else {
                // Create new review
                response = await api.post(`/services/${id}/reviews`, review, {
                    headers: {
                        'x-user-login': currentUser,
                        'x-current-time': currentTime
                    }
                });
            }
    
            if (response.data.status === 'success') {
                setSubmitSuccess(true);
                
                // Update the review in the UI
                const updatedReview = {
                    ...response.data.data.review,
                    reviewer_name: response.data.data.reviewer_name,
                    reviewer_login: currentUser
                };
                
                setUserReview(updatedReview);
                
                // Update service stats and reviews
                setService(prev => ({
                    ...prev,
                    average_rating: response.data.data.service.average_rating,
                    review_count: response.data.data.service.review_count,
                    reviews: isEditing 
                        ? prev.reviews.map(r => r.id === userReview.id ? updatedReview : r)
                        : [...prev.reviews, updatedReview]
                }));
    
                setReviewMessage({
                    type: 'success',
                    text: isEditing 
                        ? 'Your review has been updated successfully!' 
                        : 'Thank you! Your review has been submitted successfully!'
                });
    
                // Clear form after success
                setTimeout(() => {
                    setShowReviewForm(false);
                    setIsEditing(false);
                    clearMessages();
                }, 2000);
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to submit review';
            setReviewMessage({ type: 'error', text: errorMessage });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteReview = () => {
        if (!userReview) return;
        
        if (window.confirm('Are you sure you want to delete your review?')) {
            deleteReview();
        }
    };

    // Separate the actual delete functionality
    const deleteReview = async () => {
        setSubmitting(true);
        
        try {
            const response = await api.delete(`/services/${id}/reviews/${userReview.id}`, {
                headers: {
                    'x-user-login': currentUser,
                    'x-current-time': currentTime
                }
            });

            if (response.data.status === 'success') {
                setUserReview(null);
                setIsEditing(false);
                setShowReviewForm(false);
                
                // Update service stats and reviews
                setService(prev => ({
                    ...prev,
                    average_rating: response.data.data.average_rating,
                    review_count: response.data.data.review_count,
                    reviews: prev.reviews.filter(r => r.id !== userReview.id)
                }));

                // Show success message near the reviews section
                setActionMessage({ 
                    type: 'success', 
                    text: 'Your review has been deleted successfully' 
                });
                
                // Clear message after a delay
                setTimeout(() => {
                    setActionMessage({ type: '', text: '' });
                }, 3000);
            }
        } catch (error) {
            setActionMessage({ 
                type: 'error', 
                text: error.response?.data?.message || 'Failed to delete review' 
            });
        } finally {
            setSubmitting(false);
        }
    };

    // Message Component
    const MessageAlert = ({ type, message }) => {
        if (!message) return null;
        
        let bgColor = 'bg-gray-100';
        let textColor = 'text-gray-800';
        let icon = null;
        
        if (type === 'error') {
            bgColor = 'bg-red-50';
            textColor = 'text-red-800';
            icon = <AlertCircle className="h-5 w-5 text-red-500" />;
        } else if (type === 'success') {
            bgColor = 'bg-green-50';
            textColor = 'text-green-800';
            icon = <CheckCircle className="h-5 w-5 text-green-500" />;
        } else if (type === 'warning') {
            bgColor = 'bg-yellow-50';
            textColor = 'text-yellow-800';
            icon = <AlertTriangle className="h-5 w-5 text-yellow-500" />;
        }
        
        return (
            <div className={`flex items-center gap-2 ${bgColor} ${textColor} px-4 py-3 rounded-md my-3`}>
                {icon}
                <span>{message}</span>
            </div>
        );
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
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
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
                        Back to Search Results
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
                                        <div className="flex items-center">
                                            <MapPin className="h-5 w-5 mr-1" />
                                            {service.location}
                                        </div>
                                        <div className="flex items-center bg-black/30 px-3 py-1 rounded-full">
                                            <Star className="h-5 w-5 text-yellow-400 fill-current mr-1" />
                                            {formatRating(service.average_rating)}
                                            <span className="text-sm ml-1">
                                                ({service.review_count || 0} reviews)
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="hidden">
                                    {/* Price moved to the service provider card for better visibility */}
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


                        {/* Action Buttons - Removed as they've been relocated to the service provider card */}

                        {/* Reviews Section */}
                        <div className="mb-10">
                            {/* Reviews Section Header */}
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-semibold text-gray-800">
                                    Reviews {service.review_count ? `(${service.review_count})` : ''}
                                </h2>
                                
                                {/* Show action message if any */}
                                {actionMessage.text && (
                                    <MessageAlert type={actionMessage.type} message={actionMessage.text} />
                                )}
                                
                                {!showReviewForm && (
                                    isLoggedIn ? (
                                        userReview ? (
                                            <Button 
                                                onClick={handleExistingReview}
                                                className="bg-blue-600 hover:bg-blue-700"
                                            >
                                                Edit Your Review
                                            </Button>
                                        ) : (
                                            <Button 
                                                onClick={handleNewReview}
                                                className="bg-blue-600 hover:bg-blue-700"
                                            >
                                                Write a Review
                                            </Button>
                                        )
                                    ) : (
                                        <Button 
                                            onClick={handleNonLoggedInReview}
                                            className="bg-blue-600 hover:bg-blue-700"
                                        >
                                            Write a Review
                                        </Button>
                                    )
                                )}
                            </div>
                            
                            {/* Show login error message for non-logged users, but not in the form */}
                            {!isLoggedIn && reviewMessage.text && (
                                <MessageAlert type={reviewMessage.type} message={reviewMessage.text} />
                            )}
                            
                            {/* Current user's review banner - only show for logged in users */}
                            {isLoggedIn && !showReviewForm && userReview && (
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-blue-100 p-2 rounded-full">
                                                <CheckCircle className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div>
                                            <h4 className="font-medium text-blue-800">You have already reviewed this service</h4>
                                                <p className="text-sm text-blue-600">You rated this service {userReview.rating} stars</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button 
                                                onClick={handleExistingReview}
                                                variant="outline"
                                                size="sm"
                                                className="flex items-center text-blue-600 border-blue-300 hover:bg-blue-50"
                                            >
                                                <Edit className="h-4 w-4 mr-1" />
                                                Edit
                                            </Button>
                                            <Button 
                                                onClick={handleDeleteReview}
                                                variant="outline"
                                                size="sm"
                                                className="flex items-center text-red-600 border-red-300 hover:bg-red-50"
                                            >
                                                <Trash className="h-4 w-4 mr-1" />
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Review Form - only shown for logged in users */}
                            {showReviewForm && isLoggedIn && (
                                <div className="bg-gray-50 p-6 rounded-xl mb-8 shadow-sm border border-gray-200">
                                    <form onSubmit={handleSubmitReview}>
                                        <h3 className="text-xl font-semibold mb-4 text-gray-800">
                                            {isEditing ? 'Edit Your Review' : 'Share Your Experience'}
                                        </h3>
                                        
                                        {/* Display review submission message if any */}
                                        {reviewMessage.text && (
                                            <MessageAlert type={reviewMessage.type} message={reviewMessage.text} />
                                        )}
                                        
                                        <div className="mb-6">
                                            <label className="block text-gray-700 mb-2">Your Rating</label>
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <button
                                                        key={star}
                                                        type="button"
                                                        onClick={() => handleRatingChange(star)}
                                                        className="focus:outline-none"
                                                    >
                                                        <Star 
                                                            className={`h-8 w-8 ${
                                                                star <= review.rating
                                                                    ? 'text-yellow-400 fill-current' 
                                                                    : 'text-gray-300'
                                                            }`} 
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        <div className="mb-6">
                                            <label htmlFor="comment" className="block text-gray-700 mb-2">
                                                Your Review *
                                            </label>
                                            <textarea
                                                id="comment"
                                                name="comment"
                                                value={review.comment}
                                                onChange={handleReviewChange}
                                                rows="4"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                required
                                            ></textarea>
                                        </div>
                                        
                                        <div className="flex gap-3">
                                            <Button
                                                type="submit"
                                                className="bg-blue-600 hover:bg-blue-700"
                                                disabled={submitting}
                                            >
                                                {submitting ? 'Submitting...' : (isEditing ? 'Update Review' : 'Submit Review')}
                                            </Button>
                                            
                                            {isEditing && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="text-red-600 border-red-600 hover:bg-red-50"
                                                    onClick={handleDeleteReview}
                                                    disabled={submitting}
                                                >
                                                    Delete Review
                                                </Button>
                                            )}
                                            
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => {
                                                    setShowReviewForm(false);
                                                    if (isEditing) {
                                                        setReview({
                                                            rating: userReview.rating,
                                                            comment: userReview.comment
                                                        });
                                                    }
                                                    clearMessages();
                                                }}
                                                disabled={submitting}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* Reviews List */}
                            {service.reviews && service.reviews.length > 0 ? (
                                <div className="space-y-6">
                                    {service.reviews.map((reviewItem) => (
                                        <div key={reviewItem.id} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex items-start gap-4">
                                                <img
                                                    src={reviewItem.reviewer_image || 'https://via.placeholder.com/40'}
                                                    alt={reviewItem.reviewer_name}
                                                    className="w-10 h-10 rounded-full"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <h4 className="font-medium text-gray-900">{reviewItem.reviewer_name}</h4>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex items-center bg-gray-50 px-2 py-1 rounded-md">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <Star 
                                                                        key={i} 
                                                                        className={`h-4 w-4 ${i < reviewItem.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                                                                    />
                                                                ))}
                                                            </div>
                                                            {isLoggedIn && reviewItem.reviewer_login === currentUser && (
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={handleExistingReview}
                                                                        className="text-blue-600 hover:text-blue-800"
                                                                    >
                                                                        <Edit className="h-4 w-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={handleDeleteReview}
                                                                        className="text-red-600 hover:text-red-800"
                                                                    >
                                                                        <Trash className="h-4 w-4" />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <p className="text-gray-600 mb-2">{reviewItem.comment}</p>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs text-gray-500">
                                                            {reviewItem.created_at 
                                                                ? new Date(reviewItem.created_at).toLocaleDateString('en-US', {
                                                                    year: 'numeric',
                                                                    month: 'short',
                                                                    day: 'numeric'
                                                                })
                                                                : 'Recently'
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 bg-gray-50 rounded-xl">
                                    <p className="text-gray-500 mb-4">No reviews yet.</p>
                                    {isLoggedIn ? (
                                        !showReviewForm && !userReview && (
                                            <Button 
                                                onClick={handleNewReview}
                                                className="bg-blue-600 hover:bg-blue-700"
                                            >
                                                Be the First to Review
                                            </Button>
                                        )
                                    ) : (
                                        <div>
                                           
                                           
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        
                        
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ServiceDetails;