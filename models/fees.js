const mongoose = require("mongoose");

const feesSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "StudentEnquiry",
  },
  registrationPaymentMode: String,
  payment: Number,
  payDate: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("feesSchema", feesSchema);
