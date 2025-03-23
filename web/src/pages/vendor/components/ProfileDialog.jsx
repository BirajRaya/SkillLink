/* eslint-disable react/prop-types */
// components/ProfileDialog.jsx
import { useState, useEffect } from "react";
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
  X,
  Camera,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
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
  error,
}) => {
  const [showPassword, setShowPassword] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  // Add state for field-specific errors
  const [errors, setErrors] = useState({});

  // Detect viewport size for responsive adjustments
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    // Initial check
    checkScreenSize();

    // Add event listener
    window.addEventListener("resize", checkScreenSize);

    // Clean up
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  return (
    <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
      <DialogContent className="sm:max-w-md max-w-[95vw] p-4 sm:p-6 flex flex-col max-h-[95vh] sm:max-h-[85vh]">
        <DialogHeader className="space-y-1 sm:space-y-2">
          <DialogTitle className="text-lg sm:text-xl">
            Update Profile
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Make changes to your profile information here.
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable content area */}
        <div className="overflow-y-auto flex-grow pr-1 -mr-1">
          <form
            id="profile-form"
            onSubmit={handleProfileUpdate}
            className="space-y-3 sm:space-y-4 py-2 sm:py-4"
          >
            <div className="space-y-2 text-center">
              <Label htmlFor="profilePicture" className="text-xs sm:text-sm">
                Profile Picture
              </Label>
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto">
                {profileData.profilePicture ? (
                  <img
                    src={`${profileData.profilePicture}`}
                    alt="Profile"
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border"
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-200 flex items-center justify-center border">
                    <User className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
                  </div>
                )}
                <label
                  htmlFor="profilePictureInput"
                  aria-label="Change profile picture"
                >
                  <div className="absolute bottom-1 right-1 bg-gray-800 text-white p-1 rounded-full cursor-pointer hover:bg-gray-700">
                    <Camera className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
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
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="fullName" className="text-xs sm:text-sm">
                Full Name
              </Label>
              <div className="relative">
                <User className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                <Input
                  id="fullName"
                  value={profileData.fullName}
                  onChange={handleProfileChange}
                  className="pl-8 sm:pl-10 h-8 sm:h-10 text-xs sm:text-sm"
                  placeholder="Your full name"
                  pattern="[A-Za-z\s]+"
                  required
                  onBlur={() => {
                    if (profileData.fullName.length < 6) {
                      setErrors({
                        ...errors,
                        fullName:
                          "Full Name must be at least 6 characters long",
                      });
                    } else {
                      setErrors({ ...errors, fullName: "" });
                    }
                  }}
                />
                {errors.fullName && (
                  <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="email" className="text-xs sm:text-sm">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  className="pl-8 sm:pl-10 bg-gray-100 cursor-not-allowed h-8 sm:h-10 text-xs sm:text-sm"
                  placeholder="Your email address"
                  readOnly
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="phone" className="text-xs sm:text-sm">
                Phone Number
              </Label>
              <div className="relative">
                <Phone className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                <Input
                  id="phone"
                  value={profileData.phone}
                  onChange={handleProfileChange}
                  className="pl-8 sm:pl-10 h-8 sm:h-10 text-xs sm:text-sm"
                  placeholder="Your phone number"
                  pattern="\d{10}"
                  required
                  onBlur={() => {
                    if (
                      profileData.phone.length !== 10 ||
                      !/^\d+$/.test(profileData.phone)
                    ) {
                      setErrors({
                        ...errors,
                        phone: "Phone Number should be exactly 10 digits",
                      });
                    } else {
                      setErrors({ ...errors, phone: "" });
                    }
                  }}
                />
                {errors.phone && (
                  <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
                )}
              </div>
            </div>

            {/* Address */}
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="address" className="text-xs sm:text-sm">
                Address
              </Label>
              <div className="relative">
                <Home className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                <Input
                  id="address"
                  value={profileData.address}
                  onChange={handleProfileChange}
                  className="pl-8 sm:pl-10 h-8 sm:h-10 text-xs sm:text-sm"
                  placeholder="Your address"
                  required
                  onBlur={() => {
                    if (profileData.address.length < 10) {
                      setErrors({
                        ...errors,
                        address: "Address should be minimum 10 characters",
                      });
                    } else {
                      setErrors({ ...errors, address: "" });
                    }
                  }}
                />
                {errors.address && (
                  <p className="mt-1 text-xs text-red-500">{errors.address}</p>
                )}
              </div>
            </div>

            {/* Change Password Section */}
            <div className="pt-2 sm:pt-4 border-t">
              <h4 className="text-xs sm:text-sm font-medium mb-2 sm:mb-3">
                Change Password (Optional)
              </h4>

              {/* Current Password */}
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="currentPassword" className="text-xs sm:text-sm">
                  Current Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                  <Input
                    id="currentPassword"
                    type={showPassword.currentPassword ? "text" : "password"}
                    value={profileData.currentPassword}
                    onChange={handleProfileChange}
                    className="pl-8 sm:pl-10 pr-8 sm:pr-10 h-8 sm:h-10 text-xs sm:text-sm"
                    placeholder="Enter current password"
                    onBlur={() => {
                      if (
                        profileData.currentPassword &&
                        profileData.currentPassword.length < 7
                      ) {
                        setErrors({
                          ...errors,
                          currentPassword:
                            "Current Password should be minimum 7 characters",
                        });
                      } else {
                        setErrors({ ...errors, currentPassword: "" });
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((prev) => ({
                        ...prev,
                        currentPassword: !prev.currentPassword,
                      }))
                    }
                    className="absolute right-2.5 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={
                      showPassword.currentPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword.currentPassword ? (
                      <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    ) : (
                      <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    )}
                  </button>
                  {errors.currentPassword && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.currentPassword}
                    </p>
                  )}
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1 sm:space-y-2 mt-2 sm:mt-3">
                <Label htmlFor="newPassword" className="text-xs sm:text-sm">
                  New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                  <Input
                    id="newPassword"
                    type={showPassword.newPassword ? "text" : "password"}
                    value={profileData.newPassword}
                    onChange={handleProfileChange}
                    className="pl-8 sm:pl-10 pr-8 sm:pr-10 h-8 sm:h-10 text-xs sm:text-sm"
                    placeholder="Enter new password (Min 7 char)"
                    minLength={7}
                    onBlur={() => {
                      if (
                        profileData.newPassword &&
                        profileData.newPassword.length < 7
                      ) {
                        setErrors({
                          ...errors,
                          newPassword:
                            "New Password should be minimum 7 characters",
                        });
                      } else {
                        setErrors({ ...errors, newPassword: "" });
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((prev) => ({
                        ...prev,
                        newPassword: !prev.newPassword,
                      }))
                    }
                    className="absolute right-2.5 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={
                      showPassword.newPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword.newPassword ? (
                      <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    ) : (
                      <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    )}
                  </button>
                  {errors.newPassword && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.newPassword}
                    </p>
                  )}
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1 sm:space-y-2 mt-2 sm:mt-3">
                <Label htmlFor="confirmPassword" className="text-xs sm:text-sm">
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showPassword.confirmPassword ? "text" : "password"}
                    value={profileData.confirmPassword}
                    onChange={handleProfileChange}
                    className="pl-8 sm:pl-10 pr-8 sm:pr-10 h-8 sm:h-10 text-xs sm:text-sm"
                    placeholder="Confirm new password (Min 7 char)"
                    minLength={7}
                    onBlur={() => {
                      if (
                        profileData.confirmPassword &&
                        profileData.confirmPassword.length < 7
                      ) {
                        setErrors({
                          ...errors,
                          confirmPassword:
                            "Confirm Password should be minimum 7 characters",
                        });
                      } else if (
                        profileData.newPassword &&
                        profileData.confirmPassword &&
                        profileData.newPassword !== profileData.confirmPassword
                      ) {
                        setErrors({
                          ...errors,
                          confirmPassword: "Passwords do not match",
                        });
                      } else {
                        setErrors({ ...errors, confirmPassword: "" });
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((prev) => ({
                        ...prev,
                        confirmPassword: !prev.confirmPassword,
                      }))
                    }
                    className="absolute right-2.5 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={
                      showPassword.confirmPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword.confirmPassword ? (
                      <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    ) : (
                      <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    )}
                  </button>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>

              {/* General error message */}
              {error && (
                <p className="text-red-500 text-xs sm:text-sm mt-2">{error}</p>
              )}
            </div>
          </form>
        </div>

        {/* Fixed footer with buttons */}
        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end pt-3 sm:pt-4 gap-2 sm:space-x-2 mt-2 sm:mt-3 border-t">
          <Button
            type="button"
            variant="outline"
            className="flex items-center justify-center w-full sm:w-auto h-8 sm:h-10 text-xs sm:text-sm"
            onClick={handleCancel}
          >
            <X className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Cancel
          </Button>
          <Button
            type="submit"
            form="profile-form"
            className="flex items-center justify-center w-full sm:w-auto h-8 sm:h-10 text-xs sm:text-sm"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileDialog;
