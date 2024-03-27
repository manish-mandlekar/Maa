const mongoose = require('mongoose');

// Define a schema for courses
const courseSchema = new mongoose.Schema({
    courseName: {
        type: String,
        required: true
    },
    courseCode: {
        type: String,
        required: true,
        unique: true
    },
    courseDuration: {
        type: String,
        required: true
    },
    totalFee: {
        type: String,
        required: true
    }
});

// Create a model from the schema
const Course = mongoose.model('Course', courseSchema);

module.exports = Course;
