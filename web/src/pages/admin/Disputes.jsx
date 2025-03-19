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
        {isLoading ? (
          <div className="text-center py-8">
            <p>Loading disputes...</p>
          </div>
        ) : filteredDisputes.length === 0 ? (
          <div className="text-center py-8">
            <p>No disputes found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">Evidence</th>
                  <th className="px-6 py-3 text-left">User Name</th>
                  <th className="px-6 py-3 text-left">Vendor Name</th>
                  <th className="px-6 py-3 text-left">Service Name</th>
                  <th className="px-6 py-3 text-left">Reason</th>
                  <th className="px-6 py-3 text-left">Description</th>
                  <th className="px-6 py-3 text-left">Date</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDisputes.map((dispute) => (
                  <tr key={dispute.id}>
                    <td className="px-6 py-4">
                      {dispute.evidence && <img src={
                        dispute.evidence.startsWith("data:image")
                          ? dispute.evidence // Base64 image
                          : `http://localhost:5000/${dispute.evidence}` // URL-based image
                      } alt="Evidence" className="h-10 w-10 object-cover" />}
                    </td>
                    <td className="px-6 py-4">{dispute.user_name || 'N/A'}</td>
                    <td className="px-6 py-4">{dispute.vendor_name || 'N/A'}</td>
                    <td className="px-6 py-4">{dispute.service_name || 'N/A'}</td>
                    <td className="px-6 py-4">{dispute.reason}</td>
                    <td className="px-6 py-4">{dispute.description}</td>
                    <td className="px-6 py-4">{dispute.created_at ? new Date(dispute.created_at).toLocaleDateString() : 'N/A'}</td>
                    <td className="px-6 py-4">{dispute.status}</td>
                    <td className="px-6 py-4 flex space-x-2">
                      <button onClick={() => handleOpenModal(dispute)}><Edit className="h-5 w-5 text-blue-500" /></button>
                      <button onClick={() => handleDeleteDispute(dispute.id)}><Trash2 className="h-5 w-5 text-red-500" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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