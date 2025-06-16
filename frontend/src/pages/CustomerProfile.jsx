import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const CustomerProfile = () => {
  const navigate = useNavigate();
  const backend_url = import.meta.env.VITE_BACKEND_URL;
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');

        if (!token) {
          toast.error("Please login to access this page.");
          navigate('/signin');
          return;
        }

        const res = await axios.get(`${backend_url}/user/getuser`, {
          headers: { token }
        });

        setUser(res.data.user);
      } catch (error) {
        console.error(error);
        toast.error("Failed to fetch user profile.");
      }
    };

    fetchUser();
  }, []);

  if (!user) return <p className="text-center text-gray-600">Loading...</p>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-[#14213D] mb-4">Customer Profile</h1>
      <div className="bg-[#E5E5E5] p-4 rounded-lg shadow">
        <p><strong>Username:</strong> {user.username}</p>
        <p><strong>Email:</strong> {user.email}</p>
      </div>

      <h2 className="text-2xl mt-10 mb-4 font-semibold text-[#14213D]">Your Wishlist</h2>

      {user.likedlist && user.likedlist.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="py-2 px-4">Car Name</th>
                <th className="py-2 px-4">Brand</th>
                <th className="py-2 px-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {user.likedlist.map((car) => (
                <tr key={car._id} className="border-t">
                  <td className="py-2 px-4">{car.name}</td>
                  <td className="py-2 px-4">{car.brand}</td>
                  <td className="py-2 px-4">
                    <button
                      onClick={() => navigate(`/catalogue/${car._id}`)}
                      className="bg-[#FCA311] text-white px-3 py-1 rounded hover:bg-[#e59400] transition"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-600">You haven't liked any cars yet.</p>
      )}
    </div>
  );
};

export default CustomerProfile;
