const express = require('express');
const router = express.Router();
const pool = require('../config/db');
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

module.exports = router;