import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Wrench, Bolt, Truck, Camera, Users, Star } from "lucide-react";

const LandingPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();


  // Handle search button click
  const handleSearchClick = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setLoading(true);
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchTerm.trim()) {
        setLoading(true);
        navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Main Content */}
      <main className="flex-grow bg-gray-50">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Find Skilled Workers<br />
              <span className="text-blue-600">In Your Area</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Connect with verified professionals for your project needs
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-12 relative">
              <form onSubmit={handleSearchClick} className="flex gap-4">
                <Input 
                  className="flex-grow" 
                  placeholder="Search for skilled workers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <Button 
                  type="submit"
                  className="flex items-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      Search
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>

          {/* Features Section */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <div className="text-center p-6 rounded-lg border hover:shadow-lg transition-shadow">
              <Search className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Easy Search</h3>
              <p className="text-gray-600">Find skilled professionals quickly and efficiently</p>
            </div>
            
            <div className="text-center p-6 rounded-lg border hover:shadow-lg transition-shadow">
              <Star className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Verified Workers</h3>
              <p className="text-gray-600">All professionals are vetted and verified</p>
            </div>
            
            <div className="text-center p-6 rounded-lg border hover:shadow-lg transition-shadow">
              <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Direct Connect</h3>
              <p className="text-gray-600">Connect directly with workers in your area</p>
            </div>
          </div>
        </div>
      </main>

      {/* Services Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Popular Services
        </h2>
        <div className="grid md:grid-cols-4 gap-8">
          {[
            { icon: <Wrench className="h-12 w-12 text-blue-600 mx-auto" />, title: "Plumbing" },
            { icon: <Bolt className="h-12 w-12 text-blue-600 mx-auto" />, title: "Electrician" },
            { icon: <Truck className="h-12 w-12 text-blue-600 mx-auto" />, title: "Driver" },
            { icon: <Camera className="h-12 w-12 text-blue-600 mx-auto" />, title: "Cameraperson" },
          ].map((service, index) => (
            <div
              key={index}
              className="text-center p-6 rounded-lg border hover:shadow-lg transition-shadow"
            >
              {service.icon}
              <h3 className="text-xl font-semibold mt-4">{service.title}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-blue-600 text-white py-16 text-center">
        <h2 className="text-3xl font-bold">Are You a Skilled Professional?</h2>
        <p className="text-lg mt-2">Join SkillLink and start connecting with clients today.</p>
        <Button className="mt-6 bg-white text-blue-600 font-semibold px-6 py-3">
          Become a Vendor
        </Button>
      </section>
    </div>
  );
};

export default LandingPage;