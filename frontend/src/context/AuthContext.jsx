import { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from 'jwt-decode';


const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setIsLoggedIn(true);
        setUser(decoded); 
      } catch (err) {
        console.error("Invalid token");
        localStorage.removeItem("token");
      }
    }

    const syncAuth = () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const decoded = jwtDecode(token);
          setIsLoggedIn(true);
          setUser(decoded);
        } catch {
          setIsLoggedIn(false);
          setUser(null);
        }
      } else {
        setIsLoggedIn(false);
        setUser(null);
      }
    };

    window.addEventListener("storage", syncAuth);
    return () => window.removeEventListener("storage", syncAuth);
  }, []);

  const login = (token) => {
    localStorage.setItem("token", token);
    try {
      const decoded = jwtDecode(token);
      setIsLoggedIn(true);
      setUser(decoded);
    } catch {
      console.error("Invalid token");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
