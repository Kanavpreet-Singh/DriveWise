import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AddCar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [imageSource, setImageSource] = useState('upload');
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);

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

  useEffect(() => {
    if (!user) {
      toast.error("Please login to access this page.");
      navigate('/signin');
    } else if (user.role !== 'dealer') {
      toast.error("Login with PEC id to add car.");
      navigate('/');
    }
  }, [user, navigate]);

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

  const handleImageChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const uploadToCloudinary = async () => {
    setUploading(true);
    const data = new FormData();
    data.append('file', imageFile);
    data.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
      method: 'POST',
      body: data,
    });

    const json = await res.json();
    setUploading(false);
    return json.secure_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let imageUrl = formData.image;

      if (imageSource === 'upload' && imageFile) {
        imageUrl = await uploadToCloudinary();
      }

      const token = localStorage.getItem('token');
      const res = await axios.post(`${backend_url}/car/add`,
        { ...formData, image: imageUrl },
        { headers: { token } });

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
      setImageFile(null);
      navigate('/catalogue');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong');
      setUploading(false);
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

        {/* Image Source Selector */}
        <div className="space-y-2">
          <label className="block font-semibold text-gray-700">Image Source</label>
          <select
            className="w-full border px-3 py-2 rounded"
            value={imageSource}
            onChange={(e) => setImageSource(e.target.value)}
          >
            <option value="upload">Upload Image File</option>
            <option value="url">Paste Online Image URL</option>
          </select>

          {imageSource === 'upload' ? (
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full border px-3 py-2 rounded"
            />
          ) : (
            <input
              type="text"
              name="image"
              placeholder="Enter image URL"
              value={formData.image}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            />
          )}
        </div>

        {uploading && <p className="text-sm text-gray-500">Uploading image...</p>}

        <button type="submit" className="bg-yellow text-white px-4 py-2 rounded shadow" disabled={uploading}>
          {uploading ? 'Uploading...' : 'Add Car'}
        </button>
      </form>
    </div>
  );
};

export default AddCar;
