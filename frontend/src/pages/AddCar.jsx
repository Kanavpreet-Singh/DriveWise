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
  const [imageFiles, setImageFiles] = useState([]);
  const [imageUrls, setImageUrls] = useState(['', '', '']);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    price: '',
    category: '',
    fuelType: '',
    transmission: '',
    year: '',
    seats: '',
    image: [],
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, index) => {
    const files = [...imageFiles];
    files[index] = e.target.files[0];
    setImageFiles(files);
  };

  const uploadToCloudinary = async (file) => {
    const data = new FormData();
    data.append('file', file);
    data.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
      method: 'POST',
      body: data,
    });

    const json = await res.json();
    return json.secure_url;
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  const coords = formData.location.coordinates;
  if (!coords.length) {
    toast.error('Please select a valid city from the dropdown');
    return;
  }

  // Image validation - BEFORE upload or API call
  if (imageSource === 'upload') {
    const validFiles = imageFiles.filter(Boolean);
    if (validFiles.length < 2) {
      toast.error("Please upload at least 2 images.");
      return;
    }
  } else {
    const validUrls = imageUrls.filter((url) => url.trim());
    if (validUrls.length < 2) {
      toast.error("Please provide at least 2 image URLs.");
      return;
    }
  }

  try {
    setUploading(true);
    let finalImages = [];

    if (imageSource === 'upload') {
      const uploads = await Promise.all(
        imageFiles.filter(Boolean).map((file) => uploadToCloudinary(file))
      );
      finalImages = uploads;
    } else {
      finalImages = imageUrls.filter((url) => url.trim()).slice(0, 3);
    }

    const token = localStorage.getItem('token');
    const res = await axios.post(`${backend_url}/car/add`,
      {
        ...formData,
        image: finalImages,
        location: {
          type: 'Point',
          coordinates: coords
        }
      },
      {
        headers: { token }
      });

    toast.success(res.data.message);
    setFormData({ name: '', brand: '', price: '', category: '', fuelType: '', transmission: '', year: '', seats: '', image: [], location: { city: '', coordinates: [] } });
    setImageFiles([]);
    setImageUrls(['', '', '']);
    setCityInput('');
    setUploading(false);
    navigate('/catalogue');
  } catch (error) {
    toast.error(error.response?.data?.message || error.message || 'Something went wrong');
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
          {['Toyota', 'Hyundai', 'Suzuki', 'Honda', 'Tata', 'Mahindra', 'Kia', 'BMW', 'Mercedes-Benz', 'Audi', 'Tesla', 'Volkswagen'].map((brand) => <option key={brand} value={brand}>{brand}</option>)}
        </select>

        <input name="price" type="number" placeholder="Price (INR)" required className="w-full border px-3 py-2" value={formData.price} onChange={handleChange} />

        <select name="category" required className="w-full border px-3 py-2" value={formData.category} onChange={handleChange}>
          <option value="">Select Category</option>
          {['Hatchback', 'Sedan', 'SUV', 'Luxury', 'Super Luxury'].map((cat) => <option key={cat} value={cat}>{cat}</option>)}
        </select>

        <select name="fuelType" required className="w-full border px-3 py-2" value={formData.fuelType} onChange={handleChange}>
          <option value="">Select Fuel Type</option>
          {['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'].map((f) => <option key={f} value={f}>{f}</option>)}
        </select>

        <select name="transmission" required className="w-full border px-3 py-2" value={formData.transmission} onChange={handleChange}>
          <option value="">Select Transmission</option>
          {['Manual', 'Automatic'].map((t) => <option key={t} value={t}>{t}</option>)}
        </select>

        <input name="year" type="number" placeholder="Year" required className="w-full border px-3 py-2" value={formData.year} onChange={handleChange} />
        <input name="seats" type="number" placeholder="Seats" className="w-full border px-3 py-2" value={formData.seats} onChange={handleChange} />

        
        <div className="relative">
          <input
            type="text"
            placeholder="City"
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
                      location: { city: city.name, coordinates: city.coordinates }
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
          <select className="w-full border px-3 py-2 rounded" value={imageSource} onChange={(e) => setImageSource(e.target.value)}>
            <option value="upload">Upload Images</option>
            <option value="url">Enter Image URLs</option>
          </select>

          {imageSource === 'upload' ? (
            <div className="space-y-2">
              {[0, 1, 2].map((idx) => (
                <input key={idx} type="file" accept="image/*" onChange={(e) => handleFileChange(e, idx)} className="w-full border px-3 py-2" />
              ))}
              <div className="flex flex-wrap gap-3">
                {imageFiles.filter(Boolean).map((file, i) => (
                  <img key={i} src={URL.createObjectURL(file)} className="h-24 rounded shadow" />
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {[0, 1, 2].map((idx) => (
                <input
                  key={idx}
                  type="text"
                  placeholder={`Image URL ${idx + 1}`}
                  value={imageUrls[idx]}
                  onChange={(e) => {
                    const newUrls = [...imageUrls];
                    newUrls[idx] = e.target.value;
                    setImageUrls(newUrls);
                  }}
                  className="w-full border px-3 py-2"
                />
              ))}
              <div className="flex flex-wrap gap-3">
                {imageUrls.filter(Boolean).map((url, i) => (
                  <img key={i} src={url} className="h-24 rounded shadow" />
                ))}
              </div>
            </div>
          )}
        </div>

        {uploading && <p className="text-sm text-gray-500">Uploading images...</p>}

        <button type="submit" className="bg-yellow text-white px-4 py-2 rounded shadow" disabled={uploading}>
          {uploading ? 'Uploading...' : 'Add Car'}
        </button>
      </form>
    </div>
  );
};

export default AddCar;
