import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { User, Briefcase, Mail, Phone, MapPin, Lock, Upload, Eye, EyeOff } from 'lucide-react';
import EmailVerification from '../../components/EmailVerification';
import { toast } from "@/hooks/use-toast";
import axios from "axios";
import LockImage from '@/assets/image/signup.png';

const SignupPage = () => {
  const [selectedRole, setSelectedRole] = useState("customer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showVerification, setShowVerification] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
    const field = id.replace(`${selectedRole}-`, "");
    setFormData({ 
      ...formData, 
      [field]: value 
    });
  };

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) {
      setFormData({ ...formData, profilePicture: e.target.files[0].name });
    }
  };

  const validateForm = () => {
    // Name validation (letters and spaces only)
    if (!/^[A-Za-z\s]+$/.test(formData.fullName)) {
      setError("Name should contain only letters");
      toast({
        title: "Validation Error",
        description: "Name should contain only letters",
        variant: "destructive",
      });
      return false;
    }

    // Password validation
    if (formData.password.length < 7) {
      setError("Password must be at least 7 characters long");
      toast({
        title: "Validation Error",
        description: "Please lengthen this password to 7 characters long",
        variant: "destructive",
      });
      return false;
    }

    // Phone number validation (exactly 10 digits)
    if (!/^\d{10}$/.test(formData.phone)) {
      setError("Phone number must be exactly 10 digits");
      toast({
        title: "Validation Error",
        description: "Phone number must be exactly 10 digits",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmitForSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post("http://localhost:5000/signup", {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        address: formData.address,
        profilePicture: formData.profilePicture,
        role: selectedRole === "customer" ? "user" : "vendor",
      });

      if (response.data.requiresVerification) {
        setUserEmail(formData.email);
        setShowVerification(true);
      }
      
    } catch (err) {
      console.error('Signup error:', err.response?.data || err);
      const errorMessage = err.response?.data?.message || 
                          (Array.isArray(err.response?.data?.errors) ? 
                          err.response.data.errors.join(', ') : 
                          "Registration failed");
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (showVerification) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <EmailVerification 
          email={userEmail}
          onSuccess={() => {
            toast({
              title: "Success",
              description: "Email verified successfully! Redirecting to login page...",
              variant: "default",
            });
            // Add a slight delay before redirecting
            setTimeout(() => {
              window.location.href = "/login";
            }, 2000); // 2 seconds delay
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex md-3">
      {/* Left Side - Illustration and Welcome */}
      <div className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-center items-center">
        <div className="max-w-lg">
          <img src={LockImage} className="w-full h-auto mb-8" alt="Welcome" />
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
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">
                  {error}
                </div>
              )}

              <Tabs defaultValue="customer" className="w-full" onValueChange={setSelectedRole}>
                <TabsList className="grid w-full grid-cols-2 mb-8">
                  <TabsTrigger value="customer" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    Customer
                  </TabsTrigger>
                  <TabsTrigger value="vendor" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    Vendor
                  </TabsTrigger>
                </TabsList>

                {/* Common form for both Customer and Vendor */}
                {["customer", "vendor"].map((role) => (
                  <TabsContent key={role} value={role}>
                    <form className="space-y-4" onSubmit={handleSubmitForSignup}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`${role}-fullName`}>Full Name*</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input 
                              id={`${role}-fullName`}
                              placeholder="Enter your full name"
                              className="pl-10"
                              value={formData.fullName}
                              onChange={handleChange}
                              pattern="[A-Za-z\s]+"
                              title="Enter Letters Only"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`${role}-email`}>Email*</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input 
                              id={`${role}-email`}
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
                          <Label htmlFor={`${role}-password`}>Password*</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input 
                              id={`${role}-password`}
                              type={showPassword ? "text" : "password"}
                              placeholder="Create a password(Min 7 char)"
                              className="pl-10 pr-10"
                              value={formData.password}
                              onChange={handleChange}
                              required
                              minLength={7}
                            />
                            <button 
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`${role}-phone`}>Phone Number*</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input 
                              id={`${role}-phone`}
                              placeholder="Enter 10 digit phone number"
                              className="pl-10"
                              value={formData.phone}
                              onChange={handleChange}
                              pattern="\d{10}"
                              title="Please enter exactly 10 digits"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`${role}-address`}>Address*</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            id={`${role}-address`}
                            placeholder="Enter your address"
                            className="pl-10"
                            value={formData.address}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`${role}-profile`}>Profile Picture*</Label>
                        <div className="relative">
                          <Upload className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input 
                            id={`${role}-profile`}
                            type="file"
                            className="pl-10"
                            onChange={handleFileChange}
                            accept="image/*"
                            required
                          />
                        </div>
                      </div>

                      <Button 
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        disabled={loading}
                      >
                        Sign up
                      </Button>
                    </form>
                  </TabsContent>
                ))}
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