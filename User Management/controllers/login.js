const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

// load env vars
dotenv.config({ path: "./config/config.env" });

const JWT_SECRET = process.env.JWT_SECRET;

exports.login = async (req, res,next) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
  
    if (!user) return res.status(404).json({ message: "User not found" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });
  
    // Generate JWT Token
    const token = jwt.sign(
      { id: user._id, role: user.role},
      JWT_SECRET,
      { expiresIn: "1h" } // Token valid for 1 hour
    );
    res.json({ token });
  };

