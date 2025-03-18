/* eslint-disable react/prop-types */
import { BarChart3 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const StatsTab = ({ dashboardStats, formatCurrency }) => {
  // Calculate percentages safely to avoid NaN or division by zero
  const calculatePercentage = (part, total) => {
    if (!total || total === 0) return 0;
    const value = ((part || 0) / total) * 100;
    return isNaN(value) ? "0.0" : value.toFixed(1);
  };

  // Ensure we have valid numbers for these properties
  const completedBookings = dashboardStats.completedBookings || 0;
  const pendingBookings = dashboardStats.pendingBookings || 0;
  const cancelledBookings = dashboardStats.cancelledBookings || 0;
  const totalBookings = dashboardStats.totalBookings || 1; // Default to 1 to avoid division by zero

  // Get percentages for different booking statuses
  const completionPercentage = calculatePercentage(completedBookings, totalBookings);
  const pendingPercentage = calculatePercentage(pendingBookings, totalBookings);
  const cancelledPercentage = calculatePercentage(cancelledBookings, totalBookings);

  // Use provided completion rate or calculate it
  const completionRate = dashboardStats.completionRate || completionPercentage;
  const completionRateChange = dashboardStats.completionRateChangePercent || "0.0";

  // Check if monthly stats data exists
  const hasMonthlyData = dashboardStats.monthlyStats && dashboardStats.monthlyStats.length > 0;

  // Prepare monthly chart data
  const monthlyChartHeight = 180;
  const maxBookingValue = hasMonthlyData ? 
    Math.max(...dashboardStats.monthlyStats.map(month => parseInt(month.total_bookings))) : 0;

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
            <p className="text-2xl font-bold text-blue-900">{dashboardStats.totalBookings || 0}</p>
            <p className={`text-xs ${(dashboardStats.bookingsChangePercent || 0) >= 0 ? 'text-blue-700' : 'text-red-700'} mt-1`}>
              {(dashboardStats.bookingsChangePercent || 0) >= 0 ? '+' : ''}{dashboardStats.bookingsChangePercent || 0}% from last month
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-green-800">Completion Rate</h3>
            <p className="text-2xl font-bold text-green-900">
              {completionRate}%
            </p>
            <p className={`text-xs ${parseFloat(completionRateChange) >= 0 ? 'text-green-700' : 'text-red-700'} mt-1`}>
              {parseFloat(completionRateChange) >= 0 ? '+' : ''}
              {completionRateChange}% from last month
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-purple-800">Customer Rating</h3>
            <p className="text-2xl font-bold text-purple-900">{dashboardStats.averageRating || "0.0"}/5.0</p>
            <p className="text-xs text-purple-700 mt-1">Based on {dashboardStats.totalReviews || 0} reviews</p>
          </div>
        </div>
        
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Booking Status Breakdown</h3>
            <div className="flex flex-col space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Completed ({completedBookings})</span>
                <span className="text-sm font-medium">
                  {completionPercentage}%
                </span>
              </div>
              <Progress value={parseFloat(completionPercentage)} className="h-2 bg-gray-200" />
              
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm">Pending ({pendingBookings})</span>
                <span className="text-sm font-medium">
                  {pendingPercentage}%
                </span>
              </div>
              <Progress value={parseFloat(pendingPercentage)} className="h-2 bg-gray-200" />
              
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm">Cancelled ({cancelledBookings})</span>
                <span className="text-sm font-medium">
                  {cancelledPercentage}%
                </span>
              </div>
              <Progress value={parseFloat(cancelledPercentage)} className="h-2 bg-gray-200" />
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Monthly Performance</h3>
            {hasMonthlyData ? (
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium">Bookings by Month</h4>
                  </div>
                  <div className="relative h-[200px] w-full">
                    <div className="absolute left-20 bottom-0 h-[180px] w-full border-l border-b border-gray-200">
                      {/* Y-axis labels */}
                      <div className="absolute -left-10 bottom-0 h-full flex flex-col justify-between text-xs text-gray-500">
                        <span>100%</span>
                        <span>75%</span>
                        <span>50%</span>
                        <span>25%</span>
                        <span>0</span>
                      </div>
                      
                      {/* Bars */}
                      <div className="absolute bottom-0 left-0 right-0 h-full flex justify-around items-end px-4">
                        {dashboardStats.monthlyStats.map((month, index) => (
                          <div key={index} className="flex flex-col items-center">
                            <div className="relative" style={{ height: `${(parseInt(month.total_bookings) / maxBookingValue) * 100}%`, minHeight: '1px' }}>
                              <div 
                                className="w-12 bg-blue-500 rounded-t-sm" 
                                style={{ 
                                  height: `${Math.max((parseInt(month.total_bookings) / maxBookingValue) * monthlyChartHeight, 1)}px`,
                                  transition: 'height 0.3s ease-in'
                                }}
                                title={`${month.total_bookings} bookings, ${formatCurrency(month.revenue)} revenue`}
                              />
                            </div>
                            <span className="text-xs mt-2 text-gray-600">{month.month.split(' ')[0]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded-lg p-3">
                    <h5 className="text-sm font-medium text-gray-500 mb-1">Best Performing Month</h5>
                    {(() => {
                      const bestMonth = [...dashboardStats.monthlyStats].sort((a, b) => 
                        parseFloat(b.revenue) - parseFloat(a.revenue))[0];
                      return (
                        <div>
                          <p className="font-semibold">{bestMonth?.month || "N/A"}</p>
                          <p className="text-xs text-gray-600">{formatCurrency(bestMonth?.revenue || 0)} • {bestMonth?.total_bookings || 0} bookings</p>
                        </div>
                      );
                    })()}
                  </div>
                  <div className="border rounded-lg p-3">
                    <h5 className="text-sm font-medium text-gray-500 mb-1">Month-over-Month Growth</h5>
                    {(() => {
                      if (dashboardStats.monthlyStats.length < 2) return <p>Not enough data</p>;
                      
                      const lastMonth = dashboardStats.monthlyStats[dashboardStats.monthlyStats.length - 1];
                      const previousMonth = dashboardStats.monthlyStats[dashboardStats.monthlyStats.length - 2];
                      const growth = ((lastMonth.total_bookings - previousMonth.total_bookings) / previousMonth.total_bookings) * 100;
                      
                      return (
                        <p className={`font-semibold ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {growth >= 0 ? '+' : ''}{growth.toFixed(1)}% 
                          <span className="text-xs font-normal text-gray-500 ml-1">in bookings</span>
                        </p>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-center items-center h-40 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="mx-auto h-8 w-8 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No data available</h3>
                  <p className="mt-1 text-sm text-gray-500">Your monthly statistics will appear here.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsTab;