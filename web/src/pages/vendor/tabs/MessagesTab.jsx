import { MessageSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MessagesTab = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Customer Messages</h2>
      <p className="text-gray-600 mb-6">
        View and respond to customer inquiries and messages.
      </p>
      
      <Tabs defaultValue="inbox">
        <TabsList className="mb-6">
          <TabsTrigger value="inbox">Inbox</TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>
        
        <TabsContent value="inbox">
          <div className="flex justify-center items-center h-40 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-center">
              <MessageSquare className="mx-auto h-8 w-8 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No messages yet</h3>
              <p className="mt-1 text-sm text-gray-500">Customer messages will appear here.</p>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="sent">
          <div className="flex justify-center items-center h-40 bg-gray-50 rounded-lg">
            <div className="text-center">
              <h3 className="mt-2 text-sm font-medium text-gray-900">No sent messages</h3>
              <p className="mt-1 text-sm text-gray-500">Your sent messages will appear here.</p>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="archived">
          <div className="flex justify-center items-center h-40 bg-gray-50 rounded-lg">
            <div className="text-center">
              <h3 className="mt-2 text-sm font-medium text-gray-900">No archived messages</h3>
              <p className="mt-1 text-sm text-gray-500">Your archived messages will appear here.</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MessagesTab;