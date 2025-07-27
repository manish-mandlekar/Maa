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
  },
  qualification: {
    type: String,
  },
  address: {
    type: String,
    required: true,
  },
  r_no: {
    type: Number,
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
    type: String,
  },
  session: {
    type: String,
    default: "2023-2024",
  },
  sessionMonth: {
    type: String,
    default: "January",
  },
  rejected: {
    type: Boolean,
    default: false,
  },
  registered: {
    type: Boolean,
    default: false,
  },
  enquiryBy: String,
  joiningDate: Date,
  reference: String,
  registrationPaymentMode: String,
  installment: String,
  due: Number,
  registrationPayment: String,
  dueDate: String,
  // new fields
  whatsappNumber: {
    type: Number,
  },
  dateOfBirth: {
    type: Date,
  },
  medium: {
    type: String,
    enum: ["hindi", "english"],
  },
  category: {
    type: String,
    enum: ["SC", "ST", "OBC", "General"],
  },
  addharNo: {
    type: String,
  },
  mainSubject: {
    type: String, // PCM, Commerce, etc
  },

  yearOfPassing: {
    type: Number,
  },
  division: {
    type: Number, // 1, 2, 3, 4
    enum: [1, 2, 3, 4],
  },
  percentageOfMarks: {
    type: Number,
  },
  boardOrUniversity: {
    type: String,
  },
  familyIncome: {
    type: Number, // Yearly income in rupees
  },
  religion: {
    type: String,
  },
  maritalStatus: {
    type: String,
    enum: ["Single", "Married", "Divorced", "Widowed"],
  },
});

const StudentEnquiry = mongoose.model("StudentEnquiry", studentEnquirySchema);

module.exports = StudentEnquiry;
