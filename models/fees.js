const mongoose = require("mongoose");

const feesSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "studentModelType",
  },
  studentModelType: {
    type: String,
    enum: ["StudentEnquiry", "admission"],
    required: true,
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
