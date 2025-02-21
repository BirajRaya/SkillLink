
import LandingPage from "./pages/landing_page/landing_page"
import SignupPage from "./pages/authentication/sign_up"
import SignInPage from "./pages/authentication/sign_in"
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import TemplatePage from "./pages/TemplatePage"



function App() {
  return (
    <Router>
    <Routes>
      {/* Wrap all routes that need Navbar and Footer with TemplatePage */}
      <Route path="/" element={<TemplatePage />}>
        <Route index element={<LandingPage />} />  {/* Default route */}
        <Route path="/register" element={<SignupPage />} />
        <Route path="/login" element={<SignInPage />} />
        
      </Route>
    </Routes>
  </Router>
  )
}

export default App
