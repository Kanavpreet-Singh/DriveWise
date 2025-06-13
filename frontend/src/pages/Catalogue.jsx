import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import CarCard from '../components/CarCard';

const Catalogue = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cars, setCars] = useState([]);

  useEffect(() => {
    const fetchCars = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/car/allcars`);
        setCars(res.data.cars);
      } catch (err) {
        console.error('Error fetching cars:', err);
      }
    };

    fetchCars();
  }, []);

  return (
    <div className="px-6 py-4">
      {user?.role === 'dealer' && (
        <div className="mb-6">
          <button
            onClick={() => navigate('/addcar')}
            className="bg-[var(--color-yellow)] text-white px-4 py-2 rounded-md shadow-[0_2px_4px_var(--color-gray)]"
          >
            Add Listing
          </button>
        </div>
      )}

      <h2 className="text-2xl font-bold mb-4 text-[#14213D]">All Cars</h2>

      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {cars.map((car) => (
          <CarCard
            key={car._id}
            name={car.name}
            brand={car.brand}
            minprice={car.minprice}
            maxprice={car.maxprice}
            image={car.image}
            _id={car._id}
          />
        ))}
      </div>
    </div>
  );
};

export default Catalogue;
