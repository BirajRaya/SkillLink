import LandingPage from "./pages/landing_page/landing_page"
import SignupPage from "./pages/authentication/sign_up"
import SignInPage from "./pages/authentication/sign_in"
import AdminDashboard from "./pages/admin/admin_dashboard";
import VendorDashboard from "./pages/vendor/vendordashboard"; // Import the vendor dashboard
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import TemplatePage from "./pages/TemplatePage"
import { Toaster } from "@/components/ui/toaster"
import ForgotPasswordPage from "./pages/authentication/ForgetPasswordPage";
import OtpVerificationPage from "./pages/authentication/OtpVerificationPage";
import ResetPasswordPage from "./pages/authentication/ResetPasswordPage";
import { AuthProvider, useAuth } from './utils/AuthContext';

// Protected Route Component - Ensures only authenticated users with proper roles can access specific routes
const ProtectedRoute = ({ children, requiredRole }) => {
  const { currentUser, isAuthenticated } = useAuth();
  
  // If user is not logged in, redirect to login page
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  // If route requires a specific role and user doesn't have it, redirect to their appropriate dashboard
  if (requiredRole && currentUser.role !== requiredRole) {
    // Redirect to appropriate dashboard based on user's actual role
    if (currentUser.role === "admin") {
      return <Navigate to="/admin-dashboard" />;
    } else if (currentUser.role === "vendor") {
      return <Navigate to="/vendor-dashboard" />;
    } else {
      // Regular users go to home page - there is no separate user dashboard
      return <Navigate to="/" />;
    }
  }
  
  // If all checks pass, render the requested route
  return children;
};

// Inner App component that uses auth hooks
const AppWithAuth = () => {
  const { isAuthenticated, currentUser } = useAuth();
  
  return (
    <>
      {/* Toast notifications component */}
      <Toaster />
      
      {/* Application Routes */}
      <Routes>
        {/* Public routes wrapped in TemplatePage for Navbar and Footer */}
        <Route path="/" element={<TemplatePage />}>
          {/* Landing Page - Only redirects admin and vendor users to their dashboards */}
          <Route index element={
            isAuthenticated && (currentUser?.role === "admin" || currentUser?.role === "vendor") ? (
              currentUser?.role === "admin" ? (
                <Navigate to="/admin-dashboard" />
              ) : (
                <Navigate to="/vendor-dashboard" />
              )
            ) : (
              <LandingPage />
            )
          } />  
          
          {/* Registration Page - Redirects logged in users appropriately */}
          <Route path="/register" element={
            isAuthenticated ? (
              currentUser?.role === "admin" ? (
                <Navigate to="/admin-dashboard" />
              ) : currentUser?.role === "vendor" ? (
                <Navigate to="/vendor-dashboard" />
              ) : (
                <Navigate to="/" />
              )
            ) : (
              <SignupPage />
            )
          } />
          
          {/* Login Page - Redirects logged in users appropriately */}
          <Route path="/login" element={
            isAuthenticated ? (
              currentUser?.role === "admin" ? (
                <Navigate to="/admin-dashboard" />
              ) : currentUser?.role === "vendor" ? (
                <Navigate to="/vendor-dashboard" />
              ) : (
                <Navigate to="/" />
              )
            ) : (
              <SignInPage />
            )
          } />
          
          {/* Password recovery routes */}
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/verify-otp" element={<OtpVerificationPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>
        
        {/* Protected routes */}
        {/* Admin Dashboard - Only accessible to admin users */}
        <Route path="/admin-dashboard/*" element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        } />
        
        {/* Vendor Dashboard - Only accessible to vendor users */}
        <Route path="/vendor-dashboard/*" element={
          <ProtectedRoute requiredRole="vendor">
            <VendorDashboard />
          </ProtectedRoute>
        } />
        
        {/* Catch-all route redirects to home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
};

// Main App component
function App() {
  return (
    <Router>
      <AuthProvider>
        <AppWithAuth />
      </AuthProvider>
    </Router>
  );
}

export default App;