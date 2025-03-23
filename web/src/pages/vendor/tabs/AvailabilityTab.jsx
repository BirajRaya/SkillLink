/* eslint-disable react/prop-types */

import { Loader2, X, Save } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const AvailabilityTab = ({
  availabilityData,
  handleAvailabilityChange,
  handleWorkingDayChange,
  handleAvailabilitySubmit,
  isLoading,
  setActiveTab,
  isMobile, // New prop for responsive design
}) => {
  const navigate = useNavigate();

  const handleCancel = () => {
    // If setActiveTab is provided, use it for in-app navigation
    if (setActiveTab) {
      setActiveTab("dashboard");
    } else {
      // Fallback to useNavigate for direct route changes
      navigate("/dashboard");
    }
  };

  // Generate hours options for dropdowns with AM/PM format
  const hoursOptions = Array.from({ length: 24 }, (_, i) => {
    const hour24 = i;
    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
    const amPm = hour24 < 12 ? "AM" : "PM";
    const formattedHour = `${hour12}:00 ${amPm}`;
    // Still store the value in 24-hour format for backend consistency
    const value = `${hour24.toString().padStart(2, "0")}:00`;

    return { value, label: formattedHour };
  });

  const orderedDays = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 w-full max-w-3xl mx-auto">
      <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-4">
        Availability Settings
      </h2>
      <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
        Manage your availability status, working hours, and response times.
      </p>

      <form
        className="space-y-4 sm:space-y-6"
        onSubmit={handleAvailabilitySubmit}
      >
        <div className="space-y-3 sm:space-y-4">
          <Label className="text-sm sm:text-base font-medium">
            Current Availability Status
          </Label>
          <RadioGroup
            value={availabilityData.status}
            onValueChange={(value) => handleAvailabilityChange("status", value)}
            className="flex flex-col space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="available" id="available" />
              <Label
                htmlFor="available"
                className="font-normal text-sm sm:text-base"
              >
                Available for new bookings
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value="partially-available"
                id="partially-available"
              />
              <Label
                htmlFor="partially-available"
                className="font-normal text-sm sm:text-base"
              >
                Limited availability
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="unavailable" id="unavailable" />
              <Label
                htmlFor="unavailable"
                className="font-normal text-sm sm:text-base"
              >
                Not available for new bookings
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <Label className="text-sm sm:text-base font-medium">
            Working Days
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
            {orderedDays.map((day) => (
              <div key={day} className="flex items-center space-x-2">
                <Checkbox
                  id={day}
                  checked={availabilityData.workingDays[day] ?? false}
                  onCheckedChange={(checked) =>
                    handleWorkingDayChange(day, checked)
                  }
                  className="h-4 w-4 sm:h-5 sm:w-5"
                />
                <Label
                  htmlFor={day}
                  className="font-normal capitalize text-sm sm:text-base"
                >
                  {day}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-1 sm:space-y-2">
            <Label
              htmlFor="startTime"
              className="text-sm sm:text-base font-medium"
            >
              Working Hours - Start
            </Label>
            <Select
              value={availabilityData.workingHours.start}
              onValueChange={(value) =>
                handleAvailabilityChange("workingHours.start", value)
              }
            >
              <SelectTrigger
                id="startTime"
                className="h-9 sm:h-10 text-sm sm:text-base"
              >
                <SelectValue placeholder="Select start time" />
              </SelectTrigger>
              <SelectContent>
                {hoursOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="text-sm sm:text-base"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 sm:space-y-2">
            <Label
              htmlFor="endTime"
              className="text-sm sm:text-base font-medium"
            >
              Working Hours - End
            </Label>
            <Select
              value={availabilityData.workingHours.end}
              onValueChange={(value) =>
                handleAvailabilityChange("workingHours.end", value)
              }
            >
              <SelectTrigger
                id="endTime"
                className="h-9 sm:h-10 text-sm sm:text-base"
              >
                <SelectValue placeholder="Select end time" />
              </SelectTrigger>
              <SelectContent>
                {hoursOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="text-sm sm:text-base"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1 sm:space-y-2">
          <Label
            htmlFor="responseTime"
            className="text-sm sm:text-base font-medium"
          >
            Typical Response Time
          </Label>
          <Select
            value={availabilityData.responseTime}
            onValueChange={(value) =>
              handleAvailabilityChange("responseTime", value)
            }
          >
            <SelectTrigger
              id="responseTime"
              className="h-9 sm:h-10 text-sm sm:text-base"
            >
              <SelectValue placeholder="Select response time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="same-day" className="text-sm sm:text-base">
                Same Day
              </SelectItem>
              <SelectItem value="within-24h" className="text-sm sm:text-base">
                Within 24 hours
              </SelectItem>
              <SelectItem value="within-48h" className="text-sm sm:text-base">
                Within 48 hours
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1 sm:space-y-2">
          <Label
            htmlFor="additionalNotes"
            className="text-sm sm:text-base font-medium"
          >
            Additional Notes (Optional)
          </Label>
          <Textarea
            id="additionalNotes"
            placeholder="Any specific details about your availability..."
            value={availabilityData.additionalNotes}
            onChange={(e) =>
              handleAvailabilityChange("additionalNotes", e.target.value)
            }
            className="min-h-[5rem] sm:min-h-24 text-sm sm:text-base"
          />
        </div>

        <div className="pt-4 flex flex-col sm:flex-row justify-center sm:justify-end space-y-2 sm:space-y-0 sm:space-x-4">
          <Button
            type="button"
            variant="outline"
            className="flex items-center justify-center w-full sm:w-auto text-sm sm:text-base h-9 sm:h-10"
            onClick={handleCancel}
          >
            <X className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex items-center justify-center w-full sm:w-auto text-sm sm:text-base h-9 sm:h-10"
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
        </div>
      </form>
    </div>
  );
};

export default AvailabilityTab;
