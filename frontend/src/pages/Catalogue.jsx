import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import CarCard from '../components/CarCard';

const Catalogue = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cars, setCars] = useState([]);
  const [filters, setFilters] = useState({
    brand: '',
    fuelType: '',
    transmission: '',
    seats: '',
    category: '',
  });
  const [filtersApplied, setFiltersApplied] = useState(false);

  const backend_url = import.meta.env.VITE_BACKEND_URL;

  const fetchCars = async () => {
    try {
      const res = await axios.get(`${backend_url}/car/allcars`);
      setCars(res.data.cars);
    } catch (err) {
      console.error('Error fetching cars:', err);
    }
  };

  useEffect(() => {
    fetchCars();
  }, []);

  const handleApplyFilters = async () => {
    try {
      const res = await axios.get(`${backend_url}/car/allcars`);
      const filtered = res.data.cars.filter((car) => {
        return (
          (filters.brand ? car.brand === filters.brand : true) &&
          (filters.fuelType ? car.fuelType === filters.fuelType : true) &&
          (filters.transmission ? car.transmission === filters.transmission : true) &&
          (filters.seats ? car.seats === parseInt(filters.seats) : true) &&
          (filters.category ? car.category === filters.category : true)
        );
      });
      setCars(filtered);
      setFiltersApplied(true);
    } catch (err) {
      console.error('Error filtering cars:', err);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      brand: '',
      fuelType: '',
      transmission: '',
      seats: '',
      category: '',
    });
    fetchCars();
    setFiltersApplied(false);
  };

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

          {/* Filter Section */}
    <div className="bg-white shadow-lg rounded-xl p-6 mb-8 border border-gray-200">
      <h3 className="text-2xl font-bold text-[#14213D] mb-6">Filter Cars</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Brand */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
          <select
            value={filters.brand}
            onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#FCA311] transition"
          >
            <option value="">Select Brand</option>
            {['Toyota', 'Hyundai', 'Suzuki', 'Honda', 'Tata', 'Mahindra', 'Kia', 'BMW', 'Mercedes-Benz', 'Audi', 'Tesla', 'Volkswagen'].map((brand) => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
        </div>

        {/* Fuel Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Type</label>
          <select
            value={filters.fuelType}
            onChange={(e) => setFilters({ ...filters, fuelType: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#FCA311] transition"
          >
            <option value="">Select Fuel Type</option>
            {['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'].map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Transmission */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Transmission</label>
          <select
            value={filters.transmission}
            onChange={(e) => setFilters({ ...filters, transmission: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#FCA311] transition"
          >
            <option value="">Select Transmission</option>
            {['Manual', 'Automatic'].map((trans) => (
              <option key={trans} value={trans}>{trans}</option>
            ))}
          </select>
        </div>

        {/* Seats */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Seats</label>
          <select
            value={filters.seats}
            onChange={(e) => setFilters({ ...filters, seats: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#FCA311] transition"
          >
            <option value="">Select Seats</option>
            {[2, 4, 5, 6, 7, 8].map((seat) => (
              <option key={seat} value={seat}>{seat}</option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#FCA311] transition"
          >
            <option value="">Select Category</option>
            {['Hatchback', 'Sedan', 'SUV', 'Luxury', 'Super Luxury'].map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Buttons */}
      <div className="mt-6 flex flex-wrap gap-4">
        <button
          onClick={handleApplyFilters}
          className="bg-[#FCA311] hover:bg-[#e59400] text-white font-semibold px-6 py-2 rounded-lg transition"
        >
          Apply Filters
        </button>

        {filtersApplied && (
          <button
            onClick={handleClearFilters}
            className="text-[#FCA311] hover:underline text-sm font-medium"
          >
            Clear All Filters
          </button>
        )}
      </div>
    </div>

      {/* Cars Grid */}
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
            listedby={car.listedby}
          />
        ))}
      </div>
    </div>
  );
};

export default Catalogue;
