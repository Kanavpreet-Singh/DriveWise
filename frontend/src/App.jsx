import Navbar from "./components/Navbar"
import { Routes, Route } from 'react-router-dom';
import Signup from "./pages/Signup";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Signin from "./pages/Signin";
import CarCard from "./components/CarCard";
import DealerProfile from "./pages/DealerProfile";
import CustomerProfile from "./pages/CustomerProfile";
import Catalogue from "./pages/Catalogue";
import AddCar from "./pages/AddCar";
import CarDetails from "./pages/CarDetails";
function App() {
  

  return (
    <>
      <Navbar/>
      <Routes>
      <Route path="/signup" element={<Signup/>} />
      <Route path="/signin" element={<Signin/>} />
      <Route path="/catalogue" element={<Catalogue/>} />
      <Route path="/addcar" element={<AddCar/>} />
      <Route path="/catalogue/:carId" element={<CarDetails />} />
      <Route path="/dealer" element={<DealerProfile/>} />
      <Route path="/customer" element={<CustomerProfile/>} />
      </Routes>

      <ToastContainer position="top-right" autoClose={2000} />

    </>
  )
}

export default App
