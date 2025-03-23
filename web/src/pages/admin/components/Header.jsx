import { Menu } from "lucide-react";

const Header = ({ toggleSidebar, isMobile }) => {
  return (
    <header className="bg-white border-b sticky top-0 z-20 h-16">
      <div className="flex items-center h-full px-4 md:px-6">
        {/* Mobile menu toggle - only show on mobile when sidebar is closed */}
        {isMobile && (
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md hover:bg-gray-100 focus:outline-none"
            aria-label="Toggle Menu"
          >
            <Menu className="h-5 w-5 text-gray-600" />
          </button>
        )}

        {/* Your existing header content can go here */}
        <div className="flex items-center gap-4 flex-1">
          <div className="relative w-96">{/* Original empty content */}</div>
        </div>
      </div>
    </header>
  );
};

export default Header;
