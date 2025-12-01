import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/authService';
import { User, AuthResponse, CompanyUser } from '../types';
import { storage } from '../utils/storage';
import { STORAGE_KEYS } from '../constants/config';

interface AuthContextType {
  user: User | null;
  companies: CompanyUser[];
  activeCompanyId: string | null;
  activeRole: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  switchCompany: (companyId: string, role: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [companies, setCompanies] = useState<CompanyUser[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await storage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (token) {
        const savedUser = await storage.getObject<User>(STORAGE_KEYS.USER);
        const companyId = await storage.getItem(STORAGE_KEYS.ACTIVE_COMPANY);
        const role = await storage.getItem(STORAGE_KEYS.ACTIVE_ROLE);

        if (savedUser) {
          setUser(savedUser);
          setActiveCompanyId(companyId);
          setActiveRole(role);
        }
      }
    } catch (error) {
      console.log('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthResponse = async (data: AuthResponse) => {
    setUser(data.user);
    setCompanies(data.companies || []);
    
    if (data.companies && data.companies.length > 0) {
      setActiveCompanyId(data.companies[0].companyId);
      setActiveRole(data.companies[0].role);
    }
  };

  const login = async (email: string, password: string) => {
    const data = await authService.login(email, password);
    await handleAuthResponse(data);
  };

  const register = async (name: string, email: string, password: string) => {
    const data = await authService.register(name, email, password);
    await handleAuthResponse(data);
  };

  const googleLogin = async (idToken: string) => {
    const data = await authService.googleLogin(idToken);
    await handleAuthResponse(data);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setCompanies([]);
    setActiveCompanyId(null);
    setActiveRole(null);
  };

  const updateProfile = async (data: Partial<User>) => {
    const updatedUser = await authService.updateProfile(data);
    setUser(updatedUser);
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    await authService.changePassword(oldPassword, newPassword);
  };

  const switchCompany = async (companyId: string, role: string) => {
    await storage.setItem(STORAGE_KEYS.ACTIVE_COMPANY, companyId);
    await storage.setItem(STORAGE_KEYS.ACTIVE_ROLE, role);
    setActiveCompanyId(companyId);
    setActiveRole(role);
  };

  const refreshUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      }
    } catch (error) {
      console.log('Refresh user error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        companies,
        activeCompanyId,
        activeRole,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        googleLogin,
        logout,
        updateProfile,
        changePassword,
        switchCompany,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
