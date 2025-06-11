import React, { useState } from 'react';
const backend_url=import.meta.env.BE_URL
const Signup = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    console.log('Signup data:', formData);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#E5E5E5] p-5">
      <div className="bg-white rounded-lg shadow-md p-10 w-full max-w-md">
        <h2 className="text-[#14213D] text-2xl font-bold text-center mb-8">Create Account</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="username" className="block text-[#14213D] text-sm font-medium">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded border border-[#E5E5E5] focus:outline-none focus:ring-2 focus:ring-[#FCA311]"
              required
            />
          </div>
          
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
            className="w-full bg-[#FCA311] text-black py-3 px-4 rounded font-semibold hover:bg-[#e59400] transition-colors mt-4"
          >
            Sign Up
          </button>
        </form>
        
        <p className="text-[#14213D] text-sm text-center mt-6">
          Already have an account?{' '}
          <a href="/login" className="text-[#FCA311] font-semibold hover:underline">
            Log in
          </a>
        </p>
      </div>
    </div>
  );
};

export default Signup;