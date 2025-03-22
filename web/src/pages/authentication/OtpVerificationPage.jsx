import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Briefcase, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import forgotp from "../../assets/image/forgotp.png";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const OtpVerificationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { email } = location.state || {}; // Get email from state passed from ForgotPasswordPage
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [otp, setOtp] = useState("");

  useEffect(() => {
    if (!email) {
      navigate("/forgot-password"); // Redirect back to forgot password page if no email passed
    }
  }, [email, navigate]);

  const handleChange = (e) => {
    setOtp(e.target.value);
  };

  const handleSubmitForOtpVerification = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(""); // Reset error message
    try {
        const response = await axios.post("http://localhost:5000/otp", {
        email: email,
        otp: otp
      });
  
      console.log('OTP Verification response:', response.data);
  
      // Check if the backend response is successful
      if (response.data.message === 'OTP validated successfully, you can reset your password') {
        setSuccessMessage("OTP verified successfully! Redirecting to reset password...");
        
        setTimeout(() => {
          navigate("/reset-password", { state: { email } });
        }, 2000); // Redirect after 2 seconds
      } else {
        setError("Invalid OTP. Please try again.");  // In case of an invalid OTP message
      }
    } catch (err) {
      console.error('OTP Verification error:', err);
      setError(err.response?.data?.message || "Error verifying OTP. Please try again.");
    } finally {
      setLoading(false); // Reset loading state
    }
  };
  

  return (
    <div className="min-h-screen bg-gray-50 flex md-3">
      {/* Left Side - Illustration and Welcome */}
      <div className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-center items-center">
        <div className="max-w-lg">
          <img src={forgotp} className="w-full h-auto mb-8" alt="Verify OTP" />
          <div className="flex items-center justify-center mb-8">
            <Briefcase className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-2xl font-bold">SkillLink</span>
          </div>
          <h1 className="text-3xl font-bold mb-4">Verify OTP</h1>
          <p className="text-gray-600 text-lg">
            Enter the OTP sent to your email address to verify your account.
          </p>
        </div>
      </div>

      {/* Right Side - OTP Verification Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-16 xl:px-20 bg-white">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">OTP Verification</h2>
            <p className="mt-2 text-gray-600">Enter the OTP sent to your email to verify and reset your password.</p>
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
              <form className="space-y-4" onSubmit={handleSubmitForOtpVerification}>
                <div className="space-y-2">
                  <Label htmlFor="otp">OTP</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="otp"
                      type="text"
                      placeholder="Enter OTP"
                      className="pl-10"
                      value={otp}
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
                      Verifying OTP...
                    </>
                  ) : (
                    "Verify OTP"
                  )}
                </Button>
              </form>
              <div className="mt-6 text-center text-gray-600">
                Didn't receive OTP?{" "}
                <a href="/forgot-password" className="text-blue-600 hover:underline font-medium">
                  Resend OTP
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OtpVerificationPage;
