/* eslint-disable react/prop-types */

import { Loader2, X, Save } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom"; // Ensure this import is present

const AvailabilityTab = ({
  availabilityData,
  handleAvailabilityChange,
  handleWorkingDayChange,
  handleAvailabilitySubmit,
  isLoading,
  setActiveTab  
}) => {
  const navigate = useNavigate(); // Initialize useNavigate

  const handleCancel = () => {
    // Redirect to the vendor dashboard
    navigate("/dashboard"); // Adjust the path as necessary
  };

  // Generate hours options for dropdowns with AM/PM format
  const hoursOptions = Array.from({ length: 24 }, (_, i) => {
    const hour24 = i;
    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
    const amPm = hour24 < 12 ? 'AM' : 'PM';
    const formattedHour = `${hour12}:00 ${amPm}`;
    // Still store the value in 24-hour format for backend consistency
    const value = `${hour24.toString().padStart(2, '0')}:00`;

    return { value, label: formattedHour };
  });
  
  const orderedDays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Availability Settings</h2>
      <p className="text-gray-600 mb-6">
        Manage your availability status, working hours, and response times.
      </p>

      <form className="space-y-6" onSubmit={handleAvailabilitySubmit}>
        <div className="space-y-4">
          <Label>Current Availability Status</Label>
          <RadioGroup
            value={availabilityData.status}
            onValueChange={(value) => handleAvailabilityChange("status", value)}
            className="flex flex-col space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="available" id="available" />
              <Label htmlFor="available" className="font-normal">
                Available for new bookings
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="partially-available" id="partially-available" />
              <Label htmlFor="partially-available" className="font-normal">
                Limited availability
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="unavailable" id="unavailable" />
              <Label htmlFor="unavailable" className="font-normal">
                Not available for new bookings
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-4">
          <Label>Working Days</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {orderedDays.map((day) => (
              <div key={day} className="flex items-center space-x-2">
                <Checkbox
                  id={day}
                  checked={availabilityData.workingDays[day] ?? false}
                  onCheckedChange={(checked) => handleWorkingDayChange(day, checked)}
                />
                <Label htmlFor={day} className="font-normal capitalize">
                  {day}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="startTime">Working Hours - Start</Label>
            <Select
              value={availabilityData.workingHours.start}
              onValueChange={(value) => handleAvailabilityChange("workingHours.start", value)}
            >
              <SelectTrigger id="startTime">
                <SelectValue placeholder="Select start time" />
              </SelectTrigger>
              <SelectContent>
                {hoursOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="endTime">Working Hours - End</Label>
            <Select
              value={availabilityData.workingHours.end}
              onValueChange={(value) => handleAvailabilityChange("workingHours.end", value)}
            >
              <SelectTrigger id="endTime">
                <SelectValue placeholder="Select end time" />
              </SelectTrigger>
              <SelectContent>
                {hoursOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="responseTime">Typical Response Time</Label>
          <Select
            value={availabilityData.responseTime}
            onValueChange={(value) => handleAvailabilityChange("responseTime", value)}
          >
            <SelectTrigger id="responseTime">
              <SelectValue placeholder="Select response time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="same-day">Same Day</SelectItem>
              <SelectItem value="within-24h">Within 24 hours</SelectItem>
              <SelectItem value="within-48h">Within 48 hours</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="additionalNotes">Additional Notes (Optional)</Label>
          <Textarea
            id="additionalNotes"
            placeholder="Any specific details about your availability..."
            value={availabilityData.additionalNotes}
            onChange={(e) => handleAvailabilityChange("additionalNotes", e.target.value)}
            className="min-h-24"
          />
        </div>

        <div className="pt-4 flex justify-left space-x-4">
          <Button type="button" variant="outline" className="flex items-center" onClick={handleCancel}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
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
        </div>
      </form>
    </div>
  );
};

export default AvailabilityTab;