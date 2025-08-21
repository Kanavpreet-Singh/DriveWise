import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

import CarCard from '../components/CarCard';
import { FaPlus } from 'react-icons/fa';
import PricePredictCard from '../components/PricePredictCard';

const Catalogue = () => {
  const [searchParams] = useSearchParams();
  
  const [requestText, setRequestText] = useState("");


  const [errorMessage, setErrorMessage] = useState("");
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
  const [showNearbyHeading, setShowNearbyHeading] = useState(false);
  const [loading, setLoading] = useState(false);
  const backend_url = import.meta.env.VITE_BACKEND_URL;

  const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    const deg2rad = (deg) => deg * (Math.PI / 180);
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleShowNearby = async () => {
    try {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        const res = await axios.get(`${backend_url}/car/allcars`);
        const filtered = res.data.cars.filter((car) => {
          const [carLng, carLat] = car.location?.coordinates || [];
          const dist = getDistanceFromLatLonInKm(latitude, longitude, carLat, carLng);
          return dist <= 50;
        });
        setCars(filtered);
        setFiltersApplied(true);
        setShowNearbyHeading(true);
      });
    } catch (err) {
      console.error('Error fetching nearby cars:', err);
    }
  };

  const fetchCars = async () => {
  try {
    const res = await axios.get(`${backend_url}/car/allcars`);
    let allCars = res.data.cars;

    const min = parseFloat(searchParams.get('min'));
const max = parseFloat(searchParams.get('max'));

if (!isNaN(min) && !isNaN(max)) {
  allCars = allCars.filter(
    (car) => Number(car.price) >= min && Number(car.price) <= max
  );
  setFiltersApplied(true);


}


    setCars(allCars);
  } catch (err) {
    console.error('Error fetching cars:', err);
  }
};


  useEffect(() => {
    fetchCars();
  }, []);

  const brandFromURL = searchParams.get('brand');
  const nearbyFlag = searchParams.get('nearby');

  useEffect(() => {
    if (brandFromURL) {
      setFilters((prev) => ({ ...prev, brand: brandFromURL }));
      setFiltersApplied(true);
    }
  }, [brandFromURL]);

  useEffect(() => {
    if (filters.brand) {
      handleApplyFilters();
    }
  }, [filters.brand]);

  useEffect(() => {
    if (nearbyFlag === 'true') {
      handleShowNearby();
    }
  }, [nearbyFlag]);


  const fetchRequestedCars = async () => {

    if (!user) {
        toast.warn("Please sign in use AI based Car finder.");
        return;
      }

  if (!requestText.trim()) return;

  try {
    setLoading(true)
    setErrorMessage(""); 
    const res = await fetch(`${backend_url}/car/requestedcars?q=${encodeURIComponent(requestText)}`, {
  method: "GET", 
});

if (!res.ok) {
  throw new Error("Backend request failed");
}

const data = await res.json();
setCars(data);
  } catch (err) {
    setErrorMessage("⚠️ Could not fetch recommended cars. Please try again later.");
    setCars([]); 
  }
  finally {
      setLoading(false); 
    }
};


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

  const handleClearQuery = () => {
  setRequestText("");       
  setErrorMessage("");      
  fetchCars();              
  setFiltersApplied(false); 
  setShowNearbyHeading(false);
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
    setShowNearbyHeading(false);
  };

  return (
    <div className="px-6 py-4">
      {user?.role === 'dealer' && (
        <div className="mb-6">
          <button
            onClick={() => navigate('/addcar')}
            className="flex items-center gap-2 text-[#FCA311] border border-[#FCA311] px-5 py-2 rounded-md font-semibold transition duration-200 ease-in-out hover:bg-[#FCA311] hover:text-[#14213D] shadow-sm"
          >
            <FaPlus className="text-sm" />
            Add Listing
          </button>
        </div>
      )}

      

      <div className="bg-gradient-to-br from-white to-gray-50 shadow-xl rounded-2xl p-8 mb-8 border border-gray-100">
  <div className="flex items-center space-x-3 mb-8">
    <div className="bg-[#FCA311] rounded-full p-2">
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
      </svg>
    </div>
    <div>
      <h3 className="text-2xl font-bold text-[#14213D]">Filter Cars</h3>
      <p className="text-sm text-gray-600">Find your perfect car with advanced filters</p>
    </div>
  </div>

  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    <div>
      <label className="flex items-center space-x-2 text-sm font-semibold text-[#14213D] mb-2">
        <svg className="w-4 h-4 text-[#FCA311]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
        </svg>
        <span>Brand</span>
      </label>
      <div className="relative">
        <select
          value={filters.brand}
          onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
          className="w-full appearance-none bg-white border-2 border-gray-200 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:border-[#FCA311] focus:ring-2 focus:ring-[#FCA311]/20 transition-all duration-200 text-gray-700 hover:border-gray-300 font-medium"
        >
          <option value="">Select Brand</option>
          {['Toyota', 'Hyundai', 'Suzuki', 'Honda', 'Tata', 'Mahindra', 'Kia', 'BMW', 'Mercedes-Benz', 'Audi', 'Tesla', 'Volkswagen'].map((brand) => (
            <option key={brand} value={brand}>{brand}</option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>

    <div>
      <label className="flex items-center space-x-2 text-sm font-semibold text-[#14213D] mb-2">
        <svg className="w-4 h-4 text-[#FCA311]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
        </svg>
        <span>Fuel Type</span>
      </label>
      <div className="relative">
        <select
          value={filters.fuelType}
          onChange={(e) => setFilters({ ...filters, fuelType: e.target.value })}
          className="w-full appearance-none bg-white border-2 border-gray-200 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:border-[#FCA311] focus:ring-2 focus:ring-[#FCA311]/20 transition-all duration-200 text-gray-700 hover:border-gray-300 font-medium"
        >
          <option value="">Select Fuel Type</option>
          {['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'].map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>

    <div>
      <label className="flex items-center space-x-2 text-sm font-semibold text-[#14213D] mb-2">
        <svg className="w-4 h-4 text-[#FCA311]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>Transmission</span>
      </label>
      <div className="relative">
        <select
          value={filters.transmission}
          onChange={(e) => setFilters({ ...filters, transmission: e.target.value })}
          className="w-full appearance-none bg-white border-2 border-gray-200 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:border-[#FCA311] focus:ring-2 focus:ring-[#FCA311]/20 transition-all duration-200 text-gray-700 hover:border-gray-300 font-medium"
        >
          <option value="">Select Transmission</option>
          {['Manual', 'Automatic'].map((trans) => (
            <option key={trans} value={trans}>{trans}</option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>

    <div>
      <label className="flex items-center space-x-2 text-sm font-semibold text-[#14213D] mb-2">
        <svg className="w-4 h-4 text-[#FCA311]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
        <span>Seats</span>
      </label>
      <div className="relative">
        <select
          value={filters.seats}
          onChange={(e) => setFilters({ ...filters, seats: e.target.value })}
          className="w-full appearance-none bg-white border-2 border-gray-200 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:border-[#FCA311] focus:ring-2 focus:ring-[#FCA311]/20 transition-all duration-200 text-gray-700 hover:border-gray-300 font-medium"
        >
          <option value="">Select Seats</option>
          {[2, 4, 5, 6, 7, 8].map((seat) => (
            <option key={seat} value={seat}>{seat}</option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>

    <div>
      <label className="flex items-center space-x-2 text-sm font-semibold text-[#14213D] mb-2">
        <svg className="w-4 h-4 text-[#FCA311]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        <span>Category</span>
      </label>
      <div className="relative">
        <select
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          className="w-full appearance-none bg-white border-2 border-gray-200 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:border-[#FCA311] focus:ring-2 focus:ring-[#FCA311]/20 transition-all duration-200 text-gray-700 hover:border-gray-300 font-medium"
        >
          <option value="">Select Category</option>
          {['Hatchback', 'Sedan', 'SUV', 'Luxury', 'Super Luxury'].map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  </div>

  <div className="mt-8 flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-gray-200">
    <div className="flex flex-wrap gap-3">
      <button
        onClick={handleApplyFilters}
        className="bg-[#FCA311] hover:bg-[#e2940e] text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#FCA311]/30 shadow-lg hover:shadow-xl flex items-center space-x-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span>Apply Filters</span>
      </button>

      


      {filtersApplied && (
        <button
          onClick={handleClearFilters}
          className="bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 hover:bg-gray-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Clear All Filters</span>
        </button>
      )}
    </div>

    <div className="text-sm text-gray-500 flex items-center space-x-1">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>Use filters to narrow down your search</span>
    </div>
  </div>
</div>

      <div className="mt-4 mb-7">
  <textarea
    value={requestText}
    onChange={(e) => setRequestText(e.target.value)}
    placeholder="Type here what sort of car you are looking for.."
    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-[#FCA311] focus:ring-2 focus:ring-[#FCA311]/20 outline-none transition-all duration-200 resize-none shadow-sm hover:shadow-md"
    rows={3}
  />
  <div className="flex flex-col sm:flex-row gap-3 mt-4 w-full sm:w-auto">
  {/* Get Recommended Cars Button */}
  <button
    onClick={fetchRequestedCars}
    disabled={loading}
    className="flex-1 sm:flex-none bg-[#FCA311] hover:bg-[#e2940e] disabled:bg-[#FCA311]/70 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 disabled:scale-100 focus:outline-none focus:ring-4 focus:ring-[#FCA311]/30 shadow-lg hover:shadow-xl disabled:shadow-md flex items-center justify-center space-x-2 min-w-[200px]"
  >
    {loading ? (
      <>
        <svg
          className="animate-spin h-5 w-5 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 
            0 12h4zm2 5.291A7.962 7.962 0 014 
            12H0c0 3.042 1.135 5.824 3 
            7.938l3-2.647z"
          ></path>
        </svg>
        <span>Loading...</span>
      </>
    ) : (
      <>
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 
            0 7 7 0 0114 0z"
          />
        </svg>
        <span>Get Recommended Cars</span>
      </>
    )}
  </button>

  {/* Clear Query Button - only visible if input is not empty */}
  {requestText.trim() !== "" && (
    <button
      onClick={handleClearQuery}
      className="flex-1 sm:flex-none bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 px-8 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2 hover:bg-gray-50 min-w-[200px]"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
      <span>Clear Query</span>
    </button>
  )}
</div>

</div>


      {showNearbyHeading && (
        <h2 className="text-lg sm:text-xl font-semibold text-[#14213D] mb-6 flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-[#FCA311]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 11c.828 0 1.5-.672 1.5-1.5S12.828 8 12 8s-1.5.672-1.5 1.5S11.172 11 12 11z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 11c0 4.687-7.5 10-7.5 10S4.5 15.687 4.5 11a7.5 7.5 0 0115 0z"
            />
          </svg>
          Showing results <span className="text-[#FCA311]">near you</span>
        </h2>
      )}


      {errorMessage && (
        <div className="text-red-600 font-semibold my-2">{errorMessage}</div>
      )}




      {cars.length === 0 ? (
        <div className="text-center text-gray-500 text-lg py-12">
          No cars found for the selected filters.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {cars.map((car) => (
            <CarCard
              key={car._id}
              name={car.name}
              brand={car.brand}
              price={car.price}
              
              image={car.image}
              _id={car._id}
              listedby={car.listedby}
            />
          ))}
        </div>
      )}

      <PricePredictCard/>
    </div>
  );
};

export default Catalogue;
