const mongoose = require("mongoose");

// Define a schema for student inquiries
const feesSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "StudentEnquiry",
  },
  registrationPaymentMode: String,
  payment: Number,
  payDate: {
    type: Date,
    default: Date.now(),
  },
});

// Create a model from the schema
const feesSchemaModel = mongoose.model("feesSchema", feesSchema);

module.exports = feesSchemaModel;
