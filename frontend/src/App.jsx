import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Signup from "./pages/Signup";
import Signin from "./pages/Signin";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import DealerProfile from "./pages/DealerProfile";
import CustomerProfile from "./pages/CustomerProfile";
import Catalogue from "./pages/Catalogue";
import AddCar from "./pages/AddCar";
import CarDetails from "./pages/CarDetails";
import Home from "./pages/Home";
import EditCar from "./pages/EditCar";
import Messenger from "./pages/messenger/Messenger";
import PredictPrice from './pages/PredictPrice';
import UploadProgressPanel from './components/UploadProgressPanel';
import { useAuth } from './context/AuthContext';

import { useEffect, useState } from 'react';
import axios from "axios";

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 503) {
      if (error.response.data && error.response.data.errorType === 'server_overload') {
        toast.error(error.response.data.message, { toastId: 'load-shedding-toast' });
      }
    }
    return Promise.reject(error);
  }
);
function App() {
  const location = useLocation();
  const { loading: authLoading } = useAuth();
  const [serverAwake, setServerAwake] = useState(false);

  useEffect(() => {
    const wakeServer = async () => {
      try {
        await axios.get(`${import.meta.env.VITE_BACKEND_URL}/user/health`);
        setServerAwake(true);
      } catch (err) {
        console.error("Silent backend wake-up failed", err);
      }
    };

    wakeServer();
  }, []);

  const hideFooterOn = ["/messenger"];

  // Show the wake-up / loading screen while backend is starting or auth is resolving
  if (!serverAwake || authLoading) {
    return (
      <>
        <ToastContainer position="top-right" autoClose={2000} />
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          background: 'linear-gradient(135deg, #14213D 0%, #1a2d50 100%)',
          color: '#FFFFFF',
          padding: '2rem',
          textAlign: 'center',
        }}>
          {/* Animated spinner */}
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid rgba(252, 163, 17, 0.3)',
            borderTop: '4px solid #FCA311',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '1.5rem',
          }} />
          <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem', fontWeight: 600 }}>
            🚀 Starting up... Please wait
          </h2>
          <p style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', opacity: 0.85, maxWidth: '420px' }}>
            This happens because the backend server (hosted on Render free tier) goes to sleep after some inactivity.
          </p>
          <p style={{ margin: 0, fontSize: '1rem', opacity: 0.85, maxWidth: '420px' }}>
            It usually takes 10–15 seconds to wake up. Thanks for your patience!
          </p>

          {/* Inline keyframes for the spinner */}
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
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
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
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
      <UploadProgressPanel />
    </>
  );
}

export default App;

