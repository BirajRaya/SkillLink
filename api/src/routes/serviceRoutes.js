const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Search route
router.get('/search', async (req, res) => {
    const { q: searchQuery } = req.query;

    try {
        // Base query with all necessary joins
        let query = `
            SELECT 
                s.id,
                s.name,
                s.description,
                s.price,
                s.image_url,
                s.location,
                c.category_name,
                COALESCE(AVG(r.rating)::numeric(10,2), 0) as average_rating,
                COUNT(DISTINCT r.id) as review_count
            FROM services s
            LEFT JOIN categories c ON s.category_id = c.id
            LEFT JOIN reviews r ON s.id = r.service_id
            WHERE s.status = true
        `;

        const queryParams = [];

        // Add search condition if query is provided
        if (searchQuery) {
            query += `
                AND (
                    LOWER(s.name) LIKE LOWER($1) OR 
                    LOWER(s.description) LIKE LOWER($1) OR
                    LOWER(s.location) LIKE LOWER($1) OR
                    LOWER(c.category_name) LIKE LOWER($1)
                )
            `;
            queryParams.push(`%${searchQuery}%`);
        }

        // Add group by clause
        query += `
            GROUP BY 
                s.id, 
                s.name,
                s.description,
                s.price,
                s.image_url,
                s.location,
                c.category_name
            ORDER BY 
                CASE 
                    WHEN LOWER(s.name) LIKE LOWER($1) THEN 0
                    WHEN LOWER(c.category_name) LIKE LOWER($1) THEN 1
                    ELSE 2
                END,
                s.created_at DESC
        `;

        const result = await pool.query(query, queryParams);
        res.json(result.rows);

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ 
            message: 'Error performing search',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get service by ID route 
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    // Validate if id is a valid integer
    if (!Number.isInteger(parseInt(id))) {
        return res.status(400).json({ 
            message: 'Invalid service ID. Must be a number.' 
        });
    }

    try {
        // Query to get service details with category and reviews
        const query = `
            SELECT 
                s.id,
                s.name,
                s.description,
                s.price,
                s.image_url,
                s.location,
                s.status,
                c.category_name,
                u.full_name as vendor_name,
                u.email as vendor_email,
                u.phone_number as vendor_phone,
                COALESCE(AVG(r.rating)::numeric(10,2), 0) as average_rating,
                COUNT(DISTINCT r.id) as review_count
            FROM services s
            LEFT JOIN categories c ON s.category_id = c.id
            LEFT JOIN users u ON s.vendor_id = u.id
            LEFT JOIN reviews r ON s.id = r.service_id
            WHERE s.id = $1 AND s.status = true
            GROUP BY 
                s.id, 
                s.name, 
                s.description, 
                s.price, 
                s.image_url, 
                s.location,
                s.status,
                c.category_name,
                u.full_name,
                u.email,
                u.phone_number
        `;

        const result = await pool.query(query, [parseInt(id)]);

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                message: 'Service not found or inactive'
            });
        }

        // Get reviews for the service
        const reviewsQuery = `
            SELECT 
                r.id,
                r.rating,
                r.comment,
                r.created_at,
                u.full_name as reviewer_name,
                u.profile_picture as reviewer_image
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.service_id = $1
            ORDER BY r.created_at DESC
            LIMIT 5
        `;

        const reviews = await pool.query(reviewsQuery, [parseInt(id)]);

        // Combine service details with reviews
        const serviceData = {
            ...result.rows[0],
            reviews: reviews.rows
        };

        res.json(serviceData);

    } catch (error) {
        console.error('Error fetching service details:', error);
        res.status(500).json({ 
            message: 'Error fetching service details',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// review submission route
// Add new endpoints for edit and delete
router.put('/:serviceId/reviews/:reviewId', async (req, res) => {
    const { serviceId, reviewId } = req.params;
    const { rating, comment } = req.body;
    const userLogin = req.headers['x-user-login'];
    const currentTime = req.headers['x-current-time'];

    if (!userLogin) {
        return res.status(401).json({
            status: 'error',
            message: 'Please log in to edit your review'
        });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Verify user and review ownership
        const userEmail = `${userLogin}@gmail.com`;
        const reviewCheck = await client.query(
            `SELECT r.id 
             FROM reviews r
             JOIN users u ON r.user_id = u.id
             WHERE r.id = $1 AND r.service_id = $2 AND u.email = $3`,
            [reviewId, serviceId, userEmail]
        );

        if (reviewCheck.rows.length === 0) {
            throw new Error('UNAUTHORIZED');
        }

        // Update the review
        await client.query(
            `UPDATE reviews 
             SET rating = $1, comment = $2, updated_at = $3
             WHERE id = $4`,
            [rating, comment, currentTime, reviewId]
        );

        // Recalculate stats
        const statsResult = await client.query(
            `SELECT 
                ROUND(AVG(rating)::numeric, 2) as avg_rating,
                COUNT(*) as review_count
             FROM reviews 
             WHERE service_id = $1`,
            [serviceId]
        );

        await client.query('COMMIT');

        res.json({
            status: 'success',
            message: 'Review updated successfully',
            data: {
                average_rating: statsResult.rows[0].avg_rating,
                review_count: statsResult.rows[0].review_count
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        
        if (error.message === 'UNAUTHORIZED') {
            res.status(403).json({
                status: 'error',
                message: 'You can only edit your own reviews'
            });
        } else {
            res.status(500).json({
                status: 'error',
                message: 'Failed to update review'
            });
        }
    } finally {
        client.release();
    }
});

router.delete('/:serviceId/reviews/:reviewId', async (req, res) => {
    const { serviceId, reviewId } = req.params;
    const userLogin = req.headers['x-user-login'];

    if (!userLogin) {
        return res.status(401).json({
            status: 'error',
            message: 'Please log in to delete your review'
        });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Verify user and review ownership
        const userEmail = `${userLogin}@gmail.com`;
        const reviewCheck = await client.query(
            `SELECT r.id 
             FROM reviews r
             JOIN users u ON r.user_id = u.id
             WHERE r.id = $1 AND r.service_id = $2 AND u.email = $3`,
            [reviewId, serviceId, userEmail]
        );

        if (reviewCheck.rows.length === 0) {
            throw new Error('UNAUTHORIZED');
        }

        // Delete the review
        await client.query(
            'DELETE FROM reviews WHERE id = $1',
            [reviewId]
        );

        // Recalculate stats
        const statsResult = await client.query(
            `SELECT 
                ROUND(AVG(rating)::numeric, 2) as avg_rating,
                COUNT(*) as review_count
             FROM reviews 
             WHERE service_id = $1`,
            [serviceId]
        );

        await client.query('COMMIT');

        res.json({
            status: 'success',
            message: 'Review deleted successfully',
            data: {
                average_rating: statsResult.rows[0].avg_rating,
                review_count: statsResult.rows[0].review_count
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        
        if (error.message === 'UNAUTHORIZED') {
            res.status(403).json({
                status: 'error',
                message: 'You can only delete your own reviews'
            });
        } else {
            res.status(500).json({
                status: 'error',
                message: 'Failed to delete review'
            });
        }
    } finally {
        client.release();
    }
});

// Modified POST endpoint to include user's existing review
router.post('/:id/reviews', async (req, res) => {
    const userLogin = req.headers['x-user-login'];
    const currentTime = req.headers['x-current-time'];

    if (!userLogin) {
        return res.status(401).json({
            status: 'error',
            message: 'Please log in to submit a review'
        });
    }

    const { id: service_id } = req.params;
    const { rating, comment } = req.body;
    const userEmail = `${userLogin}@gmail.com`;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Get user details
        const userResult = await client.query(
            'SELECT id, full_name FROM users WHERE email = $1',
            [userEmail]
        );

        if (userResult.rows.length === 0) {
            throw new Error('USER_NOT_FOUND');
        }

        const user = userResult.rows[0];

        // Check for existing review
        const existingReview = await client.query(
            `SELECT r.id, r.rating, r.comment, r.created_at
             FROM reviews r
             WHERE r.service_id = $1 AND r.user_id = $2`,
            [service_id, user.id]
        );

        if (existingReview.rows.length > 0) {
            // Return the existing review instead of throwing an error
            return res.status(200).json({
                status: 'exists',
                message: 'You have already reviewed this service',
                data: {
                    review: existingReview.rows[0],
                    canEdit: true
                }
            });
        }

        // Insert new review
        const reviewResult = await client.query(
            `INSERT INTO reviews (service_id, user_id, rating, comment, created_at)
             VALUES ($1, $2, $3, $4, $5::timestamptz)
             RETURNING id, created_at`,
            [service_id, user.id, rating, comment, currentTime]
        );

        // Calculate stats
        const statsResult = await client.query(
            `SELECT 
                ROUND(AVG(rating)::numeric, 2) as avg_rating,
                COUNT(*) as review_count
             FROM reviews 
             WHERE service_id = $1`,
            [service_id]
        );

        await client.query('COMMIT');

        res.status(201).json({
            status: 'success',
            message: 'Review submitted successfully',
            data: {
                reviewer_name: user.full_name,
                review: {
                    id: reviewResult.rows[0].id,
                    created_at: reviewResult.rows[0].created_at,
                    rating,
                    comment
                },
                service: {
                    average_rating: statsResult.rows[0].avg_rating,
                    review_count: statsResult.rows[0].review_count
                }
            }
        });

    } catch (error) {
        console.error('Error in review submission:', error);
        await client.query('ROLLBACK');
        
        if (error.message === 'USER_NOT_FOUND') {
            res.status(404).json({
                status: 'error',
                message: 'User account not found'
            });
        } else {
            res.status(500).json({
                status: 'error',
                message: 'Failed to submit review'
            });
        }
    } finally {
        client.release();
    }
});


module.exports = router;