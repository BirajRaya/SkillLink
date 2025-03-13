import { useState, useEffect } from 'react';
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
  RefreshCw
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { useToast } from "../../hooks/use-toast";
import { useAuth } from "../../utils/AuthContext"; 
import api from '@/lib/api';

const MyBookings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState("all");
  const itemsPerPage = 5;
  
  // Helper function to get current formatted timestamp
  const getCurrentTimestamp = () => {
    return '2025-03-13 01:23:56'; // Using the provided timestamp
  };

  // Helper function to get current username
  const getCurrentUsername = () => {
    return 'sudeepbanjade21'; // Using the provided username
  };

  useEffect(() => {
    fetchBookings();
  }, [currentPage]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`[${getCurrentTimestamp()}] Fetching user bookings - page ${currentPage} - User: ${getCurrentUsername()}`);
      
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
      } else {
        console.error('Unexpected response format:', response.data);
        setError('Invalid response format from server');
      }
    } catch (err) {
      console.error(`[${getCurrentTimestamp()}] Error fetching bookings:`, err);
      setError('Failed to load your bookings');
    } finally {
      setLoading(false);
    }
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
      console.log(`[${getCurrentTimestamp()}] User ${getCurrentUsername()} booking service ID: ${booking.service_id}`);
      
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

  const BookingCard = ({ booking }) => {
    // Debug the status to ensure it's working correctly
    const status = booking.status?.toLowerCase();
    const isCompletedRejectedCancelled = ['completed', 'rejected', 'cancelled'].includes(status);
    
    console.log(`[${getCurrentTimestamp()}] Booking ${booking.id} status: ${status}, Should show Book Now: ${isCompletedRejectedCancelled}`);
    
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
        
        <div className="flex justify-between items-center">
          <span className="font-semibold text-blue-700">${booking.amount}</span>
          <div className="space-x-2">
            {/* Changed condition to check exact lowercase status values */}
            {['completed', 'rejected', 'cancelled'].includes(booking.status?.toLowerCase()) ? (
              <Button
                variant="default"
                size="sm"
                className="gap-1"
                onClick={() => handleBookNow(booking)}
              >
                <RefreshCw className="h-4 w-4" />
                Book Now
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/bookings/view/${booking.id}`)}
              >
                View Details
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/services/${booking.service_id}`)}
            >
              View Service
            </Button>
            
            {booking.status?.toLowerCase() === 'pending' && (
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