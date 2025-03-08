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
            {/* Main Navigation placeholder - This would be your actual main navigation */}
            <div className="bg-white border-b border-gray-200 h-14 fixed top-0 left-0 right-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
                    <span className="font-semibold text-gray-800">Main Navigation</span>
                </div>
            </div>

            {/* Fixed Search bar - positioned below the main navigation */}
            <div className="bg-white border-b shadow-md fixed top-14 left-0 right-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <form onSubmit={handleSearch} className="w-full max-w-2xl mx-auto">
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <Input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search for services..."
                                    className="pl-10 w-full h-12 text-base rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-all"
                                />
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            </div>
                            <Button 
                                type="submit" 
                                disabled={loading}
                                className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
                            >
                                {loading ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                                ) : (
                                    'Search'
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Main Content - Added padding-top to account for fixed header (nav + search) */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pt-36">
                {/* Results Header */}
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900">Search Results</h2>
                    <p className="text-gray-600 mt-2 text-lg">
                        Found {results.length} results for "{searchParams.get('q')}"
                    </p>
                </div>

                {/* Results List */}
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
                    </div>
                ) : results.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
                        {results.map((service) => (
                            <div
                                key={service.id}
                                onClick={() => navigate(`/services/${service.id}`)}
                                className="bg-white rounded-2xl shadow-lg hover:shadow-xl hover:translate-y-[-1px] transition-all duration-200 overflow-hidden group cursor-pointer border border-gray-100"
                            >
                                <div className="flex flex-col lg:flex-row">
                                    {service.image_url && (
                                        <div className="lg:w-1/3 relative overflow-hidden">
                                            <img
                                                src={service.image_url}
                                                alt={service.name}
                                                className="w-full h-48 lg:h-full object-cover group-hover:scale-[1.01] transition-transform duration-300"
                                            />
                                            <div className="absolute top-3 left-3 bg-blue-600 text-white text-sm font-medium px-3 py-1 rounded-full">
                                                ${service.price}
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex-1 p-6">
                                        <div className="space-y-4">
                                            <div>
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h3 className="font-bold text-xl text-gray-900 group-hover:text-blue-600 transition-colors">
                                                            {service.name}
                                                        </h3>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                                                {service.category_name}
                                                            </span>
                                                            <div className="flex items-center">
                                                                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                                                <span className="ml-1 text-sm font-medium text-gray-700">
                                                                    {formatRating(service.average_rating)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-gray-600 line-clamp-3 mt-3">
                                                    {service.description}
                                                </p>
                                            </div>
                                            <div className="pt-4 border-t border-gray-100">
                                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                                    {service.location && (
                                                        <div className="flex items-center">
                                                            <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                                                            <span>{service.location}</span>
                                                        </div>
                                                    )}
                                                    {service.duration && (
                                                        <div className="flex items-center">
                                                            <Clock className="h-4 w-4 mr-1 text-gray-400" />
                                                            <span>{service.duration}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex justify-end">
                                                <Button
                                                    className="bg-transparent hover:bg-blue-50 text-blue-600 font-medium transition-colors"
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
                    <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
                        <div className="max-w-md mx-auto">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-50 rounded-full">
                                <Search className="h-10 w-10 text-blue-500" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mt-6">
                                No results found
                            </h3>
                            <p className="text-gray-600 mt-3">
                                Try adjusting your search terms or browse our categories.
                            </p>
                            <Button
                                onClick={() => navigate('/')}
                                className="mt-8 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-colors"
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