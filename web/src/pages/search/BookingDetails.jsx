import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { 
  CalendarDays, 
  Clock, 
  MapPin, 
  FileText, 
  DollarSign, 
  AlertCircle, 
  CheckCircle2,
  XCircle,
  Loader2,
  Home,
  RefreshCw
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import api from '@/lib/api';
import { useAuth } from "../../utils/AuthContext"; 

const BookingDetails = ({ booking, onCancelBooking }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth(); // Get current user from auth context
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [error, setError] = useState(null);
  const [localBooking, setLocalBooking] = useState(booking);

  // Helper function to get current username
  const getCurrentUsername = () => {
    return currentUser?.username || currentUser?.email || 'anonymous-user';
  };

  // Update local booking when prop changes
  useEffect(() => {
    if (booking) {
      setLocalBooking(booking);
    }
  }, [booking]);

  // Check if booking exists
  if (!localBooking) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center">
        <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
        <h3 className="text-lg font-medium mb-2">Booking Information Unavailable</h3>
        <p className="text-gray-600">The booking information could not be loaded.</p>
      </div>
    );
  }

  // Format date and time correctly using the user's selected time if available
  const formatDateTime = (dateString) => {
    try {
      // First try to use the provided display time if available
      if (localBooking.displayTime) {
        // Parse the date part from the booking_date
        const datePart = new Date(dateString).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
        // Parse the raw time (e.g. "18:00") to create a formatted time display
        const [hours, minutes] = localBooking.displayTime.split(':');
        const timePart = new Date().setHours(parseInt(hours), parseInt(minutes));
        const formattedTime = new Date(timePart).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        
        return `${datePart}, ${formattedTime}`;
      }

      // Fall back to the standard date formatting if no display time
      const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true
      };
      
      return new Date(dateString).toLocaleDateString('en-US', options);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error formatting date:`, error);
      return "Date format error";
    }
  };

  // Check if booking can be booked again (cancelled, rejected, or completed)
  const canBookAgain = () => {
    const status = localBooking.status?.toLowerCase();
    return status === 'cancelled' || status === 'rejected' || status === 'completed';
  };

  const getStatusBadge = (status) => {
    // Add a safeguard here to handle undefined status
    const bookingStatus = status ? status.toLowerCase() : 'pending';
    
    switch (bookingStatus) {
      case 'accepted':
        return (
          <div className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full">
            <CheckCircle2 className="h-4 w-4" />
            <span>Accepted</span>
          </div>
        );
      case 'rejected':
        return (
          <div className="flex items-center gap-1 text-red-600 bg-red-50 px-3 py-1 rounded-full">
            <XCircle className="h-4 w-4" />
            <span>Rejected</span>
          </div>
        );
      case 'cancelled':
        return (
          <div className="flex items-center gap-1 text-gray-600 bg-gray-50 px-3 py-1 rounded-full">
            <XCircle className="h-4 w-4" />
            <span>Cancelled</span>
          </div>
        );
      case 'completed':
        return (
          <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            <CheckCircle2 className="h-4 w-4" />
            <span>Completed</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1 text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full">
            <Clock className="h-4 w-4" />
            <span>Pending</span>
          </div>
        );
    }
  };

  const handleCancelBooking = async () => {
    try {
      setCancelLoading(true);
      setError(null);
      
      console.log(`[${new Date().toISOString()}] User ${getCurrentUsername()} cancelling booking ID: ${localBooking.id}`);
      
      if (!localBooking.id) {
        throw new Error("Booking ID is missing");
      }
      
      // Make the API call to cancel the booking
      const response = await api.post(`/bookings/${localBooking.id}/cancel`);
      
      if (response.status === 200 || response.status === 201) {
        console.log(`[${new Date().toISOString()}] Booking ${localBooking.id} cancelled successfully`);
        
        // Update local state
        setLocalBooking({
          ...localBooking,
          status: 'cancelled'
        });
        
        // Call the parent handler if provided
        if (onCancelBooking) {
          onCancelBooking(localBooking.id);
        }
        
        setShowCancelDialog(false);
      } else {
        console.error(`[${new Date().toISOString()}] Unexpected response status: ${response.status}`);
        setError("Unexpected response from server. Please try again.");
      }
    } catch (err) {
      console.error(`[${new Date().toISOString()}] Error cancelling booking:`, err);
      setError(err.response?.data?.message || err.message || 'Failed to cancel booking. Please try again.');
    } finally {
      setCancelLoading(false);
    }
  };

  // Handle "Book Now" functionality 
  const handleBookNow = () => {
    if (localBooking.service_id) {
      console.log(`[${new Date().toISOString()}] User ${getCurrentUsername()} opening booking form for service ID: ${localBooking.service_id}`);
      
      // Navigate to service page with query parameter to open booking form
      navigate(`/services/${localBooking.service_id}?action=book`);
      
      // Store booking data for pre-filling
      if (localStorage) {
        const bookingData = {
          address: localBooking.address || '',
          city: localBooking.city || '',
          postal_code: localBooking.postal_code || '',
          province: localBooking.province || '',
          country: localBooking.country || '',
          notes: localBooking.notes || '',
          last_booked: new Date().toISOString(),
        };
        
        localStorage.setItem('booking_prefill', JSON.stringify(bookingData));
      }
    } else {
      console.error(`[${new Date().toISOString()}] Cannot book service: Missing service_id`);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-2xl font-bold text-blue-700">Your Booking</h2>
        {getStatusBadge(localBooking.status)}
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Date & Time */}
          <div className="flex items-start">
            <CalendarDays className="h-5 w-5 text-blue-600 mr-3 mt-1" />
            <div>
              <p className="text-sm text-gray-500">Date & Time</p>
              <p className="font-medium">{formatDateTime(localBooking.booking_date)}</p>
            </div>
          </div>
          
          {/* Booking ID */}
          <div className="flex items-start">
            <FileText className="h-5 w-5 text-blue-600 mr-3 mt-1" />
            <div>
              <p className="text-sm text-gray-500">Booking ID</p>
              <p className="font-medium">{localBooking.id}</p>
            </div>
          </div>

          {/* Address */}
          <div className="flex items-start">
            <Home className="h-5 w-5 text-blue-600 mr-3 mt-1" />
            <div>
              <p className="text-sm text-gray-500">Address</p>
              <p className="font-medium">{localBooking.address || 'Not specified'}</p>
            </div>
          </div>
          
                   {/* Location */}
                   <div className="flex items-start">
            <MapPin className="h-5 w-5 text-blue-600 mr-3 mt-1" />
            <div>
              <p className="text-sm text-gray-500">Location</p>
              <p className="font-medium">
                {localBooking.city || 'Not specified'}, {localBooking.province || 'Ontario'}, {localBooking.country || 'Canada'}
              </p>
              <p className="text-sm">{localBooking.postal_code || 'No postal code'}</p>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-start">
            <DollarSign className="h-5 w-5 text-blue-600 mr-3 mt-1" />
            <div>
              <p className="text-sm text-gray-500">Amount</p>
              <p className="font-medium">${localBooking.amount}</p>
            </div>
          </div>
        </div>

        {/* Notes */}
        {localBooking.notes && (
          <div className="mt-4 border-t pt-4">
            <p className="text-sm text-gray-500 mb-1">Special Instructions</p>
            <p className="bg-gray-50 p-3 rounded-md">{localBooking.notes}</p>
          </div>
        )}
        
        {/* Actions */}
        <div className="mt-6 flex flex-col gap-3">
          {/* Show Cancel button for pending bookings */}
          {localBooking.status && localBooking.status.toLowerCase() === 'pending' && (
            <Button 
              variant="destructive" 
              className="w-full" 
              onClick={() => setShowCancelDialog(true)}
            >
              Cancel Booking
            </Button>
          )}
          
          {/* Show Book Now button for cancelled, rejected, or completed bookings */}
          {canBookAgain() && localBooking.service_id && (
            <Button 
              variant="default"
              className="w-full flex items-center justify-center gap-2"
              onClick={handleBookNow}
            >
              <RefreshCw className="h-4 w-4" />
              Book Now
            </Button>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this booking? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)} disabled={cancelLoading}>
              Keep Booking
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancelBooking}
              disabled={cancelLoading}
            >
              {cancelLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Yes, Cancel Booking'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
BookingDetails.propTypes = {
  booking: PropTypes.object.isRequired,
  onCancelBooking: PropTypes.func
};

export default BookingDetails;