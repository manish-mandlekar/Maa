const mongoose = require("mongoose");

// Define a schema for student inquiries
const universitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  location: {
    type: String,
    trim: true,
  },
});

const University = mongoose.model("university", universitySchema);
module.exports = University 
