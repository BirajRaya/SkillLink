/* eslint-disable react/prop-types */
import { 
    Menu,  
    User, 
    ChevronDown,
    Settings,
    Clock,
    HelpCircle,
    LogOut 
  } from "lucide-react";
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
  } from "@/components/ui/dropdown-menu";
  import { Button } from "@/components/ui/button";

  
  const Header = ({ 
    currentUser, 
    profileData, 
    sidebarOpen, 
    setSidebarOpen,
    setShowProfileDialog,
    setActiveTab,
    logout
  }) => {
    return (
      <div className="bg-white shadow-md sticky top-0 z-10 border-b border-gray-100">
        <div className="mx-auto">
          <div className="flex justify-between h-14 items-center pl-6 pr-6">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md focus:outline-none transition-colors"
                aria-label="Toggle sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="ml-7 flex items-baseline space-x-1.5">
                <h1 className="text-lg font-bold text-blue-600">SkillLink</h1>
                <span className="mx-1 text-gray-300">|</span>
                <p className="text-xs font-medium text-gray-600">Vendor Dashboard</p>
              </div>
            </div>
  
            <div className="flex items-center space-x-6">
   
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="flex items-center space-x-2 rounded-full px-3 py-2 hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
                  >
                    {profileData.profilePicture ? (
                      <img 
                        src={`${profileData.profilePicture}`} 
                        alt="Profile" 
                        className="h-9 w-9 rounded-full object-cover border-2 border-blue-100"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                        <User className="h-5 w-5 text-white" />
                      </div>
                    )}
                    <div className="flex flex-col items-start mx-1">
                      <span className="font-medium text-gray-800">{currentUser?.fullName || 'Vendor'}</span>
                      <span className="text-xs text-gray-500">Vendor Account</span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-1 mt-1 shadow-lg rounded-lg border border-gray-100">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{currentUser?.email || 'vendor@example.com'}</p>
                    <p className="text-xs text-gray-500">Manage your account</p>
                  </div>
                  <DropdownMenuItem
                    className="flex items-center px-3 py-2 my-1 rounded-md hover:bg-blue-50 cursor-pointer"
                    onClick={() => setShowProfileDialog(true)}
                  >
                    <Settings className="mr-2 h-4 w-4 text-blue-500" />
                    <span className="text-gray-700">Update Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex items-center px-3 py-2 my-1 rounded-md hover:bg-blue-50 cursor-pointer"
                    onClick={() => setActiveTab("availability")}
                  >
                    <Clock className="mr-2 h-4 w-4 text-blue-500" />
                    <span className="text-gray-700">Availability Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex items-center px-3 py-2 my-1 rounded-md hover:bg-blue-50 cursor-pointer"
                    onClick={() => setActiveTab("support")}
                  >
                    <HelpCircle className="mr-2 h-4 w-4 text-blue-500" />
                    <span className="text-gray-700">Help & Support</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuItem
                    className="flex items-center px-3 py-2 my-1 rounded-md hover:bg-red-50 cursor-pointer"
                    onClick={logout}
                  >
                    <LogOut className="mr-2 h-4 w-4 text-red-500" />
                    <span className="text-red-600 font-medium">Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  export default Header;