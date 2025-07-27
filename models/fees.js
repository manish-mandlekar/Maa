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
  feeType: {
    type: String,
    default: "Regular Fee",
  },
});
const Fees = mongoose.model("feesSchema", feesSchema);

module.exports = Fees;
