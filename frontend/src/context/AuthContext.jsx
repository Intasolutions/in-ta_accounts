import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkToken();
  }, []);

  const checkToken = async () => {
    const token = sessionStorage.getItem('access_token');
    const loginTime = sessionStorage.getItem('login_timestamp');
    const now = new Date().getTime();
    
    if (token && loginTime) {
      const timePassed = now - parseInt(loginTime, 10);
      const sixHours = 6 * 60 * 60 * 1000;
      
      if (timePassed >= sixHours) {
        logout();
        setLoading(false);
        return;
      }
      
      // Auto logout when 6 hours are reached while app is open
      setTimeout(() => {
        logout();
        window.location.href = '/login';
      }, sixHours - timePassed);

      try {
        const decoded = jwtDecode(token);
        // We'll fetch the full user profile to get the role
        const res = await api.get(`users/${decoded.user_id}/`);
        setUser(res.data);
      } catch (err) {
        console.error("Invalid token", err);
        logout();
      }
    } else if (token && !loginTime) {
      logout();
    }
    setLoading(false);
  };

  const login = async (username, password) => {
    const res = await api.post('token/', { username, password });
    sessionStorage.setItem('access_token', res.data.access);
    sessionStorage.setItem('refresh_token', res.data.refresh);
    sessionStorage.setItem('login_timestamp', new Date().getTime().toString());
    await checkToken();
  };

  const logout = () => {
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('login_timestamp');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
