const jwt = require('jsonwebtoken');

const adminAuthMiddleware = (req, res, next) => {
  // Get token from headers
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' });
  }

  // Extract token from "Bearer TOKEN" format
  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Malformed token' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user is an admin
    if (decoded.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. Admin privileges required.' 
      });
    }

    // Attach user info to request
    req.user = decoded;
    next();
  } catch (error) {
    // Handle different types of token errors
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Catch any other unexpected errors
    return res.status(500).json({ 
      message: 'Authentication error', 
      error: error.message 
    });
  }
};

module.exports = adminAuthMiddleware;