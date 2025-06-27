import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import emi from '../assets/emi.jpg';

const EmiFinder = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [salary, setSalary] = useState('');
  const [mode, setMode] = useState('loan');
  const [loanAmount, setLoanAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [tenure, setTenure] = useState('');
  const [downPayment, setDownPayment] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const calculateEMI = (P, R, N) => {
    const r = R / 12 / 100;
    return (P * r * Math.pow(1 + r, N)) / (Math.pow(1 + r, N) - 1);
  };

  const handleSubmit = () => {
    setError('');

    const monthlySalary = Number(salary);
    if (!monthlySalary || monthlySalary < 10000) {
      setError("Please enter a valid monthly salary (minimum ₹10,000).");
      return;
    }

    let finalBudget = 0;
    const safeEMIPerMonth = monthlySalary * 0.4; // 40% of salary

    if (mode === 'loan') {
      if (!loanAmount || !interestRate || !tenure) {
        setError("Please fill in all loan details.");
        return;
      }
      const emi = calculateEMI(Number(loanAmount), Number(interestRate), Number(tenure));
      if (emi > safeEMIPerMonth) {
        setError(`EMI of ₹${Math.round(emi)} exceeds 40% of your salary.`);
        return;
      }
      finalBudget = Number(loanAmount);
    } else if (mode === 'downpayment') {
      if (!downPayment || Number(downPayment) < 100000) {
        setError("Enter valid downpayment amount (min ₹1,00,000).");
        return;
      }
      finalBudget = Number(downPayment);
    } else if (mode === 'hybrid') {
      if (!downPayment || !loanAmount || !interestRate || !tenure) {
        setError("Fill both loan and downpayment details.");
        return;
      }
      const emi = calculateEMI(Number(loanAmount), Number(interestRate), Number(tenure));
      if (emi > safeEMIPerMonth) {
        setError(`EMI of ₹${Math.round(emi)} exceeds 40% of your salary.`);
        return;
      }
      finalBudget = Number(downPayment) + Number(loanAmount);
    }

    // Only 1 price field is now used (not min and max separately in DB), so we’ll just pass price filter range
    const minPrice = Math.floor(finalBudget * 0.8);
    const price = Math.ceil(finalBudget * 1.1);

    navigate(`/catalogue?min=${minPrice}&max=${price}`);
  };

  return (
    <section className="bg-white py-10 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto bg-gray rounded-xl shadow-md p-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="w-full md:w-1/2">
            <h2 className="text-3xl sm:text-4xl font-bold text-blue mb-3">EMI Budget Planner</h2>
            <p className="text-gray-600 mb-5">
              Based on your salary and finance plan, we’ll show you car options in your budget.
            </p>
            <button
              onClick={() => setShowPopup(true)}
              className="bg-yellow hover:bg-blue text-white px-5 py-2.5 rounded-lg shadow-md transition"
            >
              Calculate My Budget
            </button>
          </div>
          <div className="hidden md:block w-full md:w-1/2">
            <img src={emi} alt="EMI" className="rounded-lg w-full max-w-md mx-auto" />
          </div>
        </div>
      </div>

      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-lg p-6 space-y-5 relative">
            <button
              className="absolute top-2 right-3 text-gray-400 text-xl"
              onClick={() => setShowPopup(false)}
            >
              ×
            </button>

            <h3 className="text-2xl font-semibold text-blue">Enter Your Details</h3>

            <div>
              <label className="block text-gray-700 font-medium mb-1">Monthly Salary (₹)</label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-2">Choose Mode</label>
              <div className="flex gap-4">
                {['loan', 'downpayment', 'hybrid'].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setMode(opt)}
                    className={`px-4 py-2 rounded-md border ${
                      mode === opt
                        ? 'bg-yellow text-white border-yellow'
                        : 'border-gray-300 text-gray-700'
                    }`}
                  >
                    {opt === 'loan' ? 'Loan' : opt === 'downpayment' ? 'Downpayment' : 'Hybrid'}
                  </button>
                ))}
              </div>
            </div>

            {(mode === 'loan' || mode === 'hybrid') && (
              <>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Loan Amount (₹)</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value)}
                  />
                </div>
                <div className="flex gap-4">
                  <div className="w-1/2">
                    <label className="block text-gray-700 font-medium mb-1">Interest Rate (%)</label>
                    <input
                      type="number"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      value={interestRate}
                      onChange={(e) => setInterestRate(e.target.value)}
                    />
                  </div>
                  <div className="w-1/2">
                    <label className="block text-gray-700 font-medium mb-1">Tenure (months)</label>
                    <input
                      type="number"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      value={tenure}
                      onChange={(e) => setTenure(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            {(mode === 'downpayment' || mode === 'hybrid') && (
              <div>
                <label className="block text-gray-700 font-medium mb-1">Downpayment (₹)</label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={downPayment}
                  onChange={(e) => setDownPayment(e.target.value)}
                />
              </div>
            )}

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              onClick={handleSubmit}
              className="w-full mt-2 bg-yellow hover:bg-blue text-white font-medium py-2 rounded-md transition"
            >
              Show Cars In My Budget
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default EmiFinder;
