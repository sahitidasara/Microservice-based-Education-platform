//import jwt from "jsonwebtoken";
const bcrypt = require('bcrypt');

const mongoose = require('mongoose');
const { type } = require('os');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
  },
  email: {
    type: String,
    required: [true, 'Please add a email id'],
    unique: true,
  },
  password: {
    type : String,
    required : [true, 'Please add a password']
  },
  role: { type: String, default: 'user', enum: ['user', 'admin'] } // Default to 'user'
});

UserSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
  
    this.password = await bcrypt.hash(this.password, 10);
    next();
  });
  
  UserSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
  };
  
  
  module.exports = mongoose.model('User', UserSchema);