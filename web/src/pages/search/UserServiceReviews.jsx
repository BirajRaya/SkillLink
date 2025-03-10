import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { 
    Star, 
    CheckCircle,
    Edit,
    Trash,
    AlertCircle,
    AlertTriangle,
    LogIn
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from '@/lib/api';
import { useAuth } from '@/utils/AuthContext';

const UserServiceReviews = ({ serviceId, reviews: initialReviews, onReviewUpdate }) => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { currentUser, isAuthenticated } = useAuth();
    
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [review, setReview] = useState({
        rating: 5,
        comment: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [userReview, setUserReview] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [reviewMessage, setReviewMessage] = useState({ type: '', text: '' });
    const [reviews, setReviews] = useState(initialReviews || []);
    
    // Safe localStorage functions with error handling
    const safelyGetItem = (key) => {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            console.warn('Error accessing localStorage:', e);
            return null;
        }
    };

    const safelySetItem = (key, value) => {
        try {
            // Only store minimal data to avoid quota issues
            const minimalValue = JSON.stringify({
                id: value.id,
                rating: value.rating,
                comment: value.comment,
                reviewer_id: value.reviewer_id,
                reviewer_login: value.reviewer_login,
                created_at: value.created_at,
                updated_at: value.updated_at
            });
            localStorage.setItem(key, minimalValue);
            return true;
        } catch (e) {
            console.warn('Error saving to localStorage:', e);
            return false;
        }
    };

    const safelyRemoveItem = (key) => {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.warn('Error removing from localStorage:', e);
            return false;
        }
    };
    
    // Debug auth state
    useEffect(() => {
        console.log("Auth state:", { 
            isAuthenticated, 
            currentUser, 
            token: localStorage.getItem('token')
        });
    }, [isAuthenticated, currentUser]);
    
    // Check if user has already reviewed this service
    useEffect(() => {
        if (initialReviews && initialReviews.length > 0 && isAuthenticated && currentUser) {
            console.log("Checking for existing review in:", initialReviews);
            setReviews(initialReviews);
            
            // Check if current user has a review
            const existingReview = initialReviews.find(r => 
                // Check if reviewer_id matches currentUser.id
                (r.reviewer_id && currentUser.id && r.reviewer_id === currentUser.id) ||
                // Check if reviewer_login matches user's email
                (r.reviewer_login && currentUser.email && r.reviewer_login.toLowerCase() === currentUser.email.toLowerCase()) ||
                // Check if reviewer_login matches username
                (r.reviewer_login && currentUser.username && r.reviewer_login.toLowerCase() === currentUser.username.toLowerCase())
            );
            
            if (existingReview) {
                console.log("Found user review:", existingReview);
                setUserReview(existingReview);
                
                try {
                    safelySetItem(`user_review_${serviceId}`, existingReview);
                } catch (e) {
                    console.warn("Failed to save to localStorage:", e);
                }
                
                setReview({
                    rating: existingReview.rating,
                    comment: existingReview.comment || ''
                });
            } else {
                console.log("No existing review found for user:", currentUser?.username || currentUser?.email);
                setUserReview(null);
            }
        } else if (!isAuthenticated || !currentUser) {
            setUserReview(null);
        }
    }, [initialReviews, isAuthenticated, serviceId, currentUser]);
    
    // For non-logged in users - redirect to login page
    const handleNonLoggedInReview = () => {
        const currentPath = window.location.pathname;
        sessionStorage.setItem('redirectAfterLogin', currentPath);
        
        navigate('/login');
    };

    // Clear messages
    const clearMessages = () => {
        setReviewMessage({ type: '', text: '' });
    };
    
    // For users without existing review - shows form
    const handleNewReview = () => {
        if (!isAuthenticated) {
            handleNonLoggedInReview();
            return;
        }
        
        clearMessages();
        setIsEditing(false);
        setShowReviewForm(true);
        setReview({
            rating: 5,
            comment: ''
        });
    };

    // For users with existing review - shows edit form
    const handleExistingReview = () => {
        if (!isAuthenticated) {
            handleNonLoggedInReview();
            return;
        }
        
        clearMessages();
        setIsEditing(true);
        setShowReviewForm(true);
        if (userReview) {
            setReview({
                rating: userReview.rating,
                comment: userReview.comment || ''
            });
        }
    };

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

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        
        // Debug auth state before submission
        console.log("Submitting review - Auth state:", {
            isAuthenticated,
            currentUser: currentUser?.id ? { 
                id: currentUser.id,
                email: currentUser.email,
                username: currentUser.username
            } : null,
            token: localStorage.getItem('token')?.substring(0, 20) + "..."
        });

        // Skip the auth check here, we already validate at the button/form level
        // Users can only see the form if they're authenticated
        
        setSubmitting(true);
        
        try {
            let response;
            const reviewData = {
                service_id: serviceId,
                rating: review.rating,
                comment: review.comment.trim()
            };
    
            // Log the request before making it
            console.log(`Making ${isEditing ? 'PUT' : 'POST'} request to:`, 
                isEditing ? 
                    `/services/${serviceId}/reviews/${userReview.id}` : 
                    `/services/${serviceId}/reviews`
            );
            
            if (isEditing && userReview) {
                // Update existing review
                response = await api.put(`/services/${serviceId}/reviews/${userReview.id}`, reviewData);
            } else {
                // Create new review
                response = await api.post(`/services/${serviceId}/reviews`, reviewData);
            }
    
            console.log("Review API response:", response.data);
    
            if (response.data.status === 'success') {
                // Show success message
                setReviewMessage({
                    type: 'success',
                    text: isEditing 
                        ? 'Your review has been updated successfully!' 
                        : 'Thank you! Your review has been submitted successfully!'
                });
                
                // If creating a new review, store the new review data
                if (!isEditing) {
                    // Extract review data from response
                    const newReview = response.data.data?.review;
                    
                    if (newReview) {
                        console.log("Created new review:", newReview);
                        
                        // Save to local state for immediate UI update
                        setUserReview(newReview);
                        
                        // Try to save the review to localStorage (minimal version)
                        try {
                            safelySetItem(`user_review_${serviceId}`, newReview);
                        } catch (e) {
                            console.warn("Failed to save to localStorage:", e);
                        }
                        
                        // Add to reviews list
                        setReviews(prev => [...prev, newReview]);
                    }
                } else {
                    // If updating, update the review in the list
                    const updatedReview = response.data.data?.review || {
                        ...userReview,
                        rating: review.rating,
                        comment: review.comment,
                        updated_at: new Date().toISOString()
                    };
                    
                    setUserReview(updatedReview);
                    
                    // Update in localStorage too
                    try {
                        safelySetItem(`user_review_${serviceId}`, updatedReview);
                    } catch (e) {
                        console.warn("Failed to update in localStorage:", e);
                    }
                    
                    setReviews(prev => 
                        prev.map(r => r.id === userReview.id ? updatedReview : r)
                    );
                }
    
                // Notify parent component if needed
                if (onReviewUpdate) {
                    onReviewUpdate();
                }
    
                // Close form after successful submission
                setTimeout(() => {
                    setShowReviewForm(false);
                    clearMessages();
                }, 1000);
            }
        } catch (error) {
            // Enhanced error handling with more details
            console.error("Review submission error:", error);
            
            // Check if it's an authentication error
            if (error.response?.status === 401) {
                console.warn("Authentication error detected");
                
                // Check if token exists but might be invalid
                const token = localStorage.getItem('token');
                if (token) {
                    // Show a more specific message
                    setReviewMessage({ 
                        type: 'error', 
                        text: 'Your session appears to have expired. Please refresh the page or login again.' 
                    });
                } else {
                    // No token found
                    setReviewMessage({ 
                        type: 'error', 
                        text: 'Authentication required. Please login to continue.' 
                    });
                }
            } else {
                // For other errors, show the actual error message
                const errorMessage = error.response?.data?.message || 'Failed to submit review';
                setReviewMessage({ type: 'error', text: errorMessage });
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteReview = async () => {
        if (!isAuthenticated) {
            handleNonLoggedInReview();
            return;
        }
        
        if (!userReview) return;
        
        if (window.confirm('Are you sure you want to delete your review?')) {
            setSubmitting(true);
            
            try {
                const response = await api.delete(`/services/${serviceId}/reviews/${userReview.id}`);
    
                if (response.data.status === 'success') {
                    // Remove the deleted review from reviews array
                    setReviews(prev => prev.filter(r => r.id !== userReview.id));
                    
                    // Clear user review state
                    setUserReview(null);
                    setIsEditing(false);
                    
                    // Also remove from localStorage
                    safelyRemoveItem(`user_review_${serviceId}`);
                    
                    if (onReviewUpdate) {
                        onReviewUpdate();
                    }
                    
                    toast({
                        title: "Success",
                        description: "Your review has been deleted successfully",
                    });
                }
            } catch (error) {
                console.error('Error deleting review:', error);
                
                // Check if it's an authentication error
                if (error.response?.status === 401) {
                    toast({
                        title: "Session Expired",
                        description: "Your login session has expired. Please refresh and try again.",
                        variant: "destructive",
                    });
                } else {
                    toast({
                        title: "Error",
                        description: error.response?.data?.message || "Failed to delete review",
                        variant: "destructive",
                    });
                }
            } finally {
                setSubmitting(false);
            }
        }
    };

    // Format date with YYYY-MM-DD HH:MM:SS format
    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            
            // Format as YYYY-MM-DD HH:MM:SS
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        } catch (error) {
            return 'Recently';
        }
    };

    // Check if a review belongs to the current user
    const isUserReview = (reviewItem) => {
        if (!isAuthenticated || !currentUser) return false;
        
        // More precise comparison with type safety and case insensitivity
        return (
            // Check if IDs match
            (reviewItem.reviewer_id && currentUser.id && reviewItem.reviewer_id === currentUser.id) ||
            // Check if emails match (case insensitive)
            (reviewItem.reviewer_login && currentUser.email && 
             reviewItem.reviewer_login.toLowerCase() === currentUser.email.toLowerCase()) ||
            // Check if usernames match (case insensitive)
            (reviewItem.reviewer_login && currentUser.username && 
             reviewItem.reviewer_login.toLowerCase() === currentUser.username.toLowerCase())
        );
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

    // This empty component keeps the app from breaking while removing the actual debug component
    const AuthDebugInfo = () => null;

    // Get sorted reviews with current user's review at the top
    const getSortedReviews = () => {
        if (!reviews || reviews.length === 0) return [];
        
        // If not authenticated or no user review, return regular reviews
        if (!isAuthenticated || !userReview) return reviews;
        
        // Split reviews into user's review and other reviews
        const userReviews = reviews.filter(r => isUserReview(r));
        const otherReviews = reviews.filter(r => !isUserReview(r));
        
        // Combine with user's review first
        return [...userReviews, ...otherReviews];
    };

    return (
        <div className="mb-10">
            {/* Reviews Section Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">
                    Reviews {reviews.length ? `(${reviews.length})` : ''}
                </h2>
                
                {/* Review Action Buttons */}
                {!showReviewForm && (
                    isAuthenticated ? (
                        userReview ? (
                            null
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
                            className="flex items-center bg-blue-600 hover:bg-blue-700"
                        >
                            <LogIn className="h-4 w-4 mr-2" />
                            Login to Review
                        </Button>
                    )
                )}
            </div>

            {/* Auth Debug Info - Empty component to prevent errors */}
            <AuthDebugInfo />

            {/* Review Form - Only show for authenticated users */}
            {isAuthenticated && showReviewForm && (
                <div className="bg-gray-50 p-6 rounded-lg border mb-8">
                    <form onSubmit={handleSubmitReview}>
                        <h3 className="text-xl font-medium mb-4">
                            {isEditing ? "Edit Your Review" : "Write a Review"}
                        </h3>
                        
                        {/* Rating Stars */}
                        <div className="mb-6">
                            <label className="block mb-2 text-sm font-medium">Your Rating:</label>
                            <div className="flex items-center">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => handleRatingChange(star)}
                                        className="p-1"
                                    >
                                        <Star
                                            fill={star <= review.rating ? "#FFB800" : "none"}
                                            stroke={star <= review.rating ? "#FFB800" : "#94a3b8"}
                                            className={`h-8 w-8 ${
                                                star <= review.rating 
                                                    ? "text-yellow-400" 
                                                    : "text-slate-400"
                                            }`}
                                        />
                                    </button>
                                ))}
                                <span className="ml-2 text-gray-700">
                                    ({review.rating} of 5)
                                </span>
                            </div>
                        </div>
                        
                        {/* Review Comment */}
                        <div className="mb-4">
                            <label 
                                htmlFor="comment" 
                                className="block mb-2 text-sm font-medium"
                            >
                                Your Review:
                            </label>
                            <textarea
                                id="comment"
                                name="comment"
                                rows={5}
                                value={review.comment}
                                onChange={handleReviewChange}
                                placeholder="Share your experience with this service..."
                                className="w-full p-2.5 text-gray-900 bg-white rounded-lg border focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        
                        {/* Messages */}
                        {reviewMessage.text && (
                            <MessageAlert 
                                type={reviewMessage.type} 
                                message={reviewMessage.text} 
                            />
                        )}
                        
                        {/* Form Action Buttons */}
                        <div className="flex justify-end gap-3 mt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setShowReviewForm(false);
                                    clearMessages();
                                }}
                                disabled={submitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={submitting}
                            >
                                {submitting 
                                    ? (isEditing ? "Updating..." : "Submitting...") 
                                    : (isEditing ? "Update Review" : "Submit Review")
                                }
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Review List */}
            {reviews?.length > 0 ? (
                <div className="space-y-6">
                    {getSortedReviews().map((reviewItem) => {
                        // Check review ownership for each review item individually
                        const isCurrentUserReview = isUserReview(reviewItem);
                        
                        return (
                            <div 
                                key={reviewItem.id} 
                                className={`p-5 rounded-lg ${
                                    isCurrentUserReview
                                        ? "bg-blue-50 border-blue-100" 
                                        : "bg-white border-gray-100"
                                } border`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-start">
                                        {/* User Avatar */}
                                        <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-medium mr-3">
                                            {reviewItem.reviewer_name?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                        
                                        <div>
                                            <h4 className="text-md font-semibold">
                                                {reviewItem.reviewer_name || "Anonymous User"}
                                                {isCurrentUserReview && (
                                                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 py-1 px-2 rounded">
                                                        You
                                                    </span>
                                                )}
                                            </h4>
                                            <div className="flex items-center mt-1">
                                                {/* Star Rating */}
                                                <div className="flex">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <Star
                                                            key={star}
                                                            fill={star <= reviewItem.rating ? "#FFB800" : "none"}
                                                            stroke={star <= reviewItem.rating ? "#FFB800" : "#94a3b8"}
                                                            className={`h-4 w-4 ${
                                                                star <= reviewItem.rating 
                                                                    ? "text-yellow-400" 
                                                                    : "text-slate-400"
                                                            }`}
                                                        />
                                                    ))}
                                                </div>
                                                <span className="ml-2 text-sm text-gray-500">
                                                    {formatDate(reviewItem.created_at || reviewItem.updated_at)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Review Text */}
                                {reviewItem.comment && (
                                    <p className="text-gray-700 mt-3">{reviewItem.comment}</p>
                                )}
                                
                                {/* Edit/Delete Buttons - Only for the review author */}
                                {isCurrentUserReview && !showReviewForm && (
                                    <div className="flex gap-2 mt-3">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex items-center"
                                            onClick={handleExistingReview}
                                        >
                                            <Edit className="h-4 w-4 mr-1" />
                                            Edit
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex items-center text-red-600 hover:bg-red-50 hover:text-red-700"
                                            onClick={handleDeleteReview}
                                        >
                                            <Trash className="h-4 w-4 mr-1" />
                                            Delete
                                        </Button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-gray-50 p-6 rounded-lg text-center">
                    <p className="text-gray-500">There are no reviews yet.</p>
                    {isAuthenticated && !userReview && !showReviewForm && (
                        <Button
                            onClick={handleNewReview}
                            className="mt-4 bg-blue-600 hover:bg-blue-700"
                        >
                            Be the first to write a review
                        </Button>
                    )}
                    {!isAuthenticated && (
                        <Button
                            onClick={handleNonLoggedInReview}
                            className="mt-4 flex items-center mx-auto bg-blue-600 hover:bg-blue-700"
                        >
                            <LogIn className="h-4 w-4 mr-2" />
                            Login to Write a Review
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
};

export default UserServiceReviews;