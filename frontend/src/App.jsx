import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Signup from "./pages/Signup";
import Signin from "./pages/Signin";
import DealerProfile from "./pages/DealerProfile";
import CustomerProfile from "./pages/CustomerProfile";
import Catalogue from "./pages/Catalogue";
import AddCar from "./pages/AddCar";
import CarDetails from "./pages/CarDetails";
import Home from "./pages/Home";
import EditCar from "./pages/EditCar";
import Messenger from "./pages/messenger/Messenger";
import PredictPrice from './pages/PredictPrice';

import { useEffect, useState } from 'react';
import axios from "axios";

function App() {
  const location = useLocation();
  const [serverAwake, setServerAwake] = useState(false);

  useEffect(() => {
    const wakeServer = async () => {
      toast.info("Waking up server, please wait...");
      try {
        await axios.get(`${import.meta.env.VITE_BACKEND_URL}/user/health`);
        setServerAwake(true);
        toast.dismiss(); 
      } catch (err) {
        toast.error("Server is not responding. Please try again shortly.");
        console.error("Silent backend wake-up failed", err);
      }
    };

    wakeServer();
  }, []);

  const hideFooterOn = ["/messenger"];

  if (!serverAwake) {
    return (
      <>
        <ToastContainer position="top-right" autoClose={2000} />
        <div style={{ textAlign: 'center', marginTop: '20%' }}>
         <div style={{ textAlign: 'center', marginTop: '20%' }}>
        <h2>🚀 Starting up... Please wait</h2>
        <p style={{ marginTop: '1rem', fontSize: '1rem' }}>
          This happens because the backend server (hosted on Render free tier) goes to sleep after some inactivity.
        </p>
        <p style={{ marginTop: '0.5rem', fontSize: '1rem' }}>
          It usually takes 10–15 seconds to wake up. Thanks for your patience!
        </p>
</div>

        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/catalogue" element={<Catalogue />} />
        <Route path="/addcar" element={<AddCar />} />
        <Route path="/catalogue/:carId" element={<CarDetails />} />
        <Route path="/edit/:id" element={<EditCar />} />
        <Route path="/dealer" element={<DealerProfile />} />
        <Route path="/customer" element={<CustomerProfile />} />
        <Route path="/messenger" element={<Messenger />} />
        <Route path="/predict-price" element={<PredictPrice />} />
      </Routes>

      {!hideFooterOn.includes(location.pathname) && <Footer />}

      <ToastContainer position="top-right" autoClose={2000} />
    </>
  );
}

export default App;
