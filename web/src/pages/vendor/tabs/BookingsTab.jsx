/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { 
  Calendar, 
  Search, 
  CheckCircle, 
  XCircle,
  Clock, 
  Filter,
  ChevronDown,
  Loader2,
  AlertCircle,
  FileText,
  CheckSquare,
  Ban
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import api from "@/lib/api";
import { format, parseISO } from "date-fns";
import { useToast } from "../../../hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "../../../utils/AuthContext"; // Adjust the import path as needed

const BookingsTab = () => {
  const { toast } = useToast();
  const { currentUser } = useAuth(); // Get current user from auth context
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [sortField, setSortField] = useState("created_at");
  const [sortDirection, setSortDirection] = useState("desc");

  // Helper function to get current formatted timestamp
  const getCurrentTimestamp = () => {
    return "2025-03-12 23:44:08"; // Using the provided timestamp
  };

  // Helper function to get current username
  const getCurrentUsername = () => {
    return "sudeepbanjade21"; // Using the provided username
  };

  // Fetch bookings on component mount
  useEffect(() => {
    fetchBookings();
  }, []);

  // Apply filters when tab, search term, or sort changes
  useEffect(() => {
    applyFilters();
  }, [bookings, activeTab, searchTerm, sortField, sortDirection]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`[${getCurrentTimestamp()}] Fetching vendor bookings for ${getCurrentUsername()}`);
      const response = await api.get('/bookings/vendor');
      
      if (response.data && response.data.bookings) {
        console.log(`[${getCurrentTimestamp()}] Received ${response.data.bookings.length} bookings`);
        setBookings(response.data.bookings);
      } else {
        console.error('Unexpected response format:', response.data);
        setError('Invalid response format from server');
      }
    } catch (err) {
      console.error(`[${getCurrentTimestamp()}] Error fetching bookings:`, err);
      setError('Failed to load bookings. Please try again.');
      toast({
        variant: "destructive",
        title: "Error loading bookings",
        description: "There was a problem retrieving your bookings."
      });
    } finally {
      setLoading(false);
    }
  };

  // Apply filters and sorting to bookings
  const applyFilters = () => {
    let result = [...bookings];
    
    // Filter by status based on active tab
    if (activeTab !== "all") {
      result = result.filter(booking => booking.status?.toLowerCase() === activeTab);
    }
    
    // Filter by search term
    if (searchTerm) {
      const lowercaseSearch = searchTerm.toLowerCase();
      result = result.filter(
        booking => 
          booking.id?.toString().includes(lowercaseSearch) ||
          booking.user_name?.toLowerCase().includes(lowercaseSearch) ||
          booking.service_name?.toLowerCase().includes(lowercaseSearch)
      );
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let valueA = a[sortField];
      let valueB = b[sortField];
      
      // Handle dates
      if (sortField === 'booking_date' || sortField === 'created_at') {
        valueA = new Date(valueA).getTime();
        valueB = new Date(valueB).getTime();
      }
      
      // Handle numbers
      if (sortField === 'amount') {
        valueA = parseFloat(valueA) || 0;
        valueB = parseFloat(valueB) || 0;
      }
      
      // Apply sort direction
      const sortMultiplier = sortDirection === 'asc' ? 1 : -1;
      
      if (valueA < valueB) return -1 * sortMultiplier;
      if (valueA > valueB) return 1 * sortMultiplier;
      return 0;
    });
    
    setFilteredBookings(result);
  };

  const formatDate = (dateString) => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  const formatTime = (dateString) => {
    try {
      return format(parseISO(dateString), 'h:mm a');
    } catch (e) {
      return '';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const statusLower = status?.toLowerCase() || 'pending';
    
    switch (statusLower) {
      case 'accepted':
        return (
          <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs">
            <CheckCircle className="h-3 w-3" />
            <span>Accepted</span>
          </div>
        );
      case 'rejected':
        return (
          <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs">
            <XCircle className="h-3 w-3" />
            <span>Rejected</span>
          </div>
        );
      case 'completed':
        return (
          <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-full text-xs">
            <CheckSquare className="h-3 w-3" />
            <span>Completed</span>
          </div>
        );
      case 'cancelled':
        return (
          <div className="flex items-center gap-1 text-gray-600 bg-gray-50 px-2 py-1 rounded-full text-xs">
            <Ban className="h-3 w-3" />
            <span>Cancelled</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1 text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full text-xs">
            <Clock className="h-3 w-3" />
            <span>Pending</span>
          </div>
        );
    }
  };

  const handleTabChange = (value) => {
    setActiveTab(value);
  };

  const handleSort = (field) => {
    // If clicking the same field, toggle direction
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to descending
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setShowDetailsDialog(true);
  };

  const handleAction = (booking, action) => {
    setSelectedBooking(booking);
    setActionType(action);
    setShowActionDialog(true);
  };

  const executeAction = async () => {
    if (!selectedBooking || !actionType) return;
    
    setActionLoading(true);
    
    try {
      // Determine the status to set based on the action type
      const newStatus = actionType === 'accept' ? 'accepted' :
                        actionType === 'reject' ? 'rejected' : 'completed';
      
      console.log(`[${getCurrentTimestamp()}] Updating booking ${selectedBooking.id} status to ${newStatus}`);
      
      const endpoint = `/bookings/${selectedBooking.id}/status`;
      
      const response = await api.put(endpoint, { status: newStatus });
      
      if (response.status === 200) {
        console.log(`[${getCurrentTimestamp()}] Status update successful, updating UI`);
        
        // Update booking in state
        setBookings(prev => prev.map(booking => 
          booking.id === selectedBooking.id 
            ? { 
                ...booking, 
                status: newStatus 
              } 
            : booking
        ));
        
        // Apply filters to update the filteredBookings array
        applyFilters();
        
        toast({
          title: "Success",
          description: actionType === 'accept' ? 'Booking accepted successfully' :
                      actionType === 'reject' ? 'Booking rejected successfully' : 
                      'Booking marked as completed'
        });
        
        // For completed bookings, refresh data from server to ensure DB sync
        if (actionType === 'complete') {
          setTimeout(() => {
            fetchBookings();
          }, 500); // Small delay to ensure DB has updated
        }
      } else {
        throw new Error('Unexpected response from server');
      }
      
    } catch (err) {
      console.error(`[${getCurrentTimestamp()}] Error during ${actionType} action:`, err);
      toast({
        variant: "destructive",
        title: "Action failed",
        description: err.response?.data?.message || `Failed to ${actionType} booking`
      });
    } finally {
      setActionLoading(false);
      setShowActionDialog(false);
    }
  };

  // Empty state component for when there are no bookings of a certain type
  const EmptyState = ({ status }) => (
    <div className="flex justify-center items-center h-60 bg-gray-50 rounded-lg">
      <div className="text-center">
        <Calendar className="mx-auto h-8 w-8 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No {status} bookings</h3>
        <p className="mt-1 text-sm text-gray-500">Your {status} bookings will appear here.</p>
      </div>
    </div>
  );

  // Booking table component to maintain consistency across tabs
  const BookingTable = ({ bookings }) => {
    if (bookings.length === 0) {
      return <EmptyState status={activeTab === "all" ? "matching" : activeTab} />;
    }
    
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-gray-500 border-b">
              <th className="text-left pb-2">
                <button 
                  className="flex items-center"
                  onClick={() => handleSort('id')}
                >
                  Booking ID
                  {sortField === 'id' && (
                    <ChevronDown className={`h-3 w-3 ml-1 ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} />
                  )}
                </button>
              </th>
              <th className="text-left pb-2">
                <button 
                  className="flex items-center"
                  onClick={() => handleSort('user_name')}
                >
                  Customer
                  {sortField === 'user_name' && (
                    <ChevronDown className={`h-3 w-3 ml-1 ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} />
                  )}
                </button>
              </th>
              <th className="text-left pb-2">
                <button 
                  className="flex items-center"
                  onClick={() => handleSort('service_name')}
                >
                  Service
                  {sortField === 'service_name' && (
                    <ChevronDown className={`h-3 w-3 ml-1 ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} />
                  )}
                </button>
              </th>
              <th className="text-left pb-2">
                <button 
                  className="flex items-center"
                  onClick={() => handleSort('booking_date')}
                >
                  Date
                  {sortField === 'booking_date' && (
                    <ChevronDown className={`h-3 w-3 ml-1 ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} />
                  )}
                </button>
              </th>
              <th className="text-left pb-2">
                <button 
                  className="flex items-center"
                  onClick={() => handleSort('amount')}
                >
                  Amount
                  {sortField === 'amount' && (
                    <ChevronDown className={`h-3 w-3 ml-1 ${sortDirection === 'desc' ? 'transform rotate-180' : ''}`} />
                  )}
                </button>
              </th>
              <th className="text-left pb-2">Status</th>
              <th className="text-left pb-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id} className="border-b">
                <td className="py-3 text-sm">{booking.id}</td>
                <td className="py-3 text-sm">{booking.user_name || 'Unknown User'}</td>
                <td className="py-3 text-sm">{booking.service_name || 'Unknown Service'}</td>
                <td className="py-3 text-sm">
                  {formatDate(booking.booking_date)} <br />
                  <span className="text-xs text-gray-500">{formatTime(booking.booking_date)}</span>
                </td>
                <td className="py-3 text-sm">{formatCurrency(booking.amount || 0)}</td>
                <td className="py-3 text-sm">
                  {getStatusBadge(booking.status)}
                </td>
                <td className="py-3 text-sm">
                  {/* Hide dropdown for completed, cancelled or rejected bookings */}
                  {!['completed', 'cancelled', 'rejected'].includes(booking.status?.toLowerCase()) ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          Actions <ChevronDown className="ml-1 h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                      
                        
                        {/* Show accept/reject options only for pending bookings */}
                        {booking.status?.toLowerCase() === 'pending' && (
                          <>
                            <DropdownMenuItem onClick={() => handleAction(booking, 'accept')}>
                              <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                              <span>Accept</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction(booking, 'reject')}>
                              <XCircle className="mr-2 h-4 w-4 text-red-500" />
                              <span>Reject</span>
                            </DropdownMenuItem>
                          </>
                        )}
                        
                        {/* Show complete option only for accepted bookings */}
                        {booking.status?.toLowerCase() === 'accepted' && (
                          <DropdownMenuItem onClick={() => handleAction(booking, 'complete')}>
                            <CheckSquare className="mr-2 h-4 w-4 text-blue-500" />
                            <span>Mark as Completed</span>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    // For completed, rejected or cancelled bookings just show view details button
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleViewDetails(booking)}
                    >
                      View Details
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Bookings & Appointments</h2>
        <div className="flex justify-center items-center h-60">
          <div className="text-center">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin mx-auto" />
            <p className="mt-2 text-gray-500">Loading your bookings...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Bookings & Appointments</h2>
        <div className="bg-red-50 text-red-800 p-4 rounded-md flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 text-red-600" />
          <div>
            <h3 className="font-medium">Failed to load bookings</h3>
            <p className="text-sm text-red-700">{error}</p>
            <Button onClick={fetchBookings} size="sm" className="mt-3">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Bookings & Appointments</h2>
      <p className="text-gray-600 mb-6">
        Manage your customer bookings and scheduled appointments.
      </p>
      
      {/* Search and Filter */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="search"
            placeholder="Search bookings by ID, customer or service..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={fetchBookings}>Refresh</Button>
      </div>
      
      {/* Tabs for different booking statuses */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Bookings</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="accepted">Accepted</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>
        
        {/* All Bookings Tab */}
        <TabsContent value="all">
          <BookingTable bookings={filteredBookings} />
        </TabsContent>
        
        {/* Pending Bookings Tab */}
        <TabsContent value="pending">
          <BookingTable bookings={filteredBookings} />
        </TabsContent>
        
        {/* Accepted Bookings Tab */}
        <TabsContent value="accepted">
          <BookingTable bookings={filteredBookings} />
        </TabsContent>
        
        {/* Rejected Bookings Tab */}
        <TabsContent value="rejected">
          <BookingTable bookings={filteredBookings} />
        </TabsContent>
        
        {/* Completed Bookings Tab */}
        <TabsContent value="completed">
          <BookingTable bookings={filteredBookings} />
        </TabsContent>
        
        {/* Cancelled Bookings Tab */}
        <TabsContent value="cancelled">
          <BookingTable bookings={filteredBookings} />
        </TabsContent>
      </Tabs>
      
      {/* Booking Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-4">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm text-gray-500">Booking ID</p>
                  <p className="font-medium">{selectedBooking.id}</p>
                </div>
                {getStatusBadge(selectedBooking.status)}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-medium">{selectedBooking.user_name || 'Unknown'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Service</p>
                  <p className="font-medium">{selectedBooking.service_name || 'Unknown'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">{formatDate(selectedBooking.booking_date)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Time</p>
                  <p className="font-medium">{formatTime(selectedBooking.booking_date)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="font-medium">{formatCurrency(selectedBooking.amount || 0)}</p>
                </div>
              </div>
              
              {selectedBooking.address && (
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium">
                    {selectedBooking.address}
                    {selectedBooking.city && `, ${selectedBooking.city}`}
                  </p>
                  {selectedBooking.postal_code && (
                    <p className="text-sm text-gray-500">{selectedBooking.postal_code}</p>
                  )}
                </div>
              )}
              
              {selectedBooking.notes && (
                <div>
                  <p className="text-sm text-gray-500">Notes</p>
                  <p className="bg-gray-50 p-2 rounded text-sm">{selectedBooking.notes}</p>
                </div>
              )}
              
              <DialogFooter>
                {/* Only show action buttons for bookings that can have status changed */}
                {!['completed', 'cancelled', 'rejected'].includes(selectedBooking.status?.toLowerCase()) && (
                  <>
                    {selectedBooking.status?.toLowerCase() === 'pending' && (
                      <div className="flex w-full space-x-2">
                        <Button 
                          variant="destructive" 
                          onClick={() => {
                            setShowDetailsDialog(false);
                            handleAction(selectedBooking, 'reject');
                          }}
                          className="flex-1"
                        >
                          Reject
                        </Button>
                        <Button 
                          variant="default"
                          onClick={() => {
                            setShowDetailsDialog(false);
                            handleAction(selectedBooking, 'accept');
                          }}
                          className="flex-1"
                        >
                          Accept
                        </Button>
                      </div>
                    )}
                    
                    {selectedBooking.status?.toLowerCase() === 'accepted' && (
                      <Button 
                        variant="default"
                        onClick={() => {
                          setShowDetailsDialog(false);
                          handleAction(selectedBooking, 'complete');
                        }}
                        className="w-full"
                      >
                        Mark as Completed
                      </Button>
                    )}
                  </>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Action Confirmation Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'accept' && 'Accept Booking'}
              {actionType === 'reject' && 'Reject Booking'}
              {actionType === 'complete' && 'Complete Booking'}
            </DialogTitle>
          </DialogHeader>
          
          <div>
            <p>
              {actionType === 'accept' && 'Are you sure you want to accept this booking?'}
              {actionType === 'reject' && 'Are you sure you want to reject this booking?'}
              {actionType === 'complete' && 'Are you sure you want to mark this booking as completed?'}
            </p>
            
            {selectedBooking && (
              <div className="bg-gray-50 p-3 rounded-md mt-4 text-sm">
                <p><strong>Booking ID:</strong> {selectedBooking.id}</p>
                <p><strong>Customer:</strong> {selectedBooking.user_name || 'Unknown'}</p>
                <p><strong>Service:</strong> {selectedBooking.service_name || 'Unknown'}</p>
                <p><strong>Date:</strong> {formatDate(selectedBooking.booking_date)}</p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActionDialog(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button 
              variant={actionType === 'reject' ? "destructive" : "default"}
              onClick={executeAction}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {actionType === 'accept' && 'Accept'}
                  {actionType === 'reject' && 'Reject'}
                  {actionType === 'complete' && 'Complete'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Bookings count summary */}
      <div className="mt-6 pt-4 border-t text-sm text-gray-500">
        {bookings.length === 0 ? (
          <p>No bookings available</p>
        ) : (
          <p>
           
          </p>
        )}
      </div>
    </div>
  );
};

export default BookingsTab;