/* eslint-disable no-unused-vars */
// VendorDashboard.jsx - Main component file
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '../../utils/AuthContext';
import axios from 'axios';
import {
  Menu,
  User,
  ChevronDown,
  BellRing,
  Settings,
  Clock,
  HelpCircle,
  LogOut
} from "lucide-react";

// Component imports
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ProfileDialog from './components/ProfileDialog';
import AvailabilityForm from './components/AvailabilityForm';
import NewServiceDialog from './components/NewServiceDialog';
import SuccessAlertDialog from './components/SuccessAlertDialog';

// Tab content components
import DashboardTab from './tabs/DashboardTab';
import AvailabilityTab from './tabs/AvailabilityTab';
import ServicesTab from './tabs/ServicesTab';
import BookingsTab from './tabs/BookingsTab';
import MessagesTab from './tabs/MessagesTab';
import StatsTab from './tabs/StatsTab';
import ClientsTab from './tabs/ClientsTab';
import SupportTab from './tabs/SupportTab';

// UI components
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const VendorDashboard = () => {
  const { currentUser, logout, setCurrentUser } = useAuth();
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showAvailabilityForm, setShowAvailabilityForm] = useState(false);
  const [hasFilledAvailability, setHasFilledAvailability] = useState(false);
  const [showNewServiceDialog, setShowNewServiceDialog] = useState(false);
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const { toast } = useToast();

  const [availabilityData, setAvailabilityData] = useState({
    status: "available", // available, partially-available, unavailable
    workingDays: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false
    },
    workingHours: {
      start: "09:00",
      end: "17:00"
    },
    responseTime: "same-day", // same-day, within-24h, within-48h
    additionalNotes: ""
  });

  const [mainAvailabilityData, setMainAvailabilityData] = useState(availabilityData)

  const [profileData, setProfileData] = useState({
    fullName: currentUser?.fullName || '',
    profilePicture: currentUser?.profilePicture || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    address: currentUser?.address || ''
  });

  const [newService, setNewService] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    duration: '',
    location: 'onsite',
    tags: ''
  });

  // Mock data for dashboard stats
  const dashboardStats = {
    totalBookings: 12,
    pendingBookings: 3,
    completedBookings: 8,
    cancelledBookings: 1,
    totalEarnings: 2450,
    pendingPayments: 350,
    averageRating: 4.8,
    totalReviews: 7,
    recentBookings: [
      { id: 'BK1234', customer: 'Sarah Johnson', service: 'Plumbing Repair', date: '2023-06-12', status: 'completed', amount: 120 },
      { id: 'BK1235', customer: 'Michael Brown', service: 'Electrical Installation', date: '2023-06-14', status: 'pending', amount: 250 },
      { id: 'BK1236', customer: 'Emily Davis', service: 'Home Cleaning', date: '2023-06-18', status: 'pending', amount: 100 }
    ],
    popularServices: [
      { service: 'Plumbing Repair', bookings: 5, earnings: 600 },
      { service: 'Electrical Installation', bookings: 4, earnings: 1000 },
      { service: 'Home Cleaning', bookings: 3, earnings: 300 }
    ]
  };

  useEffect(() => {
    // Check if user has filled availability form before
    const checkAvailability = async () => {
      try {
        // Replace with your actual API endpoint
        const response = await axios.get(`http://localhost:5000/vendors/getAvailability/${currentUser.id}`);
        if (response.data) {
          setAvailabilityData(response.data);
          setMainAvailabilityData(response.data)
          // setHasFilledAvailability(true);
        } else {
          // If no availability data found, show the form
          setShowAvailabilityForm(true);
          setHasFilledAvailability(false);
        }
      } catch (error) {
        console.error("Error checking availability:", error);
        const errorMessage = error.response?.data?.message || error.message || "Failed to fetch availability data.";

        // If error (likely no availability set), show the form
        setShowAvailabilityForm(true);
        setHasFilledAvailability(false);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive", // Red background
          className: "bg-red-500 text-white font-medium border-l-4 border-red-700"
        });

      }
    };

    checkAvailability();
  }, [currentUser.id]);

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

  const handleAvailabilityChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setAvailabilityData({
        ...availabilityData,
        [parent]: {
          ...availabilityData[parent],
          [child]: value
        }
      });
    } else {
      setAvailabilityData({
        ...availabilityData,
        [field]: value
      });
    }
  };

  const handleWorkingDayChange = (day, checked) => {
    setAvailabilityData({
      ...availabilityData,
      workingDays: {
        ...availabilityData.workingDays,
        [day]: checked
      }
    });
  };

  const handleNewServiceChange = (field, value) => {
    setNewService({
      ...newService,
      [field]: value
    });
  };

  const handleAvailabilitySubmit = async (e) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      // Replace with your actual API endpoint
      await axios.post("http://localhost:5000/vendors/update-availability", {
        vendorId: currentUser.id,
        availability: availabilityData
      });

      setHasFilledAvailability(true);
      setShowAvailabilityForm(false);
      setIsLoading(false);
      setActiveTab("dashboard");
      setMainAvailabilityData(availabilityData)
      toast({
        title: "Success",
        description: "Your Availability has been updated successfully!",
        variant: "success",
        className: "bg-green-500 text-white font-medium border-l-4 border-green-700"
      });
    } catch (error) {
      console.error("Error updating availability:", error);
      setError("Failed to update availability status. Please try again.");
      toast({
        title: "Error",
        description: "Failed to Update Availability.",
        variant: "destructive", // Red background
        className: "bg-red-500 text-white font-medium border-l-4 border-red-700"
      });
      setIsLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();

    if (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (profileData.fullName.length < 5) {
      setError("Full Name must be at least 5 characters long");
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
      setProfileData({
        ...updateUser,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      updateUser.role = currentUser.role;
      updateUser.id = currentUser.id;
      setCurrentUser(updateUser);
      localStorage.setItem('user', JSON.stringify(updateUser));
      setError("");
      setShowProfileDialog(false);
      toast({
        title: "Success",
        description: "Your profile has been updated successfully!",
        variant: "success",
        className: "bg-green-500 text-white font-medium border-l-4 border-green-700"
      });
    } catch (err) {
      console.error('profile change error:', err);
      setError(err.response?.data?.message || "Failed to update profile");
      toast({
        title: "Error",
        description: "Failed to Update Profile.",
        variant: "destructive", // Red background
        className: "bg-red-500 text-white font-medium border-l-4 border-red-700"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitNewService = async (e) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      // Replace with your actual API endpoint
      await axios.post("http://localhost:5000/add-service", {
        vendorId: currentUser.id,
        service: newService
      });

      setShowNewServiceDialog(false);
      setNewService({
        title: '',
        description: '',
        category: '',
        price: '',
        duration: '',
        location: 'onsite',
        tags: ''
      });
      setIsLoading(false);
      setShowAlertDialog(true);
    } catch (error) {
      console.error("Error adding service:", error);
      setError("Failed to add service. Please try again.");
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setProfileData({
      ...currentUser,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setError("");
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Render different content based on active tab
  const renderContent = () => {
    const commonProps = {
      dashboardStats,
      formatCurrency,
      getStatusColor,
      isLoading,
      setActiveTab
    };

    switch (activeTab) {
      case "dashboard":
        return <DashboardTab {...commonProps} />;
      case "availability":
        return (
          <AvailabilityTab
            availabilityData={availabilityData}
            handleAvailabilityChange={handleAvailabilityChange}
            handleWorkingDayChange={handleWorkingDayChange}
            handleAvailabilitySubmit={handleAvailabilitySubmit}
            isLoading={isLoading}
            setActiveTab={setActiveTab}
          />
        );
      case "services":
        return (
          <ServicesTab
            setShowNewServiceDialog={setShowNewServiceDialog}
            {...commonProps}
          />
        );
      case "bookings":
        return <BookingsTab {...commonProps} />;
      case "messages":
        return <MessagesTab />;
      case "stats":
        return <StatsTab {...commonProps} />;
      case "clients":
        return <ClientsTab />;
      case "support":
        return <SupportTab />;
      default:
        return <div>Select a tab from the sidebar</div>;
    }
  };

  // If availability form needs to be shown and hasn't been filled, redirect to form
  if (showAvailabilityForm && !hasFilledAvailability) {
    return (
      <AvailabilityForm
        availabilityData={availabilityData}
        handleAvailabilityChange={handleAvailabilityChange}
        handleWorkingDayChange={handleWorkingDayChange}
        handleAvailabilitySubmit={handleAvailabilitySubmit}
        isLoading={isLoading}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Dashboard Header with Profile Actions */}
      <Header
        currentUser={currentUser}
        profileData={profileData}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        setShowProfileDialog={setShowProfileDialog}
        setActiveTab={setActiveTab}
        logout={logout}
      />

      {/* Main content with sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          sidebarOpen={sidebarOpen}
          availabilityData={mainAvailabilityData}
        />

        {/* Main content area */}
        <div className="flex-1 overflow-auto p-4 md:p-6">
          {renderContent()}
        </div>
      </div>

      {/* Dialogs */}
      <ProfileDialog
        showProfileDialog={showProfileDialog}
        setShowProfileDialog={setShowProfileDialog}
        profileData={profileData}
        handleProfileChange={handleProfileChange}
        handleProfilePictureChange={handleProfilePictureChange}
        handleProfileUpdate={handleProfileUpdate}
        handleCancel={handleCancel}
        isLoading={isLoading}
        error={error}
      />

      <NewServiceDialog
        showNewServiceDialog={showNewServiceDialog}
        setShowNewServiceDialog={setShowNewServiceDialog}
        newService={newService}
        handleNewServiceChange={handleNewServiceChange}
        handleSubmitNewService={handleSubmitNewService}
        isLoading={isLoading}
        error={error}
      />

      <SuccessAlertDialog
        showAlertDialog={showAlertDialog}
        setShowAlertDialog={setShowAlertDialog}
      />
    </div>
  );
};

export default VendorDashboard;