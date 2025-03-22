import { createContext, useState, useContext, useEffect } from 'react';
import { jwtDecode } from "jwt-decode";
import { useNavigate } from 'react-router-dom';

// Create the context
const AuthContext = createContext();

// Create a custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// eslint-disable-next-line react/prop-types
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // This effect runs only once on component mount
    const checkAuthStatus = async () => {
      setLoading(true);
      // Check if there's a token in localStorage
      const token = localStorage.getItem('token');

      if (token) {
        try {
          // Decode token to get user information
          const decodedToken = jwtDecode(token);

          // Check if token is expired
          const currentTime = Date.now() / 1000;
          if (decodedToken.exp && decodedToken.exp < currentTime) {
            // Token is expired, log user out
            await handleLogout();
          } else {
            // Get user data either from localStorage or from the token
            const userData = localStorage.getItem('user')
              ? JSON.parse(localStorage.getItem('user'))
              : {
                  id: decodedToken.userId,
                  email: decodedToken.email,
                  role: decodedToken.role,
                  fullName: decodedToken.fullName || 'User',
                  address: decodedToken.address || 'no address provided',
                  profilePicture: decodedToken.profilePicture || 'no picture',
                };

            setCurrentUser(userData);
          }
        } catch (error) {
          console.error("Invalid token:", error);
          await handleLogout();
        }
      }
      setLoading(false);
      setIsInitialized(true);
    };

    checkAuthStatus();
  }, []);

  // Login function - returns a promise to prevent multiple redirects
  const login = async (userData, token) => {
    try {
      // Try to store token first since it's smaller
      localStorage.setItem('token', token);
      
      if (userData) {
        // Only store essential user data to reduce size
        // const minimalUserData = {
        //   id: userData.id,
        //   email: userData.email,
        //   role: userData.role,
        //   fullName: userData.full_name || userData.fullName || 'User',
        // };
        
        try {
          localStorage.setItem('user', JSON.stringify(userData));
        } catch {
          // If storing user data fails, clear and retry
          localStorage.clear();
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(userData));
        }
        
        // Set the full user data in state
        setCurrentUser(userData);
      }
  
      // Return the role for external navigation if needed
      return userData?.role;
    } catch (error) {
      console.error('Storage error during login:', error);
      // If everything fails, at least try to set the current user in state
      setCurrentUser(userData);
      return userData?.role;
    }
  };

  // Explicit navigation function separated from login
  const navigateByRole = (role) => {
    if (role === "admin") {
      navigate('/admin-dashboard');
    } else if (role === "vendor") {
      navigate('/vendor-dashboard');
    } else {
      navigate('/');
    }
  };

  // Logout function
  const handleLogout = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
  };

  const logout = () => {
    handleLogout().then(() => {
      navigate('/');
    });
  };

  // Provide authentication values and functions
  const value = {
    currentUser,
    isAuthenticated: !!currentUser,
    isInitialized,
    login,
    logout,
    navigateByRole,
    loading,
    setCurrentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;