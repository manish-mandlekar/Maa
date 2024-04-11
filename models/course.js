const mongoose = require("mongoose");

// Define a schema for courses
const courseSchema = new mongoose.Schema({
  courseName: String,
  courseCode: String,
  courseDuration: Number,
  totalFee: {
    type: Number,
    default: 0,
  },
});

// Create a model from the schema
const Course = mongoose.model("Course", courseSchema);

module.exports = Course;
