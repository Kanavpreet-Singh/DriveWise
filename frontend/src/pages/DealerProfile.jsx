import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const DealerProfile = () => {
  const navigate = useNavigate();
  const backend_url = import.meta.env.VITE_BACKEND_URL;
  const [user, setUser] = useState(null);
  const [cars, setCars] = useState([]);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
  const confirmed = window.confirm("Are you sure you want to delete your account? This action is irreversible.");
  if (!confirmed) return;

  try {
    setDeleting(true);
    const token = localStorage.getItem("token");

    const res = await axios.delete(`${backend_url}/user/`, {
      headers: {
        token: token  
      }
    });

    toast.success(res.data.message || "Account deleted successfully.");
    localStorage.removeItem("token");
    navigate("/signin");
  } catch (error) {
    console.error(error);
    toast.error("Failed to delete account.");
  } finally {
    setDeleting(false);
  }
};

  useEffect(() => {
    const fetchDealerInfo = async () => {
      try {
        const token = localStorage.getItem('token');

        if (!token) {
          toast.error("Please login to access this page.");
          navigate('/signin');
          return;
        }

        const res = await axios.get(`${backend_url}/user/dealer`, {
          headers: { token }
        });

        setUser(res.data.dealer);
        setCars(res.data.cars);
      } catch (error) {
        console.error(error);
        toast.error("Error fetching dealer data.");
      }
    };

    fetchDealerInfo();
  }, []);

  if (!user) return <p className="text-center text-gray-600">Loading...</p>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-[#14213D] mb-4">Dealer Profile</h1>
      <div className="flex flex-col sm:flex-row items-center bg-[#E5E5E5] p-6 rounded-lg shadow mb-10">
  <img
    src={user.profilePic || "https://res.cloudinary.com/demo/image/upload/v1234567890/default_profile.jpg"}
    alt="Dealer"
    className="w-32 h-32 rounded-full border-2 border-[#FCA311] object-cover mb-4 sm:mb-0 sm:mr-6"
    loading="lazy"
  />
  <div className="text-center sm:text-left">
    <p className="text-xl font-semibold text-[#14213D]">{user.username}</p>
    <p className="text-gray-700">{user.email}</p>
  </div>
</div>


      <h2 className="text-2xl mt-8 mb-4 font-semibold text-[#14213D]">Your Listed Cars</h2>

      {cars.length === 0 ? (
        <p className="text-gray-600">No cars listed yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {cars.map((car) => (
            <div
              key={car._id}
              className="bg-white border border-[#E5E5E5] rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105"
            >
              <img
                src={Array.isArray(car.image) ? car.image[0] : car.image}
                alt={car.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-4 space-y-2">
                <h3 className="text-lg font-semibold text-[#14213D]">{car.name}</h3>
                <p className="text-sm text-[#14213D]">{car.brand}</p>
               <p className="text-sm text-[#14213D]">₹{(car.price / 100000).toFixed(2)} Lakh</p>

                <p className="text-xs text-gray-600">
                  {car.fuelType} | {car.transmission} | {car.year} | {car.seats} seats
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Wishlist Section */}
      <h2 className="text-2xl mt-12 mb-4 font-semibold text-[#14213D]">Your Wishlist</h2>
      {user.likedlist && user.likedlist.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="py-2 px-4">Car Name</th>
                <th className="py-2 px-4">Brand</th>
                <th className="py-2 px-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {user.likedlist.map((car) => (
                <tr key={car._id} className="border-t">
                  <td className="py-2 px-4">{car.name}</td>
                  <td className="py-2 px-4">{car.brand}</td>
                  <td className="py-2 px-4">
                    <button
                      onClick={() => navigate(`/catalogue/${car._id}`)}
                      className="bg-[#FCA311] text-white px-3 py-1 rounded hover:bg-[#e59400] transition"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-600">You haven't liked any cars yet.</p>
      )}

      <div className="mt-10 text-center">
  <button
    onClick={handleDeleteAccount}
    className={`px-5 py-2 rounded text-white transition ${
      deleting ? "bg-gray-500 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
    }`}
    disabled={deleting}
  >
    {deleting ? "Deleting Account..." : "Delete My Account"}
  </button>
</div>
    </div>
  );
};

export default DealerProfile;
