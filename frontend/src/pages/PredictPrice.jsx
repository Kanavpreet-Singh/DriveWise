"use client"

import { useState } from "react"
import { Car, Calculator, Users, Settings, AlertCircle } from "lucide-react"

export default function PredictPrice() {
  const [formData, setFormData] = useState({
    name: "",
    year: "",
    km_driven: "",
    fuel: "",
    seller_type: "",
    transmission: "",
    owner: "",
    mileage: "",
    engine: "",
    max_power: "",
    seats: "",
  })

  const [prediction, setPrediction] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const carBrands = {
    Maruti: 1,
    Skoda: 2,
    Honda: 3,
    Hyundai: 4,
    Toyota: 5,
    Ford: 6,
    Renault: 7,
    Mahindra: 8,
    Tata: 9,
    Chevrolet: 10,
    Datsun: 11,
    Jeep: 12,
    "Mercedes-Benz": 13,
    Mitsubishi: 14,
    Audi: 15,
    Volkswagen: 16,
    BMW: 17,
    Nissan: 18,
    Lexus: 19,
    Jaguar: 20,
    Land: 21,
    MG: 22,
    Volvo: 23,
    Daewoo: 24,
    Kia: 25,
    Fiat: 26,
    Force: 27,
    Ambassador: 28,
    Ashok: 29,
    Isuzu: 30,
    Opel: 31,
  }

  const fuelTypes = {
    Diesel: 1,
    Petrol: 2,
    LPG: 3,
    CNG: 4,
  }

  const sellerTypes = {
    Individual: 1,
    Dealer: 2,
    "Trustmark Dealer": 3,
  }

  const transmissionTypes = {
    Manual: 1,
    Automatic: 2,
  }

  const ownerTypes = {
    "First Owner": 1,
    "Second Owner": 2,
    "Third Owner": 3,
    "Fourth & Above Owner": 4,
    "Test Drive Car": 5,
  }

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    // Clear error when user starts typing
    if (error) setError(null)
  }

  const convertFormDataToFeatures = () => {
    // Convert form data to numerical features array
    // Order: [name, year, km_driven, fuel, seller_type, transmission, owner, mileage, engine, max_power, seats]
    return [
      carBrands[formData.name],
      Number.parseInt(formData.year),
      Number.parseInt(formData.km_driven),
      fuelTypes[formData.fuel],
      sellerTypes[formData.seller_type],
      transmissionTypes[formData.transmission],
      ownerTypes[formData.owner],
      Number.parseFloat(formData.mileage),
      Number.parseFloat(formData.engine),
      Number.parseFloat(formData.max_power),
      Number.parseInt(formData.seats),
    ]
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setPrediction(null)

    try {
      const features = convertFormDataToFeatures()

      const response = await fetch(import.meta.env.VITE_ML_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          features: features,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.predicted_price) {
        setPrediction(Math.round(data.predicted_price))
      } else {
        throw new Error("No predicted_price in response")
      }
    } catch (err) {
      console.error("Prediction error:", err)
      setError(err.message || "Failed to get prediction. Please check if the API server is running.")
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid = Object.values(formData).every((value) => value !== "")

  return (
    <>
      <div className="container">
        {/* Header */}
        <div className="header">
          <div className="header-content">
            <Car className="header-icon" />
            <h1 className="header-title">Car Price Predictor</h1>
          </div>
          <p className="header-subtitle">Get an accurate estimate of your car's market value</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="cards-grid">
            {/* Basic Information Card */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">
                  <Car size={20} />
                  Basic Information
                </h2>
                <p className="card-description">Enter your car's basic details</p>
              </div>
              <div className="card-content">
                <div className="form-group">
                  <label className="label">Car Brand</label>
                  <select
                    className="input"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                  >
                    <option value="">Select car brand</option>
                    {Object.keys(carBrands).map((brand) => (
                      <option key={brand} value={brand}>
                        {brand}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="label">Manufacturing Year</label>
                  <input
                    type="number"
                    placeholder="e.g., 2020"
                    min="1990"
                    max="2024"
                    className="input"
                    value={formData.year}
                    onChange={(e) => handleInputChange("year", e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="label">Kilometers Driven</label>
                  <input
                    type="number"
                    placeholder="e.g., 70000"
                    min="0"
                    className="input"
                    value={formData.km_driven}
                    onChange={(e) => handleInputChange("km_driven", e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="label">Number of Seats</label>
                  <input
                    type="number"
                    placeholder="e.g., 5"
                    min="2"
                    max="8"
                    className="input"
                    value={formData.seats}
                    onChange={(e) => handleInputChange("seats", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Technical Specifications Card */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">
                  <Settings size={20} />
                  Technical Specs
                </h2>
                <p className="card-description">Engine and performance details</p>
              </div>
              <div className="card-content">
                <div className="form-group">
                  <label className="label">Fuel Type</label>
                  <select
                    className="input"
                    value={formData.fuel}
                    onChange={(e) => handleInputChange("fuel", e.target.value)}
                  >
                    <option value="">Select fuel type</option>
                    {Object.keys(fuelTypes).map((fuel) => (
                      <option key={fuel} value={fuel}>
                        {fuel}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="label">Transmission</label>
                  <select
                    className="input"
                    value={formData.transmission}
                    onChange={(e) => handleInputChange("transmission", e.target.value)}
                  >
                    <option value="">Select transmission</option>
                    {Object.keys(transmissionTypes).map((trans) => (
                      <option key={trans} value={trans}>
                        {trans}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="label">Mileage (km/l)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g., 18.9"
                    className="input"
                    value={formData.mileage}
                    onChange={(e) => handleInputChange("mileage", e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="label">Engine (CC)</label>
                  <input
                    type="number"
                    placeholder="e.g., 1197"
                    className="input"
                    value={formData.engine}
                    onChange={(e) => handleInputChange("engine", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Ownership Details Card */}
          <div className="card ownership-card">
            <div className="card-header">
              <h2 className="card-title">
                <Users size={20} />
                Ownership Details
              </h2>
              <p className="card-description">Seller and ownership information</p>
            </div>
            <div className="card-content">
              <div className="ownership-grid">
                <div className="form-group">
                  <label className="label">Seller Type</label>
                  <select
                    className="input"
                    value={formData.seller_type}
                    onChange={(e) => handleInputChange("seller_type", e.target.value)}
                  >
                    <option value="">Select seller type</option>
                    {Object.keys(sellerTypes).map((seller) => (
                      <option key={seller} value={seller}>
                        {seller}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="label">Owner Type</label>
                  <select
                    className="input"
                    value={formData.owner}
                    onChange={(e) => handleInputChange("owner", e.target.value)}
                  >
                    <option value="">Select owner type</option>
                    {Object.keys(ownerTypes).map((owner) => (
                      <option key={owner} value={owner}>
                        {owner}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="label">Max Power (bhp)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g., 81.86"
                    className="input"
                    value={formData.max_power}
                    onChange={(e) => handleInputChange("max_power", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="submit-container">
            <button
              type="submit"
              disabled={!isFormValid || isLoading}
              className={`submit-button ${!isFormValid || isLoading ? "disabled" : ""}`}
            >
              {isLoading ? (
                <>
                  <Calculator size={20} className="spinning" />
                  <span>Calculating...</span>
                </>
              ) : (
                <>
                  <Calculator size={20} />
                  <span>Predict Price</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div className="error-card">
            <div className="error-content">
              <AlertCircle size={24} />
              <div>
                <h3 className="error-title">Prediction Failed</h3>
                <p className="error-message">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Prediction Result */}
        {prediction && (
          <div className="result-card">
            <div className="result-header">
              <h2 className="result-title">Predicted Price</h2>
            </div>
            <div className="result-content">
              <div className="result-price">₹{prediction.toLocaleString("en-IN")}</div>
              <p className="result-description">
                This is an estimated market value based on the provided specifications
              </p>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .container {
          min-height: 100vh;
          background-color: #E5E5E5;
          padding: 16px;
        }

        .header {
          text-align: center;
          margin-bottom: 32px;
          max-width: 1024px;
          margin-left: auto;
          margin-right: auto;
        }

        .header-content {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .header-icon {
          width: 48px;
          height: 48px;
          color: #FCA311;
          flex-shrink: 0;
        }

        .header-title {
          font-size: 2.5rem;
          font-weight: bold;
          color: #14213D;
          margin: 0;
          line-height: 1.2;
        }

        .header-subtitle {
          font-size: 1.125rem;
          color: #000000;
          margin: 0;
        }

        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
          margin-bottom: 24px;
          max-width: 1024px;
          margin-left: auto;
          margin-right: auto;
        }

        .card {
          background-color: #FFFFFF;
          border: 2px solid #14213D;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          overflow: hidden;
        }

        .ownership-card {
          max-width: 1024px;
          margin-left: auto;
          margin-right: auto;
          margin-bottom: 24px;
        }

        .card-header {
          background-color: #14213D;
          color: #FFFFFF;
          padding: 20px;
        }

        .card-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .card-description {
          color: #E5E5E5;
          margin: 4px 0 0 0;
          font-size: 14px;
        }

        .card-content {
          padding: 24px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group:last-child {
          margin-bottom: 0;
        }

        .label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #14213D;
          font-size: 14px;
        }

        .input {
          width: 100%;
          padding: 14px;
          border: 2px solid #E5E5E5;
          border-radius: 8px;
          font-size: 16px;
          background-color: #FFFFFF;
          outline: none;
          transition: border-color 0.3s ease;
          box-sizing: border-box;
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
        }

        .input:focus {
          border-color: #FCA311;
        }

        .ownership-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .submit-container {
          text-align: center;
          max-width: 1024px;
          margin-left: auto;
          margin-right: auto;
        }

        .submit-button {
          background-color: #FCA311;
          color: #14213D;
          border: 2px solid #14213D;
          padding: 16px 32px;
          font-size: 18px;
          font-weight: bold;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.3s ease;
          min-height: 56px;
          margin: 0 auto;
        }

        .submit-button:hover:not(.disabled) {
          background-color: #e6930f;
          transform: translateY(-2px);
        }

        .submit-button.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        .error-card {
          background-color: #FFFFFF;
          border: 2px solid #dc2626;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          margin-top: 24px;
          max-width: 1024px;
          margin-left: auto;
          margin-right: auto;
        }

        .error-content {
          padding: 20px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          color: #dc2626;
        }

        .error-title {
          margin: 0 0 4px 0;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .error-message {
          margin: 0;
          font-size: 14px;
          color: #666;
        }

        .result-card {
          background-color: #FFFFFF;
          border: 2px solid #FCA311;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          overflow: hidden;
          margin-top: 32px;
          max-width: 1024px;
          margin-left: auto;
          margin-right: auto;
        }

        .result-header {
          background-color: #FCA311;
          color: #14213D;
          padding: 20px;
          text-align: center;
        }

        .result-title {
          margin: 0;
          font-size: 1.5rem;
          font-weight: bold;
        }

        .result-content {
          padding: 32px;
          text-align: center;
        }

        .result-price {
          font-size: 2.5rem;
          font-weight: bold;
          color: #14213D;
          margin-bottom: 8px;
          line-height: 1.2;
        }

        .result-description {
          color: #000000;
          margin: 0;
          font-size: 16px;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Mobile Responsive Styles */
        @media (max-width: 768px) {
          .container {
            padding: 12px;
          }

          .header-title {
            font-size: 1.8rem;
          }

          .header-subtitle {
            font-size: 1rem;
          }

          .header-icon {
            width: 36px;
            height: 36px;
          }

          .cards-grid {
            grid-template-columns: 1fr;
            gap: 16px;
            margin-bottom: 16px;
          }

          .card-header {
            padding: 16px;
          }

          .card-content {
            padding: 16px;
          }

          .card-title {
            font-size: 1.1rem;
          }

          .ownership-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .submit-button {
            width: 100%;
            max-width: 300px;
            padding: 14px 24px;
            font-size: 16px;
          }

          .result-content {
            padding: 24px 16px;
          }

          .result-price {
            font-size: 2rem;
          }

          .result-header {
            padding: 16px;
          }

          .error-content {
            padding: 16px;
          }
        }

        @media (max-width: 480px) {
          .header-content {
            flex-direction: column;
            gap: 8px;
          }

          .header-title {
            font-size: 1.5rem;
            text-align: center;
          }

          .header-subtitle {
            font-size: 0.9rem;
          }

          .card-header {
            padding: 12px;
          }

          .card-content {
            padding: 12px;
          }

          .input {
            padding: 12px;
            font-size: 16px;
          }

          .submit-button {
            padding: 12px 20px;
            font-size: 15px;
            min-height: 48px;
          }

          .result-price {
            font-size: 1.8rem;
          }

          .result-content {
            padding: 20px 12px;
          }

          .error-content {
            padding: 12px;
            flex-direction: column;
            gap: 8px;
          }
        }

        /* Very small screens */
        @media (max-width: 320px) {
          .cards-grid {
            grid-template-columns: 1fr;
          }

          .ownership-grid {
            grid-template-columns: 1fr;
          }

          .header-title {
            font-size: 1.3rem;
          }

          .result-price {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </>
  )
}
