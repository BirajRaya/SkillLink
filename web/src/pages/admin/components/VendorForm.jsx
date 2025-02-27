import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const VendorForm = ({ open, onClose }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Vendor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Business Name</label>
            <Input required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Owner Name</label>
            <Input required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input type="email" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Phone</label>
            <Input type="tel" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Service Type</label>
            <Select required>
              <SelectTrigger>
                <SelectValue placeholder="Select service type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="plumbing">Plumbing</SelectItem>
                <SelectItem value="electrical">Electrical</SelectItem>
                <SelectItem value="carpentry">Carpentry</SelectItem>
                <SelectItem value="painting">Painting</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Experience (years)</label>
            <Input type="number" required />
          </div>
          <Button type="submit" className="w-full">Add Vendor</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default VendorForm;