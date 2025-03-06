import { Mail, Phone, MessageSquare, BookOpen, HelpCircle, ShieldCheck } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const SupportTab = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Support & Help</h2>
      <p className="text-gray-600 mb-6">
        Get help with your vendor account and services.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Contact Support</CardTitle>
            <CardDescription>Reach out to our support team with any questions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-blue-100 p-2 rounded-full">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="text-sm font-medium">Email</h4>
                <p className="text-sm text-gray-500">support@skilllink.com</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-green-100 p-2 rounded-full">
                <Phone className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h4 className="text-sm font-medium">Phone</h4>
                <p className="text-sm text-gray-500">+1 (555) 123-4567</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 p-2 rounded-full">
                <MessageSquare className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h4 className="text-sm font-medium">Live Chat</h4>
                <p className="text-sm text-gray-500">Available 9am-5pm, Monday to Friday</p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full">
              Contact Support
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Help Resources</CardTitle>
            <CardDescription>Browse our knowledge base and guides</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="bg-amber-100 p-2 rounded-full">
                <BookOpen className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h4 className="text-sm font-medium">Vendor Guide</h4>
                <p className="text-sm text-gray-500">Learn how to optimize your vendor profile</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="bg-cyan-100 p-2 rounded-full">
                <HelpCircle className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <h4 className="text-sm font-medium">FAQs</h4>
                <p className="text-sm text-gray-500">Answers to common questions</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="bg-pink-100 p-2 rounded-full">
                <ShieldCheck className="h-5 w-5 text-pink-600" />
              </div>
              <div>
                <h4 className="text-sm font-medium">Trust & Safety</h4>
                <p className="text-sm text-gray-500">Best practices for safe transactions</p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              View Help Center
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default SupportTab;
