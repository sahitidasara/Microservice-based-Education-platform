const User = require('../models/User');
const amqp = require('amqplib');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const axios = require('axios');

// @desc  Get all users
// @route GET /api/v1/users
// @access Public
const getUsers = async (req, res, next) => {
    try {
      const users = await User.find();
  
      return res.status(200).json({
        success: true,
        count: users.length,
        data: users
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  };
  
  // @desc  Create a user
  // @route POST /api/v1/users
  // @access Public
const addUser = async (req, res) => {
    try {
      const { email, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({ email, password: hashedPassword });
      await user.save();
  
      // Notify Progress Service directly
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      await axios.post('http://localhost:6050/api/v1/progress/init', {
        userId: user._id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
  
      res.status(201).json({ success: true, token });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

module.exports = {addUser, getUsers};