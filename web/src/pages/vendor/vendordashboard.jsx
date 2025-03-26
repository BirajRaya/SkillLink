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
  LogOut,
  X
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
  const [isMobile, setIsMobile] = useState(false);
  const [showAvailabilityForm, setShowAvailabilityForm] = useState(false);
  const [hasFilledAvailability, setHasFilledAvailability] = useState(false);
  const [showNewServiceDialog, setShowNewServiceDialog] = useState(false);
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const { toast } = useToast();

  // Check if screen is mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    // Set initial values
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar on tab selection on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [activeTab, isMobile]);

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
  const [dashboardStats, setDashboardStats] = useState({
    totalBookings: 0,
    totalEarnings: 0,
    bookingsChangePercent: 0,
    earningsChangePercent: 0,
    averageRating: "0.0",
    totalReviews: 0,
    pendingBookings: 0,
    recentBookings: [],
    popularServices: []
  });

  // New state for service insights
  const [serviceInsights, setServiceInsights] = useState({
    mostBooked: null,
    highestRated: null,
    mostProfitable: null
  });

  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);

        const response = await axios.get(`http://localhost:5000/vendors/dashboard-stats/${currentUser.id}`);
        if (response.data && response.data.success) {
          setDashboardStats(response.data.dashboardStats);
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if ((activeTab === "dashboard" || activeTab === "stats") && currentUser.id) {
      fetchDashboardStats();
    }
  }, [activeTab, currentUser.id]);

  // New effect for service insights
  useEffect(() => {
    const fetchServiceInsights = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/vendors/service-insights/${currentUser.id}`);
        if (response.data && response.data.success) {
          setServiceInsights(response.data.serviceInsights);
        }
      } catch (error) {
        console.error('Error fetching service insights:', error);
      }
    };

    if (activeTab === "services" && currentUser.id) {
      fetchServiceInsights();
    }
  }, [activeTab, currentUser.id]);

  useEffect(() => {
    // Check if user has filled availability form before
    const checkAvailability = async () => {
      try {
        // Replace with your actual API endpoint
        const response = await axios.get(`http://localhost:5000/vendors/getAvailability/${currentUser.id}`);
        if (response.data) {
          setAvailabilityData(response.data);
          setMainAvailabilityData(response.data);
          setHasFilledAvailability(true);
        } else {
          // If no availability data found, show the form
          setShowAvailabilityForm(true);
          setHasFilledAvailability(false);
        }
      } catch (error) {
        // Check if error is specifically a 404 (not found) or availability-related error
        if (error.response && (error.response.status === 404 || 
            error.response.data?.message?.includes('availability'))) {
          console.log('Availability not set yet for this vendor');
        } else {
          // Log only if it's a real error, not just missing availability
          console.error('network error:', error);
          toast({
            title: "Error",
            description: "network error.",
            variant: "destructive", // Red background
            className: "bg-red-500 text-white font-medium border-l-4 border-red-700"
          });

        }
        
        // In both cases, show the form
        setShowAvailabilityForm(true);
        setHasFilledAvailability(false);
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
      setActiveTab,
      isMobile
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
            isMobile={isMobile}
          />
        );
      case "services":
        return (
          <ServicesTab
            setShowNewServiceDialog={setShowNewServiceDialog}
            serviceInsights={serviceInsights} 
            formatCurrency={formatCurrency}
            isMobile={isMobile}
            {...commonProps}
          />
        );
      case "bookings":
        return <BookingsTab {...commonProps} />;
      case "messages":
        return <MessagesTab isMobile={isMobile} />;
      case "stats":
        return <StatsTab {...commonProps} />;
      case "support":
        return <SupportTab isMobile={isMobile} />;
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
        isMobile={isMobile}
      />
    );
  }

  return (
    <div className="bg-gray-100 flex flex-col h-screen">
      {/* Dashboard Header with Profile Actions */}
      <Header
        currentUser={currentUser}
        profileData={profileData}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        setShowProfileDialog={setShowProfileDialog}
        setActiveTab={setActiveTab}
        logout={logout}
        isMobile={isMobile}
      />

      {/* Main content with sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile sidebar backdrop */}
        {isMobile && sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-20"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Sidebar - Now responsive */}
        <div 
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } fixed md:relative z-30 md:z-auto h-full transition-transform duration-300 ease-in-out md:translate-x-0 border-r border-gray-200 dark:border-gray-800`}
        >
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            sidebarOpen={sidebarOpen}
            availabilityData={mainAvailabilityData}
            isMobile={isMobile}
          />
          
          {/* Close sidebar button for mobile */}
          {isMobile && (
            <button 
              className="absolute top-2 right-2 p-2 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Main content area - now responsive */}
        <div className={`flex-1 overflow-auto p-3 sm:p-4 md:p-6 ${isMobile ? 'w-full' : ''}`}>
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
        isMobile={isMobile}
      />

      <NewServiceDialog
        showNewServiceDialog={showNewServiceDialog}
        setShowNewServiceDialog={setShowNewServiceDialog}
        newService={newService}
        handleNewServiceChange={handleNewServiceChange}
        handleSubmitNewService={handleSubmitNewService}
        isLoading={isLoading}
        error={error}
        isMobile={isMobile}
      />

      <SuccessAlertDialog
        showAlertDialog={showAlertDialog}
        setShowAlertDialog={setShowAlertDialog}
        isMobile={isMobile}
      />
    </div>
  );
};

export default VendorDashboard;