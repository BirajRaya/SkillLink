const express = require("express");
const router = express.Router();
const pool = require("../config/db"); // PostgreSQL connection
const multer = require("multer");

// Multer setup for file uploads (evidence)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/"); // Ensure this folder exists
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    },
});

const upload = multer({ storage: storage });

// Create a dispute
router.post("/create", async (req, res) => {
    try {
        const { user_id, booking_id, reason, description , feedback, user_name, vendor_name, service_name} = req.body; // Ensure `user_id` is sent
        const evidencePath = req.body.evidence ? req.body.evidence : null; // Store file path if uploaded  

        // Insert into database
        const newDispute = await pool.query(
            `INSERT INTO dispute (user_id, booking_id, reason, description, evidence, feedback, user_name, vendor_name, service_name) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [user_id, booking_id, reason, description, evidencePath, feedback, user_name, vendor_name, service_name]
        );

        res.status(201).json({ status: "success", dispute: newDispute.rows[0] });
    } catch (err) {
        console.error("Error processing dispute:", err.message);
        res.status(500).json({ error: "Server error" });
    }
});

// Check if a dispute exists for a given booking_id
router.get("/check/:booking_id", async (req, res) => {
    try {
        const { booking_id } = req.params;
        
        // Query database for dispute related to the given booking_id
        const dispute = await pool.query(
            `SELECT * FROM dispute WHERE booking_id = $1`,
            [booking_id]
        );
        
        if (dispute.rows.length > 0) {
            res.status(200).json({ exists: true, dispute: dispute.rows[0] });
        } else {
            res.status(200).json({ exists: false, message: "No dispute found for this booking." });
        }
    } catch (err) {
        console.error("Error checking dispute:", err.message);
        res.status(500).json({ error: "Server error" });
    }
});

// Get disputes for the logged-in user (Supports pagination and filtering by status)
router.get("/user", async (req, res) => {
    try {
        const { user_id , isAdmin} = req.query; // Get user_id from query params
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const offset = (page - 1) * limit;
        const statusFilter = req.query.status; // Optional status filter

        if(isAdmin){
            const adminDisputes = await pool.query(
                "SELECT * FROM dispute"
            );
            
            // Optimize response by replacing evidence with 'has-evidence' indicator
            const optimizedDisputes = adminDisputes.rows.map(dispute => {
                if (dispute.evidence) {
                    return {
                        ...dispute,
                        evidence: 'has-evidence' // Replace actual image data with indicator
                    };
                }
                return dispute;
            });
            
            res.json({
                disputes: optimizedDisputes,
                total: adminDisputes.rows.length,
                page,
                limit,
            });
            return;
        }

        if (!user_id) {
            return res.status(400).json({ error: "User ID is required" });
        }

        // SQL query to fetch disputes for a user
        let query = `SELECT * FROM dispute WHERE user_id = $1`;
        const values = [user_id];

        // Add status filter if provided
        if (statusFilter) {
            query += ` AND status = $2`;
            values.push(statusFilter);
        }

        query += ` ORDER BY created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
        values.push(limit, offset);

        const disputes = await pool.query(query, values);
        const totalDisputes = await pool.query(
            `SELECT COUNT(*) FROM dispute WHERE user_id = $1 ${statusFilter ? "AND status = $2" : ""}`,
            statusFilter ? [user_id, statusFilter] : [user_id]
        );

        // Optimize response by replacing evidence with 'has-evidence' indicator
        const optimizedDisputes = disputes.rows.map(dispute => {
            if (dispute.evidence) {
                return {
                    ...dispute,
                    evidence: 'has-evidence' // Replace actual image data with indicator
                };
            }
            return dispute;
        });

        res.json({
            disputes: optimizedDisputes,
            total: parseInt(totalDisputes.rows[0].count),
            page,
            limit,
        });
    } catch (err) {
        console.error("Error fetching disputes:", err.message);
        res.status(500).json({ error: "Server error" });
    }
});

// Add this new endpoint to get individual dispute evidence
router.get("/:id/evidence", async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query(
        "SELECT evidence FROM dispute WHERE id = $1",
        [id]
      );
  
      if (result.rows.length === 0 || !result.rows[0].evidence) {
        return res.status(404).json({ message: "Evidence not found" });
      }
  
      res.json({ evidence: result.rows[0].evidence });
    } catch (err) {
      console.error("Error fetching dispute evidence:", err.message);
      res.status(500).json({ error: "Server error" });
    }
  });

// Update dispute status (Admin action)
router.put("/updates/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { status,feedback } = req.body;

        const updatedDispute = await pool.query(
            `UPDATE dispute SET status = $1, feedback = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
            [status, feedback , id]
        );

        if (updatedDispute.rows.length === 0) {
            return res.status(404).json({ error: "Dispute not found" });
        }

        res.status(200).json(updatedDispute.rows[0]);
    } catch (err) {
        console.error("Error updating dispute:", err.message);
        res.status(500).json({ error: "Server error" });
    }
});

// Delete a dispute
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const deletedDispute = await pool.query(
            "DELETE FROM dispute WHERE id = $1 RETURNING *",
            [id]
        );

        if (deletedDispute.rows.length === 0) {
            return res.status(404).json({ error: "Dispute not found" });
        }

        res.json({ message: "Dispute deleted successfully" });
    } catch (err) {
        console.error("Error deleting dispute:", err.message);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;