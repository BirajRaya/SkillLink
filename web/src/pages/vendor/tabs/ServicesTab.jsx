import { Plus, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ServicesTab = ({ setShowNewServiceDialog }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold">Your Services</h2>
            <p className="text-gray-600">
              Manage the services you offer to customers
            </p>
          </div>
          <Button onClick={() => setShowNewServiceDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Service
          </Button>
        </div>
        
        <Tabs defaultValue="all">
          <TabsList className="mb-6">
            <TabsTrigger value="all">All Services</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <div className="flex justify-center items-center h-40 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-center">
                <Briefcase className="mx-auto h-8 w-8 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No services yet</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new service.</p>
                <div className="mt-6">
                  <Button onClick={() => setShowNewServiceDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Service
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="active">
            <div className="flex justify-center items-center h-40 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-center">
                <h3 className="mt-2 text-sm font-medium text-gray-900">No active services</h3>
                <p className="mt-1 text-sm text-gray-500">Your active services will appear here.</p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="draft">
            <div className="flex justify-center items-center h-40 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-center">
                <h3 className="mt-2 text-sm font-medium text-gray-900">No draft services</h3>
                <p className="mt-1 text-sm text-gray-500">Your draft services will appear here.</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Service Insights</h3>
        <p className="text-gray-600 mb-6">
          See how your services are performing
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Most Booked</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">No data yet</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Highest Rated</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">No data yet</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Most Profitable</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">No data yet</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ServicesTab;
