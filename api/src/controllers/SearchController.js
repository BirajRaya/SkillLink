const pool = require('../config/db');

const searchServices = async (req, res) => {
    const { query, category, minPrice, maxPrice } = req.query;
    
    try {
        let sqlQuery = `
            SELECT 
                s.id,
                s.name,
                s.description,
                s.price,
                s.image_url,
                c.category_name,
                u.full_name as vendor_name,
                COALESCE(AVG(r.rating), 0) as average_rating,
                COUNT(DISTINCT r.id) as review_count
            FROM services s
            LEFT JOIN categories c ON s.category_id = c.id
            LEFT JOIN users u ON s.vendor_id = u.id
            LEFT JOIN reviews r ON s.id = r.service_id
            WHERE s.status = true
        `;

        const queryParams = [];
        
        if (query) {
            queryParams.push(`%${query}%`);
            sqlQuery += ` AND (LOWER(s.name) LIKE LOWER($${queryParams.length}) 
                          OR LOWER(s.description) LIKE LOWER($${queryParams.length}))`;
        }

        if (category) {
            queryParams.push(category);
            sqlQuery += ` AND c.id = $${queryParams.length}`;
        }

        if (minPrice) {
            queryParams.push(minPrice);
            sqlQuery += ` AND s.price >= $${queryParams.length}`;
        }

        if (maxPrice) {
            queryParams.push(maxPrice);
            sqlQuery += ` AND s.price <= $${queryParams.length}`;
        }

        sqlQuery += ` GROUP BY s.id, s.name, s.description, s.price, s.image_url, 
                     c.category_name, u.full_name
                     ORDER BY s.created_at DESC`;

        const result = await pool.query(sqlQuery, queryParams);
        res.json(result.rows);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getServiceDetails = async (req, res) => {
    const { id } = req.params;
    
    try {
        const serviceQuery = `
            SELECT 
                s.*,
                c.category_name,
                u.full_name as vendor_name,
                COALESCE(AVG(r.rating), 0) as average_rating,
                COUNT(DISTINCT r.id) as review_count
            FROM services s
            LEFT JOIN categories c ON s.category_id = c.id
            LEFT JOIN users u ON s.vendor_id = u.id
            LEFT JOIN reviews r ON s.id = r.service_id
            WHERE s.id = $1
            GROUP BY s.id, c.category_name, u.full_name
        `;

        const result = await pool.query(serviceQuery, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Service not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching service details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    searchServices,
    getServiceDetails
};