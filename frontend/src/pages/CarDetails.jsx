import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { useNavigate, useLocation } from 'react-router-dom';
const cityList = [
  { name: 'Delhi', coordinates: [77.1025, 28.7041] },
  { name: 'Mumbai', coordinates: [72.8777, 19.076] },
  { name: 'Bangalore', coordinates: [77.5946, 12.9716] },
  { name: 'Hyderabad', coordinates: [78.4867, 17.385] },
  { name: 'Ahmedabad', coordinates: [72.5714, 23.0225] },
  { name: 'Chennai', coordinates: [80.2707, 13.0827] },
  { name: 'Kolkata', coordinates: [88.3639, 22.5726] },
  { name: 'Pune', coordinates: [73.8567, 18.5204] },
  { name: 'Jaipur', coordinates: [75.7873, 26.9124] },
  { name: 'Chandigarh', coordinates: [76.7794, 30.7333] },
  { name: 'Mohali', coordinates: [76.7081, 30.7046] },
  { name: 'Noida', coordinates: [77.391, 28.5355] },
  { name: 'Lucknow', coordinates: [80.9462, 26.8467] },
  { name: 'Indore', coordinates: [75.8577, 22.7196] },
  { name: 'Nagpur', coordinates: [79.0882, 21.1458] },
  { name: 'Bhopal', coordinates: [77.4126, 23.2599] },
  { name: 'Surat', coordinates: [72.8311, 21.1702] },
  { name: 'Patna', coordinates: [85.1376, 25.5941] },
  { name: 'Gurgaon', coordinates: [77.0266, 28.4595] },
  { name: 'Amritsar', coordinates: [74.8723, 31.634] },
];

const CarDetails = () => {
  const { carId } = useParams();
  const [car, setCar] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [city, setCity] = useState('');
  const [dealername, setdealername] = useState(null)
  const { user } = useAuth();
  const commentRef = useRef();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
  fetchCar();
  fetchComments();
}, [carId]);

