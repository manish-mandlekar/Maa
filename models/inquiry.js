const mongoose = require("mongoose");

const inquirySchema = new mongoose.Schema(
  {
    inquiryType: {
      type: String,
      enum: ["student", "admission"], // 'student' = Diploma Inquiry, 'admission' = Regular Admission
      required: true,
    },
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
      type: String, // using string to preserve formatting/leading 0s
      required: true,
    },
    course: {
      courseName: String,
      _id: String,
    },
    qualification: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    rejected: {
      type: Boolean,
      default: false,
    },
    registered: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Inquiry = mongoose.model("Inquiry", inquirySchema);
module.exports = Inquiry;
