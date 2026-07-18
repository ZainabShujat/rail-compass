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
  const [welcomeMessage, setWelcomeMessage] = useState('');



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
      const res = await axios.get(`/api/auth/me`);
      const fetchedUser = res.data.user;
      
      const savedUsers = JSON.parse(localStorage.getItem('railwise_users') || '{}');
      const userKey = fetchedUser.email || fetchedUser.googleId;
      if (userKey && savedUsers[userKey] && !fetchedUser.isOnboarded) {
        fetchedUser.preferences = savedUsers[userKey].preferences;
        fetchedUser.isOnboarded = savedUsers[userKey].isOnboarded;
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
    const userKey = userData.email || userData.googleId;
    if (userKey && savedUsers[userKey] && !userData.isOnboarded) {
      userData.preferences = savedUsers[userKey].preferences;
      userData.isOnboarded = savedUsers[userKey].isOnboarded;
      
      // Update backend token silently
      axios.post(`/api/auth/onboarding`, { preferences: userData.preferences }, { headers: { Authorization: `Bearer ${newToken}` } }).then(res => {
        if (res.data.token) {
          localStorage.setItem('token', res.data.token);
          setToken(res.data.token);
        }
      }).catch(console.error);
    }

    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
    
    setWelcomeMessage(`Hi, ${userData.name || 'Traveler'}! Welcome aboard.`);
    setTimeout(() => setWelcomeMessage(''), 4000);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const updatePreferences = async (preferences) => {
    try {
      const res = await axios.post(`/api/auth/onboarding`, { preferences });
      
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      }
      
      const updatedUser = res.data.user;
      const userKey = updatedUser.email || updatedUser.googleId;
      const savedUsers = JSON.parse(localStorage.getItem('railwise_users') || '{}');
      if (userKey) {
        savedUsers[userKey] = {
          preferences: updatedUser.preferences,
          isOnboarded: updatedUser.isOnboarded
        };
        localStorage.setItem('railwise_users', JSON.stringify(savedUsers));
      }
      
      setUser(updatedUser);
      return updatedUser;
    } catch (err) {
      console.error('Failed to update preferences', err);
      throw err;
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const res = await axios.put(`/api/auth/profile`, profileData);
      
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      }
      
      const updatedUser = res.data.user;
      const userKey = updatedUser.email || updatedUser.googleId;
      const savedUsers = JSON.parse(localStorage.getItem('railwise_users') || '{}');
      if (userKey) {
        savedUsers[userKey] = {
          preferences: updatedUser.preferences,
          isOnboarded: updatedUser.isOnboarded
        };
        localStorage.setItem('railwise_users', JSON.stringify(savedUsers));
      }
      
      setUser(updatedUser);
      return updatedUser;
    } catch (err) {
      console.error('Failed to update profile', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updatePreferences, updateProfile, welcomeMessage }}>
      {children}
    </AuthContext.Provider>
  );
}
