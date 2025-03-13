const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// Authentication middleware
exports.authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token is missing'
      });
    }
    
    try {
      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Log token info for debugging
      console.log("[2025-03-11 20:53:51] Token decoded:", decoded);
      
      // Attach user data to request - important to normalize userId/id field
      req.user = {
        id: decoded.userId || decoded.id || decoded.sub,
        userId: decoded.userId || decoded.id || decoded.sub, // Add both for compatibility
        email: decoded.email,
        role: decoded.role
      };
      
      // Log the user object
      console.log("[2025-03-11 20:53:51] Attached user to request:", req.user);
      
      // Continue to the next middleware or route handler
      next();
    } catch (error) {
      console.error('[2025-03-11 20:53:51] JWT verification failed:', error);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
  } catch (error) {
    console.error('[2025-03-11 20:53:51] Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

module.exports = exports;