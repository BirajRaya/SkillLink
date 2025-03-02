import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  AlertCircle,
  BarChart,
  Settings,
  LogOut,
  ChartBarStacked,
  User,
  HandPlatter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "../../../utils/AuthContext";

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin-dashboard' },
  { icon: Users, label: 'Users', path: '/admin-dashboard/users' },
  { icon: Building2, label: 'Vendors', path: '/admin-dashboard/vendors' },
  { icon: AlertCircle, label: 'Disputes', path: '/admin-dashboard/disputes' },
  { icon: BarChart, label: 'Analytics', path: '/admin-dashboard/analytics' },
  { icon: ChartBarStacked  , label: 'Categories', path: '/admin-dashboard/categories' },
  { icon: HandPlatter, label: 'Services', path: '/admin-dashboard/services' },
];

const Sidebar = () => {
  const { logout } = useAuth();
  const location = useLocation();

  return (
    <div className="fixed left-0 top-0 w-64 h-screen bg-white border-r flex flex-col">
      <div className="h-16 border-b flex items-center px-6">
        <h1 className="text-xl font-bold text-black">SkillLink</h1>
      </div>
      <nav className="p-4 flex-1">
        {navItems.map(({ icon: Icon, label, path }) => (
          <Link
            key={path}
            to={path}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg mb-1 text-black hover:bg-gray-100',
              location.pathname === path && 'bg-gray-100 text-primary font-medium'
            )}
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 px-4 py-2 w-full rounded-lg hover:bg-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="h-4 w-4 text-gray-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-black">Admin User</p>
                <p className="text-xs text-gray-500">admin@skilllink.com</p>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600" onSelect={(e) => {
              e.preventDefault();
              logout();
            }}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default Sidebar;