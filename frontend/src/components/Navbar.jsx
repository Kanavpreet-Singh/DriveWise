import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Logo from "../assets/logo.png"

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { isLoggedIn, logout,user } = useAuth();
  const navigate = useNavigate();
  

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
    navigate('/');
    toast.success("You are logged out");
    
  };

  const handleShowProfile = () => {
    setIsProfileOpen(false);
    
    if(user.role=='dealer'){
      navigate(`/dealer`); 
    }
    else{
      navigate('/customer'); 
    }
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
    <nav className="bg-gray text-blue border border-gray px-4 py-3 flex items-center justify-between relative">
      
      <div onClick={()=>{navigate('/')}} className="cursor-pointer">
        <img className='h-12 w-28' src={Logo} alt="" />
      </div>

      
      <div className="hidden md:flex space-x-6 mr-4 items-center">
        <a href='/' className='hover:underline'>Home</a>
        <a href='/catalogue' className='hover:underline'>Catalogue</a>
        {isLoggedIn && (
          <a href='/messenger' className='hover:underline'>Messenger</a>
        )}
        


        
        {isLoggedIn ? (
          <div className="relative">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)} 
              className="hover:text-yellow hover:font-bold"
            >
              <span className="material-symbols-outlined cursor-pointer">
                account_circle
              </span>
            </button>
            
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 border border-gray">
                <button
                  onClick={handleShowProfile}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  Show Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
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
          <a href='/' className='hover:text-yellow'>Home</a>
          <a href='/catalogue' className='hover:text-yellow'>Catalogue</a>
          {isLoggedIn && (
            <a href='/messenger' className='hover:text-yellow'>Messenger</a>
          )}

          
          
          {isLoggedIn ? (
            <>
              <button 
                onClick={handleShowProfile} 
                className="hover:text-yellow text-left"
              >
                Show Profile
              </button>
              <button 
                onClick={handleLogout} 
                className="hover:text-yellow text-left"
              >
                Logout
              </button>
            </>
          ) : (
            <a href="/signup" className="hover:text-yellow">
              Signup
            </a>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;