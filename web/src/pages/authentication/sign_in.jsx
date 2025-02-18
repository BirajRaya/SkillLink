import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Briefcase } from "lucide-react";
import LockImage from "../../assets/image/signup.png";

const SigninPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex md-3">
      {/* Left Side - Illustration and Welcome */}
      <div className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-center items-center">
        <div className="max-w-lg">
          <img src={LockImage} className="w-full h-auto mb-8" />
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
          </div>

          <Card className="border-none shadow-none">
            <CardContent className="p-0">
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input id="email" type="email" placeholder="Enter your email" className="pl-10" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input id="password" type="password" placeholder="Enter your password" className="pl-10" />
                  </div>
                </div>

                <Button className="w-full bg-blue-600 hover:bg-blue-700">Sign In</Button>
              </form>
              <div className="mt-6 text-center text-gray-600">
                Don&apos;t have an account? {" "}
                <a href="/register" className="text-blue-600 hover:underline font-medium">
                  Sign up
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