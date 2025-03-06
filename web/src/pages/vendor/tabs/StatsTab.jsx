/* eslint-disable react/prop-types */
import { BarChart3 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const StatsTab = ({ dashboardStats }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Performance Statistics</h2>
        <p className="text-gray-600 mb-6">
          View your performance metrics and analytics.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800">Total Bookings</h3>
            <p className="text-2xl font-bold text-blue-900">{dashboardStats.totalBookings}</p>
            <p className="text-xs text-blue-700 mt-1">+8% from last month</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-green-800">Completion Rate</h3>
            <p className="text-2xl font-bold text-green-900">
              {((dashboardStats.completedBookings / dashboardStats.totalBookings) * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-green-700 mt-1">+2.3% from last month</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-purple-800">Customer Rating</h3>
            <p className="text-2xl font-bold text-purple-900">{dashboardStats.averageRating}/5.0</p>
            <p className="text-xs text-purple-700 mt-1">Based on {dashboardStats.totalReviews} reviews</p>
          </div>
        </div>
        
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Booking Status Breakdown</h3>
            <div className="flex flex-col space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Completed</span>
                <span className="text-sm font-medium">
                  {((dashboardStats.completedBookings / dashboardStats.totalBookings) * 100).toFixed(1)}%
                </span>
              </div>
              <Progress value={(dashboardStats.completedBookings / dashboardStats.totalBookings) * 100} className="h-2" />
              
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm">Pending</span>
                <span className="text-sm font-medium">
                  {((dashboardStats.pendingBookings / dashboardStats.totalBookings) * 100).toFixed(1)}%
                </span>
              </div>
              <Progress value={(dashboardStats.pendingBookings / dashboardStats.totalBookings) * 100} className="h-2" />
              
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm">Cancelled</span>
                <span className="text-sm font-medium">
                  {((dashboardStats.cancelledBookings / dashboardStats.totalBookings) * 100).toFixed(1)}%
                </span>
              </div>
              <Progress value={(dashboardStats.cancelledBookings / dashboardStats.totalBookings) * 100} className="h-2" />
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Monthly Performance</h3>
            <div className="flex justify-center items-center h-40 bg-gray-50 rounded-lg">
              <div className="text-center">
                <BarChart3 className="mx-auto h-8 w-8 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No data available</h3>
                <p className="mt-1 text-sm text-gray-500">Your monthly statistics will appear here.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsTab;