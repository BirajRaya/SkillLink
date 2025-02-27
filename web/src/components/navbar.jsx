import { useState, useEffect } from "react";
import { Briefcase, User, LogOut, Settings, Mail, Phone, Lock, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from 'react-router-dom';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
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
import { useAuth } from '../utils/AuthContext'; // Update this path if needed

const Navbar = () => {
  const location = useLocation();
  const [activePage, setActivePage] = useState("");
  const { currentUser, isAuthenticated, logout } = useAuth();
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const navLinks = [
    { name: "Home", href: "/", id: "home" },
    { name: "About", href: "#", id: "about" },
    { name: "Contact", href: "#", id: "contact" },
  ];

  useEffect(() => {
    // Check the current path and set active page
    const path = location.pathname.split('/')[1] || "home"; // Default to "home"
    setActivePage(path);
  }, [location]);

  useEffect(() => {
    // Update profile data when currentUser changes
    if (currentUser) {
      setProfileData({
        ...profileData,
        fullName: currentUser.fullName || '',
        email: currentUser.email || '',
        phone: currentUser.phone || ''
      });
    }
  }, [currentUser]);

  // Function to get user's first name from full name
  const getFirstName = () => {
    if (!currentUser || !currentUser.fullName) return "User";
    return currentUser.fullName.split(' ')[0];
  };

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
    <>
      <nav className="border-b sticky top-0 bg-white z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <div className="flex items-center">
              <Briefcase className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-2xl font-bold text-blue-600">SkillLink</span>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.id}
                  to={link.href}
                  onClick={() => setActivePage(link.id)}
                  className={`${
                    activePage === link.id
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-600 hover:text-blue-600"
                  } pb-1`}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Buttons or User Profile */}
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <span>{currentUser?.fullName || 'User'}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      className="flex items-center"
                      onClick={() => setShowProfileDialog(true)}
                    >
                      <User className="mr-2 h-4 w-4" />
                      <span>Update Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="flex items-center text-red-600" onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className={`${
                      activePage === "login" ? "text-blue-600 border-b-2 border-blue-600" : ""
                    }`}
                  >
                    <Link to="/login">Sign In</Link>
                  </Button>
                  <Button
                    className={`${
                      activePage === "register" ? " border-b-2 border-blue-600" : ""
                    }`}
                  >
                    <Link to="/register">Sign Up</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

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
    </>
  );
};

export default Navbar;