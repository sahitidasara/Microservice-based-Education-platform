const mongoose = require('mongoose');


const courseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    instructor: String
   // price: Number,
  });
module.exports = mongoose.model("Course", courseSchema);