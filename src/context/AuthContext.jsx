import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [adminRecord, setAdminRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [googleClientId, setGoogleClientId] = useState(
    localStorage.getItem('kce_sdc_google_client_id') || ""
  );

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('kce_sdc_user');
    const storedAdmin = localStorage.getItem('kce_sdc_admin_record');
    
    if (storedUser && storedAdmin) {
      setUser(JSON.parse(storedUser));
      setAdminRecord(JSON.parse(storedAdmin));
    }
    setLoading(false);
  }, []);

  // Update client ID helper
  const updateGoogleClientId = (clientId) => {
    setGoogleClientId(clientId);
    if (clientId) {
      localStorage.setItem('kce_sdc_google_client_id', clientId);
    } else {
      localStorage.removeItem('kce_sdc_google_client_id');
    }
  };

  // Google Login Token Handler
  const handleGoogleLoginSuccess = async (credentialResponse) => {
    setLoading(true);
    setError(null);
    try {
      const token = credentialResponse.credential;
      // Decode JWT token
      const payload = JSON.parse(atob(token.split('.')[1]));
      const { email, name, picture } = payload;

      // Verify email with database
      const dbResponse = await api.getAdmin(email);
      
      if (dbResponse.error) {
        throw new Error(dbResponse.message || "You are not authorized as an administrator.");
      }

      const admin = dbResponse.admin;
      if (admin.Status !== 'Active') {
        throw new Error("Your administrator account is inactive. Please contact the Super Admin.");
      }

      const userData = { email, name, picture };
      setUser(userData);
      setAdminRecord(admin);

      localStorage.setItem('kce_sdc_user', JSON.stringify(userData));
      localStorage.setItem('kce_sdc_admin_record', JSON.stringify(admin));
      return { success: true };
    } catch (err) {
      console.error("Login Error:", err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Demo Login (for easier development/evaluation)
  const loginAsDemo = async (email) => {
    setLoading(true);
    setError(null);
    try {
      const dbResponse = await api.getAdmin(email);
      
      if (dbResponse.error) {
        throw new Error(dbResponse.message || "Unauthorized: Admin record not found");
      }

      const admin = dbResponse.admin;
      if (admin.Status !== 'Active') {
        throw new Error("This admin account is inactive.");
      }

      const userData = {
        email: admin.Email,
        name: admin.Name,
        picture: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(admin.Name)}`
      };

      setUser(userData);
      setAdminRecord(admin);

      localStorage.setItem('kce_sdc_user', JSON.stringify(userData));
      localStorage.setItem('kce_sdc_admin_record', JSON.stringify(admin));
      return { success: true };
    } catch (err) {
      console.error("Demo Login Error:", err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setAdminRecord(null);
    localStorage.removeItem('kce_sdc_user');
    localStorage.removeItem('kce_sdc_admin_record');
  };

  const isSuperAdmin = adminRecord?.Role === 'Super Admin';
  const isAdmin = adminRecord?.Role === 'Admin' || isSuperAdmin;

  return (
    <AuthContext.Provider value={{
      user,
      adminRecord,
      loading,
      error,
      googleClientId,
      updateGoogleClientId,
      handleGoogleLoginSuccess,
      loginAsDemo,
      logout,
      isSuperAdmin,
      isAdmin,
      setError
    }}>
      {children}
    </AuthContext.Provider>
  );
};
