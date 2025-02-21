import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const EmailVerification = ({ email, onSuccess }) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();

  // Check verification status on mount
  useEffect(() => {
    const checkVerification = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/check-verification/${email}`);
        if (response.data.isVerified) {
          navigate('/login');
        }
      } catch (err) {
        console.error('Error checking verification status:', err);
      }
    };
    checkVerification();
  }, [email, navigate]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      console.log('Attempting verification:', { email, code });
      
      const response = await axios.post("http://localhost:5000/verify-email", {
        email,
        code: code.trim()
      });

      console.log('Verification response:', response.data);

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        setError("✅ Verification successful! Redirecting to login...");
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      }
      
    } catch (err) {
      console.error('Verification error:', err.response?.data || err);
      setError(
        err.response?.data?.message || 
        "Verification failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError("");

    try {
      const response = await axios.post("http://localhost:5000/resend-verification", {
        email
      });

      setCode("");
      setError("✉️ New verification code sent to your email");
    } catch (err) {
      setError(
        err.response?.data?.message || 
        "Failed to resend code. Please try again."
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold text-center mb-4">Verify Your Email</h2>
          <p className="text-gray-600 text-center mb-6">
            Please enter the verification code sent to<br />
            <strong className="text-blue-600">{email}</strong>
          </p>

          <form onSubmit={handleVerify} className="space-y-4">
            <Input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter 6-digit code"
              className="text-center text-2xl py-6 tracking-widest"
              maxLength={6}
              autoFocus
              required
            />

            {error && (
              <p className={`text-sm text-center ${
                error.includes("successful") || error.includes("✅") 
                  ? "text-green-600" 
                  : error.includes("sent") || error.includes("✉️")
                    ? "text-blue-600"
                    : "text-red-500"
              } bg-opacity-10 p-3 rounded`}>
                {error}
              </p>
            )}

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading || resending || code.length !== 6}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Email"
              )}
            </Button>

            <div className="text-center mt-4">
              <Button
                type="button"
                variant="link"
                onClick={handleResend}
                disabled={loading || resending}
                className="text-sm text-blue-600"
              >
                {resending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Resend Code"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailVerification;