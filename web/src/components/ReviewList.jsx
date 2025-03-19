import { useState, useEffect } from 'react';
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/utils/AuthContext";
import { useToast } from "@/hooks/use-toast";
import api from '@/lib/api';

const ReviewList = ({ serviceId }) => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { currentUser } = useAuth();
    const { toast } = useToast();

    // Fetch reviews on component mount and when serviceId changes
    useEffect(() => {
        fetchReviews();
    }, [serviceId]);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/services/service/${serviceId}/reviews`);
            setReviews(response.data);
            setError(null);
        } catch (err) {
            setError('Failed to load reviews');
            toast({
                title: "Error",
                description: "Failed to load reviews",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteReview = async (reviewId) => {
        try {
            await api.delete(`/services/reviews/${reviewId}`);
            // Update reviews list after deletion
            setReviews(reviews.filter(review => review.id !== reviewId));
            toast({
                title: "Success",
                description: "Review deleted successfully",
            });
        } catch (err) {
            console.error('Error deleting review:', err);
            toast({
                title: "Error",
                description: "Failed to delete review",
                variant: "destructive",
            });
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center text-red-500 p-4">
                {error}
            </div>
        );
    }

    if (reviews.length === 0) {
        return (
            <div className="text-center text-gray-500 p-4">
                No reviews yet.
            </div>
        );
    }

    const formatDate = (dateString) => {
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    return (
        <div className="space-y-6 mt-4">
            <h3 className="text-xl font-semibold">
                Reviews ({reviews.length})
            </h3>
            <div className="space-y-4">
                {reviews.map((review) => (
                    <div 
                        key={review.id} 
                        className="border rounded-lg p-4 bg-white shadow-sm"
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    {/* Rating Stars */}
                                    <div className="flex">
                                        {[...Array(5)].map((_, index) => (
                                            <Star
                                                key={index}
                                                className={`h-5 w-5 ${
                                                    index < review.rating
                                                        ? 'text-yellow-400 fill-current'
                                                        : 'text-gray-300'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Review Content */}
                                <p className="text-gray-700 mb-2">{review.comment}</p>
                                
                                {/* Review Metadata */}
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <span>By: {review.user_name || 'Anonymous'}</span>
                                    <span>•</span>
                                    <span>{formatDate(review.created_at)}</span>
                                    {review.created_at !== review.updated_at && (
                                        <span className="text-xs">(edited)</span>
                                    )}
                                </div>
                            </div>

                            {/* Delete Button - Only shown to review owner */}
                            {currentUser && currentUser.id === review.user_id && (
                                <Button 
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700"
                                    onClick={() => handleDeleteReview(review.id)}
                                >
                                    Delete
                                </Button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ReviewList;