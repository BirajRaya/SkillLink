import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { User, Briefcase, Mail, Phone, MapPin, Lock, Upload } from 'lucide-react';
import LockImage from '../../assets/image/signup.png';
import axios from "axios";
import { useState } from "react";

const SignupPage = () => {

  const [selectedRole, setSelectedRole] = useState("customer");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    profilePicture: null
  });

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id.includes("customer-") ? id.replace("customer-", "") : id.replace("vendor-", "")]: value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, profilePicture: e.target.files[0].name});
  };

  const handleSubmitForSignup = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/signup", {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        address: formData.address,
        profilePicture: formData.profilePicture,
        role: selectedRole == "customer" ? "user" : "vendor",
      });
      //Email validation  goes below.
      console.log(response.data);
    } catch (err) {
      //add logic to display error messages to users.
      console.log(err.response.data.message);
    } finally {
      console.log("Signup called completed");
      setFormData({
        fullName: "",
        email: "",
        password: "",
        phone: "",
        address: "",
        profilePicture: null
      });
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 flex md-3">
      {/* Left Side - Illustration and Welcome */}
      <div className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-center items-center">
        <div className="max-w-lg">
          <img 
           src={LockImage} 
            className="w-full h-auto mb-8"
          />
            <div className="flex items-center justify-center mb-8">
  <Briefcase className="h-8 w-8 text-blue-600" />
  <span className="ml-2 text-2xl font-bold">SkillLink</span>
</div>
          
          <h1 className="text-3xl font-bold mb-4">Connect with Skilled Professionals</h1>
          <p className="text-gray-600 text-lg">
            Join our community to find expert service providers or offer your skills to those in need.
          </p>
        </div>
      </div>

      {/* Right Side - Registration Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-16 xl:px-20 bg-white">
        <div className="mx-auto w-full max-w-xl">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Create Your Account</h2>
            <p className="mt-2 text-gray-600">Choose your account type to get started</p>
          </div>

          <Card className="border-none shadow-none">
            <CardContent className="p-0">
              <Tabs defaultValue="customer" className="w-full" onValueChange={setSelectedRole}>
                <TabsList className="grid w-full grid-cols-2 mb-8">
                  <TabsTrigger value="customer" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    Customer
                  </TabsTrigger>
                  <TabsTrigger value="vendor" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    Vendor
                  </TabsTrigger>
                </TabsList>

                {/* Customer Form */}
                <TabsContent value="customer">
                  <form className="space-y-4" onSubmit={handleSubmitForSignup}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="customer-fullName">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            id="customer-fullName"
                            placeholder="Enter your full name"
                            className="pl-10"
                            value={formData.fullName}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="customer-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            id="customer-email"
                            type="email"
                            placeholder="Enter your email"
                            className="pl-10"
                            value={formData.email}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="customer-password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            id="customer-password"
                            type="password"
                            placeholder="Create a password"
                            className="pl-10"
                            value={formData.password}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="customer-phone">Phone Number</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            id="customer-phone"
                            placeholder="Enter your phone number"
                            className="pl-10"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="customer-address">Address</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input 
                          id="customer-address"
                          placeholder="Enter your address"
                          className="pl-10"
                          value={formData.address}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="customer-profile">Profile Picture</Label>
                      <div className="relative">
                        <Upload className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input 
                          id="customer-profile"
                          type="file"
                          className="pl-10"
                          onChange={handleFileChange}
                          required
                          />
                      </div>
                    </div>

                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      Create Customer Account
                    </Button>
                  </form>
                </TabsContent>

                {/* Vendor Form */}
                <TabsContent value="vendor">
                  <form className="space-y-4" onSubmit={handleSubmitForSignup}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="vendor-fullName">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            id="vendor-fullName"
                            placeholder="Enter your full name"
                            className="pl-10"
                            value={formData.fullName}
                          onChange={handleChange}
                          required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="vendor-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            id="vendor-email"
                            type="email"
                            placeholder="Enter your email"
                            className="pl-10"
                            value={formData.email}
                          onChange={handleChange}
                          required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="vendor-password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            id="vendor-password"
                            type="password"
                            placeholder="Create a password"
                            className="pl-10"
                            value={formData.password}
                          onChange={handleChange}
                          required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="vendor-phone">Phone Number</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            id="vendor-phone"
                            placeholder="Enter your phone number"
                            className="pl-10"
                            value={formData.phone}
                          onChange={handleChange}
                          required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="vendor-address">Address</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input 
                          id="vendor-address"
                          placeholder="Enter your address"
                          className="pl-10"
                          value={formData.address}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="vendor-profile">Profile Picture</Label>
                      <div className="relative">
                        <Upload className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input 
                          id="vendor-profile"
                          type="file"
                          className="pl-10"
                          onChange={handleFileChange}
                          required
                        />
                      </div>
                    </div>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      Create Vendor Account
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              <div className="mt-6 text-center text-gray-600">
                Already have an account?{' '}
                <a href="/login" className="text-blue-600 hover:underline font-medium">
                  Sign in
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;