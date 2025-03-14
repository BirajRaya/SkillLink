const express = require("express");
const pool = require("./src/config/db");
const cors = require("cors");
const path = require('path');
const http = require('http');
const multer = require('multer');
const { Server } = require("socket.io");

// Import routes
const authRoutes = require("./src/routes/authRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const categoriesRoutes = require('./src/routes/categoriesRoutes');
const serviceRoutes = require('./src/routes/serviceRoutes');
const vendorRoutes = require('./src/routes/vendorRoutes');
const chatRoutes = require('./src/routes/chatRoutes');


// Create the Express App
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-User-Login",  "X-Current-Time"],
  credentials: true,
}));


// Body parsing middleware
app.use(express.json({ limit: "10mb" })); 
app.use(express.urlencoded({ extended: true }));

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use("/", authRoutes);
app.use("/admin", adminRoutes);  
app.use("/categories", categoriesRoutes);
app.use("/services", serviceRoutes);
app.use("/vendors" , vendorRoutes);
app.use("/chat", chatRoutes);


// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', {
    message: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path
  });

  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Catch-all route for undefined routes
app.use((req, res) => {
  console.log('Unhandled route:', {
    method: req.method,
    path: req.path,
    body: req.body,
    headers: req.headers
  });

  res.status(404).json({ 
    message: 'Route not found',
    method: req.method,
    path: req.path
  });
});

// Create HTTP server
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});


let onlineUsers = {};

io.on("connection", (socket) => {

  socket.on("joinChat", (userId) => {
    onlineUsers[userId] = socket.id;
  });

  socket.on("sendMessage", ({ senderId, receiverId, message }) => {
    const receiverSocketId = onlineUsers[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("receiveMessage", { senderId, message });
    }
  });

  socket.on("disconnect", () => {
    Object.keys(onlineUsers).forEach((key) => {
      if (onlineUsers[key] === socket.id) {
        delete onlineUsers[key];
      }
    });
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

module.exports = app;