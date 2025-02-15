const express = require("express");
const pool = require("./src/db");
const cors = require("cors");

// Create the Express App
const app = express();
const PORT = 5000;

// Sample Route to Test the Database
app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()"); // Query current timestamp
    res.send(`Database Connected: ${result.rows[0].now}`);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).send("Database connection error");
  }
});

app.use(cors({
  origin: "http://localhost:5173", // Allow requests from Vite frontend
  methods: ["GET", "POST"], // Allowed methods
  credentials: true, // Allow cookies (if needed)
}));

app.use(express.json()); // Parse JSON requests

// Test Route (Sends Message to React)
app.get("/api/test", (req, res) => {
  res.json({ message: "🚀 Node.js and React are connected!" });
});

// Start the Server
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
