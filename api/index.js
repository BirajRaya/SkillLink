const express = require("express");
const pool = require("./src/config/db");
const cors = require("cors");
const authRoutes = require("./src/routes/authRoutes");
const http = require('http');

// Create the Express App
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: "http://localhost:5175",
  methods: ["GET", "POST"],
  credentials: true,
}));

// Parse JSON bodies
app.use(express.json());

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Routes
app.use("/", authRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something broke!', error: err.message });
});

// Create HTTP server
const server = http.createServer(app);

// Function to start the server
function startServer(port) {
  server.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is busy, trying ${port + 1}`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

// Start the server
startServer(PORT);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Closing server and database connections...');
  server.close(() => {
    pool.end(() => {
      console.log('Database pool closed');
      process.exit(0);
    });
  });
});