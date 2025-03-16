const express = require("express");
const router = express.Router();
const pool = require("../config/db"); // PostgreSQL connection
const multer = require('multer');


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/"); // Ensure this folder exists
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    },
});

const upload = multer({ storage: storage });

router.post("/create", upload.single("evidence"), async (req, res) => {
    try {
        const { booking_id,  reason, description } = req.body;
        const evidencePath = req.body.evidence ? req.body.evidence : null; // Store file path if uploaded        
        // Insert into database
        const newDispute = await pool.query(
            "INSERT INTO dispute (booking_id,  reason, description, evidence) VALUES ($1, $2, $3, $4) RETURNING *",
            [booking_id,  reason, description, evidencePath]
        );

        res.status(201).json({ status: "success", dispute: newDispute.rows[0] });
    } catch (err) {
        console.error("Error processing dispute:", err.message);
        res.status(500).json({ error: "Server error" });
    }
});
router.get("/get", async (req, res) => {
    try {
        const disputes = await pool.query("SELECT * FROM dispute ORDER BY created_at DESC");
        res.json(disputes.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error" });
    }
});


router.put("/updates/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        console.log(req.body);
        

        const updatedDispute = await pool.query(
            "UPDATE dispute SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
            [status, id]
        );

        if (updatedDispute.rows.length === 0) {
            return res.status(404).json({ error: "Dispute not found" });
        }

        res.json(updatedDispute.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error" });
    }
});


router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const deletedDispute = await pool.query("DELETE FROM dispute WHERE id = $1 RETURNING *", [id]);

        if (deletedDispute.rows.length === 0) {
            return res.status(404).json({ error: "Dispute not found" });
        }

        res.json({ message: "Dispute deleted successfully" });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
