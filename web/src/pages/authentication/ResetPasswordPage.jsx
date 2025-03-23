import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {Lock, Briefcase, Loader2, Eye, EyeOff } from "lucide-react";
import forgotp from "../../assets/image/forgotp.png";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { email } = location.state || {};
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState(""); // State for success message
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (!email) {
      navigate("/forgot-password"); // Redirect if no email in state
    }
  }, [email, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(""); // Reset previous errors
    setSuccessMessage(""); // Reset success message

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // Validate password strength
    if (formData.password.length < 7) {
      setError("Password must be at least 7 characters long");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/reset-password", {
        email,
        newPassword: formData.password,
      });

      if (response.data.message === "Password updated successfully") {
        setSuccessMessage("Password updated successfully! Redirecting to sign-in...");
        setTimeout(() => {
          navigate("/login"); // Redirect to signin page after success message
        }, 2000); // Redirect after 2 seconds delay
      }
    } catch (err) {
      console.error("Reset password error:", err);
      setError(
        err.response?.data?.message || "Error resetting password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Side - Illustration and Welcome */}
      <div className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-center items-center">
        <div className="max-w-lg">
          <img src={forgotp} className="w-full h-auto mb-8" alt="Welcome" />
          <div className="flex items-center justify-center mb-8">
            <Briefcase className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-2xl font-bold">SkillLink</span>
          </div>
          <h1 className="text-3xl font-bold mb-4">Reset Your Password</h1>
          <p className="text-gray-600 text-lg">
            Choose a strong password to protect your account.
          </p>
        </div>
      </div>

      {/* Right Side - Reset Password Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-16 xl:px-20 bg-white">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
            <p className="mt-2 text-gray-600">
              Enter your new password below.
            </p>

            {/* Show success message after successful password reset */}
            {successMessage && (
              <div className="mt-4 bg-green-50 text-green-600 p-3 rounded-md text-sm">
                {successMessage}
              </div>
            )}

            {/* Show error message */}
            {error && (
              <div className="mt-4 bg-red-50 text-red-600 p-3 rounded-md text-sm">
                {error}
              </div>
            )}
          </div>

          <Card className="border-none shadow-none">
            <CardContent className="p-0">
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      className="pl-10 pr-10"
                      value={formData.password}
                      onChange={handleChange}
                      required
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
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      className="pl-10 pr-10"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting Password...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;