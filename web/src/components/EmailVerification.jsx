import { useState, useRef } from 'react';
import axios from 'axios';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EmailVerification = ({ email }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']); // 6 digits OTP
  const inputRefs = useRef([]);
  const navigate = useNavigate();

  // Handle OTP input change
  const handleOtpChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next input if value is entered
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  // Handle paste functionality
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    // Check if pasted content contains only numbers
    if (!/^\d+$/.test(pastedData)) return;

    const digits = pastedData.slice(0, 6).split('');
    const newOtp = [...otp];
    
    digits.forEach((digit, index) => {
      if (index < 6) newOtp[index] = digit;
    });

    setOtp(newOtp);

    // Focus the next empty input or the last input if all are filled
    const nextEmptyIndex = newOtp.findIndex(digit => !digit);
    if (nextEmptyIndex !== -1) {
      inputRefs.current[nextEmptyIndex].focus();
    } else if (digits.length > 0) {
      inputRefs.current[5].focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const verificationCode = otp.join('');
    
    try {
      const response = await axios.post('http://localhost:5000/verify-email', {
        email,
        code: verificationCode
      });

      if (response.status === 200) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Verification failed');
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0].focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/resend-verification', {
        email
      });

      if (response.status === 200) {
        setError(''); // Clear any existing errors
        // Clear existing OTP
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0].focus();
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to resend code');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <Card className="w-[400px]">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="bg-blue-100 p-3 rounded-full">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-center">Verify your email</h2>
          <p className="text-gray-600 text-center">
            We've sent a verification code to<br />
            <span className="font-medium text-gray-900">{email}</span>
          </p>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm w-full">
              {error}
            </div>
          )}

          <form onSubmit={handleVerifyEmail} className="w-full space-y-4">
            <div className="flex justify-center gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-12 h-12 text-center text-lg border rounded-md focus:outline-none focus:border-blue-500"
                  required
                />
              ))}
            </div>

            {success && (
              <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm text-center">
                Email verified successfully! Redirecting to login page...
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading || success || otp.some(digit => !digit)}
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </Button>
          </form>

          <div className="text-sm text-center">
            <span className="text-gray-600">Didn't receive the code? </span>
            <button
              onClick={handleResendCode}
              disabled={resendLoading || success}
              className="text-blue-600 hover:underline font-medium disabled:opacity-50"
            >
              {resendLoading ? 'Sending...' : 'Resend'}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailVerification;