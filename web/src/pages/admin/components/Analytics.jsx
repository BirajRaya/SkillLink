import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const data = [
  { name: 'Jan', users: 400, vendors: 240, bookings: 240 },
  { name: 'Feb', users: 300, vendors: 139, bookings: 221 },
  { name: 'Mar', users: 200, vendors: 980, bookings: 229 },
  { name: 'Apr', users: 278, vendors: 390, bookings: 200 },
  { name: 'May', users: 189, vendors: 480, bookings: 218 },
];

const Analytics = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Analytics</h1>
      <Card className="p-6">
        <CardHeader>
          <CardTitle>Platform Growth</CardTitle>
        </CardHeader>
        <CardContent>
          <LineChart width={800} height={400} data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="users" stroke="#8884d8" />
            <Line type="monotone" dataKey="vendors" stroke="#82ca9d" />
            <Line type="monotone" dataKey="bookings" stroke="#ffc658" />
          </LineChart>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;