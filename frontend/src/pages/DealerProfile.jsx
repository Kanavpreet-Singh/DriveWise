import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const DealerProfile = () => {
  const backend_url = import.meta.env.VITE_BACKEND_URL;
  const [user, setUser] = useState(null);
  const [cars, setCars] = useState([]);

  useEffect(() => {
    const fetchDealerInfo = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${backend_url}/user/dealer`, {
          headers: { token }
        });

        setUser(res.data.dealer);
        setCars(res.data.cars);
      } catch (error) {
        console.error(error);
      }
    };

    fetchDealerInfo();
  }, []);

  if (!user) return <p className="text-center text-gray-600">Loading...</p>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-[#14213D] mb-4">Dealer Profile</h1>
      <div className="bg-[#E5E5E5] p-4 rounded-lg shadow">
        <p><strong>Username:</strong> {user.username}</p>
        <p><strong>Email:</strong> {user.email}</p>
      </div>

      <h2 className="text-2xl mt-8 mb-4 font-semibold text-[#14213D]">Your Listed Cars</h2>

      {cars.length === 0 ? (
        <p className="text-gray-600">No cars listed yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {cars.map((car) => (
            <div
              key={car._id}
              className="bg-white border border-[#E5E5E5] rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105"
            >
              <img
                src={car.image}
                alt={car.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-4 space-y-2">
                <h3 className="text-lg font-semibold text-[#14213D]">{car.name}</h3>
                <p className="text-sm text-[#14213D]">{car.brand}</p>
                <p className="text-sm text-[#14213D]">₹{car.minprice} - ₹{car.maxprice} Lakh</p>
                <p className="text-xs text-gray-600">
                  {car.fuelType} | {car.transmission} | {car.year} | {car.seats} seats
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DealerProfile;
