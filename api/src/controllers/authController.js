const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.Signup = async (req, res) => {
    const { fullName, email, password, phone, address,role,profilePicture } = req.body;
  
    // Basic validation
    if (!fullName || !email || !password || !phone || !address) {
      return res.status(400).json({ message: "All fields are required." });
    }
  
    try {
      const existingUser  = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
      if (existingUser .rows.length > 0) {
        return res.status(400).json({ message: "User  already exists." });
      }
  
      if(password.length < 6)
      {
        return res.status(400).json({message: "Password must be 6 character long"})
      }

      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(phone)) {
          return res.status(400).json({ message: "Phone number must be exactly 10 digits." });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query("INSERT INTO users (full_name, email, password, phone_number, address,role,profile_picture) VALUES ($1, $2, $3, $4, $5, $6,$7)", 
        [fullName, email, hashedPassword, phone, address,role,profilePicture]);
  
      res.status(201).json({ message: "User  created successfully." });
    } catch (error) {
      console.error("Error during sign up:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  };

  exports.Signin = async (req, res) => {
    console.log(req);
    const { email, password } = req.body;
  
    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }
  
    try {
      const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
      if (user.rows.length === 0) {
        return res.status(400).json({ message: "Invalid email or password." });
      }
  
      const isMatch = await bcrypt.compare(password, user.rows[0].password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid email or password." });
      }
  
      const token = jwt.sign({ id: user.rows[0].id }, "your_jwt_secret", { expiresIn: "1h" });
      res.json({ message: "Sign in successful.", token });
    } catch (error) {
      console.error("Error during sign in:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  };