const { Pool } = require("pg");
require("dotenv").config(); // Load environment variables

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Use the connection from .env
  ssl: { rejectUnauthorized: false }, // Required for NeonDB
});

// Test the connection
pool.connect()
  .then(() => console.log("✅ Database Connected Successfully!"))
  .catch((err) => console.error("❌ Database Connection Failed:", err));

module.exports = pool;