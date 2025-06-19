import React, { useState,useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
const AddCar = () => {

   const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      // Not logged in
      toast.error("Please login to access this page.");
      navigate('/signin'); // redirect to login
    } else if (user.role !== 'dealer') {
      // Logged in but not a dealer
      toast.error("Login with PEC id to add car.");
      navigate('/');
    }
  }, [user, navigate]);


  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    minprice: '',
    maxprice: '',
    category: '',
    fuelType: '',
    transmission: '',
    year: '',
    seats: '',
    image: '',
  });

  const backend_url = import.meta.env.VITE_BACKEND_URL;

  const brands = ['Toyota', 'Hyundai', 'Suzuki', 'Honda', 'Tata', 'Mahindra', 'Kia', 'BMW', 'Mercedes-Benz', 'Audi', 'Tesla', 'Volkswagen'];
  const categories = ['Hatchback', 'Sedan', 'SUV', 'Luxury', 'Super Luxury'];
  const fuelTypes = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'];
  const transmissions = ['Manual', 'Automatic'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${backend_url}/car/add`, 
        formData,
        {
          headers: {
            token: token,
          },
        }
      );

      toast.success(res.data.message);

      setFormData({
        name: '',
        brand: '',
        minprice: '',
        maxprice: '',
        category: '',
        fuelType: '',
        transmission: '',
        year: '',
        seats: '',
        image: '',
      });
      navigate('/catalogue');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-blue">Add a Car Listing</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="name" type="text" placeholder="Car Name" required className="w-full border px-3 py-2" value={formData.name} onChange={handleChange} />

        <select name="brand" required className="w-full border px-3 py-2" value={formData.brand} onChange={handleChange}>
          <option value="">Select Brand</option>
          {brands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
        </select>

        <input name="minprice" type="number" placeholder="Minimum Price" required className="w-full border px-3 py-2" value={formData.minprice} onChange={handleChange} />
        <input name="maxprice" type="number" placeholder="Maximum Price" required className="w-full border px-3 py-2" value={formData.maxprice} onChange={handleChange} />

        <select name="category" required className="w-full border px-3 py-2" value={formData.category} onChange={handleChange}>
          <option value="">Select Category</option>
          {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
        </select>

        <select name="fuelType" required className="w-full border px-3 py-2" value={formData.fuelType} onChange={handleChange}>
          <option value="">Select Fuel Type</option>
          {fuelTypes.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>

        <select name="transmission" required className="w-full border px-3 py-2" value={formData.transmission} onChange={handleChange}>
          <option value="">Select Transmission</option>
          {transmissions.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>

        <input name="year" type="number" placeholder="Year" required className="w-full border px-3 py-2" value={formData.year} onChange={handleChange} />
        <input name="seats" type="number" placeholder="Seats" className="w-full border px-3 py-2" value={formData.seats} onChange={handleChange} />
        <input name="image" type="text" placeholder="Image URL" className="w-full border px-3 py-2" value={formData.image} onChange={handleChange} />

        <button type="submit" className="bg-yellow text-white px-4 py-2 rounded shadow" style={{ boxShadow: '0 2px 6px var(--color-gray)' }}>
          Add Car
        </button>
      </form>
    </div>
  );
};

export default AddCar;
