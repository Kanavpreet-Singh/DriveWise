import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const EditCar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams(); 
  const backend_url = import.meta.env.VITE_BACKEND_URL;

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

  const brands = ['Toyota', 'Hyundai', 'Suzuki', 'Honda', 'Tata', 'Mahindra', 'Kia', 'BMW', 'Mercedes-Benz', 'Audi', 'Tesla', 'Volkswagen'];
  const categories = ['Hatchback', 'Sedan', 'SUV', 'Luxury', 'Super Luxury'];
  const fuelTypes = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'];
  const transmissions = ['Manual', 'Automatic'];

  useEffect(() => {
    const fetchCar = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${backend_url}/car/${id}`, {
          headers: { token },
        });

        if (res.data.car.listedby !== user?.userId) {
          toast.error('You are not authorized to edit this car.');
          navigate('/');
          return;
        }

        setFormData(res.data.car);
      } catch (err) {
        toast.error('Failed to fetch car details');
        navigate('/');
      }
    };

    if (!user) {
      toast.error('Please login to access this page.');
      navigate('/signin');
    } else if (user.role !== 'dealer') {
      toast.error('Only dealers can edit car listings.');
      navigate('/');
    } else {
      fetchCar();
    }
  }, [user, id, backend_url, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${backend_url}/car/${id}`, formData, {
        headers: { token },
      });

      toast.success(res.data.message || 'Car updated successfully');
      navigate('/catalogue');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-blue">Edit Car Listing</h2>
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
          Update Car
        </button>
      </form>
    </div>
  );
};

export default EditCar;
