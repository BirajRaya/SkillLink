import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Wrench, Bolt, Calendar, SprayCan, Hammer, Briefcase, Users, Star } from "lucide-react";

const LandingPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Track login state



  const categories = [
    { id: 1, name: "Plumbing Services", description: "Professional plumbing repair and installation", icon: "wrench" },
    { id: 2, name: "Home Cleaning Services", description: "House cleaning and organization", icon: "spray-can" },
    { id: 3, name: "Event Planning Services", description: "Event coordination and management", icon: "calendar" },
    { id: 4, name: "Electrical Services", description: "Electrical installation and repair", icon: "bolt" },
    { id: 5, name: "Carpentry Services", description: "Woodworking and furniture repair", icon: "hammer" }
  ];

  useEffect(() => {
    const checkLoginStatus = () => {
      const token = localStorage.getItem('token');
      setIsLoggedIn(!!token);
    };
    
    checkLoginStatus();
  }, []);

  const handleVendorButtonClick = () => {
    navigate('/register');
  };

  

  // Update recommendations when search term changes
  useEffect(() => {
    if (searchTerm.trim().length > 0) {
      const term = searchTerm.toLowerCase().trim();
      
      // Filter and sort categories based on search term
      const filtered = categories
        .filter(category => category.name.toLowerCase().includes(term))
        .sort((a, b) => {
          // Prioritize categories that start with the search term
          const aStartsWith = a.name.toLowerCase().startsWith(term);
          const bStartsWith = b.name.toLowerCase().startsWith(term);
          
          if (aStartsWith && !bStartsWith) return -1;
          if (!aStartsWith && bStartsWith) return 1;
          return a.name.localeCompare(b.name);
        });
      
      setRecommendations(filtered);
    } else {
      // When search is empty, show all categories
      setRecommendations(categories);
    }
  }, [searchTerm]);

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

  // Handle recommendation click
  const handleRecommendationClick = (category) => {
    setSearchTerm(category.name);
    setShowRecommendations(false);
    navigate(`/search?category=${category.id}&q=${encodeURIComponent(category.name)}`);
  };

  // Render the appropriate icon based on the category icon name
  const renderCategoryIcon = (iconName) => {
    switch (iconName) {
      case 'wrench':
        return <Wrench className="h-4 w-4" />;
      case 'bolt':
        return <Bolt className="h-4 w-4" />;
      case 'calendar':
        return <Calendar className="h-4 w-4" />;
      case 'spray-can':
        return <SprayCan className="h-4 w-4" />;
      case 'hammer':
        return <Hammer className="h-4 w-4" />;
      default:
        return <Briefcase className="h-4 w-4" />;
    }
  };

  // Handle click outside recommendations to close them
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.search-container')) {
        setShowRecommendations(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

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
            
            {/* Search Bar with Recommendations */}
            <div className="max-w-2xl mx-auto mb-12 relative search-container">
      <form onSubmit={handleSearchClick} className="flex gap-4">
        <div className="relative flex-grow">
        <Input 
  className="w-full" 
  placeholder="Search for skilled workers..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  onKeyPress={handleKeyPress}
  onClick={(e) => {
    e.stopPropagation();
    // Show all categories when clicked and nothing is typed
    if (searchTerm.trim().length === 0) {
      setRecommendations(categories);
    }
    setShowRecommendations(true);
  }}
/>
          
  
          
          {/* Recommendations dropdown */}
         {showRecommendations && (
  <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
    <ul>
      {recommendations.map((category) => (
        <li 
          key={category.id}
          className="px-4 py-2 hover:bg-blue-50 cursor-pointer"
          onClick={() => handleRecommendationClick(category)}
        >
          <div className="flex items-start">
            <span className="text-blue-600 mr-2 mt-1">
              {renderCategoryIcon(category.icon)}
            </span>
            <div className="flex-1">
              <div className="font-medium text-left">{category.name}</div>
              {category.description && (
                <div className="text-xs text-gray-500 truncate text-left">
                  {category.description}
                </div>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  </div>
)}
        </div>
        
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
        <div className="grid md:grid-cols-5 gap-6">
          <div className="text-center p-6 rounded-lg border hover:shadow-lg transition-shadow cursor-pointer"
               onClick={() => navigate('/search?category=1&q=Plumbing Services')}>
            <Wrench className="h-12 w-12 text-blue-600 mx-auto" />
            <h3 className="text-xl font-semibold mt-4">Plumbing</h3>
          </div>
          
          <div className="text-center p-6 rounded-lg border hover:shadow-lg transition-shadow cursor-pointer"
               onClick={() => navigate('/search?category=4&q=Electrical Services')}>
            <Bolt className="h-12 w-12 text-blue-600 mx-auto" />
            <h3 className="text-xl font-semibold mt-4">Electrical</h3>
          </div>
          
          <div className="text-center p-6 rounded-lg border hover:shadow-lg transition-shadow cursor-pointer"
               onClick={() => navigate('/search?category=2&q=Home Cleaning Services')}>
            <SprayCan className="h-12 w-12 text-blue-600 mx-auto" />
            <h3 className="text-xl font-semibold mt-4">Cleaning</h3>
          </div>
          
          <div className="text-center p-6 rounded-lg border hover:shadow-lg transition-shadow cursor-pointer"
               onClick={() => navigate('/search?category=3&q=Event Planning Services')}>
            <Calendar className="h-12 w-12 text-blue-600 mx-auto" />
            <h3 className="text-xl font-semibold mt-4">Events</h3>
          </div>
          
          <div className="text-center p-6 rounded-lg border hover:shadow-lg transition-shadow cursor-pointer"
               onClick={() => navigate('/search?category=5&q=Carpentry Services')}>
            <Hammer className="h-12 w-12 text-blue-600 mx-auto" />
            <h3 className="text-xl font-semibold mt-4">Carpentry</h3>
          </div>
        </div>
      </section>

      {!isLoggedIn && (
        <section className="bg-blue-600 text-white py-16 text-center">
          <h2 className="text-3xl font-bold">Are You a Skilled Professional?</h2>
          <p className="text-lg mt-2">Join SkillLink and start connecting with clients today.</p>
          <Button 
            className="mt-6 bg-white text-blue-600 font-semibold px-6 py-3"
            onClick={handleVendorButtonClick}
          >
            Become a Vendor
          </Button>
        </section>
      )}
    </div>
  );
};

export default LandingPage;