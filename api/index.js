const express = require("express");
const pool = require("./src/config/db");
const cors = require("cors");
const path = require('path');
const http = require('http');
const multer = require('multer');
const { Server } = require("socket.io");
const redis = require("redis");

// Import routes
const authRoutes = require("./src/routes/authRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const categoriesRoutes = require('./src/routes/categoriesRoutes');
const serviceRoutes = require('./src/routes/serviceRoutes');
const vendorRoutes = require('./src/routes/vendorRoutes');
const chatRoutes = require('./src/routes/chatRoutes');
const bookingRoutes = require('./src/routes/bookingRoutes');
const disputeRoute = require('./src/routes/disputeRoutes')

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
app.use("/bookings", bookingRoutes);
app.use("/disputes", disputeRoute);

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

// Redis client setup for unread messages
const redisClient = redis.createClient({
  socket: {
    host: "localhost",
    port: 6379,
  }
});

redisClient.on("error", (err) => console.error("Redis Error:", err));

(async () => {
  try {
    await redisClient.connect();
    console.log("Redis Connected Successfully in Socket Server!");
  } catch (err) {
    console.error("Redis Connection Error:", err);
  }
})();

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Track online users - use a Map with userId as key and socketId as value
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
  let currentUserId = null;

  socket.on("joinChat", async (userId) => {
    if (!userId) return;
    
    // If this socket was previously registered to a user, remove that association
    if (currentUserId && onlineUsers.get(currentUserId) === socket.id) {
      onlineUsers.delete(currentUserId);
    }
    
    // Store the new user association
    currentUserId = userId;
    onlineUsers.set(userId, socket.id);
    await redisClient.set(`user:${userId}:online`, "true", { EX: 3600 });
    
    console.log(`User ${userId} joined with socket ID: ${socket.id}`);
  });

  socket.on("sendMessage", async ({ senderId, receiverId, message }) => {
    if (!senderId || !receiverId) return;
    
    console.log(`Message from ${senderId} to ${receiverId}: ${message}`);
    
    // Increment unread count in Redis
    const unreadKey = `unread:${receiverId}`;
    await redisClient.hIncrBy(unreadKey, senderId, 1);
    
    // Get current count for logging
    const currentCount = await redisClient.hGet(unreadKey, senderId);
    console.log(`Unread count for ${receiverId} from ${senderId}: ${currentCount}`);
    
    // Check if receiver is online
    const receiverSocketId = onlineUsers.get(receiverId);
    
    if (receiverSocketId) {
      // Receiver is online, emit the message to them
      io.to(receiverSocketId).emit("receiveMessage", {
        senderId,
        receiverId,
        message,
        created_at: new Date().toISOString()
      });
    }
  });

  socket.on("markAsRead", async ({ userId, contactId }) => {
    if (!userId || !contactId) return;
    
    // Clear unread count in Redis
    const unreadKey = `unread:${userId}`;
    await redisClient.hDel(unreadKey, contactId);
    
    console.log(`Marked messages from ${contactId} as read for user ${userId}`);
    
    // Emit an event to notify that messages were marked as read
    // This will trigger a UI refresh for the user
    socket.emit("messagesMarkedAsRead", { userId, contactId });
    
    // If the contact is online, notify them as well
    const contactSocketId = onlineUsers.get(contactId);
    if (contactSocketId) {
      io.to(contactSocketId).emit("messagesMarkedAsRead", { userId, contactId });
    }
  });

  socket.on("disconnect", async () => {
    console.log("User disconnected:", socket.id);
    
    if (currentUserId && onlineUsers.get(currentUserId) === socket.id) {
      // Only remove if this socket is the current one for the user
      onlineUsers.delete(currentUserId);
      await redisClient.del(`user:${currentUserId}:online`);
      console.log(`User ${currentUserId} is now offline`);
    }
  });
});


// Start the server
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});


module.exports = app;