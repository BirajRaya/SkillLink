import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CalendarDays, 
  Clock, 
  MapPin, 
  DollarSign, 
  AlertCircle, 
  Calendar,
  ArrowRight,
  FileText,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  ChevronDown 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from "../../utils/AuthContext"; // Import auth context
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';

const BookingsList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentUser } = useAuth(); // Get current user from auth context
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  
  // Helper function to get current formatted timestamp
  const getCurrentTimestamp = () => {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
  };

  // Helper function to get current username
  const getCurrentUsername = () => {
    return currentUser?.username || currentUser?.email || 'unknown-user';
  };
  
  // Get current date for comparison (reset to midnight)
  const getCurrentDate = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  };

  // Dynamic today value
  const TODAY = getCurrentDate();

  // Fetch bookings on component mount
  useEffect(() => {
    fetchBookings();
  }, []);
  
  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log(`[${getCurrentTimestamp()}] Fetching user bookings for ${getCurrentUsername()}...`);
      
      const response = await api.get('/bookings/user');
      
      if (response.status === 200) {
        console.log(`[${getCurrentTimestamp()}] Received ${response.data.bookings.length} bookings for ${getCurrentUsername()}`);
        // Process booking data for proper display
        const processedBookings = response.data.bookings.map(booking => {
          // Try to parse metadata if it's a string
          if (booking.metadata && typeof booking.metadata === 'string') {
            try {
              booking.metadata = JSON.parse(booking.metadata);
            } catch (e) {
              console.error(`[${getCurrentTimestamp()}] Error parsing booking metadata:`, e);
              booking.metadata = {};
            }
          }
          return booking;
        });
        setBookings(processedBookings || []);
      }
    } catch (err) {
      console.error(`[${getCurrentTimestamp()}] Error fetching bookings:`, err);
      setError('Failed to load bookings. Please try again.');
      
      toast({
        variant: "destructive",
        title: "Error loading bookings",
        description: "There was a problem retrieving your bookings. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter bookings by category
  const getFilteredBookings = () => {
    if (!bookings || bookings.length === 0) return [];
    
    // Sort bookings by date (newest first for upcoming, oldest first for past)
    const sortedBookings = [...bookings].sort((a, b) => {
      const dateA = new Date(a.booking_date);
      const dateB = new Date(b.booking_date);
      return activeTab === 'past' 
        ? dateA - dateB  // Oldest first for past
        : dateB - dateA; // Newest first for upcoming
    });
    
    // Filter bookings based on active tab
    return sortedBookings.filter(booking => {
      const bookingDate = new Date(booking.booking_date);
      const bookingStatus = booking.status?.toLowerCase() || 'pending';
      
      switch (activeTab) {
        case 'upcoming': 
          // Show future bookings that are not cancelled
          return bookingDate > TODAY && bookingStatus !== 'cancelled';
        
        case 'pending':
          // Show pending bookings regardless of date
          return bookingStatus === 'pending';
        
        case 'past':
          // Show past bookings or cancelled ones
          return bookingDate < TODAY || bookingStatus === 'cancelled';
        
        case 'all':
        default:
          return true;
      }
    });
  };
  
  // Pagination data
  const filteredBookings = getFilteredBookings();
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  
  // Get current page of bookings
  const currentBookings = filteredBookings.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );
  
  const handleTabChange = (value) => {
    setActiveTab(value);
    setCurrentPage(1); // Reset to first page when tab changes
  };
  
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  
  const navigateToServiceDetails = (serviceId) => {
    navigate(`/services/${serviceId}`);
  };

  // Navigate directly to booking form
  const navigateToBookingForm = (booking) => {
    console.log(`[${getCurrentTimestamp()}] User ${getCurrentUsername()} opening booking form for service ID: ${booking.service_id}`);
    
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
  };

  // Format date for display
  const formatDateTime = (dateString, displayTime) => {
    try {
      // First try to use the display time if available
      if (displayTime) {
        const datePart = new Date(dateString).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short', 
          day: 'numeric',
          year: 'numeric'
        });
        
        // Parse and format the display time
        const [hours, minutes] = displayTime.split(':').map(Number);
        const timePart = new Date().setHours(hours, minutes);
        const formattedTime = new Date(timePart).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        
        return `${datePart}, ${formattedTime}`;
      }

      // Fall back to standard formatting
      return new Date(dateString).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error(`[${getCurrentTimestamp()}] Error formatting date:`, error);
      return dateString; // Return the original string on error
    }
  };
  
  const getStatusBadge = (status) => {
    const bookingStatus = status ? status.toLowerCase() : 'pending';
    
    switch (bookingStatus) {
      case 'accepted':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Accepted</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Cancelled</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
      default:
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
    }
  };

  const isBookingPast = (dateString) => {
    return new Date(dateString) < TODAY;
  };
  
  const getExtractedDisplayTime = (booking) => {
    // Try to get display time from various locations
    return booking.displayTime || 
      (booking.metadata && booking.metadata.displayTime) || 
      null;
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My Bookings</h1>
          <p className="text-gray-500 mt-2">View and manage all your bookings</p>
        </div>
        
        <Tabs defaultValue="upcoming">
          <TabsList className="mb-6">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="past">Past & Cancelled</TabsTrigger>
            <TabsTrigger value="all">All Bookings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upcoming" className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="border border-gray-100">
                <CardHeader className="pb-2">
                  <Skeleton className="h-6 w-1/4" />
                  <Skeleton className="h-5 w-3/4 mt-1" />
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My Bookings</h1>
          <p className="text-gray-500 mt-2">View and manage all your bookings</p>
        </div>
        
        <div className="bg-red-50 border border-red-200 text-red-700 p-8 rounded-lg text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h3 className="text-lg font-medium mb-2">Error Loading Bookings</h3>
          <p className="mb-4">{error}</p>
          <Button onClick={fetchBookings} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }
  
  // Show empty state
  if (bookings.length === 0) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My Bookings</h1>
          <p className="text-gray-500 mt-2">View and manage all your bookings</p>
        </div>
        
        <Tabs defaultValue="upcoming">
          <TabsList className="mb-6">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="past">Past & Cancelled</TabsTrigger>
            <TabsTrigger value="all">All Bookings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upcoming" className="space-y-4">
            <div className="bg-gray-50 border border-gray-100 p-12 rounded-lg text-center">
              <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No bookings found</h3>
              <p className="text-gray-500 mb-6">You don't have any bookings yet.</p>
              <Button onClick={() => navigate('/services')} className="gap-2">
                Browse Services
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Bookings</h1>
        <p className="text-gray-500 mt-2">View and manage all your bookings</p>
      </div>
      
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-6">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="past">Past & Cancelled</TabsTrigger>
          <TabsTrigger value="all">All Bookings</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="space-y-4">
          {currentBookings.length === 0 ? (
            <div className="bg-gray-50 border border-gray-100 p-12 rounded-lg text-center">
              <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">
                No {activeTab === 'all' ? '' : activeTab} bookings found
              </h3>
              <p className="text-gray-500 mb-6">
                {activeTab === 'upcoming' && "You don't have any upcoming bookings."}
                {activeTab === 'pending' && "You don't have any pending bookings."}
                {activeTab === 'past' && "You don't have any past or cancelled bookings."}
                {activeTab === 'all' && "You don't have any bookings yet."}
              </p>
              <Button onClick={() => navigate('/services')} className="gap-2">
                Browse Services
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              {currentBookings.map((booking) => (
                <Card key={booking.id} className={`border ${
                  booking.status === 'cancelled' 
                    ? 'border-gray-200 bg-gray-50' 
                    : isBookingPast(booking.booking_date) 
                    ? 'border-gray-100'
                    : 'border-blue-100'
                }`}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">
                        {booking.service_name || "Service"}
                      </CardTitle>
                      {getStatusBadge(booking.status)}
                    </div>
                    <CardDescription>
                      Provider: {booking.vendor_name || 'Unknown'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <Collapsible>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Date and Time */}
                        <div className="flex items-center">
                          <CalendarDays className="h-5 w-5 text-blue-600 mr-2" />
                          <div>
                            <p className="text-sm text-gray-500">Date & Time</p>
                            <p className="font-medium">{formatDateTime(booking.booking_date, getExtractedDisplayTime(booking))}</p>
                          </div>
                        </div>
                        
                        {/* Price */}
                        <div className="flex items-center">
                          <DollarSign className="h-5 w-5 text-blue-600 mr-2" />
                          <div>
                            <p className="text-sm text-gray-500">Amount</p>
                            <p className="font-medium">${booking.amount}</p>
                          </div>
                        </div>
                        
                        {/* Booking ID */}
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-blue-600 mr-2" />
                          <div>
                            <p className="text-sm text-gray-500">Booking ID</p>
                            <p className="font-medium text-gray-600 text-sm">{booking.id}</p>
                          </div>
                        </div>
                      </div>
                      
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="mt-2 text-xs gap-1 hover:bg-gray-100">
                          <span>View details</span>
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-dashed border-gray-200">
                          {/* Address */}
                          <div className="flex items-start">
                            <MapPin className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                            <div>
                              <p className="text-sm text-gray-500">Address</p>
                              <p className="font-medium">
                                {booking.address || 'Not specified'}
                                {booking.city && `, ${booking.city}`}
                              </p>
                              <p className="text-sm text-gray-500">{booking.postal_code}</p>
                            </div>
                          </div>
                          
                          {/* Notes */}
                          <div className="flex items-start">
                            <AlertCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                            <div>
                              <p className="text-sm text-gray-500">Special Instructions</p>
                              <p className="font-medium">
                                {booking.notes || 'No special instructions provided'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </CardContent>
                  <CardFooter className={`pt-2 border-t ${
                    booking.status === 'cancelled' ? 'border-gray-200' : 'border-gray-100'
                  }`}>
                    <div className="w-full flex gap-2">
                      <Button 
                        onClick={() => navigate(`/bookings/view/${booking.id}`)}
                        variant="outline"
                        className="flex-1"
                      >
                        View Details
                      </Button>
                      {booking.service_id && (
                        <Button 
                          onClick={() => navigateToServiceDetails(booking.service_id)}
                          variant="secondary"
                          className="flex-1"
                        >
                          View Service
                        </Button>
                      )}
                      
                      {/* Add Book Again button for completed, cancelled, or rejected bookings */}
                      {['cancelled', 'rejected', 'completed'].includes(booking.status?.toLowerCase()) && booking.service_id && (
                        <Button 
                          onClick={() => navigateToBookingForm(booking)}
                          variant="default"
                          className="flex-1 gap-2"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Book Again
                        </Button>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              ))}
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-6">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="text-sm">
                    Page {currentPage} of {totalPages}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              <div className="mt-8 text-center">
                <p className="text-sm text-gray-500">
                  Showing {currentBookings.length} of {filteredBookings.length} bookings
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Last updated: {new Date().toLocaleDateString('en-US', {
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BookingsList;