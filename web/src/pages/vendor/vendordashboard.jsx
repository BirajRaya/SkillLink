import { useState } from 'react';
import { useAuth } from '../../utils/AuthContext';
import { 
  User, 
  LogOut, 
  Settings, 
  ChevronDown, 
  Mail, 
  Phone, 
  Lock, 
  Save,
  X
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const VendorDashboard = () => {
  const { currentUser, logout } = useAuth();
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: currentUser?.fullName || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleProfileChange = (e) => {
    const { id, value } = e.target;
    setProfileData({ ...profileData, [id]: value });
  };

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    // Here you would send the updated profile data to your backend
    console.log("Updating profile with:", profileData);
    
    // Close the dialog after updating
    setShowProfileDialog(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Dashboard Header with Profile Actions */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-bold text-gray-900">Vendor Dashboard</h1>
            
            <div className="flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <span>{currentUser?.fullName || 'Vendor'}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    className="flex items-center"
                    onClick={() => setShowProfileDialog(true)}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Update Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="flex items-center text-red-600" 
                    onClick={logout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Welcome, {currentUser?.fullName || 'Vendor'}!</h2>
          <p className="text-gray-600">
            This is your vendor dashboard where you can manage your services, view statistics,
            and interact with your customers.
          </p>
        </div>
        
        {/* Dashboard content would go here */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium mb-2">Services</h3>
            <p className="text-gray-600 mb-4">Manage your services and offerings</p>
            <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
              0 Active
            </span>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium mb-2">Orders</h3>
            <p className="text-gray-600 mb-4">View and manage customer orders</p>
            <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
              0 Pending
            </span>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium mb-2">Earnings</h3>
            <p className="text-gray-600 mb-4">Track your revenue and payments</p>
            <span className="inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
              $0.00
            </span>
          </div>
        </div>
      </div>

      {/* Profile Update Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Profile</DialogTitle>
            <DialogDescription>
              Make changes to your profile information here.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleProfileUpdate} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input 
                  id="fullName" 
                  value={profileData.fullName}
                  onChange={handleProfileChange}
                  className="pl-10" 
                  placeholder="Your full name"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input 
                  id="email" 
                  type="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  className="pl-10" 
                  placeholder="Your email address"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input 
                  id="phone" 
                  value={profileData.phone}
                  onChange={handleProfileChange}
                  className="pl-10" 
                  placeholder="Your phone number"
                />
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">Change Password (Optional)</h4>
              
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input 
                    id="currentPassword" 
                    type="password"
                    value={profileData.currentPassword}
                    onChange={handleProfileChange}
                    className="pl-10" 
                    placeholder="Enter current password"
                  />
                </div>
              </div>
              
              <div className="space-y-2 mt-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input 
                    id="newPassword" 
                    type="password"
                    value={profileData.newPassword}
                    onChange={handleProfileChange}
                    className="pl-10" 
                    placeholder="Enter new password"
                  />
                </div>
              </div>
              
              <div className="space-y-2 mt-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input 
                    id="confirmPassword" 
                    type="password"
                    value={profileData.confirmPassword}
                    onChange={handleProfileChange}
                    className="pl-10" 
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter className="flex space-x-2 justify-end pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="flex items-center">
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" className="flex items-center">
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendorDashboard;