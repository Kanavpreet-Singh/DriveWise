import React, { useState } from 'react';
import axios from "axios";
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const backend_url = import.meta.env.VITE_BACKEND_URL;

const Signin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const navigate = useNavigate();

  const {login}=useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { email, password } = formData;
      const response = await axios.post(`${backend_url}/user/signin`, {
        email, password
      });
      
      
      login(response.data.token);
      
      toast.success('Login successful!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#E5E5E5] p-5">
      <div className="bg-white rounded-lg shadow-md p-10 w-full max-w-md">
        <h2 className="text-[#14213D] text-2xl font-bold text-center mb-8">Sign In</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
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
          
          <div className="space-y-2">
            <label htmlFor="password" className="block text-[#14213D] text-sm font-medium">Password</label>
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
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#FCA311] text-black py-3 px-4 rounded font-semibold hover:bg-[#e59400] transition-colors mt-4 disabled:opacity-70"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        
        <p className="text-[#14213D] text-sm text-center mt-6">
          Don't have an account?{' '}
          <a href="/signup" className="text-[#FCA311] font-semibold hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
};

export default Signin;