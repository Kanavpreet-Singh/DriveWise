import React from 'react';
import carImage from '../assets/image.png';

const Home = () => {
  return (
    <>
    <div
      className="w-full h-[70vh] p-1  md:p-7 bg-cover bg-center bg-no-repeat  text-white"
      style={{ backgroundImage: `url(${carImage})` }}
    >
      
        <div className='lg:text-left'>
            <h1 style={{ fontFamily: "'Edu VIC WA NT Hand Pre', cursive" }} className="font-serif text-3xl md:text-4xl font-bold mb-4 text-black lg:text-left">
                Drive Your Dream Car
                </h1>
                <span className='text-2xl md:text-3xl font-bold text-black' style={{ fontFamily: "'Edu VIC WA NT Hand Pre', cursive" }}>Smarter choices, smoother drives</span>

      </div>

    </div>

    </>


  );
};

export default Home;
