import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { FaSearchLocation } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const NearbyFinder = () => {
  const navigate = useNavigate();

  const handleNearbyClick = () => {
    navigate('/catalogue?nearby=true');
  };

  return (
    <section className="bg-white py-10 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
        
        {/* Text Content */}
        <div className="w-full md:w-1/2 text-center md:text-left">
          <h1 className="text-3xl sm:text-4xl font-bold text-blue mb-3">Smart Finder</h1>
          <p className="text-base sm:text-lg text-gray-600 mb-5">
            Find cars available <span className="text-yellow font-semibold">near your current location</span> instantly and smartly.
          </p>
          <button
            onClick={handleNearbyClick}
            className="inline-flex items-center gap-2 bg-yellow text-white px-5 py-2.5 rounded-lg shadow-md hover:bg-blue transition duration-200 text-sm sm:text-base"
          >
            <FaSearchLocation className="text-lg" />
            Find Cars Nearby
          </button>
        </div>

        {/* Lottie Animation */}
        <div className="w-full md:w-1/2 flex justify-center">
          <DotLottieReact
            src="/animations/myanim.json"
            loop
            autoplay
            style={{
              height: '220px',
              width: '220px',
            }}
            className="sm:h-[280px] sm:w-[280px] md:h-[300px] md:w-[300px]"
          />
        </div>
      </div>
    </section>
  );
};

export default NearbyFinder;
