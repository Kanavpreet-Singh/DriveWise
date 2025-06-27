import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaHeart, FaRegHeart, FaTrash } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';

const CarCard = ({ name, brand, price, image, _id, listedby }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const backend_url = import.meta.env.VITE_BACKEND_URL;

  const [liked, setLiked] = useState(false);

  const fetchUserAndCheckLiked = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await axios.get(`${backend_url}/user/getuser`, {
        headers: { token },
      });

      const updatedUser = res.data.user;
      setLiked(
        updatedUser?.likedlist?.some(car => car._id.toString() === _id)
      );
    } catch (error) {
      console.error("Failed to fetch user:", error);
    }
  };

  useEffect(() => {
    fetchUserAndCheckLiked();
  }, [_id]);

  const toggleLike = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      if (liked) {
        await axios.delete(`${backend_url}/car/unlike/${_id}`, {
          headers: { token },
        });
        toast.info('Removed from wishlist!');
      } else {
        await axios.post(`${backend_url}/car/like/${_id}`, {}, {
          headers: { token },
        });
        toast.success('Added to wishlist!');
      }

      fetchUserAndCheckLiked();
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm('Are you sure you want to delete this listing?');
    if (!confirmed) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${backend_url}/car/${_id}`, {
        headers: { token },
      });
      toast.success('Car deleted successfully!');
      window.location.reload(); 
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete the car.');
    }
  };

  const formatAmount = (amount) => {
    if (amount >= 10000000) {
      return (amount / 10000000).toFixed(2);
    } else {
      return (amount / 100000).toFixed(2);
    }
  };

  const getPriceUnit = (amount) => {
    return amount >= 10000000 ? 'Cr' : 'Lakh';
  };

  return (
    <div className="bg-white relative rounded-lg overflow-hidden shadow-md border border-[#E5E5E5] transition-transform  w-full max-w-sm mx-auto">
      {user && (
        <button
          className="absolute top-3 right-3 text-xl text-gray-600 hover:text-red-600 transition-colors"
          onClick={toggleLike}
        >
          {liked ? <FaHeart className="text-red-500" /> : <FaRegHeart />}
        </button>
      )}

      <img
        src={Array.isArray(image) ? image[0] : image}
        alt={`${name} image`}
        className="w-full h-48 object-cover"
      />

      <div className="p-4 space-y-2">
        <h2 className="text-[#14213D] font-semibold text-lg">{name}</h2>
        <p className="text-[#14213D] text-sm">
          ₹{formatAmount(price)} {getPriceUnit(price)}
        </p>

        <div className="flex gap-4">
          <button
            className="w-1/3 text-[#FCA311] border border-[#FCA311] py-2 rounded transition duration-200 ease-in-out hover:bg-[#FCA311] hover:text-[#14213D]"
            onClick={() => navigate(`/catalogue/${_id}`)}
          >
            View Offers
          </button>

          {user?.userId === listedby && (
            <>
              <button
                className="px-4 text-[#FCA311] border border-[#FCA311] py-2 rounded transition duration-200 ease-in-out hover:bg-[#FCA311] hover:text-[#14213D]"
                onClick={() => navigate(`/edit/${_id}`)}
              >
                Edit
              </button>
              <button
                className="w-1/3 text-red-500 font-semibold py-2 rounded hover:text-red-800"
                onClick={handleDelete}
                title="Delete Listing"
              >
                <FaTrash />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CarCard;
