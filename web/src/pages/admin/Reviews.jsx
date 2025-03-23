import React, { useState, useEffect, useMemo } from "react";
import {
  Star,
  Search,
  User,
  Building2,
  Eye,
  Loader2,
  AlertCircle,
  MoreHorizontal,
  Trash,
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
  RefreshCw,
  X,
  MessageSquare,
  VoteIcon,
} from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

import api from "@/lib/api";

const Reviews = () => {
  // State management
  const { toast } = useToast();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [selectedReview, setSelectedReview] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [vendorData, setVendorData] = useState([]);
  const [expandedVendorId, setExpandedVendorId] = useState(null);
  const [expandedServiceIds, setExpandedServiceIds] = useState({});
  const [selectedSort, setSelectedSort] = useState({
    field: "name",
    order: "asc",
  });
  const [lastUpdated, setLastUpdated] = useState(null);
  const [apiResponse, setApiResponse] = useState(null);

  // Format current date time for logging - using the exact timestamp
  const formatCurrentDateTime = () => {
    return "2025-03-18 19:57:41";
  };

  // Log with timestamp and username
  const logWithDetails = (message, details = {}) => {
    console.log(`[${formatCurrentDateTime()}]  - ${message}`, details);
  };

  // Add this state for handling debounced search
  const [searchInputValue, setSearchInputValue] = useState("");

  // Add this effect for debounced search (just like in Vendors component)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInputValue);
      setActiveSearch(searchInputValue);

      // Auto-expand the first vendor when searching
      if (searchInputValue.trim() && filteredVendors.length > 0) {
        setExpandedVendorId(filteredVendors[0].id);
      }

      // Show toast with results if term isn't empty
      if (searchInputValue.trim()) {
        const term = searchInputValue.trim().toLowerCase();
        const matchCount = vendorData.filter((vendor) => {
          // Check vendor name
          if (vendor.name.toLowerCase().includes(term)) return true;

          // Check service names
          if (
            vendor.services.some((service) =>
              service.name.toLowerCase().includes(term)
            )
          )
            return true;

          // Check reviews
          if (
            vendor.reviews.some(
              (review) =>
                (review.reviewer_name &&
                  review.reviewer_name.toLowerCase().includes(term)) ||
                (review.comment && review.comment.toLowerCase().includes(term))
            )
          )
            return true;

          return false;
        }).length;
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchInputValue, vendorData, toast]);

  // Initial data load
  useEffect(() => {
    fetchReviewData();
  }, []);

  // Fetch review data from API
  const fetchReviewData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Make API call to get reviews
      const response = await api.get("/admin/reviews");

      // Store the raw response for debugging
      setApiResponse(response.data);

      if (response.data && response.data.reviews) {
        const reviewData = response.data.reviews;
        logWithDetails(`Retrieved ${reviewData.length} reviews from database`, {
          sampleReview: reviewData.length > 0 ? reviewData[0] : null,
        });

        // Store raw reviews
        setReviews(reviewData);

        // Process the data into vendors and services
        processReviewData(reviewData);

        // Set last updated time
        setLastUpdated(new Date());
      } else {
        throw new Error("Invalid response format from API");
      }
    } catch (error) {
      setError(error.message);

      toast({
        variant: "destructive",
        title: "Error loading data",
        description: "Failed to load reviews from database. Try refreshing.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Process review data into vendors and services with enhanced error handling
  const processReviewData = (reviewData) => {
    if (!reviewData || !Array.isArray(reviewData) || reviewData.length === 0) {
      setVendorData([]);
      return;
    }

    logWithDetails("Processing review data", {
      count: reviewData.length,
      firstReview: reviewData[0],
    });

    // Use a more flexible approach to find vendor and service fields
    const sampleReview = reviewData[0];
    const vendorIdField = sampleReview.hasOwnProperty("vendor_id")
      ? "vendor_id"
      : sampleReview.hasOwnProperty("vendorId")
      ? "vendorId"
      : null;

    const vendorNameField = sampleReview.hasOwnProperty("vendor_name")
      ? "vendor_name"
      : sampleReview.hasOwnProperty("vendorName")
      ? "vendorName"
      : null;

    const serviceIdField = sampleReview.hasOwnProperty("service_id")
      ? "service_id"
      : sampleReview.hasOwnProperty("serviceId")
      ? "serviceId"
      : null;

    const serviceNameField = sampleReview.hasOwnProperty("service_name")
      ? "service_name"
      : sampleReview.hasOwnProperty("serviceName")
      ? "serviceName"
      : null;

    // Log the fields we found
    logWithDetails("Detected fields in review data", {
      vendorIdField,
      vendorNameField,
      serviceIdField,
      serviceNameField,
    });

    // If we can't find vendor fields, try extracting from vendor object
    let extractStrategy = "direct";

    if (!vendorIdField && sampleReview.hasOwnProperty("vendor")) {
      extractStrategy = "nested";
      logWithDetails("Detected nested vendor object structure");
    }

    // Group data by vendor and service
    const vendorMap = {};

    // First pass - collect all vendors and services
    reviewData.forEach((review, index) => {
      // Extract vendor information
      let vendorId, vendorName, serviceId, serviceName;

      if (extractStrategy === "direct") {
        vendorId = review[vendorIdField];
        vendorName = review[vendorNameField];
        serviceId = review[serviceIdField];
        serviceName = review[serviceNameField];
      } else if (extractStrategy === "nested" && review.vendor) {
        // Try to extract from vendor object
        vendorId = review.vendor.id;
        vendorName = review.vendor.name;

        // For service, it could be in a service object or as direct properties
        if (review.service) {
          serviceId = review.service.id;
          serviceName = review.service.name;
        } else {
          serviceId = review[serviceIdField];
          serviceName = review[serviceNameField];
        }
      }

      // Use a fallback strategy if we still don't have vendor info
      if (!vendorId || !vendorName) {
        if (index === 0) {
          logWithDetails(
            "Could not extract vendor info - using fallback strategy"
          );
        }

        // Try to find any field that might contain vendor info
        for (const key in review) {
          if (key.toLowerCase().includes("vendor")) {
            if (typeof review[key] === "object" && review[key] !== null) {
              vendorId = review[key].id || index + 1;
              vendorName = review[key].name || `Vendor ${index + 1}`;
              break;
            } else if (typeof review[key] === "string" && !vendorName) {
              vendorName = review[key];
              vendorId = index + 1;
            } else if (typeof review[key] !== "object" && !vendorId) {
              vendorId = review[key];
            }
          }
        }
      }

      // If we still don't have vendor info, create a default one
      if (!vendorId && !vendorName) {
        // Group all reviews under a single "Unknown Vendor" as a last resort
        vendorId = 9999;
        vendorName = "Unknown Vendor";
      }

      // Initialize vendor if doesn't exist
      if (!vendorMap[vendorId]) {
        vendorMap[vendorId] = {
          id: vendorId,
          name: vendorName || "Unnamed Vendor",
          totalRating: 0,
          reviewCount: 0,
          reviews: [],
          services: {},
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        };
      }

      // Handle rating properly (ensure it's numeric)
      const rating = parseInt(review.rating) || 3;

      // Add review to vendor
      vendorMap[vendorId].reviews.push(review);
      vendorMap[vendorId].totalRating += rating;
      vendorMap[vendorId].reviewCount++;
      vendorMap[vendorId].ratingDistribution[
        rating < 1 ? 1 : rating > 5 ? 5 : rating
      ]++;

      // If we have service info, add it
      if (serviceId && serviceName) {
        // Initialize service if doesn't exist
        if (!vendorMap[vendorId].services[serviceId]) {
          vendorMap[vendorId].services[serviceId] = {
            id: serviceId,
            name: serviceName || "Unnamed Service",
            totalRating: 0,
            reviewCount: 0,
            reviews: [],
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          };
        }

        // Add review to service
        vendorMap[vendorId].services[serviceId].reviews.push(review);
        vendorMap[vendorId].services[serviceId].totalRating += rating;
        vendorMap[vendorId].services[serviceId].reviewCount++;
        vendorMap[vendorId].services[serviceId].ratingDistribution[
          rating < 1 ? 1 : rating > 5 ? 5 : rating
        ]++;
      } else {
        // If no service info, add to "General" service
        const generalServiceId = `general_${vendorId}`;
        if (!vendorMap[vendorId].services[generalServiceId]) {
          vendorMap[vendorId].services[generalServiceId] = {
            id: generalServiceId,
            name: "General Services",
            totalRating: 0,
            reviewCount: 0,
            reviews: [],
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          };
        }

        // Add review to general service
        vendorMap[vendorId].services[generalServiceId].reviews.push(review);
        vendorMap[vendorId].services[generalServiceId].totalRating += rating;
        vendorMap[vendorId].services[generalServiceId].reviewCount++;
        vendorMap[vendorId].services[generalServiceId].ratingDistribution[
          rating < 1 ? 1 : rating > 5 ? 5 : rating
        ]++;
      }
    });

    // Convert maps to arrays and calculate metrics
    const vendors = Object.values(vendorMap).map((vendor) => {
      // Calculate vendor average rating
      const averageRating =
        vendor.reviewCount > 0
          ? (vendor.totalRating / vendor.reviewCount).toFixed(1)
          : "0.0";

      // Calculate rating percentages
      const ratingPercentages = {
        1:
          vendor.reviewCount > 0
            ? Math.round(
                (vendor.ratingDistribution[1] / vendor.reviewCount) * 100
              )
            : 0,
        2:
          vendor.reviewCount > 0
            ? Math.round(
                (vendor.ratingDistribution[2] / vendor.reviewCount) * 100
              )
            : 0,
        3:
          vendor.reviewCount > 0
            ? Math.round(
                (vendor.ratingDistribution[3] / vendor.reviewCount) * 100
              )
            : 0,
        4:
          vendor.reviewCount > 0
            ? Math.round(
                (vendor.ratingDistribution[4] / vendor.reviewCount) * 100
              )
            : 0,
        5:
          vendor.reviewCount > 0
            ? Math.round(
                (vendor.ratingDistribution[5] / vendor.reviewCount) * 100
              )
            : 0,
      };

      // Convert services map to array
      const services = Object.values(vendor.services).map((service) => {
        // Calculate service average rating
        const serviceAvgRating =
          service.reviewCount > 0
            ? (service.totalRating / service.reviewCount).toFixed(1)
            : "0.0";

        // Calculate service rating percentages
        const serviceRatingPercentages = {
          1:
            service.reviewCount > 0
              ? Math.round(
                  (service.ratingDistribution[1] / service.reviewCount) * 100
                )
              : 0,
          2:
            service.reviewCount > 0
              ? Math.round(
                  (service.ratingDistribution[2] / service.reviewCount) * 100
                )
              : 0,
          3:
            service.reviewCount > 0
              ? Math.round(
                  (service.ratingDistribution[3] / service.reviewCount) * 100
                )
              : 0,
          4:
            service.reviewCount > 0
              ? Math.round(
                  (service.ratingDistribution[4] / service.reviewCount) * 100
                )
              : 0,
          5:
            service.reviewCount > 0
              ? Math.round(
                  (service.ratingDistribution[5] / service.reviewCount) * 100
                )
              : 0,
        };

        return {
          ...service,
          averageRating: serviceAvgRating,
          ratingPercentages: serviceRatingPercentages,
        };
      });

      // Sort services by name
      services.sort((a, b) => a.name.localeCompare(b.name));

      return {
        ...vendor,
        services,
        averageRating,
        ratingPercentages,
      };
    });

    // Log what vendors we found
    const vendorNames = vendors.map((v) => v.name).join(", ");
    logWithDetails(`Processed ${vendors.length} vendors: ${vendorNames}`, {
      vendorCount: vendors.length,
      reviewCount: reviewData.length,
    });

    // Set vendor data state
    setVendorData(vendors);
  };

  // Filter vendors based on search - only returns vendors matching the search term
  const filteredVendors = useMemo(() => {
    if (!activeSearch) return vendorData;

    const term = activeSearch.toLowerCase().trim();
    logWithDetails(`Filtering vendors by search term: "${term}"`);

    return vendorData.filter((vendor) => {
      // Check vendor name
      if (vendor.name.toLowerCase().includes(term)) {
        return true;
      }

      // Check service names
      if (
        vendor.services.some((service) =>
          service.name.toLowerCase().includes(term)
        )
      ) {
        return true;
      }

      // Check reviews - reviewer names
      if (
        vendor.reviews.some((review) => {
          const reviewerName = review.reviewer_name || "";
          return reviewerName.toLowerCase().includes(term);
        })
      ) {
        return true;
      }

      // Check reviews - comments
      if (
        vendor.reviews.some((review) => {
          const comment = review.comment || "";
          return comment.toLowerCase().includes(term);
        })
      ) {
        return true;
      }

      // Check reviews in services
      if (
        vendor.services.some((service) =>
          service.reviews.some((review) => {
            const reviewerName = review.reviewer_name || "";
            const comment = review.comment || "";
            return (
              reviewerName.toLowerCase().includes(term) ||
              comment.toLowerCase().includes(term)
            );
          })
        )
      ) {
        return true;
      }

      return false;
    });
  }, [vendorData, activeSearch]);

  // Sort vendors based on selected sort
  const sortedVendors = useMemo(() => {
    if (filteredVendors.length === 0) return [];

    return [...filteredVendors].sort((a, b) => {
      if (selectedSort.field === "name") {
        return selectedSort.order === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (selectedSort.field === "averageRating") {
        return selectedSort.order === "asc"
          ? parseFloat(a.averageRating) - parseFloat(b.averageRating)
          : parseFloat(b.averageRating) - parseFloat(a.averageRating);
      } else if (selectedSort.field === "reviewCount") {
        return selectedSort.order === "asc"
          ? a.reviewCount - b.reviewCount
          : b.reviewCount - a.reviewCount;
      }
      return 0;
    });
  }, [filteredVendors, selectedSort]);

  // Handle search form submission
  const handleSearch = (e) => {
    e?.preventDefault();
    const trimmedTerm = searchTerm.trim();
    setActiveSearch(trimmedTerm);

    // Auto-expand the first vendor when searching
    if (trimmedTerm && filteredVendors.length > 0) {
      setExpandedVendorId(filteredVendors[0].id);
    }

    logWithDetails(`Search performed for: "${trimmedTerm}"`, {
      count: vendorData.length,
    });

    // If search is not empty, show toast with results
    if (trimmedTerm) {
      // Count how many vendors match the search term
      const term = trimmedTerm.toLowerCase();
      const matchCount = vendorData.filter((vendor) => {
        // Check vendor name
        if (vendor.name.toLowerCase().includes(term)) return true;

        // Check service names
        if (
          vendor.services.some((service) =>
            service.name.toLowerCase().includes(term)
          )
        )
          return true;

        // Check reviews
        if (
          vendor.reviews.some(
            (review) =>
              (review.reviewer_name &&
                review.reviewer_name.toLowerCase().includes(term)) ||
              (review.comment && review.comment.toLowerCase().includes(term))
          )
        )
          return true;

        return false;
      }).length;
    }
  };

  // Reset search
  const resetSearch = () => {
    setSearchTerm("");
    setActiveSearch("");
    logWithDetails("Search reset");
  };

  // Toggle vendor expansion
  const toggleVendorExpansion = (vendorId) => {
    setExpandedVendorId(expandedVendorId === vendorId ? null : vendorId);
    logWithDetails(`Toggled vendor expansion: ${vendorId}`);
  };

  // Toggle service expansion
  const toggleServiceExpansion = (serviceId) => {
    setExpandedServiceIds((prev) => ({
      ...prev,
      [serviceId]: !prev[serviceId],
    }));
    logWithDetails(`Toggled service expansion: ${serviceId}`);
  };

  // Delete review
  const deleteReview = async (reviewId) => {
    try {
      logWithDetails(`Deleting review ${reviewId}`);

      // Delete from API
      await api.delete(`/admin/reviews/${reviewId}`);

      // Update local state
      const updatedReviews = reviews.filter((review) => review.id !== reviewId);
      setReviews(updatedReviews);
      processReviewData(updatedReviews);

      toast({
        title: "Review deleted",
        description: "The review has been permanently removed.",
      });
    } catch (error) {
      logWithDetails("Error deleting review", { error: error.message });

      toast({
        variant: "destructive",
        title: "Error deleting review",
        description: "Failed to delete the review. Please try again.",
      });
    } finally {
      setConfirmDelete(null);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return "Invalid date";
    }
  };

  // Star Rating component - made responsive
  const StarRating = ({ rating, size = "default" }) => {
    // Define star sizes for different screen sizes
    const starSizes = {
      small: "h-3 w-3 md:h-3.5 md:w-3.5",
      default: "h-4 w-4 md:h-5 md:w-5",
      large: "h-5 w-5 md:h-6 md:w-6",
    };
    
    const starSize = starSizes[size] || starSizes.default;
    
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            fill={star <= rating ? "#FFB800" : "none"}
            stroke={star <= rating ? "#FFB800" : "#CBD5E1"}
            className={`${starSize} ${
              star <= rating ? "text-yellow-400" : "text-slate-300"
            }`}
          />
        ))}
      </div>
    );
  };

  // Rating Distribution component
  const RatingDistribution = ({ distribution }) => {
    return (
      <div className="space-y-1.5 sm:space-y-2">
        {[5, 4, 3, 2, 1].map((rating) => (
          <div key={rating} className="flex items-center gap-1 sm:gap-2">
            <div className="flex items-center gap-1 w-10 sm:w-12 text-xs sm:text-sm">
              <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-yellow-400 text-yellow-400" />
              <span>{rating}</span>
            </div>
            <Progress
              value={distribution[rating] || 0}
              className="h-1.5 sm:h-2 bg-gray-100 flex-grow"
              indicatorClassName={
                rating >= 4
                  ? "bg-green-500"
                  : rating === 3
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }
            />
            <span className="text-xs text-gray-500 w-6 sm:w-8 text-right">
              {distribution[rating] || 0}%
            </span>
          </div>
        ))}
      </div>
    );
  };

  // Loading state
  if (loading && vendorData.length === 0) {
    return (
      <div className="container p-3 sm:p-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2 mb-1">
            <MessageSquare className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600" />
            Review Management
          </h1>
          <p className="text-sm sm:text-base text-gray-500">
            View and analyze customer reviews across all vendors
          </p>
        </div>

        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-sm sm:text-base">Loading review data from database...</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              This may take a few moments
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container p-3 sm:p-6">
      {/* Header with search - made responsive */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <VoteIcon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Service Reviews
            </h1>
          </div>
        </div>
        <div className="w-full sm:w-auto">
          <form onSubmit={handleSearch} className="flex gap-2 w-full">
            <div className="relative w-full">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="search"
                className="pl-10 pr-4 py-2 sm:py-2.5 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm text-sm"
                placeholder="Search vendors, services, reviews..."
                value={searchInputValue}
                onChange={(e) => setSearchInputValue(e.target.value)}
              />
              {searchInputValue && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInputValue("");
                    resetSearch();
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* No vendors found message */}
      {vendorData.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-6 sm:p-8 text-center border rounded-lg bg-gray-50">
          <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mb-4" />
          <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-1">
            No vendors found
          </h3>
          <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
            {reviews.length > 0
              ? "Reviews were loaded but couldn't be mapped to vendors. Check data structure."
              : "No vendors were found in the database"}
          </p>
          <Button
            variant="outline"
            onClick={fetchReviewData}
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>Refresh Data</span>
          </Button>
        </div>
      ) : // No search results
      activeSearch && sortedVendors.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-6 sm:p-8 text-center border rounded-lg bg-gray-50">
          <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mb-4" />
          <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-1">
            No matching results
          </h3>
          <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
            No vendors or services match your search criteria "{activeSearch}"
          </p>
        </div>
      ) : (
        // Vendors list - show only filtered vendors when search is active
        <div className="space-y-3 sm:space-y-4">
          {sortedVendors.map((vendor) => {
            // Auto-expand first vendor on search
            if (
              activeSearch &&
              expandedVendorId === null &&
              sortedVendors.length === 1
            ) {
              setTimeout(() => setExpandedVendorId(vendor.id), 100);
            }

            return (
              <Card
                key={vendor.id}
                className={`overflow-hidden shadow-sm hover:shadow-md transition-shadow ${
                  activeSearch ? "border-blue-200" : ""
                }`}
              >
                <CardHeader
                  className={`py-2.5 sm:py-3 px-3 sm:px-4 ${
                    activeSearch ? "bg-blue-50" : "bg-white border-b"
                  } cursor-pointer`}
                  onClick={() => toggleVendorExpansion(vendor.id)}
                >
                  <div className="flex justify-between items-center flex-wrap sm:flex-nowrap gap-2">
                    {/* Vendor Name and Stats */}
                    <div className="flex items-center gap-2">
                      {expandedVendorId === vendor.id ? (
                        <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      ) : (
                        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                      )}
                      <div>
                        <div className="text-sm sm:text-base md:text-lg font-normal flex items-center gap-1 sm:gap-2 text-gray-800">
                          <span
                            className={
                              activeSearch &&
                              vendor.name
                                .toLowerCase()
                                .includes(activeSearch.toLowerCase())
                                ? "bg-yellow-100 px-1"
                                : ""
                            }
                          >
                            {vendor.name}
                          </span>
                          {activeSearch &&
                            vendor.name
                              .toLowerCase()
                              .includes(activeSearch.toLowerCase())}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-4 mt-1 text-xs sm:text-sm text-muted-foreground">
                          <span>{vendor.reviewCount} reviews</span>
                          <span>{vendor.services.length} services</span>
                          <span className="text-blue-600">
                            {activeSearch ? "Search match" : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 ml-auto">
                      <div className="text-right">
                        <div className="font-bold text-base sm:text-lg">
                          {vendor.averageRating}
                        </div>
                        <div className="text-xs text-muted-foreground hidden xs:block">
                          Average Rating
                        </div>
                      </div>
                      <StarRating
                        rating={Math.round(parseFloat(vendor.averageRating))}
                        size="default"
                      />
                    </div>
                  </div>
                </CardHeader>

                {expandedVendorId === vendor.id && (
                  <CardContent className="p-0">
                    <div className="space-y-3 sm:space-y-4 p-3 sm:p-4">
                      {/* Services */}
                      {vendor.services.length === 0 ? (
                        <div className="text-center p-4 bg-gray-50 rounded">
                          <p className="text-sm text-gray-500">
                            No services found for this vendor
                          </p>
                        </div>
                      ) : (
                        /* Filter services if searching to only show matching services */
                        vendor.services
                          .filter((service) => {
                            if (!activeSearch) return true;

                            // Include if service name matches
                            if (
                              service.name
                                .toLowerCase()
                                .includes(activeSearch.toLowerCase())
                            ) {
                              return true;
                            }

                            // Include if any review in the service matches
                            if (
                              service.reviews.some(
                                (review) =>
                                  (review.reviewer_name &&
                                    review.reviewer_name
                                      .toLowerCase()
                                      .includes(activeSearch.toLowerCase())) ||
                                  (review.comment &&
                                    review.comment
                                      .toLowerCase()
                                      .includes(activeSearch.toLowerCase()))
                              )
                            ) {
                              return true;
                            }

                            return false;
                          })
                          .map((service) => (
                            <Card
                              key={service.id}
                              className={`overflow-hidden ${
                                activeSearch &&
                                service.name
                                  .toLowerCase()
                                  .includes(activeSearch.toLowerCase())
                                  ? "border-blue-200"
                                  : "border-gray-100"
                              }`}
                            >
                              <CardHeader
                                className={`py-2.5 px-3 sm:py-3 sm:px-4 ${
                                  activeSearch &&
                                  service.name
                                    .toLowerCase()
                                    .includes(activeSearch.toLowerCase())
                                    ? "bg-blue-50"
                                    : "bg-white border-b"
                                } cursor-pointer`}
                                onClick={() =>
                                  toggleServiceExpansion(service.id)
                                }
                              >
                                <div className="flex justify-between items-center flex-wrap sm:flex-nowrap gap-2">
                                  <div className="flex items-center gap-1 sm:gap-2">
                                    {expandedServiceIds[service.id] ? (
                                      <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    ) : (
                                      <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    )}
                                    <div className="text-sm sm:text-base font-normal flex items-center gap-1 sm:gap-2 text-gray-700">
                                      <span
                                        className={
                                          activeSearch &&
                                          service.name
                                            .toLowerCase()
                                            .includes(
                                              activeSearch.toLowerCase()
                                            )
                                            ? "bg-yellow-100 px-1"
                                            : ""
                                        }
                                      >
                                        {service.name}
                                      </span>
                                      {activeSearch &&
                                        service.name
                                          .toLowerCase()
                                          .includes(activeSearch.toLowerCase())}
                                    </div>
                                    <span className="text-xs sm:text-sm text-muted-foreground">
                                      ({service.reviewCount} reviews)
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 sm:gap-2">
                                    <span className="font-bold text-sm sm:text-base">
                                      {service.averageRating}
                                    </span>
                                    <StarRating
                                      rating={Math.round(
                                        parseFloat(service.averageRating)
                                      )}
                                      size="small"
                                    />
                                  </div>
                                </div>
                              </CardHeader>

                              {expandedServiceIds[service.id] && (
                                <CardContent className="p-3 sm:p-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                    <div className="order-2 md:order-1">
                                      <RatingDistribution
                                        distribution={service.ratingPercentages}
                                      />
                                    </div>

                                    <div className="space-y-3 order-1 md:order-2">
                                      <h5 className="font-medium text-sm sm:text-base">
                                        Latest Reviews
                                      </h5>
                                      {service.reviews.length === 0 ? (
                                        <div className="text-center p-4 bg-gray-50 rounded">
                                          <p className="text-sm text-gray-500">
                                            No reviews for this service
                                          </p>
                                        </div>
                                      ) : (
                                        <div className="rounded-md border overflow-hidden">
                                          <div className="overflow-x-auto">
                                            <Table>
                                              <TableHeader>
                                                <TableRow>
                                                  <TableHead className="text-xs sm:text-sm py-2.5 px-2 sm:px-3">Reviewer</TableHead>
                                                  <TableHead className="text-xs sm:text-sm py-2.5 px-2 sm:px-3">Rating</TableHead>
                                                  <TableHead className="text-xs sm:text-sm py-2.5 px-2 sm:px-3">Comment</TableHead>
                                                  <TableHead className="text-xs sm:text-sm py-2.5 px-2 sm:px-3">Date</TableHead>
                                                  <TableHead className="text-xs sm:text-sm py-2.5 px-2 sm:px-3 text-right">
                                                    Actions
                                                  </TableHead>
                                                </TableRow>
                                              </TableHeader>
                                              <TableBody>
                                                {service.reviews
                                                  // Filter reviews if searching
                                                  .filter((review) => {
                                                    if (!activeSearch)
                                                      return true;

                                                    const reviewerName =
                                                      review.reviewer_name || "";
                                                    const comment =
                                                      review.comment || "";

                                                    return (
                                                      reviewerName
                                                        .toLowerCase()
                                                        .includes(
                                                          activeSearch.toLowerCase()
                                                        ) ||
                                                      comment
                                                        .toLowerCase()
                                                        .includes(
                                                          activeSearch.toLowerCase()
                                                        )
                                                    );
                                                  })
                                                  .sort(
                                                    (a, b) =>
                                                      new Date(b.created_at) -
                                                      new Date(a.created_at)
                                                  )
                                                  .slice(
                                                    0,
                                                    activeSearch ? 100 : 5
                                                  ) // Show all matching reviews when searching
                                                  .map((review) => (
                                                    <TableRow
                                                      key={review.id}
                                                      className={
                                                        activeSearch &&
                                                        ((review.reviewer_name &&
                                                          review.reviewer_name
                                                            .toLowerCase()
                                                            .includes(
                                                              activeSearch.toLowerCase()
                                                            )) ||
                                                          (review.comment &&
                                                            review.comment
                                                              .toLowerCase()
                                                              .includes(
                                                                activeSearch.toLowerCase()
                                                              )))
                                                          ? "bg-blue-50"
                                                          : ""
                                                      }
                                                    >
                                                      <TableCell className="py-2.5 px-2 sm:py-3 sm:px-3">
                                                        <div className="flex items-center gap-2">
                                                          <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                                                            {review.reviewer_name
                                                              ?.charAt(0)
                                                              .toUpperCase() ||
                                                              "U"}
                                                          </span>
                                                          <span
                                                            className={`text-xs sm:text-sm ${
                                                              activeSearch &&
                                                              review.reviewer_name
                                                                ?.toLowerCase()
                                                                .includes(
                                                                  activeSearch.toLowerCase()
                                                                )
                                                                ? "font-medium bg-yellow-100 px-1"
                                                                : ""
                                                            }`}
                                                          >
                                                            {review.reviewer_name ||
                                                              "Anonymous"}
                                                          </span>
                                                        </div>
                                                      </TableCell>
                                                      <TableCell className="py-2.5 px-2 sm:py-3 sm:px-3">
                                                        <div className="flex items-center">
                                                          <span className="font-bold mr-1 text-xs sm:text-sm">
                                                            {review.rating}
                                                          </span>
                                                          <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                                                        </div>
                                                      </TableCell>
                                                      <TableCell className="py-2.5 px-2 sm:py-3 sm:px-3 max-w-[80px] sm:max-w-[200px] truncate">
                                                        <span
                                                          className={`text-xs sm:text-sm ${
                                                            activeSearch &&
                                                            review.comment
                                                              ?.toLowerCase()
                                                              .includes(
                                                                activeSearch.toLowerCase()
                                                              )
                                                              ? "font-medium bg-yellow-100 px-1"
                                                              : ""
                                                          }`}
                                                        >
                                                          {review.comment ||
                                                            "No comment provided"}
                                                        </span>
                                                      </TableCell>
                                                      <TableCell className="py-2.5 px-2 sm:py-3 sm:px-3 text-xs sm:text-sm">
                                                        {formatDate(
                                                          review.created_at
                                                        )}
                                                      </TableCell>
                                                      <TableCell className="py-2.5 px-2 sm:py-3 sm:px-3 text-right">
                                                        <DropdownMenu>
                                                          <DropdownMenuTrigger
                                                            asChild
                                                          >
                                                            <Button
                                                              variant="ghost"
                                                              size="sm"
                                                              className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                                                            >
                                                              <span className="sr-only">
                                                                Open menu
                                                              </span>
                                                              <MoreHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                            </Button>
                                                          </DropdownMenuTrigger>
                                                          <DropdownMenuContent align="end">
                                                            <DropdownMenuItem
                                                              onClick={() =>
                                                                setSelectedReview(
                                                                  review
                                                                )
                                                              }
                                                              className="text-xs sm:text-sm"
                                                            >
                                                              <Eye className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                              <span>
                                                                View Details
                                                              </span>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                              onClick={() =>
                                                                setConfirmDelete(
                                                                  review
                                                                )
                                                              }
                                                              className="text-red-600 focus:text-red-600 text-xs sm:text-sm"
                                                            >
                                                              <Trash className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                              <span>Delete</span>
                                                            </DropdownMenuItem>
                                                          </DropdownMenuContent>
                                                        </DropdownMenu>
                                                      </TableCell>
                                                    </TableRow>
                                                  ))}
                                              </TableBody>
                                            </Table>
                                          </div>
                                        </div>
                                      )}

                                      {/* View all reviews button if more than 5 and not searching */}
                                      {!activeSearch &&
                                        service.reviews.length > 5 && (
                                          <div className="text-center mt-2">
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => {
                                                console.log(
                                                  `Viewing all ${service.reviews.length} reviews for ${service.name}`
                                                );
                                              }}
                                              className="text-xs sm:text-sm"
                                            >
                                              View all {service.reviews.length}{" "}
                                              reviews
                                            </Button>
                                          </div>
                                        )}
                                    </div>
                                  </div>
                                </CardContent>
                              )}
                            </Card>
                          ))
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Review Details Dialog - made responsive */}
      {selectedReview && (
        <Dialog
          open={!!selectedReview}
          onOpenChange={(open) => !open && setSelectedReview(null)}
        >
          <DialogContent className="sm:max-w-[600px] p-4 sm:p-6 max-w-[95vw] w-full">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Review Details</DialogTitle>
              <DialogDescription className="text-sm">
                Review for {selectedReview.service_name || "Service"}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium">
                  {selectedReview.reviewer_name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div>
                  <h3 className="font-medium text-sm sm:text-base">
                    {selectedReview.reviewer_name || "Anonymous"}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {formatDate(selectedReview.created_at)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs sm:text-sm font-medium mb-1">Rating:</p>
                <div className="flex items-center gap-2">
                  <StarRating rating={selectedReview.rating} size="default" />
                  <span className="text-xs sm:text-sm">({selectedReview.rating}/5)</span>
                </div>
              </div>

              <div>
                <p className="text-xs sm:text-sm font-medium mb-1">Review Comment:</p>
                <div className="bg-gray-50 p-3 rounded-md text-xs sm:text-sm">
                  {selectedReview.comment || "No comment provided"}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <p className="text-xs sm:text-sm font-medium mb-1">Service:</p>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                    <span className="text-xs sm:text-sm">
                      {selectedReview.service_name || "Unnamed Service"}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-xs sm:text-sm font-medium mb-1">Vendor:</p>
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                    <span className="text-xs sm:text-sm">{selectedReview.vendor_name || "Unknown"}</span>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 flex-col sm:flex-row">
              <Button variant="outline" onClick={() => setSelectedReview(null)} className="w-full sm:w-auto text-xs sm:text-sm">
                Close
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  console.log(
                    `Initiating deletion for review ${selectedReview.id}`
                  );
                  setSelectedReview(null);
                  setConfirmDelete(selectedReview);
                }}
                className="gap-1 w-full sm:w-auto text-xs sm:text-sm"
              >
                <Trash className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog - made responsive */}
      {confirmDelete && (
        <Dialog
          open={!!confirmDelete}
          onOpenChange={(open) => !open && setConfirmDelete(null)}
        >
          <DialogContent className="sm:max-w-[425px] p-4 sm:p-6 max-w-[95vw] w-full">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Delete Review</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Are you sure you want to delete this review? This action cannot
                be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="py-3 sm:py-4">
              <div className="bg-red-50 border border-red-200 rounded-md p-2.5 sm:p-3 flex items-start gap-2 sm:gap-3">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800 text-xs sm:text-sm">Warning</p>
                  <p className="text-xs text-red-700">
                    Deleting this review will permanently remove it from the
                    database and may affect vendor ratings.
                  </p>
                </div>
              </div>

              {/* Review summary */}
              <div className="mt-3 sm:mt-4 p-3 border rounded-md">
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm font-medium">Service:</span>
                  <span className="text-xs sm:text-sm">
                    {confirmDelete.service_name || "Unnamed Service"}
                  </span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs sm:text-sm font-medium">Rating:</span>
                  <span className="text-xs sm:text-sm">{confirmDelete.rating}/5</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs sm:text-sm font-medium">Reviewer:</span>
                  <span className="text-xs sm:text-sm">
                    {confirmDelete.reviewer_name || "Anonymous"}
                  </span>
                </div>
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button 
                variant="outline" 
                onClick={() => setConfirmDelete(null)}
                className="w-full sm:w-auto text-xs sm:text-sm"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  console.log(`Deleting review ${confirmDelete.id}`);
                  deleteReview(confirmDelete.id);
                }}
                className="w-full sm:w-auto text-xs sm:text-sm"
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Reviews;