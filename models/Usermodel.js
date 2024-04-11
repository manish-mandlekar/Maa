const mongoose = require("mongoose");
const plm = require("passport-local-mongoose");
const validator = require("validator");
const UserModel = mongoose.Schema({
  username: {
    type: String,
    required: [true, "Username is required"],
    minlength: [2, "Username must be at least 3 characters long"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    validate: [validator.isEmail, "Email is not valid"],
    unique: true,
  },
  institute: {
    type: String,
    default: "mpmaa",
    required: [true, "Institute code is required"],
  },
  role: {
    type: String,
    default: "user",
  },
  password: {
    type: String,
  },
});

UserModel.plugin(plm);
module.exports = mongoose.model("User", UserModel);
