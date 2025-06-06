const mongoose = require("mongoose");

const feesSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "StudentEnquiry",
  },
  registrationPaymentMode: String,
  payment: {
    type: Number,
    required: true,
  },
  payDate: {
    type: Date,
    default: Date.now,
  },
  receiptNumber: {
    type: Number,
  },
});

module.exports = mongoose.model("feesSchema", feesSchema);
