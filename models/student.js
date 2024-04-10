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
  fatherName: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    enum: ["male", "female"],
    required: true,
  },
  contactNumber: {
    type: String,
    required: true,
  },
  course: {
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
  fee: {
    type: String,
    required: true,
  },
  enquiryDate: {
    type: Date,
    default: Date.now,
  },
  joiningDate: {
    type: Date,
    default: Date.now,
  },
  rejected: {
    type: Boolean,
    default: false,
  },
  timing: {
    type: String,
    required: true,
  },
  Installment: {
    type: String,
  },
  Due: {
    type: String,
  },
  done: {
    type: String,
  },
  RegistrationPayment: {
    type: String,
  },
  DueDate: {
    type: String,
  },
});

// Create a model from the schema
const StudentEnquiry = mongoose.model("StudentEnquiry", studentEnquirySchema);

module.exports = StudentEnquiry;
