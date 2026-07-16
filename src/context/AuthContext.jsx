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
      const fetchedUser = res.data.user;
      
      const savedUsers = JSON.parse(localStorage.getItem('railwise_users') || '{}');
      if (savedUsers[fetchedUser.googleId] && !fetchedUser.isOnboarded) {
        fetchedUser.preferences = savedUsers[fetchedUser.googleId].preferences;
        fetchedUser.isOnboarded = savedUsers[fetchedUser.googleId].isOnboarded;
      }
      
      setUser(fetchedUser);
    } catch (err) {
      console.error('Error fetching user', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = (newToken, userData) => {
    const savedUsers = JSON.parse(localStorage.getItem('railwise_users') || '{}');
    if (savedUsers[userData.googleId] && !userData.isOnboarded) {
      userData.preferences = savedUsers[userData.googleId].preferences;
      userData.isOnboarded = savedUsers[userData.googleId].isOnboarded;
      
      // Update backend token silently
      axios.post(`${API_URL}/api/auth/onboarding`, { preferences: userData.preferences }).then(res => {
        if (res.data.token) {
          localStorage.setItem('token', res.data.token);
          setToken(res.data.token);
        }
      }).catch(console.error);
    }

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
      
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      }
      
      const updatedUser = res.data.user;
      
      const savedUsers = JSON.parse(localStorage.getItem('railwise_users') || '{}');
      savedUsers[updatedUser.googleId] = {
        preferences: updatedUser.preferences,
        isOnboarded: updatedUser.isOnboarded
      };
      localStorage.setItem('railwise_users', JSON.stringify(savedUsers));
      
      setUser(updatedUser);
      return updatedUser;
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
