import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LandingPage from "./pages/landing_page/landing_page";
import SignupPage from "./pages/authentication/sign_up";
import SignInPage from "./pages/authentication/sign_in";
import AdminDashboard from "./pages/admin/admin_dashboard";
import VendorDashboard from "./pages/vendor/vendordashboard";
import TemplatePage from "./pages/TemplatePage";
import { Toaster } from "@/components/ui/toaster";
import SearchResults from "./pages/search/SearchResults";
import ForgotPasswordPage from "./pages/authentication/ForgetPasswordPage";
import OtpVerificationPage from "./pages/authentication/OtpVerificationPage";
import ResetPasswordPage from "./pages/authentication/ResetPasswordPage";
import { AuthProvider, useAuth } from './utils/AuthContext';
import ServiceDetails from './pages/search/ServiceDetails';
import MyBookings from './pages/users/MyBookings';
import BookingDetailPage from './pages/bookings/BookingDetailPage';
import About_us from './pages/landing_page/about_us';
import Contact_page from './pages/landing_page/contact_page';
import DisputeDashboard from './pages/users/DisputeDashboard';

// Protected Route Component - Ensures only authenticated users with proper roles can access specific routes
const ProtectedRoute = ({ children, requiredRole }) => {
  const { currentUser, isAuthenticated } = useAuth();
  
  // If user is not logged in, redirect to login page
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: window.location.pathname }} />;
  }
  
  // If route requires a specific role and user doesn't have it, redirect to their appropriate dashboard
  if (requiredRole && currentUser.role !== requiredRole) {
    if (currentUser.role === "admin") {
      return <Navigate to="/admin-dashboard" />;
    } else if (currentUser.role === "vendor") {
      return <Navigate to="/vendor-dashboard" />;
    } else {
      return <Navigate to="/" />;
    }
  }
  
  return children;
};

// Customer-only route - only allows regular users (not admins or vendors)
const CustomerOnlyRoute = ({ children }) => {
  const { currentUser, isAuthenticated } = useAuth();
  
  // If user is logged in as admin or vendor, redirect to their dashboard
  if (isAuthenticated && (currentUser?.role === "admin" || currentUser?.role === "vendor")) {
    if (currentUser.role === "admin") {
      return <Navigate to="/admin-dashboard" />;
    } else {
      return <Navigate to="/vendor-dashboard" />;
    }
  }
  
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
          <Route index element={
            isAuthenticated && (currentUser?.role === "admin" || currentUser?.role === "vendor") ? (
              currentUser?.role === "admin" ? <Navigate to="/admin-dashboard" /> : <Navigate to="/vendor-dashboard" />
            ) : (
              <LandingPage />
            )
          } />  
          
          <Route path="/register" element={
            isAuthenticated ? (
              currentUser?.role === "admin" ? <Navigate to="/admin-dashboard" /> :
              currentUser?.role === "vendor" ? <Navigate to="/vendor-dashboard" /> :
              <Navigate to="/" />
            ) : <SignupPage />
          } />

          <Route path="/login" element={
            isAuthenticated ? (
              currentUser?.role === "admin" ? <Navigate to="/admin-dashboard" /> :
              currentUser?.role === "vendor" ? <Navigate to="/vendor-dashboard" /> :
              <Navigate to="/" />
            ) : <SignInPage />
          } />

          {/* Protected routes that only regular users can access */}
          <Route path="/search" element={
            <CustomerOnlyRoute>
              <SearchResults />
            </CustomerOnlyRoute>
          } />
          
          <Route path="/services/:id" element={
            <CustomerOnlyRoute>
              <ServiceDetails />
            </CustomerOnlyRoute>
          } />
          
          <Route path="/about" element={
            <CustomerOnlyRoute>
              <About_us />
            </CustomerOnlyRoute>
          } />
          
          <Route path="/contact" element={
            <CustomerOnlyRoute>
              <Contact_page />
            </CustomerOnlyRoute>
          } />
          
          {/* Consolidated booking routes with ProtectedRoute */}
          <Route path="/bookings" element={
            <ProtectedRoute>
              <MyBookings />
            </ProtectedRoute>
          } />
          <Route path="/dispute" element={
            // <ProtectedRoute>
              <DisputeDashboard />
            // </ProtectedRoute>
          } />
          
          <Route path="/bookings/view/:id" element={
            <ProtectedRoute>
              <BookingDetailPage />
            </ProtectedRoute>
          } />

          {/* Password recovery routes */}
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/verify-otp" element={<OtpVerificationPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* Protected Routes */}
        <Route path="/admin-dashboard/*" element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        } />

        <Route path="/vendor-dashboard/*" element={
          <ProtectedRoute requiredRole="vendor">
            <VendorDashboard />
          </ProtectedRoute>
        } />

        {/* Catch-all route */}
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