import { createContext, useContext, useState, useEffect } from "react";
import axios from 'axios';

const backend_url = import.meta.env.VITE_BACKEND_URL;
axios.defaults.withCredentials = true;

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync user state with the backend on mount
  useEffect(() => {
    localStorage.removeItem("token");
    const checkAuth = async () => {
      try {
        const response = await axios.get(`${backend_url}/user/me`);
        if (response.data.user) {
          setIsLoggedIn(true);
          // Format user data to match what components expect (id -> _id consistency)
          const userData = response.data.user;
          setUser({
            userId: userData._id,
            email: userData.email,
            username: userData.username,
            role: userData.role,
            profilePic: userData.profilePic
          });
        }
      } catch (err) {
        console.log("No active session found");
        setIsLoggedIn(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (userData) => {
    // Expecting userData from the backend response (excluding token)
    setIsLoggedIn(true);
    setUser({
      userId: userData.id || userData._id,
      email: userData.email,
      username: userData.username,
      role: userData.role,
      profilePic: userData.profilePic
    });
  };

  const logout = async () => {
    try {
      await axios.post(`${backend_url}/user/logout`);
    } catch (err) {
      console.error("Logout failed on server, clearing local state anyway");
    } finally {
      setIsLoggedIn(false);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
