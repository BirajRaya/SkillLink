/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react/prop-types */
import { Loader2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const AvailabilityForm = ({
  availabilityData,
  handleAvailabilityChange,
  handleWorkingDayChange,
  handleAvailabilitySubmit,
  isLoading
}) => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
        <h1 className="text-2xl font-bold text-center mb-6">Complete Your Availability Profile</h1>
        <p className="text-gray-600 text-center mb-8">
          Please provide your availability information to access your vendor dashboard.
          This helps customers know when you're available for bookings.
        </p>
        
        <form className="space-y-6" onSubmit={handleAvailabilitySubmit}>
          <div className="space-y-4">
            <Label>Are you currently available for new bookings?</Label>
            <RadioGroup 
              value={availabilityData.status} 
              onValueChange={(value) => handleAvailabilityChange("status", value)}
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="available" id="available-initial" />
                <Label htmlFor="available-initial" className="font-normal">
                  Yes, I'm available for new bookings
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="partially-available" id="partially-available-initial" />
                <Label htmlFor="partially-available-initial" className="font-normal">
                  I have limited availability
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="unavailable" id="unavailable-initial" />
                <Label htmlFor="unavailable-initial" className="font-normal">
                  I'm not currently taking new bookings
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-4">
            <Label>Which days are you typically available to work?</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(availabilityData.workingDays).map(([day, checked]) => (
                <div key={day} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`${day}-initial`} 
                    checked={checked}
                    onCheckedChange={(checked) => handleWorkingDayChange(day, checked)}
                  />
                  <Label htmlFor={`${day}-initial`} className="font-normal capitalize">
                    {day}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="startTime-initial">Working Hours - Start</Label>
              <Input
                id="startTime-initial"
                type="time"
                value={availabilityData.workingHours.start}
                onChange={(e) => handleAvailabilityChange("workingHours.start", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime-initial">Working Hours - End</Label>
              <Input
                id="endTime-initial"
                type="time"
                value={availabilityData.workingHours.end}
                onChange={(e) => handleAvailabilityChange("workingHours.end", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="responseTime-initial">Typical Response Time</Label>
            <Select 
              value={availabilityData.responseTime} 
              onValueChange={(value) => handleAvailabilityChange("responseTime", value)}
            >
              <SelectTrigger id="responseTime-initial">
                <SelectValue placeholder="Select response time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="same-day">Same Day</SelectItem>
                <SelectItem value="within-24h">Within 24 hours</SelectItem>
                <SelectItem value="within-48h">Within 48 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting Up Your Profile...
              </>
            ) : (
              'Complete Profile & Continue to Dashboard'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AvailabilityForm;