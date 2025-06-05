const mongoose = require("mongoose");

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
    unique: true,
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
  },
  course: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
  ],
  university: {
    type: String
  },
  enquiryBy: String,
  joiningDate: Date,
  reference: String,
  registrationPaymentMode: String,
  installment: String,
  due: Number,
  registrationPayment: String,
  dueDate: String,
  session: {
    type: String,
    default: "2023-2024",
  },
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
