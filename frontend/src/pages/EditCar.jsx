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
    images: [{ type: 'url', value: '' }],
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
          images: Array.isArray(res.data.car.image)
            ? res.data.car.image.map((img) => ({ type: 'url', value: img }))
            : [{ type: 'url', value: res.data.car.image || '' }],
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

  const addImageField = () => {
    if (formData.images.length < 3) {
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, { type: 'url', value: '' }],
      }));
    }
  };

  const removeImageField = (index) => {
    if (formData.images.length > 2) {
      const updatedImages = formData.images.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, images: updatedImages }));
    }
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

    const validImages = formData.images.filter((img) =>
      img.type === 'url' ? img.value.trim() !== '' : img.value instanceof File
    );

    if (validImages.length < 2) {
      toast.error('Please provide at least 2 valid images.');
      return;
    }

    try {
      const uploadedImageUrls = await Promise.all(
        validImages.map(async (img) => {
          if (img.type === 'file' && img.value instanceof File) {
            return await uploadToCloudinary(img.value);
          } else {
            return img.value.trim();
          }
        })
      );

      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${backend_url}/car/${id}`,
        {
          ...formData,
          image: uploadedImageUrls,
        },
        {
          headers: { token },
        }
      );

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
          <label className="block font-semibold text-gray-700">Images (Min 2, Max 3)</label>
          {formData.images.map((imgObj, index) => (
            <div key={index} className="border rounded p-3 space-y-2">
              <div className="flex items-center gap-3">
                <select
                  value={imgObj.type}
                  onChange={(e) => {
                    const updated = [...formData.images];
                    updated[index].type = e.target.value;
                    updated[index].value = '';
                    setFormData((prev) => ({ ...prev, images: updated }));
                  }}
                  className="border px-2 py-1"
                >
                  <option value="url">URL</option>
                  <option value="file">File</option>
                </select>

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

              {imgObj.type === 'url' ? (
                <input
                  type="text"
                  placeholder="Enter image URL"
                  value={imgObj.value}
                  onChange={(e) => {
                    const updated = [...formData.images];
                    updated[index].value = e.target.value;
                    setFormData((prev) => ({ ...prev, images: updated }));
                  }}
                  className="w-full border px-3 py-2"
                />
              ) : (
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const updated = [...formData.images];
                    updated[index].value = e.target.files[0];
                    setFormData((prev) => ({ ...prev, images: updated }));
                  }}
                  className="w-full border px-3 py-2"
                />
              )}

              {imgObj.type === 'url' && imgObj.value && (
                <img src={imgObj.value} alt="preview" className="h-24 rounded shadow" />
              )}
              {imgObj.type === 'file' && imgObj.value && (
                <img src={URL.createObjectURL(imgObj.value)} alt="preview" className="h-24 rounded shadow" />
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
