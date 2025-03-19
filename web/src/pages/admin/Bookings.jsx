import { useState, useEffect } from 'react';
import { 
  Calendar, 
  Search, 
  User,
  Clock, 
  Ban,
  CheckSquare,
  Building2,
  Loader2,
  CalendarDays,
  DollarSign,
  MapPin,
  AlertCircle,
  Eye,
  MoreHorizontal,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useToast } from "../../hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import api from '@/lib/api';

const Bookings = () => {
  const { toast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState('all');
  const [sortField, setSortField] = useState('booking_date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [viewAll, setViewAll] = useState(false);
  const [statistics, setStatistics] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    completed: 0,
    cancelled: 0,
    rejected: 0,
  });
  
  // Fetch all bookings
  useEffect(() => {
    fetchBookings();
  }, [currentPage, activeTab, sortField, sortDirection, viewAll]);
  
  const fetchBookings = async () => {
    try {
      setLoading(true);
      
      // Prepare query parameters
      const params = {
        page: currentPage,
        limit: viewAll ? 1000 : 10, // If viewAll is true, request a large number
        status: activeTab !== 'all' ? activeTab : undefined,
        sort: sortField,
        order: sortDirection,
        search: searchTerm || undefined
      };
      
      // Call the admin bookings endpoint
      const response = await api.get('/admin/bookings', { params });
      
      if (response.data && response.data.bookings) {
        setBookings(response.data.bookings);
        setTotalPages(Math.ceil(response.data.total / (viewAll ? response.data.total : 10)));
        
        // Update statistics if available
        if (response.data.statistics) {
          setStatistics(response.data.statistics);
        } else {
          // Calculate statistics from bookings
          const stats = {
            total: response.data.total || response.data.bookings.length,
            pending: 0,
            accepted: 0,
            completed: 0,
            cancelled: 0,
            rejected: 0,
          };
          
          // Count bookings by status
          response.data.bookings.forEach(booking => {
            const status = booking.status?.toLowerCase() || 'pending';
            if (stats[status] !== undefined) {
              stats[status]++;
            }
          });
          
          setStatistics(stats);
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error loading bookings",
        description: "There was a problem retrieving bookings data."
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle search
  const handleSearch = () => {
    setCurrentPage(1);
    fetchBookings();
  };
  
  // Handle status change
  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    try {
      await api.put(`/admin/bookings/${bookingId}/status`, { status: newStatus });
      
      // Update the booking in the local state
      setBookings(prev => 
        prev.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: newStatus } 
            : booking
        )
      );
      
      // Update statistics
      const oldStatus = bookings.find(b => b.id === bookingId)?.status?.toLowerCase() || 'pending';
      setStatistics(prev => ({
        ...prev,
        [oldStatus]: Math.max(0, prev[oldStatus] - 1),
        [newStatus.toLowerCase()]: prev[newStatus.toLowerCase()] + 1
      }));
      
      toast({
        title: "Status updated",
        description: `Booking status changed to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast({
        variant: "destructive",
        title: "Error updating status",
        description: "Failed to update booking status."
      });
    }
  };
  
  // Handle view booking details
  const viewBookingDetails = (booking) => {
    setSelectedBooking(booking);
  };
  
  // Handle tab change
  const handleTabChange = (value) => {
    setActiveTab(value);
    setCurrentPage(1);
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Format time for display
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Get status badge component
  const getStatusBadge = (status) => {
    switch (status?.toLowerCase() || 'pending') {
      case 'accepted':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Accepted</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Cancelled</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
    }
  };

  // Return loading state
  if (loading && bookings.length === 0) {
    return (
      <div className="container p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Manage Bookings</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <span>Loading bookings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Bookings</h1>
      </div>
      
      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            type="search"
            placeholder="Search by service name, user or vendor..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Button onClick={handleSearch}>Search</Button>
      </div>
      
      {/* Tabs for status filtering */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-6 grid grid-cols-6 w-full">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="accepted">Accepted</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
      
        {/* Bookings Table */}
        <TabsContent value={activeTab} className="mt-0">
          <Card className="border-0 shadow-none">
            <CardContent className="p-0">
              {bookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <Calendar className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-1">No bookings found</h3>
                  <p className="text-gray-500">
                    {activeTab !== 'all' 
                      ? `There are no bookings with ${activeTab} status`
                      : 'No bookings match your search criteria'}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking ID</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>User / Vendor</TableHead>
                      <TableHead>Booking Date</TableHead>
                      {activeTab === 'all' && <TableHead>Status</TableHead>}
                      <TableHead>Amount</TableHead>
                      <TableHead className="text-right">View Detail</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">{booking.id}</TableCell>
                        <TableCell>{booking.service_name || "Service"}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1">
                              <User className="h-3.5 w-3.5 text-blue-600" /> 
                              {booking.user_name || "User"}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Building2 className="h-3.5 w-3.5" /> 
                              {booking.vendor_name || "Vendor"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <div>{formatDate(booking.booking_date)}</div>
                            <div className="text-gray-500 text-sm">{formatTime(booking.booking_date)}</div>
                          </div>
                        </TableCell>
                        {activeTab === 'all' && <TableCell>{getStatusBadge(booking.status)}</TableCell>}
                        <TableCell>
                          <div className="font-medium">${booking.amount}</div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0" 
                            onClick={() => viewBookingDetails(booking)}
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View Details</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
              
            {/* Pagination */}
            {totalPages > 1 && !viewAll && (
              <CardFooter className="flex items-center justify-between border-t p-4">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage <= 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline" 
                    size="sm"
                    onClick={() => setViewAll(true)}
                  >
                    View All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              </CardFooter>
            )}
            
            {/* Show button to return to pagination when viewing all */}
            {viewAll && bookings.length > 10 && (
              <CardFooter className="flex items-center justify-end border-t p-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setViewAll(false);
                    setCurrentPage(1);
                  }}
                >
                  Return to Pagination
                </Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold">Booking Details</h3>
                <Button variant="ghost" size="sm" onClick={() => setSelectedBooking(null)}>
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-medium text-sm text-gray-500 mb-1">Booking Information</h4>
                  <div className="border rounded-md p-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-500">ID:</span>
                      <span className="font-medium">{selectedBooking.id}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-500">Service:</span>
                      <span className="font-medium">{selectedBooking.service_name || "Service"}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-500">Status:</span>
                      <span>{getStatusBadge(selectedBooking.status)}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-500">Amount:</span>
                      <span className="font-medium">${selectedBooking.amount}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-500">Date:</span>
                      <span>{formatDate(selectedBooking.booking_date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Time:</span>
                      <span>{formatTime(selectedBooking.booking_date)}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm text-gray-500 mb-1">Customer & Vendor</h4>
                  <div className="border rounded-md p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium">{selectedBooking.user_name || "Customer"}</p>
                        <p className="text-sm text-gray-500">{selectedBooking.user_email || "No email available"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">{selectedBooking.vendor_name || "Vendor"}</p>
                        <p className="text-sm text-gray-500">{selectedBooking.vendor_email || "No email available"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="font-medium text-sm text-gray-500 mb-1">Location</h4>
                <div className="border rounded-md p-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-5 w-5 text-red-500 mt-0.5" />
                    <div>
                      <p>{selectedBooking.address || "N/A"}</p>
                      <p>{selectedBooking.city || "N/A"}, {selectedBooking.province || "N/A"} {selectedBooking.postal_code || "N/A"}</p>
                      <p>{selectedBooking.country || "N/A"}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {selectedBooking.notes && (
                <div className="mb-6">
                  <h4 className="font-medium text-sm text-gray-500 mb-1">Special Instructions</h4>
                  <div className="border rounded-md p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                      <p>{selectedBooking.notes}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Booking Timeline */}
              <div>
                <h4 className="font-medium text-sm text-gray-500 mb-1">Timeline</h4>
                <div className="border rounded-md p-4">
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                        <FileText className="h-3 w-3 text-blue-700" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Booking Created</p>
                        <p className="text-xs text-gray-500">{formatDate(selectedBooking.created_at)} {formatTime(selectedBooking.created_at)}</p>
                      </div>
                    </div>
                    
                    {selectedBooking.status !== 'pending' && (
                      <div className="flex gap-2">
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center ${
                          selectedBooking.status === 'cancelled' || selectedBooking.status === 'rejected' 
                            ? 'bg-red-100' 
                            : 'bg-green-100'
                        }`}>
                          {selectedBooking.status === 'cancelled' ? (
                            <Ban className="h-3 w-3 text-red-700" />
                          ) : selectedBooking.status === 'rejected' ? (
                            <XCircle className="h-3 w-3 text-red-700" />
                          ) : selectedBooking.status === 'completed' ? (
                            <CheckSquare className="h-3 w-3 text-green-700" />
                          ) : (
                            <CheckCircle2 className="h-3 w-3 text-green-700" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">Booking {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}</p>
                          <p className="text-xs text-gray-500">{formatDate(selectedBooking.updated_at)} {formatTime(selectedBooking.updated_at)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedBooking(null)}>
                  Close
                </Button>
                {/* Accept, Reject, Cancel buttons removed */}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;