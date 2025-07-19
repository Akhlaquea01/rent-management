import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = () => {
      const auth = localStorage.getItem("rentManagementAuth");
      const authTime = localStorage.getItem("rentManagementAuthTime");
      
      if (auth === "true" && authTime) {
        // Check if authentication is not older than 24 hours
        const now = Date.now();
        const authTimestamp = parseInt(authTime);
        const hoursSinceAuth = (now - authTimestamp) / (1000 * 60 * 60);
        
        if (hoursSinceAuth < 24) {
          setIsAuthenticated(true);
        } else {
          // Clear expired authentication
          localStorage.removeItem("rentManagementAuth");
          localStorage.removeItem("rentManagementAuthTime");
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  const login = () => {
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem("rentManagementAuth");
    localStorage.removeItem("rentManagementAuthTime");
    setIsAuthenticated(false);
  };

  const contextValue: AuthContextType = {
    isAuthenticated,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}; 