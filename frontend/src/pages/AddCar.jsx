import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const cityList = [
  { name: 'Delhi', coordinates: [77.1025, 28.7041] },
  { name: 'Mumbai', coordinates: [72.8777, 19.0760] },
  { name: 'Bangalore', coordinates: [77.5946, 12.9716] },
  { name: 'Hyderabad', coordinates: [78.4867, 17.3850] },
  { name: 'Ahmedabad', coordinates: [72.5714, 23.0225] },
  { name: 'Chennai', coordinates: [80.2707, 13.0827] },
  { name: 'Kolkata', coordinates: [88.3639, 22.5726] },
  { name: 'Pune', coordinates: [73.8567, 18.5204] },
  { name: 'Jaipur', coordinates: [75.7873, 26.9124] },
  { name: 'Chandigarh', coordinates: [76.7794, 30.7333] },
  { name: 'Mohali', coordinates: [76.7081, 30.7046] },
  { name: 'Noida', coordinates: [77.3910, 28.5355] },
  { name: 'Lucknow', coordinates: [80.9462, 26.8467] },
  { name: 'Indore', coordinates: [75.8577, 22.7196] },
  { name: 'Nagpur', coordinates: [79.0882, 21.1458] },
  { name: 'Bhopal', coordinates: [77.4126, 23.2599] },
  { name: 'Surat', coordinates: [72.8311, 21.1702] },
  { name: 'Patna', coordinates: [85.1376, 25.5941] },
  { name: 'Gurgaon', coordinates: [77.0266, 28.4595] },
  { name: 'Amritsar', coordinates: [74.8723, 31.6340] },
];

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
    location: {
      city: '',
      coordinates: []
    }
  });

  const [cityInput, setCityInput] = useState('');
  const [citySuggestions, setCitySuggestions] = useState([]);

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

    const coords = formData.location.coordinates;
    if (!coords.length) {
      toast.error('Please select a valid city from the dropdown');
      return;
    }

    try {
      let imageUrl = formData.image;

      if (imageSource === 'upload' && imageFile) {
        imageUrl = await uploadToCloudinary();
      }

      const token = localStorage.getItem('token');
      const res = await axios.post(`${backend_url}/car/add`,
        {
          ...formData,
          image: imageUrl,
          location: {
            type: 'Point',
            coordinates: coords
          }
        },
        {
          headers: { token }
        });

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
        location: { city: '', coordinates: [] }
      });
      setCityInput('');
      setImageFile(null);
      navigate('/catalogue');
    } catch (error) {
      toast.error(error.message || 'Something went wrong');
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

        
        <div className="relative">
          <input
            type="text"
            placeholder="City (e.g. Mohali)"
            className="w-full border px-3 py-2"
            value={cityInput}
            onChange={(e) => {
              const value = e.target.value;
              setCityInput(value);
              const filtered = cityList.filter(city =>
                city.name.toLowerCase().startsWith(value.toLowerCase())
              );
              setCitySuggestions(filtered);
            }}
            required
          />

          {citySuggestions.length > 0 && (
            <ul className="absolute bg-white border w-full z-10 max-h-40 overflow-y-auto shadow">
              {citySuggestions.map((city) => (
                <li
                  key={city.name}
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      location: {
                        city: city.name,
                        coordinates: city.coordinates
                      }
                    }));
                    setCityInput(city.name);
                    setCitySuggestions([]);
                  }}
                  className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                >
                  {city.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        
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
