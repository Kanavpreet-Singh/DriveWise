import React from 'react';
import carImage from '../assets/image.png';
import HomeCard from '../components/HomeCard';
import BrandsCard from '../components/BrandsCard';
import NearbyFinder from '../components/NearbyFinder';
import EmiFinder from '../components/EmiFinder';

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
    

    

    <div className="bg-[var(--color-gray)] py-10 px-4">
  <div className="max-w-7xl mx-auto">
    
    {/* Heading */}
    <h2 className="text-center text-3xl md:text-4xl font-bold text-black mb-8 mt-12">
      Why Choose Us
    </h2>

    {/* Cards */}
    <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 justify-items-center">
      <HomeCard
        image="https://images.unsplash.com/photo-1516382799247-87df95d790b7?q=80&w=2074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        heading="Find Your Car"
        text="Browse a wide range of vehicles to suit every lifestyle."
      />
      <HomeCard
        image="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        heading="List Your Car"
        text="Become a dealer and post your car listings with ease."
      />
      <HomeCard
        image="https://plus.unsplash.com/premium_photo-1723874476102-de001b6688ab?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        heading="Smart Deals"
        text="Explore exclusive offers and limited-time discounts."
      />
    </div>


  </div>
</div>

    <BrandsCard/>
    <NearbyFinder/>
    <EmiFinder/>


    </>


  );
};

export default Home;
