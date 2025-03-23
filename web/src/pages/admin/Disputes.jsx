import { useState, useEffect, useMemo } from "react";
import {
  Edit,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Shield,
  X,
  User,
  Store,
  ShoppingBag,
  FileText,
  AlertCircle,
} from "lucide-react";
import api from "@/utils/api";
import { useAuth } from "@/utils/AuthContext";
import { useToast } from "@/hooks/use-toast";

const Disputes = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [disputes, setDisputes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("pending");
  const [evidence, setEvidence] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [errors, setErrors] = useState({});
  const { currentUser } = useAuth(); // Get current user from auth context
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const [loadedEvidences, setLoadedEvidences] = useState({});

  // For toast - handle potential missing hook
  const toastFunc =
    useToast?.toast ||
    (({ title, description }) => {
      console.log(`${title}: ${description}`);
      alert(`${title}: ${description}`);
    });

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalDisputes, setTotalDisputes] = useState(0);

  const toggleDescription = (id) => {
    setExpandedDescriptions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Function to load individual evidence images
  const loadEvidenceImage = async (disputeId) => {
    if (loadedEvidences[disputeId]) return; // Already loaded or loading

    try {
      // Mark as loading to prevent duplicate requests
      setLoadedEvidences((prev) => ({
        ...prev,
        [disputeId]: "loading",
      }));

      const response = await api.get(`/disputes/${disputeId}/evidence`);
      if (response.data && response.data.evidence) {
        setLoadedEvidences((prev) => ({
          ...prev,
          [disputeId]: response.data.evidence,
        }));
      } else {
        // No evidence found
        setLoadedEvidences((prev) => ({
          ...prev,
          [disputeId]: null,
        }));
      }
    } catch (error) {
      console.error(`Failed to load evidence for dispute ${disputeId}:`, error);
      // Mark as failed so we don't try again
      setLoadedEvidences((prev) => ({
        ...prev,
        [disputeId]: null,
      }));
    }
  };

  // Fetch disputes data when component mounts
  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/disputes/user", {
        params: {
          user_id: currentUser?.id,
          isAdmin: true,
          include_details: true,
        },
      });

      // Process the returned disputes to handle the evidence field correctly
      const processedDisputes = response.data.disputes.map((dispute) => {
        // If evidence exists but isn't the 'has-evidence' marker (for backward compatibility)
        if (
          dispute.evidence &&
          typeof dispute.evidence === "string" &&
          !dispute.evidence.startsWith("data:image") &&
          dispute.evidence !== "has-evidence"
        ) {
          return { ...dispute, evidence: "has-evidence" };
        }
        return dispute;
      });

      setDisputes(processedDisputes);
      setTotalDisputes(response.data.disputes.length);
    } catch (error) {
      console.error("Error fetching disputes:", error);
      toastFunc({
        title: "Error",
        description: "Failed to fetch disputes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (dispute) => {
    // Only allow opening modal if a dispute is provided (for editing)
    if (dispute) {
      setSelectedDispute(dispute);
      setReason(dispute.reason || "");
      setDescription(dispute.description || "");
      setStatus(dispute.status || "pending");
      setFeedback(dispute.feedback || "");
      setEvidence(null);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setErrors({});
  };

  const handleDeleteDispute = async (id) => {
    if (window.confirm("Are you sure you want to delete this dispute?")) {
      try {
        await api.delete(`/disputes/${id}`);
        // After successful deletion from the database, update the UI
        setDisputes(disputes.filter((d) => d.id !== id));
        toastFunc({
          title: "Success",
          description: "Dispute has been deleted successfully",
          variant: "success",
        });
      } catch (error) {
        console.error("Error deleting dispute:", error);
        toastFunc({
          title: "Error",
          description: "Failed to delete dispute. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSubmit = async () => {
    // Form validation
    const newErrors = {};
    let hasError = false;

    if (!feedback.trim()) {
      newErrors.feedback = "Feedback is required";
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.put(
        `/disputes/updates/${selectedDispute.id}`,
        {
          status,
          feedback,
        }
      );

      if (!response.statusText === "OK") {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      setDisputes((prevDisputes) =>
        prevDisputes.map((d) =>
          d.id === selectedDispute.id ? { ...d, status, feedback } : d
        )
      );

      toastFunc({
        title: "Success",
        description: "Dispute status updated successfully",
        variant: "success",
      });

      handleCloseModal();
    } catch (error) {
      console.error("Error updating dispute:", error);
      toastFunc({
        title: "Error",
        description: "Failed to update dispute status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter disputes based on search term
  const filteredDisputes = useMemo(() => {
    return disputes.filter(
      (dispute) =>
        dispute.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dispute.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dispute.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dispute.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dispute.service_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [disputes, searchTerm]);

  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.ceil(filteredDisputes.length / limit);
  }, [filteredDisputes, limit]);

  // Get paginated disputes
  const paginatedDisputes = useMemo(() => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return filteredDisputes.slice(startIndex, endIndex);
  }, [filteredDisputes, page, limit]);

  // Load evidence images for visible disputes
  useEffect(() => {
    // Check if we need to load evidence images for visible disputes
    paginatedDisputes.forEach((dispute) => {
      if (dispute.evidence === "has-evidence" && !loadedEvidences[dispute.id]) {
        loadEvidenceImage(dispute.id);
      }
    });
  }, [paginatedDisputes, loadedEvidences]);

  // Reset to first page when search changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  // Pagination controls
  const nextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  const prevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  // Function to truncate text properly with word breaks
  const truncateText = (text, maxLength) => {
    if (!text || text.length <= maxLength) return text;

    // If the text has natural word breaks
    if (text.includes(" ")) {
      const truncated = text.substr(0, maxLength);
      // Find the last space to avoid cutting words
      const lastSpaceIndex = truncated.lastIndexOf(" ");
      return truncated.substr(0, lastSpaceIndex) + "...";
    }
    // For long strings without spaces
    else {
      return text.substr(0, maxLength) + "...";
    }
  };

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };

    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="container px-3 sm:px-4 py-6 sm:py-8 mx-auto max-w-7xl">
      {/* Header with search bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Dispute Management
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              className="pl-10 pr-4 py-2.5 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm"
              placeholder="Search disputes"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Disputes Table */}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Evidence
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="hidden md:table-cell px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="hidden md:table-cell px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="hidden lg:table-cell px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 sm:px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 sm:py-12">
                    <div className="flex flex-col justify-center items-center space-y-3">
                      <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-blue-600" />
                      <span className="text-gray-600 font-medium text-sm sm:text-base">
                        Loading disputes data...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filteredDisputes.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 sm:py-12">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Shield className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mb-3 sm:mb-4" />
                      <p className="text-base sm:text-lg font-medium text-gray-900 mb-1">
                        No disputes found
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500 max-w-sm px-4">
                        {searchTerm
                          ? "Try adjusting your search terms"
                          : "No disputes available currently"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedDisputes.map((dispute, index) => (
                  <tr
                    key={dispute.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                    }`}
                  >
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="flex-shrink-0 h-10 w-10 sm:h-16 sm:w-16">
                        {dispute.evidence === "has-evidence" ? (
                          loadedEvidences[dispute.id] &&
                          loadedEvidences[dispute.id] !== "loading" ? (
                            <img
                              src={loadedEvidences[dispute.id]}
                              alt="Evidence"
                              className="h-10 w-10 sm:h-16 sm:w-16 rounded-md object-cover border-2 border-gray-200 shadow-sm"
                              loading="lazy"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64' fill='%23e2e8f0'%3E%3Crect width='64' height='64' rx='6' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' font-size='24' font-family='Arial' fill='%23718096' text-anchor='middle' dominant-baseline='middle'%3E?%3C/text%3E%3C/svg%3E`;
                              }}
                            />
                          ) : (
                            <div
                              className="h-10 w-10 sm:h-16 sm:w-16 rounded-md bg-blue-50 border-2 border-blue-100 flex items-center justify-center cursor-pointer shadow-sm"
                              onClick={() => loadEvidenceImage(dispute.id)}
                            >
                              {loadedEvidences[dispute.id] === "loading" ? (
                                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-blue-500" />
                              ) : (
                                <span className="text-blue-600 text-base sm:text-lg font-medium">
                                  ?
                                </span>
                              )}
                            </div>
                          )
                        ) : dispute.evidence ? (
                          // For backward compatibility with existing evidence URLs
                          <img
                            src={dispute.evidence}
                            alt="Evidence"
                            className="h-10 w-10 sm:h-16 sm:w-16 rounded-md object-cover border-2 border-gray-200 shadow-sm"
                            loading="lazy"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64' fill='%23e2e8f0'%3E%3Crect width='64' height='64' rx='6' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' font-size='24' font-family='Arial' fill='%23718096' text-anchor='middle' dominant-baseline='middle'%3E?%3C/text%3E%3C/svg%3E`;
                            }}
                          />
                        ) : (
                          <div className="h-10 w-10 sm:h-16 sm:w-16 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center">
                            <span className="text-gray-600 text-base sm:text-lg font-medium">
                              ?
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center">
                        <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 mr-1 sm:mr-2" />
                        <span className="text-xs sm:text-sm font-medium text-gray-900">
                          {dispute.user_name || "N/A"}
                        </span>
                      </div>

                      {/* Show vendor and service on mobile since columns are hidden */}
                      <div className="flex flex-col mt-1 sm:hidden">
                        <div className="text-xs text-gray-500 flex items-center">
                          <Store className="h-3 w-3 text-gray-400 mr-1" />
                          <span>{dispute.vendor_name || "N/A"}</span>
                        </div>
                        <div className="text-xs text-gray-500 flex items-center mt-0.5">
                          <ShoppingBag className="h-3 w-3 text-gray-400 mr-1" />
                          <span>{dispute.service_name || "N/A"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-3 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center">
                        <Store className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 mr-1 sm:mr-2" />
                        <span className="text-xs sm:text-sm text-gray-900">
                          {dispute.vendor_name || "N/A"}
                        </span>
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-3 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center">
                        <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 mr-1 sm:mr-2" />
                        <span className="text-xs sm:text-sm text-gray-900">
                          {dispute.service_name || "N/A"}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">
                      {dispute.reason}
                    </td>
                    <td className="hidden sm:table-cell px-3 sm:px-6 py-3 sm:py-4">
                      <div className="text-xs sm:text-sm text-gray-900 max-w-[100px] sm:max-w-[200px]">
                        {dispute.description &&
                        dispute.description.length > 60 ? (
                          <>
                            {truncateText(dispute.description, 60)}
                            <button
                              className="text-blue-600 ml-1 text-xs hover:underline focus:outline-none"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleDescription(dispute.id);
                              }}
                            >
                              Show more
                            </button>

                            {expandedDescriptions[dispute.id] && (
                              <div
                                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                                onClick={() => toggleDescription(dispute.id)}
                              >
                                <div
                                  className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full shadow-lg"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="flex justify-between items-center mb-3">
                                    <h3 className="font-medium text-gray-900">
                                      Full Description
                                    </h3>
                                    <button
                                      className="text-gray-400 hover:text-gray-500"
                                      onClick={() =>
                                        toggleDescription(dispute.id)
                                      }
                                    >
                                      <X className="h-5 w-5" />
                                    </button>
                                  </div>
                                  <div className="text-gray-800 whitespace-pre-wrap max-h-[60vh] overflow-y-auto">
                                    {dispute.description}
                                  </div>
                                  <div className="mt-4 text-right">
                                    <button
                                      className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                                      onClick={() =>
                                        toggleDescription(dispute.id)
                                      }
                                    >
                                      Close
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          dispute.description || "N/A"
                        )}
                      </div>
                    </td>
                    <td className="hidden lg:table-cell px-3 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center text-xs sm:text-sm text-gray-500">
                        <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 mr-1" />
                        {dispute.created_at
                          ? formatDate(dispute.created_at)
                          : "N/A"}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <span
                        className={`px-2 py-0.5 sm:px-2.5 sm:py-0.5 inline-flex text-xs leading-5 font-medium rounded-full ${
                          dispute.status.toLowerCase() === "accept"
                            ? "bg-green-100 text-green-800 border border-green-200"
                            : dispute.status.toLowerCase() === "reject"
                            ? "bg-red-100 text-red-800 border border-red-200"
                            : "bg-yellow-100 text-yellow-800 border border-yellow-200"
                        }`}
                      >
                        {dispute.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                      <div className="flex space-x-2 sm:space-x-3 justify-end">
                        <button
                          className="text-blue-600 hover:text-blue-800 transition-colors duration-150 p-1 sm:p-1.5 rounded-full hover:bg-blue-50"
                          onClick={() => handleOpenModal(dispute)}
                          title="Edit Dispute"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          className="text-red-500 hover:text-red-700 transition-colors duration-150 p-1 sm:p-1.5 rounded-full hover:bg-red-50"
                          onClick={() => handleDeleteDispute(dispute.id)}
                          title="Delete Dispute"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination - Responsive Design */}
        {!isLoading && filteredDisputes.length > 0 && (
          <div className="px-3 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between border-t border-gray-200 bg-gray-50 gap-3">
            <div className="text-xs sm:text-sm text-gray-500 flex items-center">
              <span className="hidden sm:inline">Showing</span>
              <span className="font-medium text-gray-700 mx-1">
                {filteredDisputes.length > 0 ? (page - 1) * limit + 1 : 0}
              </span>
              <span className="hidden sm:inline">to</span>
              <span className="font-medium text-gray-700 ml-1">
                {Math.min(page * limit, filteredDisputes.length)}
              </span>
              <span className="hidden sm:inline">of</span>
              <span className="font-medium text-gray-700 ml-1">
                {filteredDisputes.length}
              </span>
              <span className="hidden sm:inline ml-1">disputes</span>
            </div>

            <div className="flex gap-1 sm:gap-2">
              {/* Previous Button */}
              <button
                onClick={prevPage}
                disabled={page === 1}
                className={`relative inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-md border text-xs sm:text-sm font-medium ${
                  page === 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" />
                <span className="hidden xs:inline">Previous</span>
              </button>

              {/* Simplified pagination for mobile */}
              <div className="flex items-center">
                <span className="px-3 py-1 text-xs sm:text-sm">
                  Page {page} of {totalPages}
                </span>
              </div>

              {/* Next Button */}
              <button
                onClick={nextPage}
                disabled={page >= totalPages}
                className={`relative inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-md border text-xs sm:text-sm font-medium ${
                  page >= totalPages
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="hidden xs:inline">Next</span>
                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-0.5 sm:ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Resolve Dispute Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b px-4 sm:px-6 py-3 sm:py-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Resolve Dispute
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6">
              <div className="space-y-4 sm:space-y-5">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Reason
                  </label>
                  <input
                    type="text"
                    placeholder="Reason"
                    disabled
                    className="w-full px-3 py-2 sm:py-2.5 border rounded-lg border-gray-300 bg-gray-50 text-gray-500 text-xs sm:text-sm"
                    value={reason}
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    placeholder="Description"
                    disabled
                    className="w-full px-3 py-2 sm:py-2.5 border rounded-lg border-gray-300 bg-gray-50 text-gray-500 text-xs sm:text-sm"
                    value={description}
                    rows={2}
                  ></textarea>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    className="w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-xs sm:text-sm border-gray-300"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="accept">Accept</option>
                    <option value="reject">Reject</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Feedback
                  </label>
                  <textarea
                    placeholder="Provide feedback for this dispute"
                    className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-xs sm:text-sm ${
                      errors.feedback
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300"
                    }`}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={3}
                  ></textarea>
                  {errors.feedback && (
                    <div className="flex items-center mt-1 text-xs text-red-500">
                      <AlertCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                      {errors.feedback}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 sm:pt-5 mt-4 sm:mt-5 border-t">
                <button
                  className="px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none transition-colors duration-200 shadow-sm"
                  onClick={handleCloseModal}
                >
                  Cancel
                </button>
                <button
                  className="px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none transition-colors duration-200 shadow-sm"
                  onClick={handleSubmit}
                >
                  Update Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Disputes;
