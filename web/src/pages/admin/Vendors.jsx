import { useState } from 'react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import VendorForm from './components/VendorForm';
import { Card } from '@/components/ui/card';

const Vendors = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-black">Vendors</h1>
        <div className="flex items-center gap-4">
          <Input placeholder="Search vendors..." className="w-64 text-black" />
          <Button onClick={() => setIsFormOpen(true)}>Add Vendor</Button>
        </div>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
            <TableHead className="text-black">Service Type</TableHead>
              <TableHead className="text-black">Rating</TableHead>
              <TableHead className="text-black">Status</TableHead>
              <TableHead className="text-black">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>John Plumbing</TableCell>
              <TableCell>Plumbing</TableCell>
              <TableCell>4.8/5</TableCell>
              <TableCell>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  Active
                </span>
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="sm">Edit</Button>
                <Button variant="ghost" size="sm" className="text-red-600">Disable</Button>
              </TableCell>
            </TableRow>
            {/* Add more sample data as needed */}
          </TableBody>
        </Table>
      </Card>
      <VendorForm open={isFormOpen} onClose={() => setIsFormOpen(false)} />
    </div>
  );
};

export default Vendors;