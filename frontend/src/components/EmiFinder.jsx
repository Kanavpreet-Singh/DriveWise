import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import emi_img from '../assets/emi.jpg';

const EmiFinder = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [emi, setEmi] = useState(15000); // Monthly EMI User can afford
  const [downPayment, setDownPayment] = useState(100000);
  const [interestRate, setInterestRate] = useState(9.5);
  const [tenure, setTenure] = useState(60); // 5 years
  const [totalBudget, setTotalBudget] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const navigate = useNavigate();

  // Reverse EMI Formula: P = E * [(1+r)^n - 1] / [r * (1+r)^n]
  const calculateBudget = () => {
    const r = (interestRate / 12) / 100;
    const n = tenure;
    const e = emi;
    
    if (r === 0) return e * n + downPayment;

    const loanAmount = e * (Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n));
    return Math.round(loanAmount + downPayment);
  };

  useEffect(() => {
    setTotalBudget(calculateBudget());
  }, [emi, downPayment, interestRate, tenure]);

  const handleExplore = () => {
    // Show cards in a +/- 15% range of the calculated budget
    const minPrice = Math.floor(totalBudget * 0.85);
    const maxPrice = Math.ceil(totalBudget * 1.15);
    navigate(`/catalogue?min=${minPrice}&max=${maxPrice}`);
    setShowPopup(false);
  };

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <section className="bg-white py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto bg-[#14213D] rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex flex-col md:flex-row items-center">
          {/* Left Side: Copy */}
          <div className="w-full md:w-1/2 p-10 lg:p-14 text-white">
            <h2 className="text-4xl lg:text-5xl font-extrabold mb-6 leading-tight">
              Don't just dream it.<br/> 
              <span className="text-[#FCA311]">Afford it.</span>
            </h2>
            <p className="text-gray-300 text-lg mb-8 max-w-md">
              Tell us your monthly budget and we'll reveal the cars that fit your lifestyle perfectly.
            </p>
            <button
              onClick={() => setShowPopup(true)}
              className="bg-[#FCA311] hover:bg-[#e59400] text-black font-bold px-8 py-4 rounded-xl shadow-lg transform transition active:scale-95"
            >
              Start Budget Planning
            </button>
          </div>
          
          {/* Right Side: Visual */}
          <div className="w-full md:w-1/2 relative min-h-[300px] md:min-h-[450px]">
            <img 
              src={emi_img} 
              alt="Luxury Car Steering" 
              className="absolute inset-0 w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#14213D] to-transparent md:bg-none"></div>
          </div>
        </div>
      </div>

      {/* Modern Slider Popup */}
      {showPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-300">
            {/* Close Button */}
            <button
              className="absolute top-5 right-6 text-gray-400 hover:text-gray-700 transition"
              onClick={() => setShowPopup(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="p-8 sm:p-10">
              <h3 className="text-2xl font-bold text-[#14213D] mb-2 text-center">Your Purchasing Power</h3>
              
              {/* Dynamic Budget Display */}
              <div className="bg-gray-50 rounded-2xl p-8 my-8 text-center border-2 border-dashed border-gray-200">
                <span className="text-sm font-semibold text-gray-500 uppercase tracking-widest block mb-1">Estimated Car Budget</span>
                <span className="text-4xl sm:text-5xl font-black text-[#14213D]">{formatCurrency(totalBudget)}</span>
              </div>

              <div className="space-y-8">
                {/* EMI Slider */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-gray-700 uppercase">Monthly EMI appetite</label>
                    <span className="text-lg font-bold text-[#FCA311]">{formatCurrency(emi)}</span>
                  </div>
                  <input
                    type="range"
                    min="5000"
                    max="100000"
                    step="1000"
                    value={emi}
                    onChange={(e) => setEmi(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#FCA311]"
                  />
                  <div className="flex justify-between text-xs text-gray-400 font-medium">
                    <span>₹5K</span>
                    <span>₹1L</span>
                  </div>
                </div>

                {/* Downpayment Slider */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-gray-700 uppercase">Cash Down payment</label>
                    <span className="text-lg font-bold text-[#FCA311]">{formatCurrency(downPayment)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1000000"
                    step="10000"
                    value={downPayment}
                    onChange={(e) => setDownPayment(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#FCA311]"
                  />
                  <div className="flex justify-between text-xs text-gray-400 font-medium">
                    <span>₹0</span>
                    <span>₹10L+</span>
                  </div>
                </div>

                {/* Advanced Settings Toggle */}
                <div className="pt-2">
                  <button 
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition"
                  >
                    {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transform transition ${showAdvanced ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {showAdvanced && (
                    <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100 animate-in slide-in-from-top-2 duration-200">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Interest Rate (%)</label>
                        <input
                          type="number"
                          value={interestRate}
                          onChange={(e) => setInterestRate(Number(e.target.value))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#FCA311] outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Tenure (months)</label>
                        <input
                          type="number"
                          value={tenure}
                          onChange={(e) => setTenure(Number(e.target.value))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#FCA311] outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleExplore}
                className="w-full mt-10 bg-[#14213D] hover:bg-[#1a2b4d] text-white font-bold py-4 rounded-xl shadow-xl transition transform active:scale-[0.98]"
              >
                Find Cars in My Budget
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default EmiFinder;
