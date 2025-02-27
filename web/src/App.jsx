import LandingPage from "./pages/landing_page/landing_page"
import SignupPage from "./pages/authentication/sign_up"
import SignInPage from "./pages/authentication/sign_in"
import AdminDashboard from "./pages/admin/admin_dashboard";
import UserDashboard from "./pages/users/user_dashboard";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import TemplatePage from "./pages/TemplatePage"
import { Toaster } from "@/components/ui/toaster"
import ForgotPasswordPage from "./pages/authentication/ForgetPasswordPage";
import OtpVerificationPage from "./pages/authentication/OtpVerificationPage";
import ResetPasswordPage from "./pages/authentication/ResetPasswordPage";

function App() {
  return (
    <Router>
      {/* Add Toaster outside of Routes to make it available everywhere */}
      <Toaster />
      <Routes>
        {/* Wrap all routes that need Navbar and Footer with TemplatePage */}
        <Route path="/" element={<TemplatePage />}>
          <Route index element={<LandingPage />} />  
          <Route path="/register" element={<SignupPage />} />
          <Route path="/login" element={<SignInPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-otp" element={<OtpVerificationPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>
        
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/user-dashboard" element={<UserDashboard />} />
      </Routes>
    </Router>
  )
}

export default App