useEffect(() => {
  if (car && car.listedby) {
    fetchDealer();
  }
}, [car]);

  useEffect(() => {
    if (car?.location?.coordinates?.length === 2) {
      const [lng, lat] = car.location.coordinates;
      const nearest = getNearestCity(lat, lng);
      setCity(nearest);
    }
  }, [car]);

  const fetchCar = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/car/${carId}`);
      setCar(res.data.car);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDealer=async()=>{
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/user/getgeneraluser/${car.listedby}`);
      setdealername(res.data.user.username);
    } catch (err) {
      console.error(err);
    }
  }

  const fetchComments = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/car/comment/${carId}`, {
        headers: { token }
      });
      setComments(res.data.comments);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    }
  };

  const handleCommentSubmit = async () => {
    const comment = commentRef.current.value.trim();
    if (!comment) {
      toast.warn('Please enter a comment before submitting.');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/car/comment/${carId}`,
        { comment },
        { headers: { token } }
      );
      commentRef.current.value = '';
      toast.success('Comment submitted successfully!');
      fetchComments();
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast.error('Failed to submit comment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (num) => {
    if (num >= 1e7) return `₹${(num / 1e7).toFixed(2)} Cr`;
    if (num >= 1e5) return `₹${(num / 1e5).toFixed(2)} Lakh`;
    return `₹${num.toLocaleString()}`;
  };

  const getNearestCity = (lat, lon) => {
    let minDist = Infinity;
    let nearestCity = 'Unknown';
    for (let city of cityList) {
      const [clon, clat] = city.coordinates;
      const dist = Math.sqrt(Math.pow(lat - clat, 2) + Math.pow(lon - clon, 2));
      if (dist < minDist) {
        minDist = dist;
        nearestCity = city.name;
      }
    }
    return nearestCity;
  };

  const handleChatWithDealer = async () => {

   
  if (!user) {
    toast.warn("Please sign in to start a conversation.");
    return;
  }

  
  if (user.role === "dealer") {
    toast.error("Dealers cannot start conversations with other dealers.");
    return;
  }

  
  if (user.userId === car.listedby) {
    toast.info("You cannot start a conversation with yourself.");
    return;
  }
  try {
    const res = await axios.get(
      `${import.meta.env.VITE_BACKEND_URL}/conversation/find/${user.userId}/${car.listedby}`
    );

    const conversation = res.data;
    console.log("Conversation:", conversation);

    toast(`Click on "${dealername}" in the left sidebar to start chatting with the dealer.`,{
  autoClose: 6000  
});

     navigate(`/messenger`);

  } catch (err) {
    console.log("Error in handling chat with dealer:", err);
  }
};

  const handleBuyCar = async () => {
    if (!user) {
      toast.info("Please sign in to buy a car.");
      navigate('/signin', { state: { from: location.pathname } });
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to pay a booking amount of ₹10,000 to reserve "${car.name}"? You will be redirected to the payment gateway.`);
    if (!confirmed) return;

    try {
      const token = localStorage.getItem('token');

      // Step 1: Create order & reserve car
      const orderRes = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/payment/create-order/${carId}`,
        {},
        { headers: { token } }
      );

      const { orderId, amount, currency, carName, key } = orderRes.data;

      // Track if payment started to avoid race condition in ondismiss
      let paymentProcessed = false;

      // Step 2: Open Razorpay Checkout
      const options = {
        key,
        amount,
        currency,
        name: "DriveCircle",
        description: `Booking Amount for: ${carName}`,
        order_id: orderId,
        handler: async function (response) {
          paymentProcessed = true;
          // Step 3: Verify payment
          try {
            const verifyRes = await axios.post(
              `${import.meta.env.VITE_BACKEND_URL}/payment/verify-payment`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              { headers: { token } }
            );
            toast.success(verifyRes.data.message || "Payment successful!");
            fetchCar();
          } catch (verifyErr) {
            toast.error(verifyErr.response?.data?.message || "Payment verification failed.");
            fetchCar(); // Refresh status
          }
        },
        modal: {
          ondismiss: async function () {
            // User closed the modal without paying — release the reservation
            // ONLY if payment wasn't already processed/verified
            if (!paymentProcessed) {
              try {
                await axios.post(
                  `${import.meta.env.VITE_BACKEND_URL}/payment/cancel-order/${carId}`,
                  {},
                  { headers: { token } }
                );
              } catch (cancelErr) {
                console.error("Failed to cancel reservation:", cancelErr);
              }
              toast.info("Payment cancelled.");
              fetchCar();
            }
          },
        },
        prefill: {
          email: user.email || "",
        },
        theme: {
          color: "#FCA311",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", async function (response) {
        toast.error("Payment failed: " + (response.error?.description || "Unknown error"));
        try {
          await axios.post(
            `${import.meta.env.VITE_BACKEND_URL}/payment/cancel-order/${carId}`,
            {},
            { headers: { token } }
          );
        } catch (cancelErr) {
          console.error("Failed to cancel reservation on failure:", cancelErr);
        }
        fetchCar();
      });
      rzp.open();
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to initiate payment.";
      toast.error(msg);
    }
  };

  if (!car) return <p>Loading car details...</p>;

  // Determine buy button state
  const isReservedByOther = car.paymentStatus === 'pending' && car.reservedBy !== user?.userId;
  const isSold = car.sold || car.paymentStatus === 'sold';

  return (
    <div className="flex justify-center items-start min-h-screen bg-gray-50 py-10">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{car.name}</h1>
          <p className="text-lg text-yellow mb-6">{car.brand}</p>

          <div className="flex justify-center mb-6 relative">
            {car.image && car.image.length > 0 && (
              <img
                src={car.image[currentImageIndex]}
                className="w-full max-w-md rounded-lg shadow-sm border border-gray-200"
                alt={car.name}
              />
            )}

            {car.image?.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setCurrentImageIndex((prev) => (prev - 1 + car.image.length) % car.image.length)
                  }
                  className="absolute top-1/2 left-0 transform -translate-y-1/2 px-3 py-2 bg-white bg-opacity-70 hover:bg-opacity-90 text-xl font-bold rounded-r shadow"
                >
                  ‹
                </button>
                <button
                  onClick={() =>
                    setCurrentImageIndex((prev) => (prev + 1) % car.image.length)
                  }
                  className="absolute top-1/2 right-0 transform -translate-y-1/2 px-3 py-2 bg-white bg-opacity-70 hover:bg-opacity-90 text-xl font-bold rounded-l shadow"
                >
                  ›
                </button>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-semibold text-gray-700">Price:</p>
              <p className="text-lg font-bold text-yellow">{formatPrice(car.price)}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-semibold text-gray-700">Fuel Type:</p>
              <p className="text-gray-800">{car.fuelType}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-semibold text-gray-700">Transmission:</p>
              <p className="text-gray-800">{car.transmission}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-semibold text-gray-700">Seating Capacity:</p>
              <p className="text-gray-800">{car.seats} seats</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-semibold text-gray-700">Manufacturing Year:</p>
              <p className="text-gray-800">{car.year}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-semibold text-gray-700">Vehicle Category:</p>
              <p className="text-gray-800">{car.category}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-semibold text-gray-700">City:</p>
              <p className="text-gray-800">{city}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
            <p className="font-semibold text-gray-700">Dealer Name:</p>
            <p className="text-gray-800">{dealername || "Loading..."}</p>
          </div>
          </div>

          <div className="flex gap-4 justify-center flex-wrap">
            <button onClick={handleChatWithDealer} className="bg-yellow hover:bg-blue text-white font-bold py-3 px-6 rounded-lg transition duration-200">
              Chat with dealer
            </button>

            {(!user || user?.role === 'customer') && (
              isSold ? (
                <span className="bg-red-100 text-red-700 font-bold py-3 px-6 rounded-lg border border-red-300 cursor-not-allowed">
                  Sold Out
                </span>
              ) : isReservedByOther ? (
                <span className="bg-yellow-100 text-yellow-800 font-bold py-3 px-6 rounded-lg border border-yellow-300 cursor-not-allowed">
                  ⏳ Checkout in progress...
                </span>
              ) : (
                <button
                  onClick={handleBuyCar}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                    <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                  </svg>
                  Buy This Car
                </button>
              )
            )}
          </div>


          {user?.role === 'customer' && (
            <div className="space-y-2 mt-6 text-left">
              <h3 className="text-lg font-semibold text-[#14213D]">Leave a Comment</h3>
              <textarea
                ref={commentRef}
                placeholder="Write your comment..."
                className="w-full border border-gray-300 rounded-md p-2 resize-none"
                rows="3"
              ></textarea>
              <button
                onClick={handleCommentSubmit}
                className="bg-yellow text-white font-semibold px-4 py-2 rounded hover:bg-blue transition duration-200 disabled:opacity-60"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Comment'}
              </button>
            </div>
          )}

          <div className="mt-10 text-left">
            <h3 className="text-xl font-semibold text-[#14213D] mb-4">Comments</h3>
            {comments.length === 0 ? (
              <p className="text-gray-500">No comments yet.</p>
            ) : (
              <div className="space-y-4">
                {comments.map((comment, index) => (
                  <div
                    key={index}
                    className="flex items-start bg-gray-100 p-4 rounded-lg shadow-sm"
                  >
                    <img
                      src={
                        comment.user?.profilePic ||
                        "https://res.cloudinary.com/decprn8rm/image/upload/v1750436169/Screenshot_2025-06-20_214548_lwtrzl.png"
                      }
                      alt="User profile"
                      className="w-10 h-10 rounded-full mr-4 object-cover border border-gray-300"
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-800 mb-1">
                        {comment.user?.username || "Anonymous"}
                      </p>
                      <p className="text-gray-700 text-sm">{comment.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarDetails;
