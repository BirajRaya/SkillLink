/* eslint-disable react/prop-types */
import { 
    PieChart, 
    Clock, 
    Briefcase, 
    Calendar, 
    MessageSquare, 
    Users, 
    BarChart3, 
    HelpCircle 
  } from "lucide-react";
  import { Button } from "@/components/ui/button";
  import { Badge } from "@/components/ui/badge";
  import { useEffect, useState } from 'react';
  import api from '@/lib/api';
  import { io } from "socket.io-client";
  import { useAuth } from "../../../utils/AuthContext";

  const socket = io("http://localhost:5000");

  // eslint-disable-next-line react/prop-types
  const Sidebar = ({ activeTab, setActiveTab, sidebarOpen, availabilityData }) => {
    const [totalUnreadMessages, setTotalUnreadMessages] = useState(0);
    const { currentUser } = useAuth();
    
    useEffect(() => {
      // Get vendor ID from context
      const vendorId = currentUser?.id;
      
      if (!vendorId) return;
      
      // Join the chat room
      socket.emit("joinChat", vendorId);
      
      // Function to fetch total unread messages
      const fetchTotalUnreadMessages = async () => {
        try {
          const response = await api.get(`http://localhost:5000/chat/unreadMessages/${vendorId}`);
          const unreadCounts = response.data;
          
          // Calculate total by summing all unread counts
          const total = Object.values(unreadCounts).reduce((sum, count) => sum + parseInt(count || 0), 0);
          setTotalUnreadMessages(total);
        } catch (error) {
          console.error('Error fetching unread message counts:', error);
        }
      };
      
      // Initial fetch
      fetchTotalUnreadMessages();
      
      // Listen for new messages to update the count
      socket.on("receiveMessage", () => {
        fetchTotalUnreadMessages();
      });
      
      // Listen for messages marked as read
      socket.on("messagesMarkedAsRead", () => {
        fetchTotalUnreadMessages();
      });
      
      // Refresh the count periodically
      const interval = setInterval(fetchTotalUnreadMessages, 60000); // Every minute
      
      return () => {
        socket.off("receiveMessage");
        socket.off("messagesMarkedAsRead");
        clearInterval(interval);
      };
    }, [currentUser]);

    // Function to mark messages as read
    const handleMessagesClick = async () => {
      setActiveTab("messages");
      
      if (totalUnreadMessages > 0 && currentUser?.id) {
        try {
          // Call API to mark messages as read
          await api.post(`http://localhost:5000/chat/markAllAsRead`, {
            userId: currentUser.id
          });
          
          // Update local state
          setTotalUnreadMessages(0);
          
          // Emit event to update other clients
          socket.emit("markMessagesAsRead", currentUser.id);
        } catch (error) {
          console.error("Error marking messages as read:", error);
        }
      }
    };

    return (
      <div className={`bg-white w-64 shadow-lg flex-shrink-0 transition-all duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed md:static h-screen z-20`}>
        <div className="p-4 space-y-6 h-full flex flex-col">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">
              Main
            </p>
            <Button 
              variant={activeTab === "dashboard" ? "default" : "ghost"} 
              className="w-full justify-start"
              onClick={() => setActiveTab("dashboard")}
            >
              <PieChart className="mr-2 h-5 w-5" />
              Dashboard
            </Button>
            <Button 
              variant={activeTab === "availability" ? "default" : "ghost"} 
              className="w-full justify-start"
              onClick={() => setActiveTab("availability")}
            >
              <Clock className="mr-2 h-5 w-5" />
              Availability
            </Button>
            <Button 
              variant={activeTab === "services" ? "default" : "ghost"} 
              className="w-full justify-start"
              onClick={() => setActiveTab("services")}
            >
              <Briefcase className="mr-2 h-5 w-5" />
              Services
            </Button>
            <Button 
              variant={activeTab === "bookings" ? "default" : "ghost"} 
              className="w-full justify-start"
              onClick={() => setActiveTab("bookings")}
            >
              <Calendar className="mr-2 h-5 w-5" />
              Bookings
            </Button>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">
              Communication
            </p>
            <Button 
              variant={activeTab === "messages" ? "default" : "ghost"} 
              className="w-full justify-start"
              onClick={handleMessagesClick}
            >
              <MessageSquare className="mr-2 h-5 w-5" />
              Messages
              {totalUnreadMessages > 0 && (
                <Badge variant="destructive" className="ml-auto text-xs h-5 min-w-5 px-1">
                  {totalUnreadMessages > 99 ? "99+" : totalUnreadMessages}
                </Badge>
              )}
            </Button>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">
              Insights
            </p>
            <Button 
              variant={activeTab === "stats" ? "default" : "ghost"} 
              className="w-full justify-start"
              onClick={() => setActiveTab("stats")}
            >
              <BarChart3 className="mr-2 h-5 w-5" />
              Statistics
            </Button>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">
              Help
            </p>
            <Button 
              variant={activeTab === "support" ? "default" : "ghost"} 
              className="w-full justify-start"
              onClick={() => setActiveTab("support")}
            >
              <HelpCircle className="mr-2 h-5 w-5" />
              Support
            </Button>
          </div>
          
          <div className="mt-auto">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  availabilityData.status === "available" ? "bg-green-500" : 
                  availabilityData.status === "partially-available" ? "bg-yellow-500" : "bg-red-500"
                }`} />
                <div>
                  <p className="text-sm font-medium">Current Status</p>
                  <p className="text-xs text-gray-600">
                    
                    {availabilityData.status === "available" ? "Available for Bookings" : 
                     availabilityData.status === "partially-available" ? "Limited Availability" : 
                     "Not Available"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  export default Sidebar;