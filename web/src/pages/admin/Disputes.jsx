import { useState, useEffect } from "react";
import { Edit, Trash2, Search } from "lucide-react";
import api from "@/utils/api";
import { useAuth } from "@/utils/AuthContext";

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
  

  // Fetch disputes data when component mounts
  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/disputes/user", {
        params: {
          user_id: currentUser.id,
          isAdmin: true,
          include_details: true // Add this parameter to request additional details
        }
      });

      setDisputes(response.data.disputes);
    } catch (error) {
      console.error("Error fetching disputes:", error);
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
      setEvidence(null);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setErrors({});
  };

  const handleFileChange = (event) => {
    setEvidence(event.target.files[0]);
  };

  const handleDeleteDispute = async (id) => {
    if (window.confirm("Are you sure you want to delete this dispute?")) {
      try {
        await api.delete(`/disputes/${id}`);
        // After successful deletion from the database, update the UI
        setDisputes(disputes.filter((d) => d.id !== id));
      } catch (error) {
        console.error("Error deleting dispute:", error);
        alert("Failed to delete dispute. Please try again.");
      }
    }
  };

  const handleSubmit = async () => {
    // Form validation
    if (!reason.trim()) {
      setErrors({ ...errors, reason: "Reason is required" });
      return;
    }
    if (!description.trim()) {
      setErrors({ ...errors, description: "Description is required" });
      return;
    }

    if (!feedback.trim()) {
      setErrors({ ...errors, feedback: "Feedback is required" });
      return;
    }

    try {
      setIsLoading(true);
      let response;

      response = await api.put(`/disputes/updates/${selectedDispute.id}`, {
        reason,
        description,
        status,
        feedback
      });
      setIsModalOpen(false);

      setDisputes((prevDisputes) =>
        prevDisputes.map((d) =>
          d.id === selectedDispute.id ? { ...d, reason, description, status } : d
        )
      );

      if (!response.statusText === "OK") {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Refresh disputes data after successful submission
      await fetchDisputes();
      handleCloseModal();

    } catch (error) {
      console.error("Error submitting dispute:", error);
      setErrors({ ...errors, submit: "Failed to submit dispute. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Filter disputes based on search term
  const filteredDisputes = disputes.filter(dispute =>
    dispute.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dispute.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dispute.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dispute.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dispute.service_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-semibold">Dispute Management</h1>
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              className="pl-10 pr-4 py-2 w-full rounded-md border border-gray-300"
              placeholder="Search disputes"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>
        </div>
      </div>
      <div className="bg-white shadow overflow-hidden rounded-lg">
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Evidence</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Name</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor Name</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Name</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {isLoading ? (
          <tr>
            <td colSpan="9" className="text-center py-8">
              <div className="flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2">Loading disputes...</span>
              </div>
            </td>
          </tr>
        ) : filteredDisputes.length === 0 ? (
          <tr>
            <td colSpan="9" className="text-center py-8">
              <div className="flex flex-col items-center justify-center text-gray-500">
                <svg className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-lg font-medium">No disputes found</p>
                <p className="text-sm mt-1">
                  {searchTerm ? "Try adjusting your search terms" : "No disputes available currently"}
                </p>
              </div>
            </td>
          </tr>
        ) : (
          filteredDisputes.map((dispute) => (
            <tr key={dispute.id} className="hover:bg-gray-50 transition-colors duration-150">
              <td className="px-6 py-4">
                <div className="flex-shrink-0 h-16 w-16">
                  {dispute.evidence ? (
                    <img 
                      src={
                        dispute.evidence.startsWith("data:image")
                          ? dispute.evidence // Base64 image
                          : `http://localhost:5000/${dispute.evidence}` // URL-based image
                      }
                      alt="Evidence"
                      className="h-16 w-16 rounded-md object-cover border border-gray-200 shadow-sm"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-md bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-500 text-lg font-semibold">?</span>
                    </div>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 text-sm font-medium text-gray-900">{dispute.user_name || 'N/A'}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{dispute.vendor_name || 'N/A'}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{dispute.service_name || 'N/A'}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{dispute.reason}</td>
              <td className="px-6 py-4 text-sm text-gray-900" title={dispute.description}>{dispute.description}</td>
              <td className="px-6 py-4 text-sm text-gray-500">{dispute.created_at ? new Date(dispute.created_at).toLocaleDateString() : 'N/A'}</td>
              <td className="px-6 py-4">
                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  dispute.status.toLowerCase() === 'accept' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {dispute.status.toUpperCase()}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex space-x-2">
                  <button 
                    className="text-blue-500 hover:text-blue-700 transition-colors duration-150"
                    onClick={() => handleOpenModal(dispute)}
                    title="Edit Dispute"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button 
                    className="text-red-500 hover:text-red-700 transition-colors duration-150"
                    onClick={() => handleDeleteDispute(dispute.id)}
                    title="Delete Dispute"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
</div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
            <h2 className="text-xl font-semibold mb-4">Edit Dispute</h2>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Reason"
                disabled
                className={`w-full p-2 border rounded ${errors.reason ? 'border-red-500' : ''}`}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              {errors.reason && <p className="text-red-500 text-sm mt-1">{errors.reason}</p>}
            </div>
            <div className="mb-4">
              <textarea
                placeholder="Description"
                disabled
                className={`w-full p-2 border rounded ${errors.description ? 'border-red-500' : ''}`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>
            <select className="w-full p-2 border rounded mb-4" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="pending">Pending</option>
              <option value="accept">Accept</option>
              <option value="reject">Reject</option>
            </select>
            <div className="mb-4">
              <textarea
                placeholder="Provide feedback"
                className="w-full p-2 border rounded"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              ></textarea>
              {errors.feedback && <p className="text-red-500 text-sm mt-1">{errors.feedback}</p>}
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button className="px-4 py-2 bg-gray-300 rounded" onClick={handleCloseModal}>Cancel</button>
              <button className="px-4 py-2 bg-blue-500 text-white rounded" onClick={handleSubmit}>Update</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Disputes;