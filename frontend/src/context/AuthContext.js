import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [team, setTeam] = useState(null);
  const [role, setRole] = useState(null); // 'team' | 'admin'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('kalchakra_token');
    const savedRole = localStorage.getItem('kalchakra_role');
    if (token && savedRole === 'team') {
      getMe()
        .then(res => { setTeam(res.data.team); setRole('team'); })
        .catch(() => { localStorage.removeItem('kalchakra_token'); })
        .finally(() => setLoading(false));
    } else if (savedRole === 'admin') {
      setRole('admin');
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  const loginTeam = (token, teamData) => {
    localStorage.setItem('kalchakra_token', token);
    localStorage.setItem('kalchakra_role', 'team');
    setTeam(teamData);
    setRole('team');
  };

  const loginAdmin = (key) => {
    localStorage.setItem('kalchakra_admin_key', key);
    localStorage.setItem('kalchakra_role', 'admin');
    setRole('admin');
  };

  const logoutUser = () => {
    localStorage.removeItem('kalchakra_token');
    localStorage.removeItem('kalchakra_role');
    localStorage.removeItem('kalchakra_admin_key');
    setTeam(null);
    setRole(null);
  };

  const updateTeam = (updates) => setTeam(prev => ({ ...prev, ...updates }));

  return (
    <AuthContext.Provider value={{ team, role, loading, loginTeam, loginAdmin, logoutUser, updateTeam }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
