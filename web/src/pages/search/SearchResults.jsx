import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Star, MapPin, Clock, Filter, ChevronDown, ChevronUp, X } from "lucide-react";
import api from '@/lib/api';

const SearchResults = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
    const [results, setResults] = useState([]);
    const [filteredResults, setFilteredResults] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Filter states
    const [showFilters, setShowFilters] = useState(false);
    const [locations, setLocations] = useState([
        { name: 'Mississauga', checked: searchParams.get('location')?.includes('Mississauga') || false },
        { name: 'Toronto', checked: searchParams.get('location')?.includes('Toronto') || false },
        { name: 'Brampton', checked: searchParams.get('location')?.includes('Brampton') || false },
    ]);
    const [priceSort, setPriceSort] = useState(searchParams.get('priceSort') || '');
    const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
    const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
    
    const filterRef = useRef(null);
    const navigate = useNavigate();

    // Format rating helper function
    const formatRating = (rating) => {
        if (!rating) return 'New';
        const numRating = parseFloat(rating);
        return isNaN(numRating) ? 'New' : numRating.toFixed(1);
    };

    // Handle clicks outside of the filter panel
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (filterRef.current && !filterRef.current.contains(event.target)) {
                setShowFilters(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Load search results when search params change
    useEffect(() => {
        const query = searchParams.get('q');
        if (query) {
            performSearch(query);
        }
    }, [searchParams]);

    // Apply filters whenever results or filter settings change
    useEffect(() => {
        applyFilters();
    }, [results, locations, priceSort, minPrice, maxPrice]);

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
            updateSearchParams({ q: searchTerm.trim() });
        }
    };

    const updateSearchParams = (newParams) => {
        const current = Object.fromEntries(searchParams.entries());
        const updated = { ...current, ...newParams };
        
        // Remove any undefined or empty string values
        Object.keys(updated).forEach(key => {
            if (updated[key] === undefined || updated[key] === '') {
                delete updated[key];
            }
        });
        
        setSearchParams(updated);
    };

    const handleLocationChange = (locationIndex) => {
        const updatedLocations = [...locations];
        updatedLocations[locationIndex].checked = !updatedLocations[locationIndex].checked;
        setLocations(updatedLocations);
        
        // Update URL params with selected locations
        const selectedLocations = updatedLocations
            .filter(loc => loc.checked)
            .map(loc => loc.name);
            
        updateSearchParams({ location: selectedLocations.join(',') });
    };

    const handlePriceSortChange = (sortOrder) => {
        setPriceSort(sortOrder);
        updateSearchParams({ priceSort: sortOrder });
    };

    const handlePriceRangeChange = () => {
        // Only update if both values are valid numbers or empty
        const min = minPrice === '' ? '' : Number(minPrice);
        const max = maxPrice === '' ? '' : Number(maxPrice);
        
        if ((min === '' || !isNaN(min)) && (max === '' || !isNaN(max))) {
            updateSearchParams({ 
                minPrice: minPrice, 
                maxPrice: maxPrice 
            });
        }
    };

    const clearFilters = () => {
        setLocations(locations.map(loc => ({ ...loc, checked: false })));
        setPriceSort('');
        setMinPrice('');
        setMaxPrice('');
        
        // Remove filter params from URL
        const { q } = Object.fromEntries(searchParams.entries());
        setSearchParams({ q });
    };

    const applyFilters = () => {
        if (!results.length) {
            setFilteredResults([]);
            return;
        }

        let filtered = [...results];

        // Filter by location
        const selectedLocations = locations
            .filter(loc => loc.checked)
            .map(loc => loc.name);
            
        if (selectedLocations.length > 0) {
            filtered = filtered.filter(service => 
                service.location && selectedLocations.some(loc => 
                    service.location.toLowerCase().includes(loc.toLowerCase())
                )
            );
        }

        // Filter by price range
        if (minPrice !== '') {
            filtered = filtered.filter(service => 
                service.price >= parseFloat(minPrice)
            );
        }
        
        if (maxPrice !== '') {
            filtered = filtered.filter(service => 
                service.price <= parseFloat(maxPrice)
            );
        }

        // Sort by price
        if (priceSort === 'low-to-high') {
            filtered.sort((a, b) => a.price - b.price);
        } else if (priceSort === 'high-to-low') {
            filtered.sort((a, b) => b.price - a.price);
        }

        setFilteredResults(filtered);
    };

    // Count how many filters are active
    const activeFilterCount = () => {
        let count = 0;
        if (locations.some(loc => loc.checked)) count++;
        if (priceSort) count++;
        if (minPrice || maxPrice) count++;
        return count;
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Main Navigation placeholder */}
            <div className="bg-white border-b border-gray-200 h-14 fixed top-0 left-0 right-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
                    <span className="font-semibold text-gray-800">Main Navigation</span>
                </div>
            </div>

            {/* Fixed Search bar */}
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

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pt-36">
                {/* Results Header with Filter Button */}
                <div className="mb-8 flex justify-between items-start">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">Search Results</h2>
                        <p className="text-gray-600 mt-2 text-lg">
                            Found {filteredResults.length} results for "{searchParams.get('q')}"
                        </p>
                    </div>
                    <div className="relative" ref={filterRef}>
                        <Button 
                            onClick={() => setShowFilters(!showFilters)}
                            variant="outline"
                            className="flex items-center gap-2 h-10"
                        >
                            <Filter className="h-4 w-4" />
                            <span>Filters</span>
                            {activeFilterCount() > 0 && (
                                <span className="flex items-center justify-center h-5 w-5 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                                    {activeFilterCount()}
                                </span>
                            )}
                            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                        
                        {/* Filter Panel */}
                        {showFilters && (
                            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-30">
                                <div className="p-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-medium text-gray-900">Filter Results</h3>
                                        <button 
                                            onClick={clearFilters}
                                            className="text-sm text-blue-600 hover:text-blue-800"
                                        >
                                            Clear all
                                        </button>
                                    </div>
                                    
                                    {/* Location Filter */}
                                    <div className="mb-4">
                                        <h4 className="font-medium text-sm text-gray-700 mb-2">Location</h4>
                                        <div className="space-y-2">
                                            {locations.map((location, index) => (
                                                <label key={location.name} className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={location.checked}
                                                        onChange={() => handleLocationChange(index)}
                                                        className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                                                    />
                                                    <span className="ml-2 text-gray-700">{location.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    {/* Price Sort */}
                                    <div className="mb-4">
                                        <h4 className="font-medium text-sm text-gray-700 mb-2">Sort by Price</h4>
                                        <div className="space-y-2">
                                            <label className="flex items-center">
                                                <input
                                                    type="radio"
                                                    checked={priceSort === 'low-to-high'}
                                                    onChange={() => handlePriceSortChange('low-to-high')}
                                                    className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                                                />
                                                <span className="ml-2 text-gray-700">Price: Low to High</span>
                                            </label>
                                            <label className="flex items-center">
                                                <input
                                                    type="radio"
                                                    checked={priceSort === 'high-to-low'}
                                                    onChange={() => handlePriceSortChange('high-to-low')}
                                                    className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                                                />
                                                <span className="ml-2 text-gray-700">Price: High to Low</span>
                                            </label>
                                            {priceSort && (
                                                <button 
                                                    onClick={() => handlePriceSortChange('')}
                                                    className="flex items-center text-xs text-gray-500 hover:text-gray-700"
                                                >
                                                    <X className="h-3 w-3 mr-1" /> Clear
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Price Range */}
                                    <div className="mb-4">
                                        <h4 className="font-medium text-sm text-gray-700 mb-2">Price Range</h4>
                                        <div className="flex space-x-2">
                                            <div className="flex-1">
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    placeholder="Min"
                                                    value={minPrice}
                                                    onChange={(e) => setMinPrice(e.target.value)}
                                                    className="w-full"
                                                />
                                            </div>
                                            <span className="text-gray-500 self-center">-</span>
                                            <div className="flex-1">
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    placeholder="Max"
                                                    value={maxPrice}
                                                    onChange={(e) => setMaxPrice(e.target.value)}
                                                    className="w-full"
                                                />
                                            </div>
                                        </div>
                                        <Button
                                            onClick={handlePriceRangeChange}
                                            className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white"
                                            size="sm"
                                        >
                                            Apply
                                        </Button>
                                        {(minPrice || maxPrice) && (
                                            <button 
                                                onClick={() => {
                                                    setMinPrice('');
                                                    setMaxPrice('');
                                                    handlePriceRangeChange();
                                                }}
                                                className="flex items-center text-xs text-gray-500 hover:text-gray-700 mt-1"
                                            >
                                                <X className="h-3 w-3 mr-1" /> Clear range
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Active Filters Display */}
                {activeFilterCount() > 0 && (
                    <div className="mb-4 flex flex-wrap gap-2">
                        {locations.filter(loc => loc.checked).map(loc => (
                            <div key={loc.name} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                {loc.name}
                                <button 
                                    onClick={() => handleLocationChange(locations.findIndex(l => l.name === loc.name))}
                                    className="ml-1 text-blue-500 hover:text-blue-700"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                        
                        {priceSort && (
                            <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center">
                                Price: {priceSort === 'low-to-high' ? 'Low to High' : 'High to Low'}
                                <button 
                                    onClick={() => handlePriceSortChange('')}
                                    className="ml-1 text-blue-500 hover:text-blue-700"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        )}
                        
                        {(minPrice || maxPrice) && (
                            <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center">
                                Price: {minPrice ? `$${minPrice}` : '$0'} - {maxPrice ? `$${maxPrice}` : 'Any'}
                                <button 
                                    onClick={() => {
                                        setMinPrice('');
                                        setMaxPrice('');
                                        handlePriceRangeChange();
                                    }}
                                    className="ml-1 text-blue-500 hover:text-blue-700"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        )}
                        
                        <button 
                            onClick={clearFilters}
                            className="text-gray-500 hover:text-gray-700 text-sm underline"
                        >
                            Clear all filters
                        </button>
                    </div>
                )}

                {/* Results List */}
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
                    </div>
                ) : filteredResults.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
                        {filteredResults.map((service) => (
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
                                {activeFilterCount() > 0 
                                    ? "Try adjusting your filters or search terms."
                                    : "Try adjusting your search terms or browse our categories."}
                            </p>
                            {activeFilterCount() > 0 && (
                                <Button
                                    onClick={clearFilters}
                                    className="mt-4 bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-2 rounded-xl transition-colors"
                                >
                                    Clear Filters
                                </Button>
                            )}
                            <Button
                                onClick={() => navigate('/')}
                                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-colors"
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