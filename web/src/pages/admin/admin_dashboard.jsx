import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './Dashboard';
import Users from './Users';
import Vendors from './Vendors';
import Disputes from './Disputes';
import Categories from './categories';
import Services from './Services';
import ChatApp from '@/chat/ChatApp';
import Bookings from './Bookings';
import Reviews from './Reviews';
import { Menu, X } from 'lucide-react';

const AdminDashboard = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  
  // State for sidebar visibility
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // State to track if we're in mobile view
  const [isMobile, setIsMobile] = useState(false);

  // Check screen size and adjust sidebar visibility
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      
      // Close sidebar automatically on mobile
      if (mobile) {
        setSidebarOpen(false);
      } else {
        // Open sidebar automatically on desktop
        setSidebarOpen(true);
      }
    };

    // Set initial values
    handleResize();
    
    // Update on window resize
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Toggle sidebar function to pass to header
  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  // Determine which component to render based on path
  const renderContent = () => {
    if (currentPath === '/admin-dashboard/users') {
      return <Users />;
    } else if (currentPath === '/admin-dashboard/vendors') {
      return <Vendors />;
    } else if (currentPath === '/admin-dashboard/categories'){
      return <Categories />;
    } else if (currentPath === '/admin-dashboard/services') {  
      return <Services />;
    } else if (currentPath === '/admin-dashboard/disputes') {
      return <Disputes />;
    } else if (currentPath === '/admin-dashboard/chat') {
      return <ChatApp />;
    } else if (currentPath === '/admin-dashboard/bookings') {
      return <Bookings />;
    } else if (currentPath === '/admin-dashboard/reviews') {
      return <Reviews />;
    } else {
      return <Dashboard />;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50 relative">
      {/* Mobile sidebar toggle button - fixed position */}
      {isMobile && !sidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="fixed z-40 bottom-6 right-6 bg-blue-600 text-white p-3 rounded-full shadow-lg focus:outline-none hover:bg-blue-700 transition-colors"
          aria-label="Open Menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      )}

      {/* Mobile sidebar close button - shown when sidebar is open */}
      {isMobile && sidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="fixed z-50 top-4 right-4 bg-white p-2 rounded-full shadow-md focus:outline-none"
          aria-label="Close Menu"
        >
          <X className="h-5 w-5 text-gray-600" />
        </button>
      )}

      {/* Mobile overlay - visible when sidebar is open on mobile */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)} 
        />
      )}
      
      {/* Sidebar - responsive position with transition */}
      <aside 
        className={`fixed lg:sticky top-0 h-screen transition-transform duration-300 z-40
                  ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
                  lg:translate-x-0 lg:z-0 lg:${sidebarOpen ? 'w-64' : 'w-0 opacity-0'} overflow-hidden`}
      >
        <Sidebar 
          isMobile={isMobile}
          closeSidebar={() => isMobile && setSidebarOpen(false)} 
        />
      </aside>
      
      {/* Main content area - adjusts based on sidebar state */}
      <div className="flex flex-col flex-grow w-full lg:w-auto">
        <Header 
          toggleSidebar={toggleSidebar} 
          sidebarOpen={sidebarOpen} 
          isMobile={isMobile} 
        />
        
        <main className="flex-1 p-4 transition-all duration-300 overflow-x-hidden">
          <div className="max-w-full mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;