import { Outlet } from 'react-router-dom'; // Outlet renders the child routes
import Navbar from '../components/navbar'; 
import Footer from '../components/footer'; 

function TemplatePage() {
  return (
    <div>
      <Navbar />
      <main>
        {/* Render dynamic content based on the route */}
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default TemplatePage;
