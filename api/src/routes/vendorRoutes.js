const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { addVendor, getAllVendors, updateVendorById, deleteVendorById } = require('../controllers/admin/vendors');

// Save vendor availability
router.post('/update-availability', async (req, res) => {
    try {
        const { vendorId, availability } = req.body;
        const { status, workingDays, workingHours, responseTime, additionalNotes } = availability;

        // Validate required fields
        if (!status || !workingDays || !workingHours  || !responseTime) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const query = `
        INSERT INTO vendor_availability 
        (vendor_id, status, working_days, working_hours, response_time, additional_notes) 
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (vendor_id) DO UPDATE 
        SET status = EXCLUDED.status,
            working_days = EXCLUDED.working_days,
            working_hours = EXCLUDED.working_hours,
            response_time = EXCLUDED.response_time,
            additional_notes = EXCLUDED.additional_notes
        RETURNING *;
         `;

         const values = [vendorId, status, workingDays, workingHours, responseTime, additionalNotes];
        const result = await pool.query(query, values);
        res.json({ 
            message: "Availability saved successfully", 
            data: result.rows[0] 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error while saving availability" });
    }
});

router.get('/:vendor_id/avaibilability', async (req, res) => {
    const { vendor_id } = req.params;
    try {
      // Query the vendor_availability table for the specified vendor
      const query = `
        SELECT vendor_id, status, working_days, working_hours, response_time, additional_notes
        FROM vendor_availability
        WHERE vendor_id = $1 AND status = 'available';
      `;
      
      const { rows } = await pool.query(query, [vendor_id]);
  
      if (rows.length === 0) {
        return res.status(404).json({ 
          error: 'Vendor availability not found or vendor is unavailable',
          isAvailable: false
        });
      }
  
      // Return the complete vendor availability information
      res.status(200).json({
        vendor_id: rows[0].vendor_id,
        status: rows[0].status,
        working_days: rows[0].working_days,
        working_hours: rows[0].working_hours,
        response_time: rows[0].response_time,
        additional_notes: rows[0].additional_notes,
        isAvailable: true
      });
    } catch (err) {
      console.error('Error fetching vendor availability:', err);
      res.status(500).json({ 
        error: 'Internal server error',
        isAvailable: false
      });
    }
  });
  

router.get('/getAvailability/:vendorId', async (req, res) => {
    const { vendorId } = req.params;

    try {
        const result = await pool.query("SELECT * FROM vendor_availability WHERE vendor_id = $1", [vendorId]);
        if (result.rows.length > 0) {
            const availability = result.rows[0]; // Fetch the first row
        
            res.status(200).json({
                status: availability.status,
                workingDays: availability.working_days, // Assuming JSONB column
                workingHours: availability.working_hours, // Assuming JSONB column
                responseTime: availability.response_time,
                additionalNotes: availability.additional_notes || "" 
            });
        } else {
            res.status(404).json({ message: "Availability not found" });
        }
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch availability" });
    }
});

// Get vendor dashboard statistics
router.get('/dashboard-stats/:vendorId', async (req, res) => {
    try {
        const { vendorId } = req.params;
        const currentDate = new Date();
        const firstDayLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        
        // Get total bookings and earnings
        const totalStatsQuery = `
            SELECT COUNT(*) as total_bookings, 
                   COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as total_earnings
            FROM bookings 
            WHERE vendor_id = $1
        `;
        
        // Get bookings by status
        const bookingStatusQuery = `
            SELECT 
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bookings,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings,
                COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings
            FROM bookings 
            WHERE vendor_id = $1
        `;
        
        // Get rating information
        const ratingsQuery = `
            SELECT AVG(r.rating) as average_rating, 
                   COUNT(r.id) as total_reviews
            FROM reviews r
            JOIN bookings b ON r.service_id = b.service_id AND r.user_id = b.user_id
            WHERE b.vendor_id = $1
        `;

        const currentMonthQuery = `
    SELECT 
        COUNT(*) AS current_month_bookings, 
        COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) AS current_month_earnings
    FROM bookings 
    WHERE vendor_id = $1 
      AND booking_date >= DATE_TRUNC('month', CURRENT_DATE) 
      AND booking_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';
`;

        
        // Get bookings from last month for comparison
        const lastMonthQuery = `
        SELECT COUNT(*) as last_month_bookings,
               SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as last_month_earnings
        FROM bookings
        WHERE vendor_id = $1 
          AND booking_date >= $2 
          AND booking_date < $3;
    `;


        
        // Get recent bookings
        const recentBookingsQuery = `
            SELECT b.id, u.full_name as customer, s.name as service, 
                   TO_CHAR(b.booking_date, 'YYYY-MM-DD HH24:MI') as date,
                   b.amount, b.status
            FROM bookings b
            JOIN users u ON b.user_id = u.id
            JOIN services s ON b.service_id = s.id
            WHERE b.vendor_id = $1
            ORDER BY b.booking_date DESC
            LIMIT 5
        `;
        
        // Get popular services
        const popularServicesQuery = `
            SELECT s.name as service, 
                   COUNT(b.id) as bookings,
                   SUM(b.amount) as earnings
            FROM bookings b
            JOIN services s ON b.service_id = s.id
            WHERE b.vendor_id = $1
            GROUP BY s.name
            ORDER BY COUNT(b.id) DESC
            LIMIT 5
        `;
        
        // Get completion rate change
        const completionRateQuery = `
            SELECT 
                (COUNT(CASE WHEN status = 'completed' AND booking_date >= $2 AND booking_date < $3 THEN 1 END) * 100.0 / 
                NULLIF(COUNT(CASE WHEN booking_date >= $2 AND booking_date < $3 THEN 1 END), 0)) as last_month_completion_rate,
                (COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / 
                NULLIF(COUNT(*), 0)) as overall_completion_rate
            FROM bookings
            WHERE vendor_id = $1
        `;
        
        // Get monthly data for the last 6 months
        const monthlyStatsQuery = `
            SELECT 
                TO_CHAR(DATE_TRUNC('month', booking_date), 'Mon YYYY') as month,
                COUNT(*) as total_bookings,
                SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as revenue,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings,
                ROUND(AVG(
                    CASE WHEN EXISTS (
                        SELECT 1 FROM reviews r 
                        WHERE r.service_id = bookings.service_id AND r.user_id = bookings.user_id
                    )
                    THEN (
                        SELECT rating FROM reviews r 
                        WHERE r.service_id = bookings.service_id AND r.user_id = bookings.user_id
                        LIMIT 1
                    )
                    ELSE NULL END
                ), 1) as avg_rating
            FROM bookings
            WHERE 
                vendor_id = $1 
                AND booking_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '5 months')
            GROUP BY DATE_TRUNC('month', booking_date)
            ORDER BY DATE_TRUNC('month', booking_date)
        `;

        const firstDayCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        
        // Execute all queries in parallel
        const [
            totalStats, 
            bookingStatus,
            ratings, 
            lastMonthStats,
            currentMonthStats,
            recentBookings,
            popularServices,
            completionRates,
            monthlyStats,
        ] = await Promise.all([
            pool.query(totalStatsQuery, [vendorId]),
            pool.query(bookingStatusQuery, [vendorId]),
            pool.query(ratingsQuery, [vendorId]),
            pool.query(lastMonthQuery, [vendorId, firstDayLastMonth, firstDayCurrentMonth]),
            pool.query(currentMonthQuery, [vendorId]),
            pool.query(recentBookingsQuery, [vendorId]),
            pool.query(popularServicesQuery, [vendorId]),
            pool.query(completionRateQuery, [vendorId, firstDayLastMonth, firstDayCurrentMonth]),
            pool.query(monthlyStatsQuery, [vendorId])
        ]);
        
        // Calculate percent changes
        const totalBookings = parseInt(totalStats.rows[0].total_bookings) || 0;
        const totalEarnings = parseFloat(totalStats.rows[0].total_earnings) || 0;
        const currentMonthBookings = parseInt(currentMonthStats.rows[0].current_month_bookings) || 0;
        const currentMonthEarnings = parseFloat(currentMonthStats.rows[0].current_month_earnings) || 0;
        const lastMonthBookings = parseInt(lastMonthStats.rows[0].last_month_bookings) || 0;
        const lastMonthEarnings = parseFloat(lastMonthStats.rows[0].last_month_earnings) || 0;
        
        // Avoid division by zero
        const bookingsChange = lastMonthBookings ? 
            ((currentMonthBookings - lastMonthBookings) / lastMonthBookings) * 100 : 0;
        const earningsChange = lastMonthEarnings ? 
            ((currentMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100 : 0;
            
        // Calculate completion rate change
        const completedBookings = parseInt(bookingStatus.rows[0].completed_bookings) || 0;
        const cancelledBookings = parseInt(bookingStatus.rows[0].cancelled_bookings) || 0;
        const pendingBookings = parseInt(bookingStatus.rows[0].pending_bookings) || 0;
        
        const overallCompletionRate = parseFloat(completionRates.rows[0].overall_completion_rate) || 0;
        const lastMonthCompletionRate = parseFloat(completionRates.rows[0].last_month_completion_rate) || 0;
        
        const completionRateChange = lastMonthCompletionRate ? 
            (overallCompletionRate - lastMonthCompletionRate) : 0;
            
        const dashboardStats = {
            totalBookings,
            totalEarnings,
            bookingsChangePercent: Math.round(bookingsChange),
            earningsChangePercent: Math.round(earningsChange),
            averageRating: parseFloat(ratings.rows[0].average_rating).toFixed(1) || "0.0",
            totalReviews: parseInt(ratings.rows[0].total_reviews) || 0,
            pendingBookings,
            completedBookings,
            cancelledBookings,
            completionRate: overallCompletionRate.toFixed(1),
            completionRateChangePercent: completionRateChange.toFixed(1),
            recentBookings: recentBookings.rows,
            popularServices: popularServices.rows,
            monthlyStats: monthlyStats.rows
        };
        
        res.json({ success: true, dashboardStats });
    } catch (error) {
        console.error('Error fetching dashboard statistics:', error);
        res.status(500).json({ error: "Server error while fetching dashboard statistics" });
    }
});

// Get vendor service insights
router.get('/service-insights/:vendorId', async (req, res) => {
    try {
        const { vendorId } = req.params;

        // Most booked service query
        const mostBookedQuery = `
            SELECT 
                s.id,
                s.name, 
                COUNT(b.id) as booking_count,
                s.image_url
            FROM services s
            JOIN bookings b ON s.id = b.service_id
            WHERE s.vendor_id = $1
            GROUP BY s.id, s.name
            ORDER BY booking_count DESC
            LIMIT 1
        `;

        // Highest rated service query
        const highestRatedQuery = `
            SELECT 
                s.id,
                s.name, 
                COALESCE(AVG(r.rating), 0) as average_rating,
                COUNT(r.id) as review_count,
                s.image_url
            FROM services s
            JOIN bookings b ON s.id = b.service_id
            LEFT JOIN reviews r ON b.service_id = r.service_id AND b.user_id = r.user_id
            WHERE s.vendor_id = $1
            GROUP BY s.id, s.name
            HAVING COUNT(r.id) > 0
            ORDER BY average_rating DESC
            LIMIT 1
        `;

        // Most profitable service query
        const mostProfitableQuery = `
            SELECT 
                s.id,
                s.name, 
                SUM(b.amount) as total_revenue,
                COUNT(b.id) as booking_count,
                s.image_url
            FROM services s
            JOIN bookings b ON s.id = b.service_id
            WHERE s.vendor_id = $1 AND b.status = 'completed'
            GROUP BY s.id, s.name
            ORDER BY total_revenue DESC
            LIMIT 1
        `;

        // Execute all queries in parallel
        const [mostBooked, highestRated, mostProfitable] = await Promise.all([
            pool.query(mostBookedQuery, [vendorId]),
            pool.query(highestRatedQuery, [vendorId]),
            pool.query(mostProfitableQuery, [vendorId])
        ]);

        const serviceInsights = {
            mostBooked: mostBooked.rows[0] || null,
            highestRated: highestRated.rows[0] || null,
            mostProfitable: mostProfitable.rows[0] || null
        };

        res.json({ success: true, serviceInsights });
    } catch (error) {
        console.error('Error fetching service insights:', error);
        res.status(500).json({ error: "Server error while fetching service insights" });
    }
});

router.post('/add-vendor', addVendor);

// Route to get all vendors
router.get('/getAllVendors', getAllVendors);

// Route to update a vendor by ID
router.put('/update-vendor/:id', updateVendorById);

// Route to delete a vendor by ID
router.delete('/delete-vendor/:id', deleteVendorById);

module.exports = router;