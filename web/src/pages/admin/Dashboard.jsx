import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

import { 
  Users, 
  Briefcase, 
  Calendar, 
  AlertTriangle, 
  TrendingUp, 
  Star, 
  DollarSign, 
  Activity,
  Bell 
} from 'lucide-react';
import api from "@/utils/api";

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const controller = new AbortController();
      try {
        setLoading(true);
        const response = await api.get('/admin/dashboard-stats', {
          signal: controller.signal,
        });

        // Fix: Check success flag in response.data, not in response
        if (response.data && response.data.success) {
          setDashboardData(response.data.dashboardData);
        } else {
          throw new Error((response.data && response.data.message) || 'Error fetching dashboard data');
        }
      } catch (err) {
        setError(err.message);
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-medium mb-2">Loading dashboard data...</h2>
          <p className="text-gray-500">Please wait while we fetch the latest information.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error loading dashboard</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const { 
    summary, 
    monthlyData, 
    serviceData, 
    userAcquisitionData, 
    weeklyBookingData, 
    topVendors, 
    recentActivities, 
    pendingTasks 
  } = dashboardData;

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div className="mb-3 sm:mb-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome back to SkillLink Admin Portal</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full max-w-md grid grid-cols-3 mb-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="users">Users & Vendors</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4 md:space-y-6 pt-4">
          {/* Summary Cards - Responsive grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Users</p>
                    <p className="text-2xl md:text-3xl font-bold text-gray-900">{summary.totalUsers.toLocaleString()}</p>
                    <div className="flex items-center mt-1">
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      <p className="text-xs sm:text-sm text-green-500 font-medium">+{summary.newUsersGrowth}% from last month</p>
                    </div>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Registered Vendors</p>
                    <p className="text-2xl md:text-3xl font-bold text-gray-900">{summary.registeredVendors.toLocaleString()}</p>
                    <div className="flex items-center mt-1">
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      <p className="text-xs sm:text-sm text-green-500 font-medium">+{summary.newVendorsGrowth}% from last month</p>
                    </div>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <Briefcase className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Bookings</p>
                    <p className="text-2xl md:text-3xl font-bold text-gray-900">{summary.totalBookings.toLocaleString()}</p>
                    <div className="flex items-center mt-1">
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      <p className="text-xs sm:text-sm text-green-500 font-medium">+{summary.newBookingsGrowth}% from last month</p>
                    </div>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Revenue</p>
                    <p className="text-2xl md:text-3xl font-bold text-gray-900">${summary.revenue.toLocaleString()}</p>
                    <div className="flex items-center mt-1">
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      <p className="text-xs sm:text-sm text-green-500 font-medium">+{summary.revenueGrowth}% from last month</p>
                    </div>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Growth Trend and Service Distribution - Responsive grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Growth Trends */}
            <Card className="col-span-1 lg:col-span-2 hover:shadow-md transition-shadow">
              <CardHeader className="p-4 md:p-6 pb-2 md:pb-3">
                <CardTitle>Platform Growth</CardTitle>
                <CardDescription>Monthly growth patterns across key metrics</CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-2 md:pt-3">
                <div className="h-[250px] sm:h-[300px]"> {/* Fixed height container for chart */}
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorVendors" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ffc658" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#ffc658" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{fontSize: 12}} />
                      <YAxis tick={{fontSize: 12}} />
                      <Tooltip />
                      <Legend iconSize={10} wrapperStyle={{fontSize: '12px'}} />
                      <Area type="monotone" dataKey="users" stroke="#8884d8" fillOpacity={1} fill="url(#colorUsers)" />
                      <Area type="monotone" dataKey="vendors" stroke="#82ca9d" fillOpacity={1} fill="url(#colorVendors)" />
                      <Area type="monotone" dataKey="bookings" stroke="#ffc658" fillOpacity={1} fill="url(#colorBookings)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Service Distribution */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="p-4 md:p-6 pb-2 md:pb-3">
                <CardTitle>Service Distribution</CardTitle>
                <CardDescription>Breakdown by service category</CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-2 md:pt-3">
                <div className="h-[250px] sm:h-[300px]"> {/* Fixed height container for chart */}
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={serviceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => 
                          percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ''
                        }
                      >
                        {serviceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notifications and Recent Activity - Responsive grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Pending Tasks */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="p-4 md:p-6 pb-2 md:pb-3">
                <CardTitle>Pending Tasks</CardTitle>
                <CardDescription>Administrative tasks requiring attention</CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-2 md:pt-3">
                <div className="space-y-4">
                  {pendingTasks.map((task) => (
                    <div key={task.id} className={`p-3 sm:p-4 rounded-lg border ${
                      task.status === 'urgent' ? 'border-l-4 border-l-red-500 bg-red-50' : 'border-l-4 border-l-blue-500 bg-blue-50'
                    }`}>
                      <div className="flex justify-between items-start flex-wrap sm:flex-nowrap gap-2">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {task.title}
                            <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-gray-700 rounded-full">{task.count}</span>
                          </h4>
                          <p className="text-xs sm:text-sm text-gray-600 mt-1">{task.description}</p>
                        </div>
                        <Badge className="shrink-0" variant={task.status === 'urgent' ? 'destructive' : 'secondary'}>
                          {task.status === 'urgent' ? 'Urgent' : 'Normal'}
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center text-xs text-gray-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>Due: {task.dueDate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity Table - with responsive wrapper */}
            <Card className="col-span-1 lg:col-span-2 hover:shadow-md transition-shadow">
              <CardHeader className="p-4 md:p-6 pb-2 md:pb-3">
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest platform events and transactions</CardDescription>
              </CardHeader>
              <CardContent className="p-0 md:p-1">
                <div className="responsive-table-wrapper overflow-x-auto">
                  <table className="w-full min-w-[500px]"> {/* Min width prevents excessive squeezing */}
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 px-3 sm:px-4 text-left text-xs font-medium text-gray-500">Activity</th>
                        <th className="py-2 px-3 sm:px-4 text-left text-xs font-medium text-gray-500">User</th>
                        <th className="py-2 px-3 sm:px-4 text-left text-xs font-medium text-gray-500">Type</th>
                        <th className="py-2 px-3 sm:px-4 text-left text-xs font-medium text-gray-500">Date</th>
                        <th className="py-2 px-3 sm:px-4 text-left text-xs font-medium text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentActivities.map((activity) => (
                        <tr key={activity.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-3 sm:px-4 text-xs sm:text-sm">{activity.activity}</td>
                          <td className="py-3 px-3 sm:px-4 text-xs sm:text-sm">{activity.user}</td>
                          <td className="py-3 px-3 sm:px-4 text-xs sm:text-sm">{activity.type}</td>
                          <td className="py-3 px-3 sm:px-4 text-xs sm:text-sm">{activity.date}</td>
                          <td className="py-3 px-3 sm:px-4 text-xs sm:text-sm">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                              activity.status === 'completed' ? 'bg-green-100 text-green-800 border border-green-200' :
                              activity.status === 'pending' ? 'border border-input bg-background text-foreground' :
                              activity.status === 'cancelled' ? 'bg-red-100 text-red-800 border border-red-200' :
                              activity.status === 'confirmed' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                              activity.status === 'rejected' ? 'bg-red-100 text-red-800 border border-red-200' :
                              activity.status === 'Active' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                              activity.status === 'Inactive' ? 'bg-gray-100 text-gray-800 border border-gray-200' :
                              activity.status === 'accepted' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                              'bg-gray-100 text-gray-800 border border-gray-200'
                            }`}>
                              {activity.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
              <CardFooter className="px-4 py-2 md:px-6">
                <p className="text-xs text-gray-500">Showing {recentActivities.length} of recent activities</p>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4 md:space-y-6 pt-4">
          {/* Weekly Performance */}
          <div className="grid grid-cols-1 gap-4 md:gap-6">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="p-4 md:p-6 pb-2 md:pb-3">
                <CardTitle>Weekly Booking Performance</CardTitle>
                <CardDescription>Completed vs. canceled bookings this week</CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-2 md:pt-3">
                <div className="h-[250px] sm:h-[300px]"> {/* Fixed height container for chart */}
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyBookingData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" tick={{fontSize: 12}} />
                      <YAxis tick={{fontSize: 12}} />
                      <Tooltip />
                      <Legend iconSize={10} wrapperStyle={{fontSize: '12px'}} />
                      <Bar dataKey="completed" fill="#4CAF50" name="Completed Bookings" />
                      <Bar dataKey="canceled" fill="#FF5252" name="Canceled Bookings" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4 md:space-y-6 pt-4">
          {/* User and Vendor Metrics - Responsive grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 md:p-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">New Users Today</p>
                  <p className="text-2xl md:text-3xl font-bold text-gray-900">{
                    recentActivities.filter(a => a.activity === "New User" && 
                      new Date(a.date).toDateString() === new Date().toDateString()).length
                  }</p>
                  <div className="flex items-center">
                    <Activity className="h-4 w-4 text-blue-500 mr-1" />
                    <p className="text-xs sm:text-sm text-blue-500 font-medium">New registrations</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 md:p-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Active Users</p>
                  <p className="text-2xl md:text-3xl font-bold text-gray-900">{summary.totalUsers}</p>
                  <div className="flex items-center">
                    <Activity className="h-4 w-4 text-blue-500 mr-1" />
                    <p className="text-xs sm:text-sm text-blue-500 font-medium">
                      {Math.round((summary.totalUsers / (summary.totalUsers + 2000)) * 100)}% of total users
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 md:p-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Total active vendor</p>
                  <p className="text-2xl md:text-3xl font-bold text-gray-900">{
                    summary.registeredVendors
                  }</p>
                  <div className="flex items-center">
                    <p className="text-xs sm:text-sm text-amber-500 font-medium">vendor have active status</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 md:p-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500">Average Vendor Rating</p>
                  <p className="text-2xl md:text-3xl font-bold text-gray-900">
                    {(topVendors.reduce((acc, vendor) => acc + parseFloat(vendor.rating), 0) / topVendors.length).toFixed(1)}
                  </p>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-500 mr-1" />
                    <p className="text-xs sm:text-sm text-gray-500 font-medium">From vendor reviews</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Vendors Table - with responsive wrapper */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="p-4 md:p-6 pb-2 md:pb-3">
              <CardTitle>Top Performing Vendors</CardTitle>
              <CardDescription>Vendors with highest ratings and bookings this month</CardDescription>
            </CardHeader>
            <CardContent className="p-0 md:p-1">
              <div className="responsive-table-wrapper overflow-x-auto">
                <table className="w-full min-w-[600px]"> {/* Min width prevents excessive squeezing */}
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 px-3 sm:px-4 text-left text-xs font-medium text-gray-500">Vendor</th>
                      <th className="py-2 px-3 sm:px-4 text-left text-xs font-medium text-gray-500">Service Category</th>
                      <th className="py-2 px-3 sm:px-4 text-left text-xs font-medium text-gray-500">Rating</th>
                      <th className="py-2 px-3 sm:px-4 text-left text-xs font-medium text-gray-500">Bookings</th>
                      <th className="py-2 px-3 sm:px-4 text-left text-xs font-medium text-gray-500">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topVendors.map((vendor, index) => (
                      <tr key={vendor.id || index} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-3 sm:px-4">
                          <div className="flex items-center">
                            <Avatar className="h-6 w-6 sm:h-8 sm:w-8 mr-2">
                              <AvatarImage src={`/api/placeholder/${(index+1) * 10}/${(index+1) * 10}`} alt={vendor.name} />
                              <AvatarFallback>{vendor.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-xs sm:text-sm">{vendor.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 sm:px-4 text-xs sm:text-sm">{vendor.service}</td>
                        <td className="py-3 px-3 sm:px-4">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-500 mr-1" />
                            <span className="text-xs sm:text-sm">{vendor.rating}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 sm:px-4 text-xs sm:text-sm">{vendor.bookings}</td>
                        <td className="py-3 px-3 sm:px-4 text-xs sm:text-sm">{vendor.revenue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
            <CardFooter className="px-4 py-2 md:px-6">
              <p className="text-xs text-gray-500">Data updated daily at midnight</p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;