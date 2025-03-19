/* eslint-disable no-undef */
/* eslint-disable react/prop-types */
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  AlertCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  Ban,
  CheckSquare,
  RefreshCw,
  Star,
  MessageSquare,
  AlertTriangle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "../../hooks/use-toast";
import { useAuth } from "../../utils/AuthContext"; 
import api from '@/lib/api';

const MyBookings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState("all");
  const [reviewStatus, setReviewStatus] = useState({});
  const [reviewForms, setReviewForms] = useState({});
  const [disputeForms, setDisputeForms] = useState({});
  const [reviewData, setReviewData] = useState({});
  const [disputeData, setDisputeData] = useState({});
  const [submittingReview, setSubmittingReview] = useState(null);
  const [submittingDispute, setSubmittingDispute] = useState(null);
  const reviewTextareaRefs = useRef({});
  const disputeTextareaRefs = useRef({});
  const disputeRefs = useRef({}); 
  const itemsPerPage = 5;
  const getCurrentTimestamp = () => {
    return new Date().toISOString().replace('T', ' ').slice(0, 19);
  };



  useEffect(() => {
    fetchBookings();
  }, [currentPage]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      
      const response = await api.get('/bookings/user', {
        params: {
          page: currentPage,
          limit: itemsPerPage
        }
      });
      
      if (response.data && response.data.bookings) {
        console.log(`[${getCurrentTimestamp()}] Received ${response.data.bookings.length} bookings`);
        setBookings(response.data.bookings);
        
        // Calculate total pages based on bookings length if total isn't provided
        const total = response.data.total || response.data.bookings.length;
        setTotalPages(Math.ceil(total / itemsPerPage));
        
        // Check for existing reviews for completed bookings
        checkReviewStatus(response.data.bookings);
      } else {
        console.error('Unexpected response format:', response.data);
        setError('Invalid response format from server');
      }
    } catch (err) {
      
      setError('Failed to load your bookings');
    } finally {
      setLoading(false);
    }
  };

  // Check if user has already left a review for each completed booking
  const checkReviewStatus = async (bookingsList) => {
    try {
      const completedBookings = bookingsList.filter(booking => 
        booking.status?.toLowerCase() === 'completed'
      );
      
      if (completedBookings.length === 0) return;
      
      let reviewStatusObj = {};
      
      for (const booking of completedBookings) {
        if (!booking.service_id) continue;
        
        try {
          // Fixed API endpoint path to match backend route
          const response = await api.get(`/services/${booking.service_id}/reviews/check`);
          
          console.log(`Review check for booking ${booking.id}:`, response.data);
          
          // Check specifically for the 'reviewed' property
          if (response.data && response.data.reviewed !== undefined) {
            reviewStatusObj[booking.id] = response.data.reviewed;
          } else {
            reviewStatusObj[booking.id] = false;
          }
        } catch (error) {
          console.error(`Error checking review for booking ${booking.id}:`, error);
          reviewStatusObj[booking.id] = false;
        }
      }
      
      setReviewStatus(reviewStatusObj);
      
      // Debug to check what values are being set
      console.log(`[${getCurrentTimestamp()}] Review status after check:`, reviewStatusObj);
    } catch (error) {
      console.error("Error checking review status:", error);
    }
  };
  
  // Handle showing the review form for a specific booking
  const handleShowReviewForm = (bookingId) => {
    // Initialize review  data for this booking if not already done
    if (!reviewData[bookingId]) {
      setReviewData(prev => ({
        ...prev,
        [bookingId]: { rating: 5, comment: '' }
      }));
    }
    
    setReviewForms(prev => ({
      ...prev,
      [bookingId]: true
    }));
  };

  // Handle closing the review form for a specific booking
  const handleCloseReviewForm = (bookingId) => {
    setReviewForms(prev => ({
      ...prev,
      [bookingId]: false
    }));
  };

  // Handle showing the dispute form for a specific booking
  const handleShowDisputeForm = (bookingId) => {
    // Initialize dispute data for this booking if not already done
    if (!disputeData[bookingId]) {
      setDisputeData(prev => ({
        ...prev,
        [bookingId]: { reason: '', description: '', evidence: null }
      }));
    }
    
    setDisputeForms(prev => ({
      ...prev,
      [bookingId]: true
    }));
  };

  // Handle closing the dispute form for a specific booking
  const handleCloseDisputeForm = (bookingId) => {
    setDisputeData(prev => ({
      ...prev,
      [bookingId]: {
        reason: '',
        description: '',
        evidence: null
      }
    }));

    // Reset the textarea field manually
    if (disputeTextareaRefs.current && disputeTextareaRefs.current[bookingId]) {
      disputeTextareaRefs.current[bookingId].value = '';
    }

    // Reset file input if you have a ref to it
    // if (disputeFileInputRefs.current && disputeFileInputRefs.current[bookingId]) {
    //   disputeFileInputRefs.current[bookingId].value = '';
    // }

    // Close the dispute form
    setDisputeForms(prev => ({
      ...prev,
      [bookingId]: false
    }));
  };

  // Helper function to preserve cursor position
  const updateTextFieldWithCursor = (ref, value) => {
    if (!ref) return;
    const start = ref.selectionStart;
    const end = ref.selectionEnd;

    // Ensure the state updates before reapplying the cursor position
    requestAnimationFrame(() => {
      ref.setSelectionRange(start, end);
    });
  };

  const reviewDataRef = useRef({});


  // Handle review comment change
  const handleCommentChange = (bookingId, event) => {
    const newValue = event.target.value;
    const textareaRef = reviewTextareaRefs.current[bookingId];
    
    // if (!reviewDataRef.current[bookingId]) {
    //   reviewDataRef.current[bookingId] = {};
    // }
    // reviewDataRef.current[bookingId].comment = newValue;

    setReviewData(prev => ({
      ...prev,
      [bookingId]: {
        ...prev[bookingId],
        comment: newValue
      }
    }));

    if (textareaRef) {
      updateTextFieldWithCursor(textareaRef, newValue);
    }
  };

  // Handle dispute description change
  const handleDisputeDescriptionChange = (bookingId, event) => {
    const newValue = event.target.value;

    // Store locally in ref (prevents rerendering)
    if (disputeRefs.current[bookingId]) {
      disputeRefs.current[bookingId].value = newValue;
    }
  };

  const handleBlur = (bookingId) => {
    const newValue = disputeRefs.current[bookingId]?.value;

    // Update state only when needed (onBlur, not on every keystroke)
    setDisputeData(prev => ({
      ...prev,
      [bookingId]: {
        ...(prev[bookingId] || {}),
        description: newValue || ''
      }
    }));
  };



  // Handle dispute reason change
  const handleDisputeReasonChange = (bookingId, reason) => {
    setDisputeData(prev => ({
      ...prev,
      [bookingId]: {
        ...prev[bookingId],
        reason
      }
    }));
  };

  // Handle dispute evidence file upload
  const handleDisputeFileChange = async (bookingId, event) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();

      reader.onload = () => {
        console.log("Base64 Data:", reader.result); // Debugging log
        setDisputeData(prev => ({
          ...prev,
          [bookingId]: {
            ...prev[bookingId],
            evidence: reader.result  // Store Base64 string
          }
        }));
      };
      console.log(disputeData);

      reader.onerror = (error) => {
        console.error("Error reading file:", error);
      };

      reader.readAsDataURL(file);
    } else {
      console.warn("No file selected");
    }
  };

  const handleRatingChange = (bookingId, value) => {
    setReviewData(prev => ({
      ...prev,
      [bookingId]: {
        ...prev[bookingId],
        rating: value
      }
    }));
  };

  // Handle submitting a review
  const handleSubmitReview = async (booking) => {
    if (!booking || !booking.id || !booking.service_id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Missing booking information. Unable to submit review."
      });
      return;
    }
    
    setSubmittingReview(booking.id);
    
    try {
      const reviewPayload = {
        service_id: booking.service_id,
        booking_id: booking.id,
        rating: reviewData[booking.id]?.rating || 5,
        comment: reviewDataRef.current[booking.id]?.comment || ''
      };
      
      console.log(`[${getCurrentTimestamp()}] Submitting review for booking ${booking.id}:`, reviewPayload);
      
      const response = await api.post(`/services/${booking.service_id}/reviews`, reviewPayload);
      
      if (response.data && response.data.status === 'success') {
        toast({
          title: "Review Submitted",
          description: "Thank you for your feedback!"
        });
        
        // Update review status to show the booking has been reviewed
        setReviewStatus(prev => ({
          ...prev,
          [booking.id]: true
        }));
        
        // Close the review form
        handleCloseReviewForm(booking.id);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to submit your review. Please try again."
        });
      }
    } catch (error) {
      console.error(`[${getCurrentTimestamp()}] Error submitting review:`, error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to submit your review"
      });
    } finally {
      setSubmittingReview(null);
    }
  };

  // Handle submitting a dispute
  const handleSubmitDispute = async (booking) => {
    if (!booking || !booking.id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Missing booking information. Unable to submit dispute."
      });
      return;
    }
    
    if (!disputeData[booking.id]?.reason) {
      toast({
        variant: "destructive",
        title: "Required Field",
        description: "Please select a reason for your dispute."
      });
      return;
    }
    
    if (!disputeData[booking.id]?.description || disputeData[booking.id].description.trim() === '') {
      toast({
        variant: "destructive",
        title: "Required Field",
        description: "Please provide a description of your dispute."
      });
      return;
    }
    
    setSubmittingDispute(booking.id);
    
    try {
      // Create form data for file upload
      const formData = new FormData();
      formData.append('booking_id', booking.id);
      formData.append('reason', disputeData[booking.id].reason);
      formData.append('description', disputeData[booking.id].description);
      
      if (disputeData[booking.id].evidence) {
        formData.append('evidence', disputeData[booking.id].evidence);
      }
      
      console.log(`[${getCurrentTimestamp()}] Submitting dispute for booking ${booking.id}`);
      
      const response = await api.post('/disputes/create', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data && response.data.status === 'success') {
        toast({
          title: "Dispute Submitted",
          description: "Your dispute has been submitted and will be reviewed by our team."
        });
        
        // Close the dispute form
        handleCloseDisputeForm(booking.id);
        
        // Refresh bookings to show updated status
        fetchBookings();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to submit your dispute. Please try again."
        });
      }
    } catch (error) {
      console.error(`[${getCurrentTimestamp()}] Error submitting dispute:`, error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to submit your dispute"
      });
    } finally {
      setSubmittingDispute(null);
    }
  };

  // Handle sending a message to vendor
  const handleMessageVendor = (booking) => {
    if (!booking.vendor_id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Vendor information is missing. Unable to send message."
      });
      return;
    }
    
    // Navigate to messaging page with vendor ID
    navigate(`/messages/vendor/${booking.vendor_id}?booking=${booking.id}`);
  };

  const cancelBooking = async (bookingId) => {
    try {
      await api.post(`/bookings/${bookingId}/cancel`);
      // Refresh the bookings list
      fetchBookings();
      toast({
        title: "Booking Cancelled",
        description: "Your booking has been cancelled successfully.",
      });
    } catch (err) {
      console.error('Error cancelling booking:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.message || "Failed to cancel booking",
      });
    }
  };

  // This function handles clicking the "Book Now" button
  const handleBookNow = (booking) => {
    if (booking.service_id) {
      
      // Navigate to service page with query parameter to open booking form
      navigate(`/services/${booking.service_id}?action=book`);
      
      // Store booking data for pre-filling
      if (localStorage) {
        const bookingData = {
          address: booking.address || '',
          city: booking.city || '',
          postal_code: booking.postal_code || '',
          province: booking.province || '',
          country: booking.country || '',
          notes: booking.notes || '',
          last_booked: new Date().toISOString(),
        };
        
        localStorage.setItem('booking_prefill', JSON.stringify(bookingData));
      }
    } else {
      console.error(`[${getCurrentTimestamp()}] Cannot book service: Missing service_id`);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Cannot book this service. Service information is missing."
      });
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const formatTime = (dateString) => {
    const options = { hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleTimeString('en-US', options);
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase() || 'pending') {
      case 'accepted':
        return (
          <div className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm">
            <CheckCircle2 className="h-4 w-4" />
            <span>Accepted</span>
          </div>
        );
      case 'rejected':
        return (
          <div className="flex items-center gap-1 text-red-600 bg-red-50 px-3 py-1 rounded-full text-sm">
            <XCircle className="h-4 w-4" />
            <span>Rejected</span>
          </div>
        );
      case 'cancelled':
        return (
          <div className="flex items-center gap-1 text-gray-600 bg-gray-50 px-3 py-1 rounded-full text-sm">
            <Ban className="h-4 w-4" />
            <span>Cancelled</span>
          </div>
        );
      case 'completed':
        return (
          <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-sm">
            <CheckSquare className="h-4 w-4" />
            <span>Completed</span>
          </div>
        );
      case 'disputed':
        return (
          <div className="flex items-center gap-1 text-orange-600 bg-orange-50 px-3 py-1 rounded-full text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>Disputed</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1 text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full text-sm">
            <Clock className="h-4 w-4" />
            <span>Pending</span>
          </div>
        );
    }
  };

  // Filter bookings by search term and status
  const filterBookings = (status = activeTab) => {
    return bookings.filter(booking => {
      // Filter by search term (service name)
      const matchesSearch = 
        !searchTerm || 
        (booking.service_name || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filter by status if specified
      if (status === 'all') {
        return matchesSearch;
      } else {
        return (booking.status || '').toLowerCase() === status && matchesSearch;
      }
    });
  };

  // Add debug logging to help diagnose the issue
  console.log(`[${getCurrentTimestamp()}] Rendering MyBookings component with ${bookings.length} bookings`);

  // Star Rating Component
  const StarRating = ({ rating, onChange, disabled = false }) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onClick={() => onChange(star)}
            className={`p-1 ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
          >
            <Star
              fill={star <= rating ? "#FFB800" : "none"}
              stroke={star <= rating ? "#FFB800" : "#94a3b8"}
              className={`h-5 w-5 ${
                star <= rating 
                  ? "text-yellow-400" 
                  : "text-slate-400"
              }`}
            />
          </button>
        ))}
        <span className="ml-1 text-sm text-gray-700">({rating}/5)</span>
      </div>
    );
  };

  const BookingCard = ({ booking }) => {
    // Debug the status to ensure it's working correctly
    const status = booking.status?.toLowerCase();
    const isCompletedRejectedCancelled = ['completed', 'rejected', 'cancelled'].includes(status);
    const isCompleted = status === 'completed';
    const hasReview = reviewStatus[booking.id];
    const showReviewForm = reviewForms[booking.id];
    const showDisputeForm = disputeForms[booking.id];
    
    console.log(`[${getCurrentTimestamp()}] Booking ${booking.id} status: ${status}, Has Review: ${hasReview}, Show Form: ${showReviewForm}`);
    
    return (
      <div className="bg-white border rounded-lg shadow-sm p-4 mb-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">{booking.service_name || "Service"}</h3>
            </div>
            <p className="text-gray-600 text-sm">by {booking.vendor_name || "Service Provider"}</p>
          </div>
          {getStatusBadge(booking.status)}
        </div>
        
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 text-blue-600 mr-2" />
            <span className="text-sm">{formatDate(booking.booking_date)}</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 text-blue-600 mr-2" />
            <span className="text-sm">{formatTime(booking.booking_date)}</span>
          </div>
        </div>
        
        {/* Review Form - Show for completed bookings that don't have a review yet */}
        {isCompleted && !hasReview && showReviewForm && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h4 className="font-medium text-blue-800 mb-2">Leave a Review</h4>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Your Rating:</label>
              <StarRating 
                rating={reviewData[booking.id]?.rating || 5} 
                onChange={(value) => handleRatingChange(booking.id, value)}
                disabled={submittingReview === booking.id}
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Your Feedback:</label>
              <Textarea 
                ref={el => reviewTextareaRefs.current[booking.id] = el}
                defaultValue=""
                onChange={(e) => handleCommentChange(booking.id, e)}
                placeholder="Share your experience with this service..." 
                rows={3} 
                disabled={submittingReview === booking.id}
                className="w-full p-2 border border-blue-200 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCloseReviewForm(booking.id)}
                disabled={submittingReview === booking.id}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => handleSubmitReview(booking)}
                disabled={submittingReview === booking.id}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {submittingReview === booking.id ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Star className="h-4 w-4 mr-1" />
                    Submit Review
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
        
        {/* Dispute Form - Show for completed bookings when dispute form is open */}
        {isCompleted && showDisputeForm && (
          <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-100">
            <h4 className="font-medium text-red-800 mb-2">File a Dispute</h4>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Reason for Dispute:</label>
              <Select 
                value={disputeData[booking.id]?.reason || ''} 
                onValueChange={(value) => handleDisputeReasonChange(booking.id, value)}
                disabled={submittingDispute === booking.id}
              >
                <SelectTrigger className="w-full border border-red-200">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="service_not_provided">Service Not Provided</SelectItem>
                  <SelectItem value="service_quality">Poor Service Quality</SelectItem>
                  <SelectItem value="inappropriate_behavior">Inappropriate Behavior</SelectItem>
                  <SelectItem value="overcharge">Overcharge</SelectItem>
                  <SelectItem value="damaged_property">Damaged Property</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Description:</label>
              <Textarea
                ref={(el) => {
                  if (el) {
                    if (!disputeTextareaRefs.current) disputeTextareaRefs.current = {};
                    disputeTextareaRefs.current[booking.id] = el;
                    disputeRefs.current[booking.id] = el; // Store reference
                  }
                }}
                defaultValue={disputeData[booking.id]?.description || ''} // Use defaultValue instead of value
                onChange={(e) => {
                  if (e.target.value.length <= 500) {
                    handleDisputeDescriptionChange(booking.id, e);
                  }
                }}
                onBlur={() => handleBlur(booking.id)} // Update state only onBlur
                placeholder="Please provide details about your dispute..."
                rows={4}
                maxLength={500}
                disabled={submittingDispute === booking.id}
                className="w-full p-2 border border-red-200 rounded-md focus:ring-red-500 focus:border-red-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                {disputeData[booking.id]?.description?.length || 0}/500 characters
              </p>
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Evidence (optional):</label>
              <Input
                type="file"
                disabled={submittingDispute === booking.id}
                onChange={(e) => handleDisputeFileChange(booking.id, e)}
                className="border border-red-200"
              />
              <p className="text-xs text-gray-500 mt-1">Upload any photos or documents that support your dispute (max 5MB).</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCloseDisputeForm(booking.id)}
                disabled={submittingDispute === booking.id}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleSubmitDispute(booking)}
                disabled={submittingDispute === booking.id}
              >
                {submittingDispute === booking.id ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Submit Dispute
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
        
        <div className="flex justify-between items-center">
  <span className="font-semibold text-blue-700">${booking.amount}</span>
  <div className="flex flex-wrap gap-2 justify-end">
    {/* For completed bookings - show additional options */}
    {isCompleted && (
      <>
        {/* Add Review button if no review exists */}
        {!hasReview && !showReviewForm && (
          <Button
            variant="default"
            size="sm"
            className="gap-1 bg-yellow-500 hover:bg-yellow-600"
            onClick={() => handleShowReviewForm(booking.id)}
          >
            <Star className="h-4 w-4" />
            Add Review
          </Button>
        )}
        
        {/* Show "Reviewed" text if review exists */}
        {hasReview && (
          <span className="text-green-600 text-sm flex items-center">
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Reviewed
          </span>
        )}
        

        
        {/* Dispute button */}
        {!showDisputeForm && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1 border-red-300 text-red-700 hover:bg-red-50"
            onClick={() => handleShowDisputeForm(booking.id)}
          >
            <AlertTriangle className="h-4 w-4" />
            Dispute
          </Button>
        )}
      </>
    )}
    
    {/* For completed, cancelled, or rejected bookings - offer to book again */}
    {isCompletedRejectedCancelled && (
      <Button
        variant="default"
        size="sm"
        className="gap-1"
        onClick={() => handleBookNow(booking)}
      >
        <RefreshCw className="h-4 w-4" />
        Book Again
      </Button>
    )}
    
    {/* View Service button */}
    <Button
      variant="default"
      size="sm"
      className="bg-green-600 hover:bg-green-700 gap-1"
      onClick={() => navigate(`/services/${booking.service_id}`)}
    >
      View Service
    </Button>
    
    {/* Only show Cancel button for pending bookings */}
    {status === 'pending' && (
      <Button
        variant="destructive"
        size="sm"
        onClick={() => cancelBooking(booking.id)}
      >
        Cancel
      </Button>
    )}
  </div>
</div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin mr-2" />
        <span className="text-lg">Loading your bookings...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-6 text-center my-4">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Failed to load bookings</h3>
        <p className="text-red-600">{error}</p>
        <Button 
          className="mt-4"
          onClick={fetchBookings}
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="bg-gray-50 border rounded-md p-6 text-center my-4">
        <Calendar className="h-10 w-10 text-blue-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Bookings Found</h3>
        <p className="text-gray-600 mb-4">You haven't made any bookings yet.</p>
        <Button onClick={() => navigate('/')}>Browse Services</Button>
      </div>
    );
  }

  // Get filtered bookings based on active tab
  const filtered = filterBookings();

  return (
    <div className="max-w-4xl mx-auto my-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">My Bookings</h1>
      
      {/* Search and Filter */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="search"
            placeholder="Search services..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {/* Tabs for different booking statuses */}
      <Tabs defaultValue="all" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6 mb-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="accepted">Accepted</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
        
        {/* All Bookings - No date categories, just a simple list */}
        <TabsContent value="all">
          {filtered.length > 0 ? (
            <>
              {filtered.map(booking => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-md">
              <p className="text-gray-500">No bookings match your search</p>
            </div>
          )}
        </TabsContent>
        
        {/* Other status tabs */}
        {["pending", "accepted", "completed", "cancelled", "rejected"].map(status => (
          <TabsContent key={status} value={status}>
            {filtered.length > 0 ? (
              filtered.map(booking => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-md">
                <p className="text-gray-500">No {status} bookings</p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
      
      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-8 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      {/* Last updated info */}
      <div className="text-center text-gray-500 text-sm mt-6">
        Last updated: {new Date('2025-03-13 01:27:59').toLocaleDateString('en-US', {
          month: 'long', 
          day: 'numeric', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </div>
    </div>
  );
};

export default MyBookings;