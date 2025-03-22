import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2, 
  XCircle,
  Loader2,
  Eye,
  MessageSquare
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { useToast } from "../../hooks/use-toast";
import api from '@/lib/api';
import { useAuth } from '@/utils/AuthContext';

const DisputeDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState("all");

  const activeTabVsDbValue = new Map();
    activeTabVsDbValue.set("accepted", 'accept');
    activeTabVsDbValue.set('rejected', 'reject');
    activeTabVsDbValue.set('pending', 'pending');
  const itemsPerPage = 5;
    const { currentUser } = useAuth(); // Get current user from auth context
  

  const getCurrentTimestamp = () => {
    return new Date().toISOString().replace('T', ' ').slice(0, 19);
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/disputes/user', {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          status: activeTab !== 'all' ? activeTab : undefined,
          user_id:currentUser.id
        }
      });
      
      if (response.data && response.data.disputes) {
        console.log(`[${getCurrentTimestamp()}] Received ${response.data.disputes.length} disputes`);
        setDisputes(response.data.disputes);
        
        // Calculate total pages based on disputes length if total isn't provided
        const total = response.data.total || response.data.disputes.length;
        setTotalPages(Math.ceil(total / itemsPerPage));
      } else {
        console.error('Unexpected response format:', response.data);
        setError('Invalid response format from server');
      }
    } catch (err) {
      console.error(`[${getCurrentTimestamp()}] Error fetching disputes:`, err);
      setError('Failed to load your disputes');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase() || 'pending') {
      case 'accept':
        return (
          <div className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm">
            <CheckCircle2 className="h-4 w-4" />
            <span>Accepted</span>
          </div>
        );
      case 'reject':
        return (
          <div className="flex items-center gap-1 text-red-600 bg-red-50 px-3 py-1 rounded-full text-sm">
            <XCircle className="h-4 w-4" />
            <span>Rejected</span>
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

  // Handle sending a message to admin
  const handleMessageAdmin = (dispute) => {
    // Navigate to messaging page with admin ID
    navigate(`/messages/admin?dispute=${dispute.id}`);
  };

  // Handle view dispute details
  const handleViewDetails = (dispute) => {
    navigate(`/disputes/${dispute.id}`);
  };

  // Filter disputes by search term and status
  const filterDisputes = () => {
    return disputes.filter(dispute => {
      // Filter by search term (service name or reason)
      const matchesSearch = 
        !searchTerm || 
        (dispute.service_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (dispute.reason || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filter by status if specified
      if (activeTab === 'all') {
        return matchesSearch;
      } else {
        return (dispute.status || '').toLowerCase() === activeTabVsDbValue.get(activeTab) && matchesSearch;
      }
    });
  };

   // Get filtered disputes based on active tab
   const filtered = filterDisputes();
   const pendingDisputes = filtered.filter(dispute => dispute.status.toLowerCase() == "pending" );
   const acceptedDisputes = filtered.filter(dispute => dispute.status.toLowerCase() == "accept" );
   const rejectedDisputes = filtered.filter(dispute => dispute.status.toLowerCase() == 'reject');   

  const DisputeCard = ({ dispute }) => {
    return ( 
      <div className="bg-white border rounded-lg shadow-sm p-4 mb-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">{dispute.service_name || "Service"}</h3>
            </div>
            <p className="text-gray-600 text-sm">by {dispute.vendor_name || "Service Provider"}</p>
          </div>
          {getStatusBadge(dispute.status)}
        </div>
        
        <div className="mb-4">
          <div className="flex flex-wrap gap-4 mb-2">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700 mr-1">Dispute ID:</span>
              <span className="text-sm">{dispute.id}</span>
            </div>
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700 mr-1">Filed on:</span>
              <span className="text-sm">{formatDate(dispute.created_at)}</span>
            </div>
          </div>
          
          <div className="mb-3">
            <span className="text-sm font-medium text-gray-700">Reason: </span>
            <span className="text-sm text-gray-800">{dispute.reason?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
          </div>
          
          <div className="mb-1">
            <span className="text-sm font-medium text-gray-700">Description:</span>
          </div>
          <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-md mb-3">
            {dispute.description?.length > 150 
              ? `${dispute.description.substring(0, 150)}...` 
              : dispute.description}
          </p>
          
          {dispute.feedback && (
            <>
              <div className="mb-1">
                <span className="text-sm font-medium text-gray-700">Response:</span>
              </div>
              <p className="text-sm text-gray-800 bg-blue-50 p-3 rounded-md">
                {dispute.feedback?.length > 150 
                  ? `${dispute.feedback.substring(0, 150)}...` 
                  : dispute.feedback}
              </p>
            </>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin mr-2" />
        <span className="text-lg">Loading your disputes...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-6 text-center my-4">
        <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Failed to load disputes</h3>
        <p className="text-red-600">{error}</p>
        <Button 
          className="mt-4"
          onClick={fetchDisputes}
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (disputes.length === 0) {
    return (
      <div className="bg-gray-50 border rounded-md p-6 text-center my-4">
        <AlertTriangle className="h-10 w-10 text-blue-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Disputes Found</h3>
        <p className="text-gray-600 mb-4">You haven't filed any disputes yet.</p>
        <Button onClick={() => navigate('/bookings')}>View My Bookings</Button>
      </div>
    );
  }

 

  return (
    <div className="max-w-4xl mx-auto my-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">My Disputes</h1>
      
      {/* Search and Filter */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="search"
            placeholder="Search disputes..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {/* Tabs for different dispute statuses */}
      <Tabs defaultValue="all" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="accepted">Accepted</TabsTrigger> 
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
        
        {/* All Disputes */}
        <TabsContent value="all">
          {filtered.length > 0 ? (
            <>
              {filtered.map(dispute => (
                <DisputeCard key={dispute.id} dispute={dispute} />
              ))}
            </>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-md">
              <p className="text-gray-500">No disputes match your search</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending">
          {pendingDisputes.length > 0 ? (
            <>
              {pendingDisputes.map(dispute => (
                <DisputeCard key={dispute.id} dispute={dispute} />
              ))}
            </>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-md">
              <p className="text-gray-500">No disputes match your search</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="accepted">
          {acceptedDisputes.length > 0 ? (
            <>
              {acceptedDisputes.map(dispute => (
                <DisputeCard key={dispute.id} dispute={dispute} />
              ))}
            </>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-md">
              <p className="text-gray-500">No disputes match your search</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="rejected">
          {rejectedDisputes.length > 0 ? (
            <>
              {rejectedDisputes.map(dispute => (
                <DisputeCard key={dispute.id} dispute={dispute} />
              ))}
            </>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-md">
              <p className="text-gray-500">No disputes match your search</p>
            </div>
          )}
        </TabsContent>

        {/* Other status tabs */}
        {/* {["accepted", "rejected"].map(status => {
        const disputesList = status == "accepted" ? acceptedDisputes : rejectedDisputes;
      
        return (
            <TabsContent key={status} value={status}>
            {disputesList.length > 0 ? (
                disputesList.map(dispute => (
                <DisputeCard key={dispute.id} dispute={dispute} />
                ))
            ) : (
                <div className="text-center py-8 bg-gray-50 rounded-md">
                <p className="text-gray-500">No {status} disputes</p>
                </div>
            )}
            </TabsContent>
        );
        })} */}

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
        Last updated: {new Date().toLocaleDateString('en-US', {
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

export default DisputeDashboard;