import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';

const Disputes = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Disputes</h1>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Issue</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Add sample data or integrate with API */}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default Disputes;