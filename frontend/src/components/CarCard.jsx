import React from 'react';

const CarCard = ({ name, brand, minprice, maxprice, image }) => {
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-md border border-[#E5E5E5] transition-transform hover:scale-105 w-full max-w-sm mx-auto">
      <img src={image} alt={`${name} image`} className="w-full h-48 object-cover" />

      <div className="p-4 space-y-2">
        <h2 className="text-[#14213D] font-semibold text-lg">{name}</h2>
        <p className="text-[#14213D] text-sm">₹{minprice} - {maxprice} Lakh<sup>*</sup></p>

        <button className="w-full bg-[#FCA311] text-black font-semibold py-2 rounded hover:bg-[#e59400] transition-colors">
          View Offers
        </button>
      </div>
    </div>
  );
};

export default CarCard;
