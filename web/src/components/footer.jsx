import { Briefcase, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  const navLinks = [
    { name: "Home", href: "#" },
    { name: "About", href: "#" },
    { name: "Contact", href: "#" },
  ];

  return (
    <footer className="bg-gray-50 border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center">
              <Briefcase className="h-6 w-6 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-blue-600">SkillLink</span>
            </div>
            <p className="text-gray-600">Connecting skilled professionals with clients in need.</p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-gray-600 hover:text-blue-600">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Services</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-600 hover:text-blue-600">Find Workers</a></li>
              <li><a href="#" className="text-gray-600 hover:text-blue-600">Post a Job</a></li>
              <li><a href="#" className="text-gray-600 hover:text-blue-600">Become a Worker</a></li>
              <li><a href="#" className="text-gray-600 hover:text-blue-600">How it Works</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Contact Us</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-600" />
                <span className="text-gray-600">support@skilllink.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-blue-600" />
                <span className="text-gray-600">+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span className="text-gray-600">123 Business St, Suite 100<br />Mississauga, On 111111</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t mt-12 pt-8 text-center text-gray-600">
          <p>&copy; {new Date().getFullYear()} SkillLink. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
