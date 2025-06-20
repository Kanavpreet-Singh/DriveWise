import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const CarDetails = () => {
  const { carId } = useParams();
  const [car, setCar] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const commentRef = useRef();

  const fetchCar = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/car/${carId}`);
      setCar(res.data.car);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchComments = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/car/comment/${carId}`, {
        headers: { token }
      });
      setComments(res.data.comments);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    }
  };

  useEffect(() => {
    fetchCar();
    fetchComments();
  }, [carId]);

  const handleCommentSubmit = async () => {
    const comment = commentRef.current.value.trim();
    if (!comment) {
      toast.warn('Please enter a comment before submitting.');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/car/comment/${carId}`,
        { comment },
        {
          headers: { token }
        }
      );

      commentRef.current.value = '';
      toast.success('Comment submitted successfully!');
      fetchComments(); // ✅ refresh comments
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast.error('Failed to submit comment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!car) return <p>Loading car details...</p>;

  return (
    <div className="flex justify-center items-start min-h-screen bg-gray-50 py-10">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{car.name}</h1>
          <p className="text-lg text-yellow mb-6">{car.brand}</p>

          <div className="flex justify-center mb-6">
            <img
              src={car.image}
              className="w-full max-w-md rounded-lg shadow-sm border border-gray-200"
              alt={car.name}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-semibold text-gray-700">Price Range:</p>
              <p className="text-lg font-bold text-yellow">₹{car.minprice} - ₹{car.maxprice} Lakh</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-semibold text-gray-700">Fuel Type:</p>
              <p className="text-gray-800">{car.fuelType}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-semibold text-gray-700">Transmission:</p>
              <p className="text-gray-800">{car.transmission}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-semibold text-gray-700">Seating Capacity:</p>
              <p className="text-gray-800">{car.seats} seats</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-semibold text-gray-700">Manufacturing Year:</p>
              <p className="text-gray-800">{car.year}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-semibold text-gray-700">Vehicle Category:</p>
              <p className="text-gray-800">{car.category}</p>
            </div>
          </div>

          <button className="bg-yellow hover:bg-blue text-white font-bold py-3 px-6 rounded-lg transition duration-200">
            View Dealerships
          </button>

          {user?.role === 'customer' && (
            <div className="space-y-2 mt-6 text-left">
              <h3 className="text-lg font-semibold text-[#14213D]">Leave a Comment</h3>
              <textarea
                ref={commentRef}
                placeholder="Write your comment..."
                className="w-full border border-gray-300 rounded-md p-2 resize-none"
                rows="3"
              ></textarea>
              <button
                onClick={handleCommentSubmit}
                className="bg-yellow text-white font-semibold px-4 py-2 rounded hover:bg-blue transition duration-200 disabled:opacity-60"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Comment'}
              </button>
            </div>
          )}

          <div className="mt-10 text-left">
  <h3 className="text-xl font-semibold text-[#14213D] mb-4">Comments</h3>

  {comments.length === 0 ? (
    <p className="text-gray-500">No comments yet.</p>
  ) : (
    <div className="space-y-4">
      {comments.map((comment, index) => (
        <div
          key={index}
          className="flex items-start bg-gray-100 p-4 rounded-lg shadow-sm"
        >
          <img
            src={
              comment.user?.profilePic ||
              "https://res.cloudinary.com/decprn8rm/image/upload/v1750436169/Screenshot_2025-06-20_214548_lwtrzl.png"
            }
            alt="User profile"
            className="w-10 h-10 rounded-full mr-4 object-cover border border-gray-300"
          />
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-1">
              {comment.user?.username || "Anonymous"}
            </p>
            <p className="text-gray-700 text-sm">{comment.text}</p>
          </div>
        </div>
      ))}
    </div>
  )}
</div>

        </div>
      </div>
    </div>
  );
};

export default CarDetails;
