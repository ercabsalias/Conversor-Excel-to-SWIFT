/**
 * useAuth Hook
 * Manages authentication state
 */

import { useEffect, useState } from 'react';

export interface User {
  userId: string;
  companyId: string;
  token: string;
  // additional profile info
  id?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('auth_token');
    const userId = localStorage.getItem('auth_userId');
    const companyId = localStorage.getItem('auth_companyId');
    const profileStr = localStorage.getItem('auth_user_profile');
    let profile: Partial<User> = {};
    if (profileStr) {
      try {
        profile = JSON.parse(profileStr);
      } catch {}
    }

    if (token && userId && companyId) {
      setUser({ token, userId, companyId, ...profile });
    }

    setLoading(false);
  }, []);

  const login = (userData: User) => {
    localStorage.setItem('auth_token', userData.token);
    localStorage.setItem('auth_userId', userData.userId);
    localStorage.setItem('auth_companyId', userData.companyId);
    // store profile info too
    localStorage.setItem('auth_user_profile', JSON.stringify({
      id: userData.id,
      username: userData.username,
      firstName: userData.firstName,
      lastName: userData.lastName,
    }));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_userId');
    localStorage.removeItem('auth_companyId');
    localStorage.removeItem('auth_user_profile');
    setUser(null);
  };

  return { user, loading, login, logout, isAuthenticated: !!user };
};
