import React, { useState } from 'react';
import axios from "axios";
import { toast } from 'react-toastify';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const backend_url = import.meta.env.VITE_BACKEND_URL;

const Signup = () => {
  const [otp, setOtp] = useState('');
  const [showOtpField, setShowOtpField] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [useProfilePic, setUseProfilePic] = useState(false);
  const [profileMethod, setProfileMethod] = useState('url'); // 'url' or 'file'
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    profilePic: ''
  });

  const [isRegistered, setIsRegistered] = useState(false);
  const [tempUser, setTempUser] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const uploadToCloudinary = async () => {
    setUploading(true);
    const data = new FormData();
    data.append("file", imageFile);
    data.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
      method: 'POST',
      body: data,
    });
    const json = await res.json();
    setUploading(false);
    return json.secure_url;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOtpChange = (e) => {
    setOtp(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let profilePicUrl;
      if (useProfilePic) {
        if (profileMethod === 'file') {
          if (!imageFile) {
            toast.error('Please choose an image file or turn off profile picture.');
            setIsLoading(false);
            return;
          }
          profilePicUrl = await uploadToCloudinary();
        } else if (formData.profilePic.trim()) {
          profilePicUrl = formData.profilePic.trim();
        } else {
          toast.error('Please enter an image URL or turn off profile picture.');
          setIsLoading(false);
          return;
        }
      }

      const { username, email, password } = formData;
      const payload = { username, email, password };
      if (profilePicUrl) {
        payload.profilePic = profilePicUrl;
      }

      const response = await axios.post(`${backend_url}/user/signup-request`, payload);
      toast.success(response.data.message);
      setShowOtpField(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Signup request failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await axios.post(`${backend_url}/user/signup-verify`, {
        email: formData.email,
        otp
      });
      if (response.status === 201) {
        setTempUser(response.data.user);
        setIsRegistered(true);
      } else {
        navigate('/signin', { state: { from: location.state?.from } });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'OTP verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#E5E5E5] p-5">
      <div className="bg-white rounded-lg shadow-md p-10 w-full max-w-md">
        {isRegistered ? (
          <div className="text-center space-y-6 py-4">
            <div className="flex justify-center">
              <div className="bg-green-100 p-4 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-[#14213D] text-2xl font-bold">Registration Successful!</h2>
            <p className="text-gray-600">
              Welcome to DriveWise! Your account has been verified. Would you like to sign in automatically to continue?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  login(tempUser);
                  const destination = location.state?.from || '/';
                  navigate(destination);
                }}
                className="w-full bg-[#FCA311] text-black py-3 px-4 rounded font-semibold hover:bg-[#e59400] transition-colors"
              >
                Yes, Sign Me In
              </button>
              <button
                onClick={() => navigate('/signin', { state: { from: location.state?.from } })}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded font-semibold hover:bg-gray-200 transition-colors"
              >
                No, Go to Login Page
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-[#14213D] text-2xl font-bold text-center mb-8">
              {showOtpField ? 'Verify Your Email' : 'Create Account'}
            </h2>
            
            {!showOtpField ? (
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

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[#14213D] text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={useProfilePic}
                      onChange={(e) => {
                        setUseProfilePic(e.target.checked);
                        if (!e.target.checked) {
                          setProfileMethod('url');
                          setImageFile(null);
                          setFormData(prev => ({ ...prev, profilePic: '' }));
                        }
                      }}
                    />
                    Add profile picture (optional)
                  </label>

                  {useProfilePic && (
                    <>
                      <select
                        value={profileMethod}
                        onChange={(e) => setProfileMethod(e.target.value)}
                        className="w-full border px-3 py-2 rounded"
                      >
                        <option value="url">Enter Image URL</option>
                        <option value="file">Upload Image File</option>
                      </select>

                      {profileMethod === 'url' ? (
                        <input
                          type="text"
                          name="profilePic"
                          placeholder="Paste image URL"
                          value={formData.profilePic}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded border border-[#E5E5E5]"
                        />
                      ) : (
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setImageFile(e.target.files[0] || null)}
                          className="w-full px-4 py-3 rounded border border-[#E5E5E5]"
                        />
                      )}

                      {uploading && <p className="text-sm text-gray-500">Uploading image...</p>}
                    </>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#FCA311] text-black py-3 px-4 rounded font-semibold hover:bg-[#e59400] transition-colors mt-4 disabled:opacity-70"
                >
                  {isLoading ? 'Sending OTP...' : 'Sign Up'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="otp" className="block text-[#14213D] text-sm font-medium">Enter OTP</label>
                  <input
                    type="number"
                    id="otp"
                    name="otp"
                    value={otp}
                    onChange={handleOtpChange}
                    className="w-full px-4 py-3 rounded border border-[#E5E5E5] focus:outline-none focus:ring-2 focus:ring-[#FCA311]"
                    required
                    autoFocus
                  />
                  <p className="text-sm text-[#14213D]">We've sent an OTP to {formData.email}</p>
                  <p className="text-xs text-gray-500 italic">
                    If you didn't request this, you can safely ignore the message.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#FCA311] text-black py-3 px-4 rounded font-semibold hover:bg-[#e59400] transition-colors mt-4 disabled:opacity-70"
                >
                  {isLoading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </form>
            )}

            <p className="text-[#14213D] text-sm text-center mt-6">
              Already have an account?{' '}
              <Link 
                to="/signin" 
                state={{ from: location.state?.from }}
                className="text-[#FCA311] font-semibold hover:underline"
              >
                Log in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Signup;