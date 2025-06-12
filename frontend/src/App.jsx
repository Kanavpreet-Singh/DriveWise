import Navbar from "./components/Navbar"
import { Routes, Route } from 'react-router-dom';
import Signup from "./pages/Signup";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
function App() {
  

  return (
    <>
      <Navbar/>
      <Routes>
      <Route path="/signup" element={<Signup/>} />
      </Routes>

      <ToastContainer position="top-right" autoClose={2000} />
      
    </>
  )
}

export default App
