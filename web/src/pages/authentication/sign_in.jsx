import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Briefcase, Loader2 , Eye, EyeOff } from "lucide-react";
import LockImage from "../../assets/image/signup.png";
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const SigninPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  const handleSubmitForSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post("http://localhost:5000/signin", {
        email: formData.email,
        password: formData.password
      });

      console.log('Login response:', response.data);

      if (response.data.token) {
        // Save token in localStorage
        localStorage.setItem('token', response.data.token);

        // Decode the token to get user role
        const decodedToken = jwtDecode(response.data.token);
        const userRole = decodedToken.role; // Assuming role is in the token

        // Redirect based on user role
        if (userRole === "admin") {
          navigate('/admin-dashboard');
        } else if (userRole === "vendor") {
          navigate('/vendor-dashboard');
        } else {
          navigate('/user-dashboard');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-3xl font-bold mb-4">Welcome Back!</h1>
          <p className="text-gray-600 text-lg">
            Sign in to access your account and manage your services seamlessly.
          </p>
        </div>
      </div>

      {/* Right Side - Sign In Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-16 xl:px-20 bg-white">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Sign In</h2>
            <p className="mt-2 text-gray-600">Enter your credentials to continue</p>
            {error && (
              <div className="mt-4 bg-red-50 text-red-600 p-3 rounded-md text-sm">
                {error}
              </div>
            )}
          </div>

          <Card className="border-none shadow-none">
            <CardContent className="p-0">
              <form className="space-y-4" onSubmit={handleSubmitForSignIn}>
                <div className="space-y-2">
                  <Label htmlFor="email">Email*</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="Enter your email" 
                      className="pl-10"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password*</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input 
                      id="password" 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Enter your password" 
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

                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
              <div className="mt-6 text-center text-gray-600">
                Don&apos;t have an account?{" "}
                <a href="/register" className="text-blue-600 hover:underline font-medium">
                  Sign up
                </a>
              </div>
              <div className="mt-2 text-center text-gray-600">
                <a 
                  href="/forgot-password" 
                  className="text-blue-600 hover:underline font-medium"
                >
                  Forgot Password?
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SigninPage;
