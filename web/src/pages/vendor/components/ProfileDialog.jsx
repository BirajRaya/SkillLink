/* eslint-disable react/prop-types */
// components/ProfileDialog.jsx
import { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Home, 
  Eye, 
  EyeOff, 
  Save, 
  Loader2, 
  X 
} from "lucide-react";
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
import { Button } from "@/components/ui/button";

const ProfileDialog = ({ 
  showProfileDialog, 
  setShowProfileDialog, 
  profileData, 
  handleProfileChange, 
  handleProfilePictureChange, 
  handleProfileUpdate,
  handleCancel,
  isLoading,
  error
}) => {
  const [showPassword, setShowPassword] = useState({
    newPassword: false,
    confirmPassword: false
  });

  return (
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
              {profileData.profilePicture ? (
                <img
                  src={`data:image/jpeg;base64,${profileData.profilePicture}`}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border">
                  <User className="h-12 w-12 text-gray-400" />
                </div>
              )}
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
                readOnly
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
              <Label htmlFor="newPassword">New Password</Label>
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
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
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
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              </div>
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
            <Button type="submit" className="flex items-center" disabled={isLoading}>
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
  );
};

export default ProfileDialog;