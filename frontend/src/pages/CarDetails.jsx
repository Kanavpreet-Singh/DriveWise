import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const CarDetails = () => {
  const { carId } = useParams();
  const [car, setCar] = useState(null);

  useEffect(() => {
    const fetchCar = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/car/${carId}`);
        setCar(res.data.car);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCar();
  }, [carId]);

  if (!car) return <p>Loading car details...</p>;

  let handleCommentSubmit = async () => {

    const comment = document.getElementById('comments').value;
    if (comment.trim() === '') {
      alert('Please enter a comment before submitting.');
      return;
    }
    
    
    let response = await axios.post(`/cars/comment/${carId}`,{})
    document.getElementById('comments').value = ''; 
    alert('Comment submitted successfully!');
  }

  return (
  <div className="flex justify-center items-center min-h-screen bg-gray-50">
    <div className="max-w-2xl w-full bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{car.name}</h1>
        <p className="text-lg text-yellow mb-6">{car.brand}</p>
        
        <div className="flex justify-center mb-6">
          <img 
            src={car.image} 
            className="w-full max-w-md rounded-lg shadow-sm border border-gray-200" 
            alt={car.name} 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="font-semibold text-gray-700">Price Range:</p>
            <p className="text-lg font-bold text-yellow">₹{car.minprice} - ₹{car.maxprice} Lakh</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="font-semibold text-gray-700">Fuel Type:</p>
            <p className="text-gray-800">{car.fuelType}</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="font-semibold text-gray-700">Transmission:</p>
            <p className="text-gray-800">{car.transmission}</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="font-semibold text-gray-700">Seating Capacity:</p>
            <p className="text-gray-800">{car.seats} seats</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="font-semibold text-gray-700">Manufacturing Year:</p>
            <p className="text-gray-800">{car.year}</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="font-semibold text-gray-700">Vehicle Category:</p>
            <p className="text-gray-800">{car.category}</p>
          </div>
        </div>

        <button className="bg-yellow hover:bg-blue text-white font-bold py-3 px-6 rounded-lg transition duration-200">
          View Dealerships
        </button>

        <h1 className='text-xl font-bold text-gray-800 mb-4'>Comments</h1>

        <textarea name="comments" id="comments" rows="4" className="w-full p-2 border border-gray-300 rounded-lg"></textarea>
        <button onClick={handleCommentSubmit} className="bg-yellow hover:bg-blue text-white font-bold py-2 px-4 rounded-lg mt-2 transition duration-200">
          Submit Comment
        </button>
      </div>
    </div>
  </div>
);
};

export default CarDetails;
