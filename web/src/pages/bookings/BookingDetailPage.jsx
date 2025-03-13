import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import BookingDetails from '../search/BookingDetails';
import { useAuth } from "../../utils/AuthContext"; 
import api from '@/lib/api';

const BookingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to get current formatted timestamp
  const getCurrentTimestamp = () => {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
  };

  // Helper function to get current username
  const getCurrentUsername = () => {
    return currentUser?.username || currentUser?.email || 'unknown-user';
  };

  useEffect(() => {
    fetchBookingDetails();
  }, [id]);

  const fetchBookingDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log(`[${getCurrentTimestamp()}] Fetching booking details for ID: ${id} - User: ${getCurrentUsername()}`);
      const response = await api.get(`/bookings/${id}`);
      
      if (response.status === 200) {
        // Process metadata if it's stored as a string
        let booking = response.data.booking;
        
        // Add default values for missing fields
        booking.vendor_name = booking.vendor_name || "Service Provider";
        booking.service_name = booking.service_name || "Service";
        
        if (booking.metadata && typeof booking.metadata === 'string') {
          try {
            booking.metadata = JSON.parse(booking.metadata);
          } catch (e) {
            console.error(`[${getCurrentTimestamp()}] Error parsing booking metadata:`, e);
            booking.metadata = {};
          }
        }
        
        // Extract display time from metadata if available
        if (booking.metadata && booking.metadata.displayTime) {
          booking.displayTime = booking.metadata.displayTime;
        }
        
        console.log(`[${getCurrentTimestamp()}] Booking loaded for user: ${getCurrentUsername()}`, booking);
        setBooking(booking);
      }
    } catch (err) {
      console.error(`[${getCurrentTimestamp()}] Error fetching booking:`, err);
      setError('Failed to load booking details. Please try again.');
      
      toast({
        variant: "destructive",
        title: "Error loading booking",
        description: "There was a problem retrieving this booking. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle booking cancellation
  const handleCancelBooking = (bookingId) => {
    console.log(`[${getCurrentTimestamp()}] Booking ${bookingId} cancelled by ${getCurrentUsername()}, updating state`);
    setBooking(prev => ({
      ...prev,
      status: 'cancelled'
    }));
    
    toast({
      title: "Booking Cancelled",
      description: "Your booking has been successfully cancelled.",
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center mb-8">
        <Button 
          variant="ghost"
          className="mr-4"
          onClick={() => navigate('/bookings')}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Bookings
        </Button>
        <h1 className="text-2xl font-bold">Booking Details</h1>
      </div>
      
      {isLoading ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full mb-4"></div>
            <div className="h-5 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="w-full space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Booking</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={() => navigate('/bookings')}>
              Return to Bookings
            </Button>
            <Button onClick={fetchBookingDetails} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        </div>
      ) : (
        <BookingDetails booking={booking} onCancelBooking={handleCancelBooking} />
      )}
    </div>
  );
};

export default BookingDetailPage;