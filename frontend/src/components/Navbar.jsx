import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isLoggedIn, logout } = useAuth();

  

  

  const handleLogout = () => {
    logout();
    toast.success("You are logged out");
  };

  const hamburger = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className="w-6 h-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
      />
    </svg>
  );

  return (
    <nav className="bg-white text-blue border border-gray px-4 py-3 flex items-center justify-between">
      
      <div className="text-xl font-bold ml-4">MySite</div>

      {/* Desktop menu */}
      <div className="hidden md:flex space-x-6 mr-4">
        <a href='/' className='hover:text-yellow hover:font-bold'>Home</a>
        <a href='#' className='hover:text-yellow hover:font-bold'>About Us</a>
        <a href='#' className='hover:text-yellow hover:font-bold'>Contact</a>
        {isLoggedIn ? (
          <button onClick={handleLogout} className="hover:text-yellow hover:font-bold">
            Logout
          </button>
        ) : (
          <a href="/signup" className="hover:text-yellow hover:font-bold">
            Signup
          </a>
        )}
      </div>

      
      <div className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
        {hamburger}
      </div>

      
      {isOpen && (
        <div className="absolute top-16 right-4 bg-white border border-gray shadow-md flex flex-col space-y-4 p-4 md:hidden z-10">
          <a href='#'>Home</a>
          <a href='#'>About Us</a>
          <a href='#'>Contact</a>
                  {isLoggedIn ? (
          <button onClick={handleLogout} className="hover:text-yellow hover:font-bold">
            Logout
          </button>
        ) : (
          <a href="/signup" className="hover:text-yellow hover:font-bold">
            Signup
          </a>
        )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
