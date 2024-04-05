const mongoose = require('mongoose');

// Define a schema for courses
const courseSchema = new mongoose.Schema({
    courseName: {
        type: String,
        
    },
    courseCode: {
        type: String,
       
    },
    courseDuration: {
        type: String,
        
    },
    totalFee: {
        type: String,
        
    },
    selectCourse:{
        type:String,
        
    },
    totalFee:{
        type:Number,
        
    }
});

// Create a model from the schema
const Course = mongoose.model('Course', courseSchema);

module.exports = Course;
