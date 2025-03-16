import { Link, useLocation } from 'react-router-dom';
import {LayoutDashboard,Users,Building2,AlertCircle,BarChart,Settings,LogOut,ChartBarStacked,User,HandPlatter,Mails} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "../../../utils/AuthContext";

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin-dashboard' },
  { icon: Users, label: 'Users', path: '/admin-dashboard/users' },
  { icon: Building2, label: 'Vendors', path: '/admin-dashboard/vendors' },
  { icon: Calendar, label: 'Bookings', path: '/admin-dashboard/bookings' },
  { icon: Star, label: 'Reviews', path: '/admin-dashboard/reviews' },
  { icon: AlertCircle, label: 'Disputes', path: '/admin-dashboard/disputes' },
  { icon: BarChart, label: 'Analytics', path: '/admin-dashboard/analytics' },
  { icon: ChartBarStacked, label: 'Categories', path: '/admin-dashboard/categories' },
  { icon: HandPlatter, label: 'Services', path: '/admin-dashboard/services' },
  { icon: Mails, label: 'Messages', path: '/admin-dashboard/chat' },
];

const Sidebar = () => {
  const { logout } = useAuth();
  const location = useLocation();

  return (
    <TooltipProvider delayDuration={300}>
      <div className="fixed left-0 top-0 w-64 h-screen bg-white border-r flex flex-col shadow-sm">
        {/* Logo Header */}
        <div className="h-16 border-b">
            <div className="ml-7 flex items-baseline space-x-1.1 mt-5">
                <h1 className="text-lg font-bold text-blue-700">SkillLink</h1>
                <span className="mx-1 text-gray-300">|</span>
                <p className="text-xs font-medium text-gray-700">Admin Dashboard</p>
              </div>
          </div>

        
        {/* Main Navigation */}
        <div className="p-3 flex-1 overflow-y-auto">
          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-1">
              Main
            </p>
            <nav>
              {navItems.slice(0, 1).map(({ icon: Icon, label, path }) => (
                <Tooltip key={path}>
                  <TooltipTrigger asChild>
                    <Link
                      to={path}
                      className={cn(
                        'flex items-center justify-between px-3 py-2 rounded-md mb-1 group transition-colors',
                        location.pathname === path 
                          ? 'bg-primary/10 text-primary font-medium' 
                          : 'text-gray-700 hover:bg-gray-100'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={cn(
                          "h-4 w-4",
                          location.pathname === path ? "text-primary" : "text-gray-500 group-hover:text-primary"
                        )} />
                        <span className="text-sm">{label}</span>
                      </div>
                      {location.pathname === path && (
                        <div className="w-1 h-5 bg-primary rounded-full" />
                      )}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">{label}</TooltipContent>
                </Tooltip>
              ))}
            </nav>
          </div>
          
          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-1">
              User Management
            </p>
            <nav>
              {navItems.slice(1, 3).map(({ icon: Icon, label, path }) => (
                <Tooltip key={path}>
                  <TooltipTrigger asChild>
                    <Link
                      to={path}
                      className={cn(
                        'flex items-center justify-between px-3 py-2 rounded-md mb-1 group transition-colors',
                        location.pathname === path 
                          ? 'bg-primary/10 text-primary font-medium' 
                          : 'text-gray-700 hover:bg-gray-100'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={cn(
                          "h-4 w-4",
                          location.pathname === path ? "text-primary" : "text-gray-500 group-hover:text-primary"
                        )} />
                        <span className="text-sm">{label}</span>
                      </div>
                      {location.pathname === path && (
                        <div className="w-1 h-5 bg-primary rounded-full" />
                      )}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">{label}</TooltipContent>
                </Tooltip>
              ))}
            </nav>
          </div>
          
          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-1">
              Operations
            </p>
            <nav>
              {navItems.slice(3, 6).map(({ icon: Icon, label, path }) => (
                <Tooltip key={path}>
                  <TooltipTrigger asChild>
                    <Link
                      to={path}
                      className={cn(
                        'flex items-center justify-between px-3 py-2 rounded-md mb-1 group transition-colors',
                        location.pathname === path 
                          ? 'bg-primary/10 text-primary font-medium' 
                          : 'text-gray-700 hover:bg-gray-100'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={cn(
                          "h-4 w-4",
                          location.pathname === path ? "text-primary" : "text-gray-500 group-hover:text-primary"
                        )} />
                        <span className="text-sm">{label}</span>
                        {label === "Disputes" && (
                          <Badge variant="destructive" className="text-xs h-4 min-w-4 px-1">3</Badge>
                        )}
                      </div>
                      {location.pathname === path && (
                        <div className="w-1 h-5 bg-primary rounded-full" />
                      )}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">{label}</TooltipContent>
                </Tooltip>
              ))}
            </nav>
          </div>
          
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-1">
              Platform
            </p>
            <nav>
              {navItems.slice(6).map(({ icon: Icon, label, path }) => (
                <Tooltip key={path}>
                  <TooltipTrigger asChild>
                    <Link
                      to={path}
                      className={cn(
                        'flex items-center justify-between px-3 py-2 rounded-md mb-1 group transition-colors',
                        location.pathname === path 
                          ? 'bg-primary/10 text-primary font-medium' 
                          : 'text-gray-700 hover:bg-gray-100'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={cn(
                          "h-4 w-4",
                          location.pathname === path ? "text-primary" : "text-gray-500 group-hover:text-primary"
                        )} />
                        <span className="text-sm">{label}</span>
                      </div>
                      {location.pathname === path && (
                        <div className="w-1 h-5 bg-primary rounded-full" />
                      )}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">{label}</TooltipContent>
                </Tooltip>
              ))}
            </nav>
          </div>
        </div>


        
        {/* User Profile */}
        <div className="p-3 border-t">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center w-full p-2 rounded-md hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-2 w-full">
                <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-gray-600" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-xs font-medium text-gray-900">Admin User</p>
                  <p className="text-xs text-gray-500 truncate">admin@skilllink.com</p>
                </div>
                <Settings className="h-3.5 w-3.5 text-gray-400" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
    
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600 cursor-pointer focus:text-red-600 text-xs" 
                onSelect={(e) => {
                  e.preventDefault();
                  logout();
                }}
              >
                <LogOut className="mr-2 h-3.5 w-3.5" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default Sidebar;