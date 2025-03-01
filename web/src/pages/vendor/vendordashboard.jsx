import { useState } from 'react';
import { useAuth } from '../../utils/AuthContext';
import axios from 'axios';
import {
  User,
  LogOut,
  Settings,
  ChevronDown,
  Mail,
  Phone,
  Lock,
  Save,
  X,
  Home,
  Eye,
  EyeOff
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
  const { currentUser, logout, setCurrentUser } = useAuth();
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [profileData, setProfileData] = useState({
    fullName: currentUser?.fullName || '',
    profilePicture: currentUser.profilePicture || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    address: currentUser.address
  });

  const handleProfileChange = (e) => {
    const { id, value } = e.target;
    setProfileData({ ...profileData, [id]: value });
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();

    if (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/update-profile",
        {
          fullName: profileData.fullName,
          email: profileData.email,
          phone: profileData.phone,
          profilePicture: profileData.profilePicture,
          currentPassword: profileData.currentPassword,
          newPassword: profileData.newPassword,
          confirmPassword: profileData.confirmPassword,
          address: profileData.address
        });
      const updateUser = response.data.user;
      setProfileData(updateUser);
      updateUser.role = currentUser.role;
      updateUser.id = currentUser.id;
      setCurrentUser(updateUser);
      localStorage.setItem('user', JSON.stringify(updateUser));
      setError("");

    } catch (err) {
      console.error('profile change error:', err);
      setError(err.response.data.message);
      return;

    }
    // Close the dialog after updating
    setShowProfileDialog(false);
  };
    const handleCancel = () => {
      setProfileData(currentUser);
      setError("");
    }


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
        <DialogContent className="sm:max-w-xlg">
          <DialogHeader>
            <DialogTitle>Update Profile</DialogTitle>
            <DialogDescription>
              Make changes to your profile information here.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleProfileUpdate} className="space-y-4 py-6 w-full max-w-md mx-auto ">
            {/* Full Name */}
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
                  pattern="[A-Za-z\s]+"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  className="pl-10 bg-gray-100 cursor-not-allowed"
                  placeholder="Your email address"
                  readonly
                />
              </div>
            </div>

            {/* Phone Number */}
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
                  pattern="\d{10}"
                  required
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <div className="relative">
                <Home className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="address"
                  value={profileData.address}
                  onChange={handleProfileChange}
                  className="pl-10"
                  placeholder="Your address"
                  required
                />
              </div>
            </div>


            {/* Change Password Section */}
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">Change Password (Optional)</h4>

              {/* Current Password */}
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

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password*</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="newPassword"
                    type={showPassword.newPassword ? "text" : "password"}
                    value={profileData.newPassword}
                    onChange={handleProfileChange}
                    className="pl-10 pr-10"
                    placeholder="Enter new password (Min 7 char)"
                    minLength={7}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => ({ ...prev, newPassword: !prev.newPassword }))}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword.newPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password*</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showPassword.confirmPassword ? "text" : "password"}
                    value={profileData.confirmPassword}
                    onChange={handleProfileChange}
                    className="pl-10 pr-10"
                    placeholder="Confirm new password (Min 7 char)"
                    minLength={7}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => ({ ...prev, confirmPassword: !prev.confirmPassword }))}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword.confirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              </div>

            </div>
            {/* Action Buttons */}
            <DialogFooter className="flex space-x-2 justify-end pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="flex items-center" onClick={handleCancel}>
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