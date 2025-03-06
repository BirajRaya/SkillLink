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

  // eslint-disable-next-line react/prop-types
  const Sidebar = ({ activeTab, setActiveTab, sidebarOpen, availabilityData }) => {
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
              onClick={() => setActiveTab("messages")}
            >
              <MessageSquare className="mr-2 h-5 w-5" />
              Messages
            </Button>
            <Button 
              variant={activeTab === "clients" ? "default" : "ghost"} 
              className="w-full justify-start"
              onClick={() => setActiveTab("clients")}
            >
              <Users className="mr-2 h-5 w-5" />
              Clients
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