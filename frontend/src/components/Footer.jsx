import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-[var(--color-blue)] text-[var(--color-white)] py-8 ">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
        
        {/* Brand Section */}
        <div>
          <h3 className="text-xl font-bold text-[var(--color-yellow)]">DriveWise</h3>
          <p className="mt-2 text-sm">
            Your trusted partner to find, list, and buy the perfect car.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-lg font-semibold mb-2">Quick Links</h4>
          <ul className="space-y-1 text-sm">
            <li><a href="/" className="hover:underline">Home</a></li>
            <li><a href="/catalogue" className="hover:underline">Catalogue</a></li>
            <li><a href="/addcar" className="hover:underline">List Your Car</a></li>
            <li><a href="/contact" className="hover:underline">Contact Us</a></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-lg font-semibold mb-2">Contact</h4>
          <p className="text-sm">Email: <a href="mailto:drivecircle05@gmail.com" className="hover:underline">drivecircle05@gmail.com</a></p>
          <p className="text-sm mt-1">Location: India</p>
        </div>
      </div>

      <div className="text-center text-sm mt-8 border-t border-[var(--color-gray)] pt-4">
        &copy; {new Date().getFullYear()} DriveWise. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
