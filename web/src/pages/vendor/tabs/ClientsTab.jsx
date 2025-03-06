import { Users } from "lucide-react";

const ClientsTab = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Your Clients</h2>
      <p className="text-gray-600 mb-6">
        Manage your client relationships and client information.
      </p>
      
      <div className="flex justify-center items-center h-40 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center">
          <Users className="mx-auto h-8 w-8 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No clients yet</h3>
          <p className="mt-1 text-sm text-gray-500">As you get bookings, your clients will appear here.</p>
        </div>
      </div>
    </div>
  );
};

export default ClientsTab;