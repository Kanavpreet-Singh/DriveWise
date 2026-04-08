import { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from 'jwt-decode';


const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const validateToken = (token) => {
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 < Date.now()) {
          console.warn("Token expired");
          localStorage.removeItem("token");
          return null;
        }
        return decoded;
      } catch (err) {
        console.error("Invalid token");
        localStorage.removeItem("token");
        return null;
      }
    };

    const token = localStorage.getItem("token");
    if (token) {
      const decoded = validateToken(token);
      if (decoded) {
        setIsLoggedIn(true);
        setUser(decoded);
      } else {
        setIsLoggedIn(false);
        setUser(null);
      }
    }

    const syncAuth = () => {
      const currentToken = localStorage.getItem("token");
      if (currentToken) {
        const decoded = validateToken(currentToken);
        if (decoded) {
          setIsLoggedIn(true);
          setUser(decoded);
        } else {
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
    try {
      const decoded = jwtDecode(token);
      if (decoded.exp * 1000 < Date.now()) {
        console.error("Attempted login with expired token");
        return;
      }
      localStorage.setItem("token", token);
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
