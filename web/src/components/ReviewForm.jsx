import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from '@/lib/api';

const ReviewForm = ({ serviceId, onReviewAdded }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await api.post('/reviews', {
                service_id: serviceId,
                rating,
                comment
            });

            toast({
                title: "Review submitted",
                description: "Thank you for your feedback!",
            });

            setRating(0);
            setComment('');
            if (onReviewAdded) {
                onReviewAdded(response.data);
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to submit review. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`p-1 ${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                    >
                        <Star className="h-6 w-6 fill-current" />
                    </button>
                ))}
            </div>
            <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write your review..."
                required
            />
            <Button 
                type="submit" 
                disabled={isSubmitting || rating === 0}
            >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </Button>
        </form>
    );
};

export default ReviewForm;