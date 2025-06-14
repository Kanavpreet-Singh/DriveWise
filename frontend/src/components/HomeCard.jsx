import React from 'react';

const HomeCard = ({ image, heading, text }) => {
  return (
    <div className="w-full max-w-xs bg-[var(--color-white)] rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 text-center">
      <img src={image} alt={heading} className="w-full h-40 object-cover" />
      
      <div className="p-4">
        <h2 className="text-lg font-bold text-[var(--color-blue)] mb-2">{heading}</h2>
        <p className="text-sm text-[var(--color-black)]">{text}</p>
      </div>
    </div>
  );
};

export default HomeCard;
