"use client"
import { useNavigate } from "react-router-dom"
import { Car, Calculator, TrendingUp } from "lucide-react"

export default function PricePredictCard() {
  const navigate = useNavigate()

  return (
    <div className="bg-gradient-to-br from-[#E5E5E5] to-[#D1D1D1] rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 mx-auto mt-10 w-full max-w-4xl text-center border border-gray-200">
      {/* Icon Section */}
      <div className="flex justify-center mb-6">
        <div className="bg-[#FCA311] rounded-full p-4 shadow-md">
          <Calculator className="w-8 h-8 text-white" />
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-4 mb-8">
        <h2 className="text-3xl font-bold text-[#14213D] leading-tight">Get an Instant Estimate for Your Car</h2>
        <p className="text-[#14213D]/80 text-lg max-w-2xl mx-auto leading-relaxed">
          Quickly check the estimated value of your used car based on key details like mileage, year, and brand. Get
          accurate pricing in seconds.
        </p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="flex items-center justify-center space-x-2 text-[#14213D]/70">
          <Car className="w-5 h-5 text-[#FCA311]" />
          <span className="text-sm font-medium">All Car Brands</span>
        </div>
        <div className="flex items-center justify-center space-x-2 text-[#14213D]/70">
          <TrendingUp className="w-5 h-5 text-[#FCA311]" />
          <span className="text-sm font-medium">Market Analysis</span>
        </div>
        <div className="flex items-center justify-center space-x-2 text-[#14213D]/70">
          <Calculator className="w-5 h-5 text-[#FCA311]" />
          <span className="text-sm font-medium">Instant Results</span>
        </div>
      </div>

      {/* CTA Button */}
      <button
        onClick={() => navigate("/predict-price")}
        className="bg-[#FCA311] hover:bg-[#e2940e] text-white font-bold px-8 py-4 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#FCA311]/30 active:scale-95"
      >
        <span className="flex items-center justify-center space-x-2">
          <Calculator className="w-5 h-5" />
          <span>Estimate My Car Price</span>
        </span>
      </button>

      {/* Subtle bottom accent */}
      <div className="mt-6 pt-4 border-t border-[#14213D]/10">
        <p className="text-xs text-[#14213D]/50">Free • No registration required • Instant results</p>
      </div>
    </div>
  )
}