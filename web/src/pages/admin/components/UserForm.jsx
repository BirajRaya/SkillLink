import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const UserForm = ({ open, onClose }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
    onClose();
  };

  

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Full Name</label>
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
            <label className="text-sm font-medium">Address</label>
            <Input required />
          </div>
          <Button type="submit" className="w-full">Add User</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserForm;