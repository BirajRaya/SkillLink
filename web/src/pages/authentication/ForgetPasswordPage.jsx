import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Briefcase, Loader2 } from "lucide-react";
import forgotp from "../../assets/image/forgotp.png";
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
 

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e) => {
    setEmail(e.target.value);
  };

  const handleSubmitForForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");
  
    try {
      const response = await axios.post("http://localhost:5000/forgot-password", {
        email: email
      });
  
      console.log('Forgot Password response:', response.data);
  
      // Ensure the response is successful
      if (response.status === 200) {
        setSuccessMessage("OTP has been sent successfully to your Email.");
        
        // Delay navigation to allow user to see the success message
        setTimeout(() => {
          navigate("/verify-otp", { state: { email } });
        }, 2000); // Redirect after 2 seconds
      } else {
        setError(response.data.message || "Failed to send OTP.");
      }
  
    } catch (err) {
      console.error('Forgot Password error:', err);
      setError(err.response?.data?.message || "Error sending OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="min-h-screen bg-gray-50 flex md-3">
      {/* Left Side - Illustration and Welcome */}
      <div className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-center items-center">
        <div className="max-w-lg">
          <img src={forgotp} className="w-full h-auto mb-8" alt="Welcome" />
          <div className="flex items-center justify-center mb-8">
            <Briefcase className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-2xl font-bold">SkillLink</span>
          </div>
          <h1 className="text-3xl font-bold mb-4">Forgot Password?</h1>
          <p className="text-gray-600 text-lg">
            Enter your email address to receive a password reset link.
          </p>
        </div>
      </div>

      {/* Right Side - Forgot Password Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-16 xl:px-20 bg-white">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Forgot Password</h2>
            <p className="mt-2 text-gray-600">Enter your email to receive an OTP for password reset.</p>
            {error && (
              <div className="mt-4 bg-red-50 text-red-600 p-3 rounded-md text-sm">
                {error}
              </div>
            )}
            {successMessage && (
                 <div className="mt-4 bg-green-50 text-green-600 p-3 rounded-md text-sm">
                    {successMessage}
                </div>
            )}
          </div>

          <Card className="border-none shadow-none">
            <CardContent className="p-0">
              <form className="space-y-4" onSubmit={handleSubmitForForgotPassword}>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10"
                      value={email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    "Send OTP"
                  )}
                </Button>
              </form>
              <div className="mt-6 text-center text-gray-600">
                Remember your password?{" "}
                <a href="/login" className="text-blue-600 hover:underline font-medium">
                  Sign In
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
