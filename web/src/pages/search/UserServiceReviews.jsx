/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { 
    Star, 
    CheckCircle,
    Edit,
    Trash,
    AlertCircle,
    AlertTriangle,
    ArrowUpDown,
    LogIn,
    Lock
} from "lucide-react";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import api from '@/lib/api';
import { useAuth } from '@/utils/AuthContext';

const UserServiceReviews = ({ serviceId, reviews: initialReviews, onReviewUpdate, bookings }) => {
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
    const [hasCompletedBooking, setHasCompletedBooking] = useState(false);
    const [sortOption, setSortOption] = useState('recent');

    const safelySetItem = (key, value) => {
        try {
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
    
    // Check if user has completed bookings
    useEffect(() => {
        if (isAuthenticated && currentUser && bookings && bookings.length > 0) {
            const completedBooking = bookings.some(booking => 
                booking.status === 'completed' && 
                booking.user_id === currentUser.id &&
                booking.service_id === serviceId
            );
            
            setHasCompletedBooking(completedBooking);
            
            if (completedBooking && !userReview && !showReviewForm) {
                setShowReviewForm(true);
            }
        } else {
            setHasCompletedBooking(false);
        }
    }, [bookings, isAuthenticated, currentUser, serviceId, userReview, showReviewForm]);
    
    // Check if user has already reviewed this service
    useEffect(() => {
        if (initialReviews && initialReviews.length > 0 && isAuthenticated && currentUser) {
            setReviews(initialReviews);
            
            const existingReview = initialReviews.find(r => 
                (r.reviewer_id && currentUser.id && r.reviewer_id === currentUser.id) ||
                (r.reviewer_login && currentUser.email && 
                 r.reviewer_login.toLowerCase() === currentUser.email.toLowerCase()) ||
                (r.reviewer_login && currentUser.username && 
                 r.reviewer_login.toLowerCase() === currentUser.username.toLowerCase())
            );
            
            if (existingReview) {
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
        
        if (!hasCompletedBooking) {
            toast({
                title: "Action not allowed",
                description: "You can only leave a review after completing a booking for this service.",
                variant: "destructive",
            });
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

    // Sorting function
    const getSortedReviews = (reviews, sortOption, isAuthenticated, currentUser) => {
        if (!reviews || reviews.length === 0) return [];
        
        const isUserReview = (reviewItem) => {
            if (!isAuthenticated || !currentUser) return false;
            
            return (
                (reviewItem.reviewer_id && currentUser.id && reviewItem.reviewer_id === currentUser.id) ||
                (reviewItem.reviewer_login && currentUser.email && 
                 reviewItem.reviewer_login.toLowerCase() === currentUser.email.toLowerCase()) ||
                (reviewItem.reviewer_login && currentUser.username && 
                 reviewItem.reviewer_login.toLowerCase() === currentUser.username.toLowerCase())
            );
        };

        let sortedReviews = [...reviews];

        switch (sortOption) {
            case 'highest_rating':
                sortedReviews.sort((a, b) => b.rating - a.rating);
                break;
            case 'lowest_rating':
                sortedReviews.sort((a, b) => a.rating - b.rating);
                break;
            case 'recent':
            default:
                sortedReviews.sort((a, b) => {
                    const dateA = new Date(a.updated_at || a.created_at);
                    const dateB = new Date(b.updated_at || b.created_at);
                    return dateB - dateA;
                });
                break;
        }

        if (isAuthenticated && currentUser) {
            const userReviews = sortedReviews.filter(r => isUserReview(r));
            const otherReviews = sortedReviews.filter(r => !isUserReview(r));
            
            return [...userReviews, ...otherReviews];
        }

        return sortedReviews;
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        
        if (!hasCompletedBooking && !isEditing) {
            setReviewMessage({
                type: 'error',
                text: 'You must complete a booking before leaving a review.'
            });
            return;
        }
        
        setSubmitting(true);
        
        try {
            let response;
            const reviewData = {
                service_id: serviceId,
                rating: review.rating,
                comment: review.comment.trim()
            };
    
            if (isEditing && userReview) {
                response = await api.put(`/services/${serviceId}/reviews/${userReview.id}`, reviewData);
            } else {
                response = await api.post(`/services/${serviceId}/reviews`, reviewData);
            }
    
            if (response.data.status === 'success') {
                setReviewMessage({
                    type: 'success',
                    text: isEditing 
                        ? 'Your review has been updated successfully!' 
                        : 'Thank you! Your review has been submitted successfully!'
                });
                
                if (!isEditing) {
                    const newReview = response.data.data?.review;
                    
                    if (newReview) {
                        setUserReview(newReview);
                        
                        try {
                            safelySetItem(`user_review_${serviceId}`, newReview);
                        } catch (e) {
                            console.warn("Failed to save to localStorage:", e);
                        }
                        
                        setReviews(prev => [...prev, newReview]);
                    }
                } else {
                    const updatedReview = response.data.data?.review || {
                        ...userReview,
                        rating: review.rating,
                        comment: review.comment,
                        updated_at: new Date().toISOString()
                    };
                    
                    setUserReview(updatedReview);
                    
                    try {
                        safelySetItem(`user_review_${serviceId}`, updatedReview);
                    } catch (e) {
                        console.warn("Failed to update in localStorage:", e);
                    }
                    
                    setReviews(prev => 
                        prev.map(r => r.id === userReview.id ? updatedReview : r)
                    );
                }
    
                if (onReviewUpdate) {
                    onReviewUpdate();
                }
    
                setTimeout(() => {
                    setShowReviewForm(false);
                    clearMessages();
                }, 1000);
            }
        } catch (error) {
            console.error("Review submission error:", error);
            
            if (error.response?.status === 401) {
                const token = localStorage.getItem('token');
                if (token) {
                    setReviewMessage({ 
                        type: 'error', 
                        text: 'Your session appears to have expired. Please refresh the page or login again.' 
                    });
                } else {
                    setReviewMessage({ 
                        type: 'error', 
                        text: 'Authentication required. Please login to continue.' 
                    });
                }
            } else {
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
                    setReviews(prev => prev.filter(r => r.id !== userReview.id));
                    
                    setUserReview(null);
                    setIsEditing(false);
                    
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
        
        return (
            (reviewItem.reviewer_id && currentUser.id && reviewItem.reviewer_id === currentUser.id) ||
            (reviewItem.reviewer_login && currentUser.email && 
             reviewItem.reviewer_login.toLowerCase() === currentUser.email.toLowerCase()) ||
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

    return (
        <div className="mb-10">
            {/* Reviews Section Header with Sorting Dropdown */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">
                    Reviews {reviews.length ? `(${reviews.length})` : ''}
                </h2>
                
                {/* Sorting Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="flex items-center">
                            <ArrowUpDown className="mr-2 h-4 w-4" />
                            Sort Reviews
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSortOption('recent')}>
                            Most Recent
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortOption('highest_rating')}>
                            Highest Rating
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortOption('lowest_rating')}>
                            Lowest Rating
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Notification for logged-in users to direct them to My Bookings tab */}
            {isAuthenticated && !userReview && !showReviewForm && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center">
                    <AlertCircle className="h-5 w-5 text-blue-500 mr-2" />
                    <p className="text-blue-700">
                        You can add a review for this service from the <Link to="/bookings" className="underline font-medium">My Bookings</Link> tab after your booking is completed.
                    </p>
                </div>
            )}

            {/* Review Form - Only show for authenticated users with completed bookings */}
            {isAuthenticated && showReviewForm && (hasCompletedBooking || isEditing) && (
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
                    {getSortedReviews(reviews, sortOption, isAuthenticated, currentUser).map((reviewItem) => {
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
                        <div className="mt-4 text-center">
                            <p className="text-blue-700 mb-2">
                                <AlertCircle className="h-5 w-5 inline-block mr-1" />
                                Reviews can be submitted from the <Link to="/bookings" className="underline font-medium">My Bookings</Link>
                                tab
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default UserServiceReviews;