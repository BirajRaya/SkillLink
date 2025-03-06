/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react/prop-types */
import { Loader2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const NewServiceDialog = ({
  showNewServiceDialog,
  setShowNewServiceDialog,
  newService,
  handleNewServiceChange,
  handleSubmitNewService,
  isLoading,
  error
}) => {
  return (
    <Dialog open={showNewServiceDialog} onOpenChange={setShowNewServiceDialog}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Service</DialogTitle>
          <DialogDescription>
            Create a new service to offer to your customers.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmitNewService} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Service Title</Label>
            <Input
              id="title"
              value={newService.title}
              onChange={(e) => handleNewServiceChange("title", e.target.value)}
              placeholder="e.g., Plumbing Repair, House Cleaning"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select 
              value={newService.category} 
              onValueChange={(value) => handleNewServiceChange("category", value)}
              required
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="home-repair">Home Repair</SelectItem>
                <SelectItem value="electrical">Electrical</SelectItem>
                <SelectItem value="plumbing">Plumbing</SelectItem>
                <SelectItem value="cleaning">Cleaning</SelectItem>
                <SelectItem value="landscaping">Landscaping</SelectItem>
                <SelectItem value="moving">Moving</SelectItem>
                <SelectItem value="personal">Personal Services</SelectItem>
                <SelectItem value="educational">Educational</SelectItem>
                <SelectItem value="it-tech">IT & Technology</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={newService.description}
              onChange={(e) => handleNewServiceChange("description", e.target.value)}
              placeholder="Describe your service in detail..."
              className="min-h-32"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="price">Price (USD)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={newService.price}
                onChange={(e) => handleNewServiceChange("price", e.target.value)}
                placeholder="e.g., 75.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min="15"
                step="15"
                value={newService.duration}
                onChange={(e) => handleNewServiceChange("duration", e.target.value)}
                placeholder="e.g., 60"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Service Location</Label>
            <RadioGroup 
              value={newService.location} 
              onValueChange={(value) => handleNewServiceChange("location", value)}
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="onsite" id="onsite" />
                <Label htmlFor="onsite" className="font-normal">
                  Onsite (at customer's location)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="remote" id="remote" />
                <Label htmlFor="remote" className="font-normal">
                  Remote (virtual service)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="both" id="both" />
                <Label htmlFor="both" className="font-normal">
                  Both options available
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input
              id="tags"
              value={newService.tags}
              onChange={(e) => handleNewServiceChange("tags", e.target.value)}
              placeholder="e.g., plumbing, repair, emergency"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          
          <DialogFooter className="flex space-x-2 justify-end pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Service'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewServiceDialog;
