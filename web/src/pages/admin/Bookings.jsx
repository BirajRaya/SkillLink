import { useState, useEffect, useCallback } from "react";
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
  XCircle,
  X,
  Filter,
  DownloadIcon,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
} from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import api from "@/lib/api";

// Helper function to get the status badge with appropriate styling
const getStatusBadge = (status) => {
  const statusStyles = {
    pending: "bg-yellow-50 border-yellow-200 text-yellow-700",
    accepted: "bg-green-50 border-green-200 text-green-700",
    completed: "bg-blue-50 border-blue-200 text-blue-700",
    cancelled: "bg-gray-50 border-gray-200 text-gray-700",
    rejected: "bg-red-50 border-red-200 text-red-700"
  };

  const style = statusStyles[status?.toLowerCase()] || statusStyles.pending;

  return (
    <Badge 
      variant="outline" 
      className={`capitalize font-medium text-xs sm:text-sm px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full shadow-sm ${style}`}
    >
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </Badge>
  );
};

const Bookings = () => {
  const { toast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInputValue, setSearchInputValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState("all");
  const [sortField, setSortField] = useState("booking_date");
  const [sortDirection, setSortDirection] = useState("desc");
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

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInputValue);
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchInputValue]);

  // Fetch bookings when dependencies change
  useEffect(() => {
    fetchBookings();
  }, [currentPage, activeTab, sortField, sortDirection, viewAll, searchTerm]);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);

      // Prepare query parameters
      const params = {
        page: currentPage,
        limit: viewAll ? 1000 : 10, // If viewAll is true, request a large number
        status: activeTab !== "all" ? activeTab : undefined,
        sort: sortField,
        order: sortDirection,
        search: searchTerm || undefined,
      };

      // Call the admin bookings endpoint
      const response = await api.get("/admin/bookings", { params });

      if (response.data && response.data.bookings) {
        setBookings(response.data.bookings);
        setTotalPages(
          Math.ceil(response.data.total / (viewAll ? response.data.total : 10))
        );

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
          response.data.bookings.forEach((booking) => {
            const status = booking.status?.toLowerCase() || "pending"; // Ensure lowercase or default to 'pending'
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
        description: "There was a problem retrieving bookings data.",
      });
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    activeTab,
    sortField,
    sortDirection,
    viewAll,
    searchTerm,
    toast,
  ]);

  // Reset search
  const clearSearch = () => {
    setSearchInputValue("");
    setSearchTerm("");
    setCurrentPage(1);
  };

  // Handle status change
  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    try {
      await api.put(`/admin/bookings/${bookingId}/status`, {
        status: newStatus,
      });

      // Update the booking in the local state
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === bookingId ? { ...booking, status: newStatus } : booking
        )
      );

      // Update statistics
      const oldStatus =
        bookings.find((b) => b.id === bookingId)?.status?.toLowerCase() ||
        "pending";
      setStatistics((prev) => ({
        ...prev,
        [oldStatus]: Math.max(0, prev[oldStatus] - 1),
        [newStatus.toLowerCase()]: prev[newStatus.toLowerCase()] + 1,
      }));

      toast({
        title: "Status updated",
        description: `Booking status changed to ${newStatus}`,
      });
    } catch (error) {
      console.error("Error updating booking status:", error);
      toast({
        variant: "destructive",
        title: "Error updating status",
        description: "Failed to update booking status.",
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

  // Handle sort change
  const toggleSortDirection = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
    setCurrentPage(1);
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Format time for display
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Return loading state
  if (loading && bookings.length === 0) {
    return (
      <div className="container px-3 sm:px-6 py-4 sm:py-6 mx-auto max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600" />
            Booking Management
          </h1>
        </div>
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow-sm border p-6 sm:p-8">
          <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-blue-600 mb-4" />
          <span className="text-gray-600 font-medium text-sm sm:text-base">
            Loading booking information...
          </span>
          <p className="text-gray-400 text-xs sm:text-sm mt-2">
            Please wait while we fetch your data
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-3 sm:px-6 py-4 sm:py-6 mx-auto max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2 mb-1">
            <Calendar className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600" />
            Booking Management
          </h1>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 items-start sm:items-end">
        <div className="relative flex-1 w-full">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400">
            <Search className="h-4 w-4" />
          </div>

          <input
            type="search"
            className="pl-10 pr-4 py-2.5 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm"
            placeholder="Search by service, customer or vendor"
            value={searchInputValue}
            onChange={(e) => setSearchInputValue(e.target.value)}
          />
          
          {searchInputValue && (
            <button 
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="flex gap-3 flex-shrink-0"></div>
      </div>

      {/* Tabs for status filtering - scrollable on small screens */}
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <div className="overflow-x-auto pb-1 mb-5 sm:mb-6 -mx-3 px-3">
          <TabsList className="grid min-w-max grid-cols-6 w-full bg-gray-100/60 p-1 rounded-lg">
            <TabsTrigger
              value="all"
              className={`${
                activeTab === "all"
                  ? "bg-white shadow-sm text-blue-600 font-medium"
                  : "text-gray-600 hover:text-gray-900"
              } transition-all text-xs sm:text-sm py-1.5 sm:py-2`}
            >
              All
            </TabsTrigger>
            <TabsTrigger
              value="pending"
              className={`${
                activeTab === "pending"
                  ? "bg-white shadow-sm text-yellow-600 font-medium"
                  : "text-gray-600 hover:text-gray-900"
              } transition-all text-xs sm:text-sm py-1.5 sm:py-2`}
            >
              Pending
            </TabsTrigger>
            <TabsTrigger
              value="accepted"
              className={`${
                activeTab === "accepted"
                  ? "bg-white shadow-sm text-green-600 font-medium"
                  : "text-gray-600 hover:text-gray-900"
              } transition-all text-xs sm:text-sm py-1.5 sm:py-2`}
            >
              Accepted
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className={`${
                activeTab === "completed"
                  ? "bg-white shadow-sm text-blue-600 font-medium"
                  : "text-gray-600 hover:text-gray-900"
              } transition-all text-xs sm:text-sm py-1.5 sm:py-2`}
            >
              Completed
            </TabsTrigger>
            <TabsTrigger
              value="cancelled"
              className={`${
                activeTab === "cancelled"
                  ? "bg-white shadow-sm text-gray-600 font-medium"
                  : "text-gray-600 hover:text-gray-900"
              } transition-all text-xs sm:text-sm py-1.5 sm:py-2`}
            >
              Cancelled
            </TabsTrigger>
            <TabsTrigger
              value="rejected"
              className={`${
                activeTab === "rejected"
                  ? "bg-white shadow-sm text-red-600 font-medium"
                  : "text-gray-600 hover:text-gray-900"
              } transition-all text-xs sm:text-sm py-1.5 sm:py-2`}
            >
              Rejected
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Bookings Table */}
        <TabsContent value={activeTab} className="mt-0">
          <Card className="border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <CardHeader className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4">
              <CardTitle className="text-base sm:text-lg font-medium text-gray-800">
                {activeTab === "all"
                  ? "All Bookings"
                  : `${
                      activeTab.charAt(0).toUpperCase() + activeTab.slice(1)
                    } Bookings`}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {bookings.length}{" "}
                {bookings.length === 1 ? "booking" : "bookings"} found
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0">
              {bookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-gray-50">
                  <div className="bg-gray-100/80 rounded-full p-3 mb-4">
                    <Calendar className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-1">
                    No bookings found
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 max-w-md">
                    {activeTab !== "all"
                      ? `There are no bookings with ${activeTab} status at the moment`
                      : searchTerm
                      ? "No bookings match your search criteria. Try adjusting your search terms."
                      : "No bookings found. Try adjusting your filters."}
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4 flex items-center gap-2 text-xs sm:text-sm py-1.5 sm:py-2 h-auto"
                    onClick={() => {
                      clearSearch();
                      if (activeTab !== "all") {
                        setActiveTab("all");
                      } else {
                        fetchBookings();
                      }
                    }}
                  >
                    <RefreshCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    {activeTab !== "all" ? "View All Bookings" : "Reset Search"}
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead
                          className="font-semibold text-gray-600 text-xs sm:text-sm py-2.5 px-2 sm:py-3 sm:px-4"
                          onClick={() => toggleSortDirection("id")}
                        >
                          <div className="flex items-center gap-1 cursor-pointer hover:text-blue-600">
                            ID
                            {sortField === "id" && (
                              <ArrowUpDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 ml-1" />
                            )}
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-gray-600 text-xs sm:text-sm py-2.5 px-2 sm:py-3 sm:px-4">
                          Service
                        </TableHead>
                        <TableHead className="font-semibold text-gray-600 text-xs sm:text-sm py-2.5 px-2 sm:py-3 sm:px-4">
                          User / Vendor
                        </TableHead>
                        <TableHead
                          className="font-semibold text-gray-600 text-xs sm:text-sm py-2.5 px-2 sm:py-3 sm:px-4"
                          onClick={() => toggleSortDirection("booking_date")}
                        >
                          <div className="flex items-center gap-1 cursor-pointer hover:text-blue-600">
                            Booking
                            {sortField === "booking_date" && (
                              <ArrowUpDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 ml-1" />
                            )}
                          </div>
                        </TableHead>
                        {activeTab === "all" && (
                          <TableHead className="font-semibold text-gray-600 text-xs sm:text-sm py-2.5 px-2 sm:py-3 sm:px-4">
                            Status
                          </TableHead>
                        )}
                        <TableHead
                          className="font-semibold text-gray-600 text-xs sm:text-sm py-2.5 px-2 sm:py-3 sm:px-4"
                          onClick={() => toggleSortDirection("amount")}
                        >
                          <div className="hidden sm:flex items-center gap-1 cursor-pointer hover:text-blue-600">
                            Amount
                            {sortField === "amount" && (
                              <ArrowUpDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 ml-1" />
                            )}
                          </div>
                          <div className="sm:hidden">$</div>
                        </TableHead>
                        <TableHead className="text-right font-semibold text-gray-600 text-xs sm:text-sm py-2.5 px-2 sm:py-3 sm:px-4">
                          <span className="sr-only">Actions</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings.map((booking) => (
                        <TableRow
                          key={booking.id}
                          className="hover:bg-blue-50/30 transition-colors"
                        >
                          <TableCell className="font-medium text-gray-700 text-xs sm:text-sm py-2.5 px-2 sm:py-3 sm:px-4">
                            #{booking.id}
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm py-2.5 px-2 sm:py-3 sm:px-4">
                            <div className="font-medium text-gray-800 truncate max-w-[80px] sm:max-w-none">
                              {booking.service_name || "Service"}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm py-2.5 px-2 sm:py-3 sm:px-4">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-600" />
                                <span className="font-medium truncate max-w-[80px] sm:max-w-none">
                                  {booking.user_name || "User"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
                                <Building2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                <span className="truncate max-w-[80px] sm:max-w-none">
                                  {booking.vendor_name || "Vendor"}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm py-2.5 px-2 sm:py-3 sm:px-4">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1 text-gray-700">
                                <CalendarDays className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-500" />
                                <span>{formatDate(booking.booking_date)}</span>
                              </div>
                              <div className="flex items-center gap-1 text-gray-500 text-xs sm:text-sm mt-0.5 sm:mt-1">
                                <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                {formatTime(booking.booking_date)}
                              </div>
                            </div>
                          </TableCell>
                          {activeTab === "all" && (
                            <TableCell className="text-xs sm:text-sm py-2.5 px-2 sm:py-3 sm:px-4">
                              {getStatusBadge(booking.status)}
                            </TableCell>
                          )}
                          <TableCell className="text-xs sm:text-sm py-2.5 px-2 sm:py-3 sm:px-4">
                            <div className="flex items-center gap-1 font-medium text-gray-700">
                              <DollarSign className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-600" />
                              {booking.amount}
                            </div>
                          </TableCell>
                          <TableCell className="text-right py-2.5 px-2 sm:py-3 sm:px-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                              onClick={() => viewBookingDetails(booking)}
                            >
                              <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              <span className="sr-only">View Details</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>

            {/* Pagination - Simplified for mobile */}
            {bookings.length > 0 && totalPages > 1 && !viewAll && (
              <CardFooter className="flex flex-col xs:flex-row items-center justify-between border-t p-3 sm:p-4 bg-gray-50 gap-3">
                <div className="text-xs sm:text-sm text-gray-500 w-full xs:w-auto text-center xs:text-left">
                  <span className="hidden xs:inline">Showing</span>{" "}
                  <span className="font-medium text-gray-700">
                    {(currentPage - 1) * 10 + 1}-
                    {Math.min(currentPage * 10, statistics.total)}
                  </span>{" "}
                  <span className="hidden xs:inline">of</span>{" "}
                  <span className="font-medium text-gray-700">
                    {statistics.total}
                  </span>
                </div>

                <div className="flex gap-2 w-full xs:w-auto justify-center xs:justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 bg-white h-8 text-xs px-2 sm:px-3"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">Prev</span>
                  </Button>

                  {/* Simple pagination for small screens */}
                  <div className="flex items-center text-xs sm:text-sm px-2">
                    <span className="font-medium">{currentPage}</span>
                    <span className="mx-1">/</span>
                    <span>{totalPages}</span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 bg-white h-8 text-xs px-2 sm:px-3"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage >= totalPages}
                  >
                    <span className="hidden xs:inline">Next</span>
                    <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                </div>
                
                {/* View all button moved below on small screens */}
                <Button
                  variant="outline"
                  size="sm"
                  className="xs:hidden bg-white text-xs w-full"
                  onClick={() => setViewAll(true)}
                >
                  View All ({statistics.total})
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden xs:block bg-white text-xs h-8 px-3"
                  onClick={() => setViewAll(true)}
                >
                  View All
                </Button>
              </CardFooter>
            )}

            {/* Show button to return to pagination when viewing all */}
            {viewAll && bookings.length > 10 && (
              <CardFooter className="flex flex-col xs:flex-row items-center justify-between border-t p-3 sm:p-4 bg-gray-50 gap-2">
                <div className="text-xs sm:text-sm text-gray-500 mb-2 xs:mb-0">
                  Viewing all {bookings.length} bookings
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white text-xs w-full xs:w-auto"
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

      {/* Booking Details Modal - Made Responsive */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white z-10 flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4 border-b">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                Booking Details
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:bg-gray-100 rounded-full h-7 w-7 sm:h-8 sm:w-8 p-0"
                onClick={() => setSelectedBooking(null)}
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>

            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-50 p-1.5 sm:p-2 rounded-full">
                    <CalendarDays className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-bold text-gray-900">
                      #{selectedBooking.id}
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-500">
                      Created on {formatDate(selectedBooking.created_at)}
                    </p>
                  </div>
                </div>
                {getStatusBadge(selectedBooking.status)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2 sm:mb-3 flex items-center gap-1.5 text-sm sm:text-base">
                    <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
                    Booking Information
                  </h4>
                  <div className="bg-gray-50 rounded-lg border border-gray-200 divide-y divide-gray-200">
                    <div className="flex justify-between p-2.5 sm:p-3 text-xs sm:text-sm">
                      <span className="text-gray-600">Service:</span>
                      <span className="font-medium text-gray-900">
                        {selectedBooking.service_name || "Service"}
                      </span>
                    </div>
                    <div className="flex justify-between p-2.5 sm:p-3 text-xs sm:text-sm">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-medium text-gray-900">
                        {formatDate(selectedBooking.booking_date)}
                      </span>
                    </div>
                    <div className="flex justify-between p-2.5 sm:p-3 text-xs sm:text-sm">
                      <span className="text-gray-600">Time:</span>
                      <span className="font-medium text-gray-900">
                        {formatTime(selectedBooking.booking_date)}
                      </span>
                    </div>
                    <div className="flex justify-between p-2.5 sm:p-3 text-xs sm:text-sm">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-medium text-green-600">
                        ${selectedBooking.amount}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2 sm:mb-3 flex items-center gap-1.5 text-sm sm:text-base">
                    <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
                    Customer & Vendor
                  </h4>
                  <div className="bg-gray-50 rounded-lg border border-gray-200">
                    <div className="p-2.5 sm:p-3 border-b border-gray-200">
                      <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                        <div className="bg-blue-100 h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-xs sm:text-sm">
                            {selectedBooking.user_name || "Customer"}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-500">
                            {selectedBooking.user_email || "No email available"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-2.5 sm:p-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="bg-green-100 h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center">
                          <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-xs sm:text-sm">
                            {selectedBooking.vendor_name || "Vendor"}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-500">
                            {selectedBooking.vendor_email ||
                              "No email available"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-2 sm:mb-3 flex items-center gap-1.5 text-sm sm:text-base">
                  <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
                  Service Location
                </h4>
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 sm:p-4">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="bg-red-100 p-1 sm:p-1.5 rounded-full mt-0.5 flex-shrink-0">
                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-xs sm:text-sm">
                        {selectedBooking.address || "N/A"}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">
                        {[
                          selectedBooking.city,
                          selectedBooking.province,
                          selectedBooking.postal_code,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {selectedBooking.country || ""}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {selectedBooking.notes && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2 sm:mb-3 flex items-center gap-1.5 text-sm sm:text-base">
                    <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
                    Special Instructions
                  </h4>
                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 sm:p-4">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="bg-blue-100 p-1 sm:p-1.5 rounded-full mt-0.5 flex-shrink-0">
                        <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                      </div>
                      <p className="text-xs sm:text-sm text-gray-800">{selectedBooking.notes}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Booking Timeline */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2 sm:mb-3 flex items-center gap-1.5 text-sm sm:text-base">
                  <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
                  Booking Timeline
                </h4>
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 sm:p-4">
                  <div className="space-y-4">
                    <div className="flex gap-2 sm:gap-3 items-start">
                      <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-700" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-xs sm:text-sm">
                          Booking Created
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(selectedBooking.created_at)} at{" "}
                          {formatTime(selectedBooking.created_at)}
                        </p>
                      </div>
                    </div>

                    {selectedBooking.status !== "pending" && (
                      <div className="flex gap-2 sm:gap-3 items-start">
                        <div
                          className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            selectedBooking.status === "cancelled" ||
                            selectedBooking.status === "rejected"
                              ? "bg-red-100"
                              : selectedBooking.status === "completed"
                              ? "bg-blue-100"
                              : "bg-green-100"
                          }`}
                        >
                          {selectedBooking.status === "cancelled" ? (
                            <Ban className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-700" />
                          ) : selectedBooking.status === "rejected" ? (
                            <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-700" />
                          ) : selectedBooking.status === "completed" ? (
                            <CheckSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-700" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-700" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-xs sm:text-sm">
                            Booking{" "}
                            {selectedBooking.status.charAt(0).toUpperCase() +
                              selectedBooking.status.slice(1)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(selectedBooking.updated_at)} at{" "}
                            {formatTime(selectedBooking.updated_at)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-3 border-t pt-4 sm:pt-6">
                {selectedBooking.status === "pending" && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() =>
                        handleUpdateBookingStatus(
                          selectedBooking.id,
                          "rejected"
                        )
                      }
                      className="bg-white border-gray-300 text-red-600 hover:bg-red-50 hover:border-red-300 text-xs sm:text-sm py-1.5 sm:py-2 h-auto w-full sm:w-auto"
                    >
                      Reject
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        handleUpdateBookingStatus(
                          selectedBooking.id,
                          "accepted"
                        )
                      }
                      className="bg-white border-gray-300 text-green-600 hover:bg-green-50 hover:border-green-300 text-xs sm:text-sm py-1.5 sm:py-2 h-auto w-full sm:w-auto"
                    >
                      Accept
                    </Button>
                  </>
                )}

                {selectedBooking.status === "accepted" && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      handleUpdateBookingStatus(selectedBooking.id, "completed")
                    }
                    className="bg-white border-gray-300 text-blue-600 hover:bg-blue-50 hover:border-blue-300 text-xs sm:text-sm py-1.5 sm:py-2 h-auto w-full sm:w-auto"
                  >
                    Mark Completed
                  </Button>
                )}

                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm py-1.5 sm:py-2 h-auto w-full sm:w-auto"
                  onClick={() => setSelectedBooking(null)}
                >
                  Close Details
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;