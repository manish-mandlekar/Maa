const mongoose = require("mongoose");

// Define a schema for student inquiries
const studentEnquirySchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  visitorEmail: {
    type: String,
    required: true,
    unique: true,
  },
  gender: {
    type: String,
    enum: ["Male", "Female"],
    required: true,
  },
  contactNumber: {
    type: String,
    required: true,
  },
  qualification: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  
  enquiryDate: {
    type: Date,
    default: Date.now,
  },
});

// Create a model from the schema
const StudentEnquiry = mongoose.model("StudentEnquiry", studentEnquirySchema);

module.exports = StudentEnquiry;
