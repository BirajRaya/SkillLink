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

const AdminDashboard = () => {
  const location = useLocation();
  const currentPath = location.pathname;

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
    }else if (currentPath === '/admin-dashboard/chat') {
      return <ChatApp />;
    }
     else if (currentPath === '/admin-dashboard/bookings') {
      return <Bookings />;
    } else if (currentPath === '/admin-dashboard/reviews') {
      return <Reviews />;
    } else {
      return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header />
        <main className="">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;