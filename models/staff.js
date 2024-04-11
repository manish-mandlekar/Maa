const mongoose = require("mongoose");

// Define a schema for student inquiries
const staffSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  secondName: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    required: true,
  },
  maritalStatus: {
    type: String,
    required: true,
  },
  qualification: {
    type: String,
    required: true,
  },
  contactNumber: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  dob: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  totalExperience: {
    type: String,
    required: true,
  },
  salary: {
    type: String,
    required: true,
  },
  joinDate: {
    type: Date,
    default: Date.now,
  },
  jobTiming: {
    type: Date,
    required:true,
  },
  position:{
    type: String,
  },
});

// Create a model from the schema
const staffSchemaModel = mongoose.model("staffSchema", staffSchema);

module.exports = staffSchemaModel;
