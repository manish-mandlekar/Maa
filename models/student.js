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
  email: {
    type: String,
    required: true,
  },
  fatherName: {
    type: String,
    required: true,
  },
  contactNumber: {
    type: Number,
    required: true,
  },
  qualification: {
    type: String,
  },
  address: {
    type: String,
    required: true,
  },
  enquiryDate: {
    type: Date,
    default: Date.now,
  },
  gender: {
    type: String,
    enum: ["male", "female"],
    required: true,
  },
  course: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
  ],
  enquiryBy: String,
  joiningDate: Date,
  reference: String,
  registrationPaymentMode: String,
  installment: String,
  due: Number,
  registrationPayment: String,
  dueDate: String,
  rejected: {
    type: Boolean,
    default: false,
  },
  registered: {
    type: Boolean,
    default: false,
  },
});

// Create a model from the schema
const StudentEnquiry = mongoose.model("StudentEnquiry", studentEnquirySchema);

module.exports = StudentEnquiry;
