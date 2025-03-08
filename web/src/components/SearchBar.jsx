import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Star, MapPin, Clock } from "lucide-react";
import api from '@/lib/api';

const SearchResults = () => {
    const [searchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Format rating helper function
    const formatRating = (rating) => {
        if (!rating) return 'New';
        const numRating = parseFloat(rating);
        return isNaN(numRating) ? 'New' : numRating.toFixed(1);
    };

    useEffect(() => {
        const query = searchParams.get('q');
        if (query) {
            performSearch(query);
        }
    }, [searchParams]);

    const performSearch = async (query) => {
        setLoading(true);
        try {
            const response = await api.get(`/services/search?q=${encodeURIComponent(query)}`);
            setResults(response.data);
        } catch (error) {
            console.error('Search error:', error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Main Navigation placeholder */}
            <div className="bg-white border-b border-gray-200 h-14 fixed top-0 left-0 right-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
                    <span className="font-semibold text-gray-800">Main Navigation</span>
                </div>
            </div>

            {/* Fixed Search bar - 20% smaller height */}
            <div className="bg-white border-b shadow-md fixed top-14 left-0 right-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                    <form onSubmit={handleSearch} className="w-full max-w-2xl mx-auto">
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <Input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search for services..."
                                    className="pl-10 w-full h-10 text-base rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                />
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            </div>
                            <Button 
                                type="submit" 
                                disabled={loading}
                                className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
                            >
                                {loading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                ) : (
                                    'Search'
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pt-32">
                {/* Results Header */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Search Results</h2>
                    <p className="text-gray-600 mt-1">
                        Found {results.length} results for "{searchParams.get('q')}"
                    </p>
                </div>

                {/* Results List - Optimized layout */}
                {loading ? (
                    <div className="flex justify-center items-center py-16">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                    </div>
                ) : results.length > 0 ? (
                    <div className="space-y-5">
                        {results.map((service) => (
                            <div
                                key={service.id}
                                onClick={() => navigate(`/services/${service.id}`)}
                                className="bg-white rounded-lg shadow-lg hover:shadow-xl hover:translate-y-[-1px] transition-all duration-200 overflow-hidden cursor-pointer border border-gray-100"
                            >
                                <div className="flex">
                                    {/* Image Section */}
                                    {service.image_url && (
                                        <div className="w-1/4 max-w-[200px] relative">
                                            <img
                                                src={service.image_url}
                                                alt={service.name}
                                                className="w-full h-full object-cover min-h-[140px] max-h-[140px]"
                                            />
                                            <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded-md">
                                                ${service.price}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Content Section */}
                                    <div className="flex-1 p-4">
                                        <div className="h-full flex flex-col justify-between">
                                            {/* Top Section: Title, Category, Rating */}
                                            <div>
                                                <div className="flex justify-between items-start mb-1">
                                                    <h3 className="font-semibold text-lg text-gray-900">
                                                        {service.name}
                                                    </h3>
                                                    <div className="flex items-center bg-gray-100 px-2 py-1 rounded-md">
                                                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                                        <span className="ml-1 text-sm font-medium text-gray-700">
                                                            {formatRating(service.average_rating)}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-2 mt-1 mb-2">
                                                    <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-md">
                                                        {service.category_name}
                                                    </span>
                                                </div>
                                                
                                                {/* Description limited to 2 lines */}
                                                <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                                                    {service.description}
                                                </p>
                                            </div>
                                            
                                            {/* Bottom Section: Metadata and Action */}
                                            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                                    {service.location && (
                                                        <div className="flex items-center">
                                                            <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                                                            <span>{service.location}</span>
                                                        </div>
                                                    )}
                                                    {service.duration && (
                                                        <div className="flex items-center">
                                                            <Clock className="h-3 w-3 mr-1 text-gray-400" />
                                                            <span>{service.duration}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <Button
                                                    className="bg-transparent hover:bg-blue-50 text-blue-600 text-xs font-medium h-8 px-3 py-0"
                                                >
                                                    View Details
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white rounded-lg shadow-md">
                        <div className="max-w-md mx-auto">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full">
                                <Search className="h-8 w-8 text-blue-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mt-4">
                                No results found
                            </h3>
                            <p className="text-gray-600 mt-2">
                                Try adjusting your search terms or browse our categories.
                            </p>
                            <Button
                                onClick={() => navigate('/')}
                                className="mt-6 bg-blue-600 hover:bg-blue-700"
                            >
                                Return to Home
                            </Button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default SearchResults;