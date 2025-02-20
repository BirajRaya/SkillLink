const express = require("express");
const pool = require("./src/config/db");
const cors = require("cors");
const authRoutes = require("./src/routes/authRoutes");
// Create the Express App
const app = express();
const PORT = 5000;

// Middleware
app.use(cors({
  origin: "http://localhost:5173", 
  methods: ["GET", "POST"], // Allowed methods
  credentials: true, // Allow cookies (if needed)
}));
app.use(express.json()); // Parse JSON requests



// Start the Server

app.use("/", authRoutes);
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));