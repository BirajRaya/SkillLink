/* eslint-disable react/prop-types */
import { Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

const BookingsTab = ({ dashboardStats, formatCurrency, getStatusColor }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Bookings & Appointments</h2>
      <p className="text-gray-600 mb-6">
        Manage your customer bookings and scheduled appointments.
      </p>
      
      <Tabs defaultValue="all">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Bookings</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-500 border-b">
                  <th className="text-left pb-2">Booking ID</th>
                  <th className="text-left pb-2">Customer</th>
                  <th className="text-left pb-2">Service</th>
                  <th className="text-left pb-2">Date</th>
                  <th className="text-left pb-2">Amount</th>
                  <th className="text-left pb-2">Status</th>
                  <th className="text-left pb-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {dashboardStats.recentBookings.map((booking) => (
                  <tr key={booking.id} className="border-b">
                    <td className="py-3 text-sm">{booking.id}</td>
                    <td className="py-3 text-sm">{booking.customer}</td>
                    <td className="py-3 text-sm">{booking.service}</td>
                    <td className="py-3 text-sm">{booking.date}</td>
                    <td className="py-3 text-sm">{formatCurrency(booking.amount)}</td>
                    <td className="py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="py-3 text-sm">
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
        
        <TabsContent value="pending">
          <div className="flex justify-center items-center h-40 bg-gray-50 rounded-lg">
            <div className="text-center">
              <Calendar className="mx-auto h-8 w-8 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No pending bookings</h3>
              <p className="mt-1 text-sm text-gray-500">Your pending bookings will appear here.</p>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="confirmed">
          <div className="flex justify-center items-center h-40 bg-gray-50 rounded-lg">
            <div className="text-center">
              <h3 className="mt-2 text-sm font-medium text-gray-900">No confirmed bookings</h3>
              <p className="mt-1 text-sm text-gray-500">Your confirmed bookings will appear here.</p>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="completed">
          <div className="flex justify-center items-center h-40 bg-gray-50 rounded-lg">
            <div className="text-center">
              <h3 className="mt-2 text-sm font-medium text-gray-900">No completed bookings</h3>
              <p className="mt-1 text-sm text-gray-500">Your completed bookings will appear here.</p>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="cancelled">
          <div className="flex justify-center items-center h-40 bg-gray-50 rounded-lg">
            <div className="text-center">
              <h3 className="mt-2 text-sm font-medium text-gray-900">No cancelled bookings</h3>
              <p className="mt-1 text-sm text-gray-500">Your cancelled bookings will appear here.</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BookingsTab;