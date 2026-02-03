// src/context/AuthContext.tsx - FIXED WITH updateUser METHOD
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { setAuthToken } from '../utils/api';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  bio?: string;
  location?: string;
  points?: number;
  rating?: number;
  totalBorrows?: number;
  totalLends?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void; // 🆕 NEW METHOD
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load auth state from localStorage on mount
  useEffect(() => {
    const loadAuthState = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');

        console.log('Loading auth state:', { 
          hasUser: !!storedUser, 
          hasToken: !!storedToken 
        });

        if (storedUser && storedToken) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setToken(storedToken);
          // CRITICAL: Set token in API client
          setAuthToken(storedToken);
          console.log('Auth state loaded successfully');
        } else {
          console.log('No stored auth state found');
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
        // Clear invalid data
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    loadAuthState();
  }, []);

  const login = (userData: User, sessionToken: string) => {
    console.log('Logging in user:', userData.email);
    
    // Save to state
    setUser(userData);
    setToken(sessionToken);
    
    // Save to localStorage for persistence
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', sessionToken);
    
    // Set token in API client
    setAuthToken(sessionToken);
    
    console.log('Login successful, token saved');
  };

  const logout = () => {
    console.log('Logging out user');
    
    // Clear state
    setUser(null);
    setToken(null);
    
    // Clear localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    
    // Clear token from API client
    setAuthToken(null);
    
    // Redirect to login
    router.push('/login');
  };

  // 🆕 NEW METHOD: Update user data
  const updateUser = (userData: Partial<User>) => {
    if (!user) return;

    const updatedUser = { ...user, ...userData };
    
    // Update state
    setUser(updatedUser);
    
    // Update localStorage
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    console.log('User updated:', updatedUser);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login, 
      logout, 
      updateUser, // 🆕 EXPOSE NEW METHOD
      isAuthenticated: !!user,
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}