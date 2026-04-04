import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate, useSearchParams } from 'react-router-dom';

const backend_url = import.meta.env.VITE_BACKEND_URL;

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !token) {
      toast.error('Reset session is missing. Please start again.');
      navigate('/forgot-password');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(`${backend_url}/user/reset-password`, {
        email,
        resetToken: token,
        password: formData.password,
      });

      toast.success(response.data.message);
      navigate('/signin');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#E5E5E5] p-5">
      <div className="bg-white rounded-lg shadow-md p-10 w-full max-w-md">
        <h2 className="text-[#14213D] text-2xl font-bold text-center mb-8">Set New Password</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="password" className="block text-[#14213D] text-sm font-medium">New Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded border border-[#E5E5E5] focus:outline-none focus:ring-2 focus:ring-[#FCA311]"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="block text-[#14213D] text-sm font-medium">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
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
            {isLoading ? 'Saving Password...' : 'Set New Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
