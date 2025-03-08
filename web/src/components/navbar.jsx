import { useState, useEffect } from "react";
import { Briefcase, User, LogOut, Settings, Mail, Phone, Lock, Save, X, Eye, EyeOff, Loader2 } from "lucide-react";
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
import axios from "axios";
import { Home } from "lucide-react";

const Navbar = () => {
  const location = useLocation();
  const [activePage, setActivePage] = useState("");
  const { currentUser, isAuthenticated, logout, setCurrentUser } = useAuth();
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    profilePicture: null,
    address: ''
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
        phone: currentUser.phone || '',
        address: currentUser.address || '',
        profilePicture: currentUser.profilePicture
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

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setProfileData({
          ...profileData,
          profilePicture: base64String,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (profileData.fullName.length < 5) {
      setError("Full Name must be 6 charaacter long");
      return;
    }

    try {
      setIsLoading(true);
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
      console.log(updateUser);
      localStorage.setItem('user', JSON.stringify(updateUser));
      setError("");

    } catch (err) {
      console.error('profile change error:', err);
      setError(err.response.data.message);
      return;
    }
    finally {
      setIsLoading(false);
    }
    // Close the dialog after updating
    setShowProfileDialog(false);
  };
  const handleCancel = () => {
    setProfileData(currentUser);
    setError("");
  }


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
                  className={`${activePage === link.id
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
                        <img
                          src={`${currentUser.profilePicture}`}
                          alt="Profile"
                          className="w-9 h-9 rounded-full object-cover border"
                        />
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
                    className={`${activePage === "login" ? "text-blue-600 border-b-2 border-blue-600" : ""
                      }`}
                  >
                    <Link to="/login">Sign In</Link>
                  </Button>
                  <Button
                    className={`${activePage === "register" ? " border-b-2 border-blue-600" : ""
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
            <div className="space-y-2 text-center">
              <Label htmlFor="profilePicture">Profile Picture</Label>
              <div className="relative w-24 h-24 mx-auto">
                <img
                  src={`${profileData.profilePicture}`}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border"
                />
                <label htmlFor="profilePictureInput">
                  <div className="absolute bottom-1 right-1 bg-gray-800 text-white p-1 rounded-full cursor-pointer hover:bg-gray-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13.5V17h3.5l7.5-7.5a2.121 2.121 0 000-3l-3-3a2.121 2.121 0 00-3 0L9 10.5z" />
                    </svg>
                  </div>
                </label>
                <input
                  type="file"
                  id="profilePictureInput"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfilePictureChange}
                />
              </div>
            </div>
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

            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">Change Password (Optional)</h4>

              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="currentPassword"
                    type={showPassword.currentPassword ? "text" : "password"}
                    value={profileData.currentPassword}
                    onChange={handleProfileChange}
                    className="pl-10"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => ({ ...prev, currentPassword: !prev.currentPassword }))}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword.currentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>


              <div className="space-y-2 mt-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="newPassword"
                    type={showPassword.newPassword ? "text" : "password"}
                    value={profileData.newPassword}
                    onChange={handleProfileChange}
                    className="pl-10"
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

              <div className="space-y-2 mt-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showPassword.confirmPassword ? "text" : "password"}
                    value={profileData.confirmPassword}
                    onChange={handleProfileChange}
                    className="pl-10"
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
              </div>
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </div>

            <DialogFooter className="flex space-x-2 justify-end pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="flex items-center" onClick={handleCancel}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" className="flex items-center">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Navbar;