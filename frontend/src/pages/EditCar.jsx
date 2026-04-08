import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUploadTracker } from '../context/UploadTrackerContext';

const EditCar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const backend_url = import.meta.env.VITE_BACKEND_URL;
  const { addUploadJob } = useUploadTracker();

  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    price: '',
    category: '',
    fuelType: '',
    transmission: '',
    year: '',
    seats: '',
  });
  const [existingImages, setExistingImages] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const brands = ['Toyota', 'Hyundai', 'Suzuki', 'Honda', 'Tata', 'Mahindra', 'Kia', 'BMW', 'Mercedes-Benz', 'Audi', 'Tesla', 'Volkswagen'];
  const categories = ['Hatchback', 'Sedan', 'SUV', 'Luxury', 'Super Luxury'];
  const fuelTypes = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'];
  const transmissions = ['Manual', 'Automatic'];

  useEffect(() => {
    const fetchCar = async () => {
      try {
        const res = await axios.get(`${backend_url}/car/${id}`);

        if (res.data.car.listedby !== user?.userId) {
          toast.error('You are not authorized to edit this car.');
          navigate('/');
          return;
        }

        setFormData({
          name: res.data.car.name || '',
          brand: res.data.car.brand || '',
          price: res.data.car.price || '',
          category: res.data.car.category || '',
          fuelType: res.data.car.fuelType || '',
          transmission: res.data.car.transmission || '',
          year: res.data.car.year || '',
          seats: res.data.car.seats || '',
        });
        setExistingImages(Array.isArray(res.data.car.image) ? res.data.car.image : []);
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

  const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const totalImages = existingImages.length + newImageFiles.length;
    if (totalImages < 2) {
      toast.error('Please keep or upload at least 2 images.');
      return;
    }

    if (totalImages > 10) {
      toast.error('Maximum 10 images are allowed.');
      return;
    }

    try {
      setSubmitting(true);

      const newImagePayloads = await Promise.all(
        newImageFiles.map((file) => readFileAsDataUrl(file))
      );

      const res = await axios.post(
        `${backend_url}/car/${id}`,
        {
          name: formData.name,
          brand: formData.brand,
          price: formData.price,
          category: formData.category,
          fuelType: formData.fuelType,
          transmission: formData.transmission,
          year: formData.year,
          seats: formData.seats,
          keepImages: existingImages,
          newImagePayloads,
          newImageFileNames: newImageFiles.map((f) => f.name),
        }
      );

      toast.success(res.data.message || 'Car updated. Image processing started in background.');
      if (newImageFiles.length > 0) {
        addUploadJob(id, formData.name || 'Car', newImageFiles.map((f) => f.name));
      }
      navigate('/catalogue');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-blue">Edit Car Listing</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="name" type="text" placeholder="Car Name" required className="w-full border px-3 py-2" value={formData.name} onChange={handleChange} />

        <select name="brand" required className="w-full border px-3 py-2" value={formData.brand} onChange={handleChange}>
          <option value="">Select Brand</option>
          {brands.map((brand) => (
            <option key={brand} value={brand}>
              {brand}
            </option>
          ))}
        </select>

        <input name="price" type="number" placeholder="Price (₹)" required className="w-full border px-3 py-2" value={formData.price} onChange={handleChange} />

        <select name="category" required className="w-full border px-3 py-2" value={formData.category} onChange={handleChange}>
          <option value="">Select Category</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <select name="fuelType" required className="w-full border px-3 py-2" value={formData.fuelType} onChange={handleChange}>
          <option value="">Select Fuel Type</option>
          {fuelTypes.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>

        <select name="transmission" required className="w-full border px-3 py-2" value={formData.transmission} onChange={handleChange}>
          <option value="">Select Transmission</option>
          {transmissions.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <input name="year" type="number" placeholder="Year" required className="w-full border px-3 py-2" value={formData.year} onChange={handleChange} />
        <input name="seats" type="number" placeholder="Seats" className="w-full border px-3 py-2" value={formData.seats} onChange={handleChange} />

        <div className="space-y-4">
          <label className="block font-semibold text-gray-700">Existing Images</label>
          <p className="text-sm text-gray-500">Remove any old image you no longer want.</p>
          <div className="flex flex-wrap gap-3">
            {existingImages.map((imgUrl) => (
              <div key={imgUrl} className="relative">
                <img src={imgUrl} alt="existing" className="h-24 rounded shadow" />
                <button
                  type="button"
                  onClick={() => setExistingImages((prev) => prev.filter((url) => url !== imgUrl))}
                  className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 text-xs"
                >
                  x
                </button>
              </div>
            ))}
          </div>

          <label className="block font-semibold text-gray-700">Add New Images</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setNewImageFiles(Array.from(e.target.files || []))}
            className="w-full border px-3 py-2"
          />

          <div className="flex flex-wrap gap-3">
            {newImageFiles.map((file, index) => (
              <img key={`${file.name}-${index}`} src={URL.createObjectURL(file)} alt="new preview" className="h-24 rounded shadow" />
            ))}
          </div>

          <p className="text-sm text-gray-500">Total images after update must be between 2 and 10.</p>
        </div>

        <button type="submit" className="bg-yellow text-white px-4 py-2 rounded shadow" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Update Car'}
        </button>
      </form>
    </div>
  );
};

export default EditCar;
