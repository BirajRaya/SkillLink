import { useState } from 'react';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import UserForm from './components/UserForm';
import { Card } from '@/components/ui/card';

const Users = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-black">Users</h1>
        <div className="flex items-center gap-4">
          <Input placeholder="Search users..." className="w-64 text-black" />
          <Button onClick={() => setIsFormOpen(true)}>Add User</Button>
        </div>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-black">Name</TableHead>
              <TableHead className="text-black">Email</TableHead>
              <TableHead className="text-black">Joined Date</TableHead>
              <TableHead className="text-black">Status</TableHead>
              <TableHead className="text-black">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Add sample data */}
          </TableBody>
        </Table>
      </Card>
      <UserForm open={isFormOpen} onClose={() => setIsFormOpen(false)} />
    </div>
  );
};

export default Users;