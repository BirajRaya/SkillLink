import { useState, useEffect } from 'react';
import { useAuth } from '@/utils/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { 
  AlertCircle, 
  Loader2, 
  Calendar, 
  MapPin, 
  Clock, 
  Home,  
  CheckCircle,
  ChevronRight,
  Info,
  Ban
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from '@/lib/api';
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";

// Time slot options - 30-minute intervals from 9 AM to 6 PM with AM/PM format
const TIME_SLOTS = [];
for (let hour = 9; hour <= 18; hour++) {
  const formattedHour = hour.toString().padStart(2, '0');
  const period = hour < 12 ? 'AM' : 'PM';
  const displayHour = hour > 12 ? (hour - 12).toString() : hour.toString();
  
  // Add time slots with both 24h value and AM/PM display format
  TIME_SLOTS.push({
    value: `${formattedHour}:00`,
    label: `${displayHour}:00 ${period}`
  });
  
  if (hour < 18) {
    TIME_SLOTS.push({
      value: `${formattedHour}:30`,
      label: `${displayHour}:30 ${period}`
    });
  }
}

const BookingForm = ({ service, onBookingComplete }) => {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();
  
  // Current time info for validation
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  // Get today's date in local timezone, not UTC
  const getLocalISODate = (date) => {
    // Create a new date forcing the time to noon to avoid timezone issues
    const d = new Date(date);
    // Extract year, month, and day components
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    // Return in YYYY-MM-DD format
    return `${year}-${month}-${day}`;
  };
  
  const today = getLocalISODate(now);
  
  // Helper functions for consistent timestamps and user identification
  const getCurrentTimestamp = () => {
    return "2025-03-13 02:52:44"; // Use the provided timestamp
  };
  
  const getCurrentUsername = () => {
    return "sudeepbanjade21"; // Use the provided username
  };


  
  const [bookingData, setBookingData] = useState({
    date: '',
    time: '',
    address: '',
    city: '',
    postalCode: '',
    notes: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [activeStep, setActiveStep] = useState(1);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [serviceAvailability, setServiceAvailability] = useState({
    isChecking: false,
    isAvailable: true,
    error: null
  });
  
  // Vendor availability data
  const [vendorAvailability, setVendorAvailability] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  
  // State to track booked dates for this service
  const [bookedDates, setBookedDates] = useState([]);
  const [existingBooking, setExistingBooking] = useState(null);


  // Function to check user's existing booking
const checkExistingBooking = async () => {
  if (!service.id || !isAuthenticated) return;
  
  try {
    
    // Call the booking check API
    const bookingResponse = await api.get(`/bookings/check/${service.id}/date`);
    
    if (bookingResponse.data && bookingResponse.data.hasBooking) {
      const booking = bookingResponse.data.booking;
      setExistingBooking(booking);
      
      // Extract date from booking and add to booked dates
      if (booking.booking_date) {
        const bookedDate = getLocalISODate(new Date(booking.booking_date));
        console.log(`[${getCurrentTimestamp()}] User has existing booking on date: ${bookedDate}`);
        
        // Add to booked dates list to block this date
        setBookedDates(prevDates => [...prevDates, bookedDate]);
      }
    } else {
      console.log(`[${getCurrentTimestamp()}] No existing bookings found for this service`);
    }
  } catch (err) {
    console.error(`[${getCurrentTimestamp()}] Error checking existing bookings:`, err);
  }
};
  
  // Function to fetch vendor availability
  const fetchVendorAvailability = async () => {

    try {
      // In a real app, you would fetch this from an API instead of hardcoding
      const response = await api.get(`/vendors/${service.vendor_id}/avaibilability`);
    
      
      const data = response.data;
      console.log(data);
      
      // Using hardcoded data for this example
      console.log(`[${getCurrentTimestamp()}] Fetched vendor availability for vendor ${service.vendor_id}`);
      setVendorAvailability(data);
      
      // Generate available dates for the next 90 days based on vendor working days
      generateAvailableDates(data);
    } catch (err) {
      console.error(`[${getCurrentTimestamp()}] Error fetching vendor availability:`, err);
      setError('Could not load vendor availability data. Please try again later.');
    }
  };
  
  // Function to generate available dates based on vendor working days
  const generateAvailableDates = (vendorData) => {
    if (!vendorData || !vendorData.working_days) return;
    
    const dates = [];
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    // Generate dates for the next 90 days
    const startDate = new Date();
    for (let i = 0; i < 90; i++) {
      const date = new Date();
      date.setDate(startDate.getDate() + i);
      
      // Check if this day of week is a working day for the vendor
      const dayName = days[date.getDay()];
      const isAvailable = vendorData.working_days[dayName] === true;
      
      if (isAvailable) {
        dates.push(getLocalISODate(date));
      }
    }
    
    setAvailableDates(dates);
  };
  
  // Function to check if a date is available for booking
  const isDateAvailable = (dateStr) => {
    return availableDates.includes(dateStr);
  };
  
  // Function to get available time slots based on vendor working hours
  const getVendorTimeSlots = (vendorData, date) => {
    if (!vendorData || !vendorData.working_hours) return TIME_SLOTS;
    
    const workingHours = vendorData.working_hours;
    const startTime = workingHours.start;
    const endTime = workingHours.end;
    
    // Convert to 24-hour format for comparison
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    // Filter time slots within working hours
    return TIME_SLOTS.filter(slot => {
      const [slotHour, slotMinute] = slot.value.split(':').map(Number);
      
      // Check if slot is within working hours
      if (slotHour < startHour || slotHour > endHour) {
        return false;
      }
      
      // Edge cases for start and end times
      if (slotHour === startHour && slotMinute < startMinute) {
        return false;
      }
      
      if (slotHour === endHour && slotMinute >= endMinute) {
        return false;
      }
      
      return true;
    });
  };
  

  useEffect(() => {
    // Log the current date and user for debugging
    console.log("Today in local timezone:", today);
    console.log("Current user:", getCurrentUsername());
    
    // Redirect to login if user is not authenticated
    if (!isAuthenticated) {
      navigate('/login', { state: { from: window.location.pathname } });
    }
    
    // Check service availability when component mounts
    checkExistingBooking();
    
    // Fetch vendor availability data
    fetchVendorAvailability();
  }, [isAuthenticated, navigate, service.id]);

  // Effect to update available time slots whenever date changes
  useEffect(() => {
    if (bookingData.date) {
      // First, get vendor-defined time slots based on working hours
      let vendorSlots = getVendorTimeSlots(vendorAvailability, bookingData.date);
      
      // Then, if it's today, filter out past times with buffer
      const slots = bookingData.date === today 
        ? vendorSlots.filter(timeSlot => {
            const [hours, minutes] = timeSlot.value.split(':').map(Number);
            
            // Add buffer time (30 minutes)
            let minHour = currentHour;
            let minMinute = currentMinute + 30;
            
            // Adjust if minutes overflow
            if (minMinute >= 60) {
              minHour += 1;
              minMinute -= 60;
            }
            
            return hours > minHour || (hours === minHour && minutes >= minMinute);
          })
        : vendorSlots; // All vendor slots for future dates
      
      console.log("Available time slots count:", slots.length);
      setAvailableTimeSlots(slots);
      
      // Clear previously selected time when date changes
      setBookingData(prev => ({
        ...prev,
        time: ''
      }));
    } else {
      // No date selected, clear time slots
      setAvailableTimeSlots([]);
    }
  }, [bookingData.date, vendorAvailability]);

  // Load prefill data from previous bookings
  useEffect(() => {
    try {
      const storedData = localStorage.getItem('booking_prefill');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        
        // Only use if not too old (within 30 days)
        const lastBooked = new Date(parsedData.last_booked || '');
        const now = new Date();
        const daysDiff = (now - lastBooked) / (1000 * 60 * 60 * 24);
        
        if (!isNaN(daysDiff) && daysDiff <= 30) {
          console.log(`[${getCurrentTimestamp()}] Loading saved booking data from ${lastBooked.toISOString()}`);
          
          setBookingData(prev => ({
            ...prev,
            address: parsedData.address || prev.address,
            city: parsedData.city || prev.city,
            postalCode: parsedData.postal_code || prev.postalCode,
            notes: parsedData.notes || prev.notes
          }));
        }
      }
    } catch (err) {
      console.error(`[${getCurrentTimestamp()}] Error loading booking prefill data:`, err);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setBookingData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'address') {
      validateAddress(value);
    }
  };

  // Date input change handler with vendor availability check
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    
    // Check if the selected date is already booked
    if (bookedDates.includes(value)) {
      setFieldErrors(prev => ({
        ...prev,
        date: 'This service is already booked on this date. Please select another date.'
      }));
      return;
    }
    
    // Check if the selected date is a vendor available date
    if (!isDateAvailable(value)) {
      setFieldErrors(prev => ({
        ...prev,
        date: 'This service is not available on the selected date'
      }));
      return;
    }
    
    setBookingData(prev => ({ ...prev, [name]: value }));
    setFieldErrors(prev => ({...prev, date: undefined}));
  };

  // Format postal code as user types (uppercase and space after 3rd character)
  const handlePostalCodeChange = (e) => {
    let value = e.target.value.toUpperCase();
    
    // Remove any spaces or hyphens
    value = value.replace(/[\s-]/g, '');
    
    // Insert a space after the 3rd character if length > 3
    if (value.length > 3) {
      value = value.substring(0, 3) + ' ' + value.substring(3);
    }
    
    // Limit to 7 characters (including space)
    if (value.length > 7) {
      value = value.substring(0, 7);
    }
    
    setBookingData(prev => ({ ...prev, postalCode: value }));
    validatePostalCode(value);
  };

  const handleSelectChange = (name, value) => {
    setBookingData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'time' && bookingData.date === today) {
      validateTimeForToday(value);
    }
  };

  const validateTimeForToday = (selectedTime) => {
    if (!selectedTime) return false;
    
    const [hours, minutes] = selectedTime.split(':').map(Number);
    
    // Add buffer time (e.g., 30 minutes) to current time for minimum booking time
    const bufferMinutes = 30;
    let minHour = currentHour;
    let minMinute = currentMinute + bufferMinutes;
    
    // Adjust if minutes overflow
    if (minMinute >= 60) {
      minHour += 1;
      minMinute -= 60;
    }
  
    // Check if the selected time is too close to current time
    if (hours < minHour || (hours === minHour && minutes < minMinute)) {
      setFieldErrors(prev => ({
        ...prev, 
        time: `Please select a time at least 30 minutes from now`
      }));
      return false;
    } else {
      setFieldErrors(prev => ({...prev, time: undefined}));
      return true;
    }
  };

  const validateAddress = (address) => {
    if (!address) {
      setFieldErrors(prev => ({...prev, address: 'Street address is required'}));
    } else if (address.length < 5) {
      setFieldErrors(prev => ({...prev, address: 'Please enter a valid street address'}));
    } else {
      setFieldErrors(prev => ({...prev, address: undefined}));
    }
  };

  const validatePostalCode = (postalCode) => {
    const regex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/i;
    
    if (!postalCode) {
      setFieldErrors(prev => ({...prev, postalCode: 'Postal code is required'}));
    } else if (!regex.test(postalCode)) {
      setFieldErrors(prev => ({...prev, postalCode: 'Please enter a valid Canadian postal code (e.g., A1A 1A1)'}));
    } else {
      setFieldErrors(prev => ({...prev, postalCode: undefined}));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;
  
    // Date validation
    if (!bookingData.date) {
      newErrors.date = 'Date is required';
      isValid = false;
    } else {
      const selectedDate = new Date(bookingData.date);
      const currentDate = new Date(today);
      
      // Check if date is in the past
      if (selectedDate < currentDate) {
        newErrors.date = 'Date cannot be in the past';
        isValid = false;
      }
      
      // Check if date is too far in the future (e.g., 90 days)
      const maxBookingDate = new Date(currentDate);
      maxBookingDate.setDate(currentDate.getDate() + 90);
      
      if (selectedDate > maxBookingDate) {
        newErrors.date = 'Bookings cannot be made more than 90 days in advance';
        isValid = false;
      }
      
      // Check if the selected date is a vendor available date
      if (!isDateAvailable(bookingData.date)) {
        newErrors.date = 'This service is not available on the selected date';
        isValid = false;
      }
    }
  
    // Time validation
    if (!bookingData.time) {
      newErrors.time = 'Time is required';
      isValid = false;
    } else if (bookingData.date === today) {
      isValid = validateTimeForToday(bookingData.time) && isValid;
    }
    
    // Address validation
    if (!bookingData.address) {
      newErrors.address = 'Street address is required';
      isValid = false;
    } else if (bookingData.address.length < 5) {
      newErrors.address = 'Please enter a valid street address';
      isValid = false;
    }
    
    // City validation
    if (!bookingData.city) {
      newErrors.city = 'City is required';
      isValid = false;
    }
    
    // Postal code validation
    if (!bookingData.postalCode) {
      newErrors.postalCode = 'Postal code is required';
      isValid = false;
    } else {
      const regex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/i;
      if (!regex.test(bookingData.postalCode)) {
        newErrors.postalCode = 'Please enter a valid Canadian postal code';
        isValid = false;
      }
    }
    
    setFieldErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate the form
    if (!validateForm()) {
      return;
    }
    
    // Check service availability again before submitting
    try {
      setLoading(true);
      console.log(`[${getCurrentTimestamp()}] User ${getCurrentUsername()} checking final availability before booking service ${service.id}`);
      
      const availabilityResponse = await api.get(`/bookings/service/${service.id}/availability`);
      
      if (!availabilityResponse.data.isAvailable) {
        console.log(`[${getCurrentTimestamp()}] Service ${service.id} is no longer available`);
        setError('This service is currently unavailable as it has been booked by another user.');
        setLoading(false);
        return;
      }
      
      // Extract hours and minutes from the selected time
      const [hours, minutes] = bookingData.time.split(':').map(Number);

      // Create a Date object for the selected date, but with zeroed time
      const bookingDate = new Date(bookingData.date);
      
      // Create a fake UTC date that actually represents local time
      // This tricks the backend into storing exactly what the user selected
      const fakeUTC = new Date(bookingDate);
      fakeUTC.setUTCHours(hours, minutes, 0, 0);
      
      // Store the time as a separate field for display purposes
      const displayTime = bookingData.time;
      
      // Create booking request with the faked UTC time
      const bookingRequest = {
        serviceId: service.id,
        vendorId: service.vendor_id,
        bookingDate: fakeUTC.toISOString(),
        displayTime: displayTime,
        amount: service.price,
        notes: bookingData.notes,
        address: bookingData.address,
        postalCode: bookingData.postalCode,
        city: bookingData.city,
        province: 'Ontario',
        country: 'Canada'
      };

      console.log(`[${getCurrentTimestamp()}] User ${getCurrentUsername()} submitting booking with:`, {
        selectedDate: bookingData.date,
        selectedTime: bookingData.time,
        fakeUTCDate: fakeUTC.toISOString(),
        displayTime
      });
      
      const response = await api.post('/bookings', bookingRequest);

      if (response.status === 201 || response.status === 200) {
        // Add display time to the booking data for proper rendering
        const bookingWithDisplay = {
          ...response.data.booking,
          displayTime: displayTime // Add selected time for display
        };
        
        console.log(`[${getCurrentTimestamp()}] User ${getCurrentUsername()} booking created successfully:`, bookingWithDisplay);
        
        // Save booking data for future use
        localStorage.setItem('booking_prefill', JSON.stringify({
          address: bookingData.address,
          city: bookingData.city, 
          postal_code: bookingData.postalCode,
          notes: bookingData.notes,
          last_booked: new Date().toISOString()
        }));
        
        onBookingComplete(bookingWithDisplay);
      }
    } catch (err) {
      console.error(`[${getCurrentTimestamp()}] User ${getCurrentUsername()} error creating booking:`, err);
      
      // Handle specific availability errors from the API
      if (err.response?.status === 409) {
        setError('This service is currently unavailable as it has been booked by another user.');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to create booking. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Loading state when checking availability
  if (serviceAvailability.isChecking) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
          <p className="text-blue-700">Checking service availability...</p>
        </div>
      </div>
    );
  }

 // Get day of week name for a given date
  const getDayOfWeek = (dateStr) => {
    if (!dateStr) return '';
    
    // Create a new date at noon to avoid timezone issues
    const date = new Date(dateStr);
    date.setHours(12, 0, 0, 0);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  };

  // Add this new function to check if a date should be disabled
  const isDateDisabled = (date) => {
    if (!vendorAvailability?.working_days) return true;
    
    // Format the date to YYYY-MM-DD for comparison
    const dateStr = getLocalISODate(date);
    
    // Check if this date is in the booked dates
    const isBooked = bookedDates.includes(dateStr);
    
    // Get the day name (sunday, monday, etc.)
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayIndex = date.getDay();
    const dayName = dayNames[dayIndex];
    
    // Check if it's a working day
    const isWorkingDay = vendorAvailability.working_days[dayName];
    
    // Check if date is in the past
    const isPastDate = date < new Date(today);
    
    // Check if date is too far in the future (90 days)
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 90);
    const isFutureDate = date > maxDate;
    
    // Date is disabled if ANY of these conditions are true
    return !isWorkingDay || isPastDate || isFutureDate || isBooked;
  };
  
  // Replace the old disabledDays function with the updated isDateDisabled
  const disabledDays = isDateDisabled;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-white to-blue-50 p-8 rounded-2xl shadow-xl"
    >
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-600">
          Book Your Appointment
        </h2>
        <div className="bg-blue-100 rounded-full p-2">
          <Calendar className="h-6 w-6 text-blue-600" />
        </div>
      </div>

      
      {/* Progress steps */}
      <div className="mb-8 hidden md:block">
        <div className="flex items-center justify-between">
          <div className={`flex flex-col items-center ${activeStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activeStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              <Calendar className="h-5 w-5" />
            </div>
            <span className="text-xs mt-2">Date & Time</span>
          </div>
          <div className={`flex-1 h-1 mx-2 ${activeStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          <div className={`flex flex-col items-center ${activeStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activeStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              <MapPin className="h-5 w-5" />
            </div>
            <span className="text-xs mt-2">Location</span>
          </div>
          <div className={`flex-1 h-1 mx-2 ${activeStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          <div className={`flex flex-col items-center ${activeStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activeStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              <CheckCircle className="h-5 w-5" />
            </div>
            <span className="text-xs mt-2">Confirm</span>
          </div>
        </div>
      </div>
      
      {/* Service Summary */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl p-4 mb-8 border border-blue-100 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-800">Service: <span className="font-bold text-blue-700">{service.name}</span></h3>
            <p className="text-sm text-gray-500">Provider: {service.vendor_name}</p>
          </div>
          <div className="bg-blue-50 px-4 py-3 rounded-lg">
            <div className="flex items-center">
              <span className="text-xl font-bold text-blue-700">${service.price}</span>
            </div>
            <p className="text-xs text-gray-500 text-center mt-1">Total Price</p>
          </div>
        </div>
      </motion.div>
      
      {/* Vendor Availability Summary */}
      {vendorAvailability && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-100 shadow-sm"
        >
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-700 mb-1">Service Availability</h4>
              <p className="text-sm text-gray-600 mb-2">
                This service is available on the following days:
              </p>
              <div className="flex flex-wrap gap-2 mb-2">
                {Object.entries(vendorAvailability.working_days).map(([day, isAvailable]) => (
                  <span 
                    key={day}
                    className={`text-xs px-2 py-1 rounded-full ${
                      isAvailable 
                        ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                        : 'bg-gray-100 text-gray-400 border border-gray-200'
                    }`}
                  >
                    {day.charAt(0).toUpperCase() + day.slice(1)}
                  </span>
                ))}
              </div>
              <p className="text-sm text-gray-600">
                Hours: <span className="font-medium">{vendorAvailability.working_hours.start} - {vendorAvailability.working_hours.end}</span>
              </p>
            </div>
          </div>
        </motion.div>
      )}
      
      {error && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start"
        >
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
          <p className="text-red-600 text-sm">{error}</p>
        </motion.div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date and Time Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm"
        >
          <h3 className="font-semibold text-lg text-gray-800 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-blue-600" />
            Choose Date & Time
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Date Selection */}
            <div className="space-y-2">
              <Label htmlFor="date" className="text-gray-700">
                Appointment Date <span className="text-red-500">*</span>
              </Label>
<Popover>
  <PopoverTrigger asChild>
    <Button
      variant="outline"
      className={`w-full pl-10 py-6 h-auto text-left font-normal relative ${
        fieldErrors.date ? "border-red-300" : "border-gray-200"
      }`}
    >
      <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
      {bookingData.date ? (
        // Manually create a date object from the stored string to avoid timezone issues
        (() => {
          const [year, month, day] = bookingData.date.split('-').map(Number);
          return format(new Date(year, month - 1, day), "PPP");
        })()
      ) : (
        <span className="text-gray-400">Select a date</span>
      )}
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-auto p-0" align="start">
    {bookedDates.length > 0 && (
      <div className="p-2 bg-amber-50 border-b border-amber-100">
        <p className="text-xs text-amber-700 flex items-center">
          <AlertCircle className="h-3 w-3 mr-1" />
          Some dates are unavailable due to existing bookings
        </p>
      </div>
    )}
    <CalendarComponent
      mode="single"
      selected={bookingData.date ? (() => {
        // Properly create date object from string parts to avoid timezone shifts
        const [year, month, day] = bookingData.date.split('-').map(Number);
        return new Date(year, month - 1, day);
      })() : undefined}
      onSelect={(date) => {
        if (date) {
          // Use the updated getLocalISODate function
          const formattedDate = getLocalISODate(date);
          console.log("Selected date:", date);
          console.log("Formatted date:", formattedDate);
          handleDateChange({ target: { name: 'date', value: formattedDate } });
        }
      }}
      disabled={disabledDays}
      initialFocus
      className="rounded-md border"
    />
  </PopoverContent>
</Popover>
              {/* Show available days of the week */}
              {vendorAvailability && (
                <div className="mt-2">
                  <p className="text-blue-600 text-xs flex items-center">
                    <Info className="h-3 w-3 mr-1" />
                    Available on: {Object.entries(vendorAvailability.working_days)
                      .filter(([_, isAvailable]) => isAvailable)
                      .map(([day]) => day.charAt(0).toUpperCase() + day.slice(1))
                      .join(', ')}
                  </p>
                </div>
              )}
              {/* Error message */}
              {fieldErrors.date && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {fieldErrors.date}
                </p>
              )}
              {/* Selected day display */}
              {bookingData.date && !fieldErrors.date && (
                <p className="text-green-600 text-xs mt-1 flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {getDayOfWeek(bookingData.date)}
                </p>
              )}
            </div>
            
            {/* Time Selection */}
            <div className="space-y-2">
              <Label htmlFor="time" className="text-gray-700">
                Appointment Time <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={bookingData.time}
                onValueChange={(value) => handleSelectChange('time', value)}
                disabled={!bookingData.date}
                // Key ensures the component completely remounts when date changes
                key={`time-select-${bookingData.date || 'none'}`}
              >
                <SelectTrigger className={`w-full pl-10 py-6 h-auto text-left font-normal relative ${
                  fieldErrors.time ? "border-red-300 focus:border-red-400 focus:ring-red-200" : "border-gray-200"
                }`}>
                  <Clock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <SelectValue className='' placeholder="" />
                  <span className="text-gray-400">Select Time</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Available Times ({availableTimeSlots.length} options)</SelectLabel>
                    {availableTimeSlots.map((timeSlot) => (
                      <SelectItem key={timeSlot.value} value={timeSlot.value}>
                        {timeSlot.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {fieldErrors.time ? (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {fieldErrors.time}
                </p>
              ) : (
                !bookingData.date ? (
                  <p className="text-blue-600 text-xs mt-1 flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    Please select a date first
                  </p>
                ) : (
                  vendorAvailability && (
                    <p className="text-blue-600 text-xs mt-1 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      Hours: {vendorAvailability.working_hours.start} - {vendorAvailability.working_hours.end}
                    </p>
                  )
                )
              )}
            </div>
          </div>
        </motion.div>
        
        {/* Location Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm"
        >
          <h3 className="font-semibold text-lg text-gray-800 mb-4 flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-blue-600" />
            Service Location
          </h3>
          
          {/* Street Address */}
          <div className="space-y-2 mb-5">
            <Label htmlFor="address" className="text-gray-700">
              Street Address <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="address"
                name="address"
                placeholder="123 Main St, Apt 4B"
                value={bookingData.address}
                onChange={handleChange}
                className={`pl-10 py-6 border-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 ${
                  fieldErrors.address ? "border-red-300 focus:border-red-400 focus:ring-red-200" : "border-gray-200"
                }`}
                required
              />
              <Home className="absolute left-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
            {fieldErrors.address && (
              <p className="text-red-500 text-xs mt-1 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {fieldErrors.address}
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* City Selection */}
            <div className="space-y-2">
              <Label htmlFor="city" className="text-gray-700">
                City <span className="text-red-500">*</span>
              </Label>
              <Select 
                onValueChange={(value) => handleSelectChange('city', value)}
                value={bookingData.city}
              >
                <SelectTrigger className={`py-6 border-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 ${
                  fieldErrors.city ? "border-red-300 focus:border-red-400 focus:ring-red-200" : "border-gray-200"
                }`}>
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mississauga">Mississauga</SelectItem>
                  <SelectItem value="Brampton">Brampton</SelectItem>
                  <SelectItem value="Toronto">Toronto</SelectItem>
                </SelectContent>
              </Select>
              {fieldErrors.city && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {fieldErrors.city}
                </p>
              )}
            </div>
    
            {/* Postal Code */}
            <div className="space-y-2">
              <Label htmlFor="postalCode" className="text-gray-700">
                Postal Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="postalCode"
                name="postalCode"
                placeholder="A1A 1A1"
                value={bookingData.postalCode}
                onChange={handlePostalCodeChange}
                className={`py-6 border-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 ${
                  fieldErrors.postalCode ? "border-red-300 focus:border-red-400 focus:ring-red-200" : "border-gray-200"
                }`}
                required
                maxLength={7}
              />
              {fieldErrors.postalCode ? (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {fieldErrors.postalCode}
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">Format: A1A 1A1</p>
              )}
            </div>
    
            {/* Province */}
            <div className="space-y-2">
              <Label htmlFor="province" className="text-gray-700">Province</Label>
              <Select disabled value="Ontario">
                <SelectTrigger className="border-2 border-gray-100 bg-gray-50 text-gray-500 py-6">
                  <SelectValue>Ontario</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ontario">Ontario</SelectItem>
                </SelectContent>
              </Select>
            </div>
    
            {/* Country */}
            <div className="space-y-2">
              <Label htmlFor="country" className="text-gray-700">Country</Label>
              <Select disabled value="Canada">
                <SelectTrigger className="border-2 border-gray-100 bg-gray-50 text-gray-500 py-6">
                  <SelectValue>Canada</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Canada">Canada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>
    
        {/* Notes */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm"
        >
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-gray-700 font-medium">
              Special Instructions (Optional)
            </Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Any special instructions or requirements..."
              value={bookingData.notes}
              onChange={handleChange}
              rows={4}
              className="border-2 border-gray-200 focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
            />
          </div>
        </motion.div>
    
        {/* Confirmation Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8"
        >
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-6 text-lg font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing your booking...
              </>
            ) : (
              <>
                Confirm Booking
                <ChevronRight className="h-5 w-5" />
              </>
            )}
          </Button>
        </motion.div>
      </form>
    </motion.div>
  );
};

export default BookingForm;