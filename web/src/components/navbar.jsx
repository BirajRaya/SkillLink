import { useState, useEffect } from "react";
import { Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();
  const [activePage, setActivePage] = useState("");

  const navLinks = [
    { name: "Home", href: "/", id: "home" },
    { name: "About", href: "#", id: "about" },
    { name: "Contact", href: "#", id: "contact" },
  ];

  useEffect(() => {
    // Check the current path and set active page
    const path = location.pathname.split('/')[1] || "home"; // Default to "home"
    setActivePage(path);
  }, [location]);

  return (
    <nav className="border-b sticky top-0 bg-white z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Briefcase className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-2xl font-bold text-blue-600">SkillLink</span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.id}
                to={link.href}
                onClick={() => setActivePage(link.id)}
                className={`${
                  activePage === link.id
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-blue-600"
                } pb-1`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              className={`${
                activePage === "login" ? "text-blue-600 border-b-2 border-blue-600" : ""
              }`}
            >
              <Link to="/login">Sign In</Link>
            </Button>
            <Button
              className={`${
                activePage === "register" ? " border-b-2 border-blue-600" : ""
              }`}
            >
              <Link to="/register">Sign Up</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
