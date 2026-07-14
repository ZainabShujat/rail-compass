import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.PROD ? '' : 'http://localhost:5000';

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/auth/me`);
      setUser(res.data.user);
    } catch (err) {
      console.error('Error fetching user', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = (newToken, userData) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const updatePreferences = async (preferences) => {
    try {
      const res = await axios.post(`${API_URL}/api/auth/onboarding`, { preferences });
      setUser(res.data.user);
      return res.data.user;
    } catch (err) {
      console.error('Failed to update preferences', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updatePreferences }}>
      {children}
    </AuthContext.Provider>
  );
}
