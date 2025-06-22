import React from 'react';
import { useNavigate } from 'react-router-dom'; // 🧠 Add this
import honda from '../assets/honda.png';
import hyundai from '../assets/hyundai.png';
import tata from '../assets/tata.png';
import toyota from '../assets/toyota.png';
import suzuki from '../assets/suzuki.png';
import kia from '../assets/kia.png';
import audi from '../assets/audi.png';
import bmw from '../assets/bmw.png';
import mahindra from '../assets/mahindra.png';
import volkswagen from '../assets/volkswagen.png';
import tesla from '../assets/tesla.png';
import mercedes from '../assets/mercedes.png';

const brands = [
  { name: 'Honda', logo: honda },
  { name: 'Hyundai', logo: hyundai },
  { name: 'Tata', logo: tata },
  { name: 'Toyota', logo: toyota },
  { name: 'Suzuki', logo: suzuki },
  { name: 'Kia', logo: kia },
  { name: 'Audi', logo: audi },
  { name: 'BMW', logo: bmw },
  { name: 'Mahindra', logo: mahindra },
  { name: 'Volkswagen', logo: volkswagen },
  { name: 'Tesla', logo: tesla },
  { name: 'Mercedes-Benz', logo: mercedes },
];

const BrandsCard = () => {
  const navigate = useNavigate();

  const handleBrandClick = (brandName) => {
    navigate(`/catalogue?brand=${encodeURIComponent(brandName)}`);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 text-center">
      <h1 className="text-3xl font-bold text-[#14213D] mb-8">Explore by Brand</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8">
        {brands.map((brand) => (
          <div
            key={brand.name}
            onClick={() => handleBrandClick(brand.name)}
            className="cursor-pointer bg-white shadow-md rounded-lg p-4 flex flex-col items-center transition-transform hover:scale-105 hover:shadow-lg"
          >
            <img
              src={brand.logo}
              alt={brand.name}
              className="h-16 w-auto object-contain mb-2"
            />
            <p className="text-sm font-medium text-[#14213D]">{brand.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BrandsCard;
