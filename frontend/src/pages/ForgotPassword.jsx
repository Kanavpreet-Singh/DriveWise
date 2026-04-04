import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const backend_url = import.meta.env.VITE_BACKEND_URL;

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('email');
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [formData, setFormData] = useState({
    email: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.post(`${backend_url}/user/forgot-password-request`, {
        email: formData.email,
      });

      toast.success(response.data.message);
      setStep('otp');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.post(`${backend_url}/user/forgot-password-verify`, {
        email: formData.email,
        otp,
      });

      toast.success(response.data.message);
      navigate(`/reset-password?email=${encodeURIComponent(formData.email)}&token=${encodeURIComponent(response.data.resetToken)}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'OTP verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#E5E5E5] p-5">
      <div className="bg-white rounded-lg shadow-md p-10 w-full max-w-md">
        <h2 className="text-[#14213D] text-2xl font-bold text-center mb-8">Forgot Password</h2>

        {step === 'email' ? (
          <form onSubmit={handleRequestOtp} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-[#14213D] text-sm font-medium">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded border border-[#E5E5E5] focus:outline-none focus:ring-2 focus:ring-[#FCA311]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#FCA311] text-black py-3 px-4 rounded font-semibold hover:bg-[#e59400] transition-colors mt-4 disabled:opacity-70"
            >
              {isLoading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="otp" className="block text-[#14213D] text-sm font-medium">Enter OTP</label>
              <input
                type="text"
                id="otp"
                name="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-4 py-3 rounded border border-[#E5E5E5] focus:outline-none focus:ring-2 focus:ring-[#FCA311]"
                required
                maxLength={6}
              />
              <p className="text-sm text-[#14213D]">We sent an OTP to {formData.email}</p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#FCA311] text-black py-3 px-4 rounded font-semibold hover:bg-[#e59400] transition-colors mt-4 disabled:opacity-70"
            >
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <button
              type="button"
              onClick={() => setStep('email')}
              className="w-full text-[#14213D] text-sm hover:underline"
            >
              Change email
            </button>
          </form>
        )}

        <p className="text-[#14213D] text-sm text-center mt-6">
          Remembered your password?{' '}
          <a href="/signin" className="text-[#FCA311] font-semibold hover:underline">
            Back to sign in
          </a>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
