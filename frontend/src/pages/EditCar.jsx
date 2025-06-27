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
    price: '',
    category: '',
    fuelType: '',
    transmission: '',
    year: '',
    seats: '',
    images: [''], // image URLs
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

        setFormData({
          ...res.data.car,
          images: Array.isArray(res.data.car.image) ? res.data.car.image : [res.data.car.image || ''],
        });
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

  const handleImageChange = (index, value) => {
    const updatedImages = [...formData.images];
    updatedImages[index] = value;
    setFormData((prev) => ({ ...prev, images: updatedImages }));
  };

  const addImageField = () => {
    if (formData.images.length < 3) {
      setFormData((prev) => ({ ...prev, images: [...prev.images, ''] }));
    }
  };

  const removeImageField = (index) => {
    if (formData.images.length > 2) {
      const updatedImages = formData.images.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, images: updatedImages }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedImages = formData.images.map(img => img.trim()).filter(img => img !== '');
    if (trimmedImages.length < 2) {
      toast.error('Please provide at least 2 valid image URLs.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${backend_url}/car/${id}`, {
        ...formData,
        image: trimmedImages,
      }, {
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

        <input name="price" type="number" placeholder="Price (₹)" required className="w-full border px-3 py-2" value={formData.price} onChange={handleChange} />

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

        <div className="space-y-2">
          <label className="block font-semibold text-gray-700">Image URLs (Min 2, Max 3):</label>
          {formData.images.map((img, index) => (
            <div key={index} className="flex gap-2 items-center">
              <input
                type="text"
                placeholder={`Image ${index + 1}`}
                value={img}
                onChange={(e) => handleImageChange(index, e.target.value)}
                className="w-full border px-3 py-2"
              />
              {formData.images.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeImageField(index)}
                  className="text-red-600 font-bold text-xl"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          {formData.images.length < 3 && (
            <button
              type="button"
              onClick={addImageField}
              className="text-blue-600 font-semibold text-sm"
            >
              + Add Another Image
            </button>
          )}
        </div>

        <button type="submit" className="bg-yellow text-white px-4 py-2 rounded shadow">
          Update Car
        </button>
      </form>
    </div>
  );
};

export default EditCar;
