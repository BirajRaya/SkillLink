const pool = require('../config/db');

const createReview = async (req, res) => {
    const { service_id, rating, comment } = req.body;
    const user_id = req.user.id;

    try {
        const result = await pool.query(
            `INSERT INTO reviews (service_id, user_id, rating, comment)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [service_id, user_id, rating, comment]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating review:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getServiceReviews = async (req, res) => {
    const { serviceId } = req.params;

    try {
        const result = await pool.query(
            `SELECT 
                r.*,
                u.full_name as reviewer_name,
                u.profile_picture as reviewer_picture
             FROM reviews r
             JOIN users u ON r.user_id = u.id
             WHERE r.service_id = $1
             ORDER BY r.created_at DESC`,
            [serviceId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const updateReview = async (req, res) => {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const user_id = req.user.id;

    try {
        const result = await pool.query(
            `UPDATE reviews
             SET rating = $1, comment = $2, updated_at = CURRENT_TIMESTAMP
             WHERE id = $3 AND user_id = $4
             RETURNING *`,
            [rating, comment, id, user_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Review not found or unauthorized' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating review:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const deleteReview = async (req, res) => {
    const { id } = req.params;
    const user_id = req.user.id;

    try {
        const result = await pool.query(
            'DELETE FROM reviews WHERE id = $1 AND user_id = $2 RETURNING *',
            [id, user_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Review not found or unauthorized' });
        }

        res.json({ message: 'Review deleted successfully' });
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    createReview,
    getServiceReviews,
    updateReview,
    deleteReview
};