import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { ToastContainer } from 'react-toastify';
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
import { useEffect } from 'react';
import axios from "axios"

function App() {
  
  const location = useLocation();

  useEffect(() => {
    // Silent backend warm-up
    axios.get(`${import.meta.env.VITE_BACKEND_URL}/user/health`).catch((err) =>
      console.error("Silent backend wake-up failed", err)
    );
  }, []);

  
  const hideFooterOn = ["/messenger"];

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
