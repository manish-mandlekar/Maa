var express = require("express");
var router = express.Router();
const mongoose = require("mongoose");
const userModel = require("../models/Usermodel");
const staffModel = require("../models/staff");
const studentModel = require("../models/student");
const courseModel = require("../models/course");
const passport = require("passport");
const localStrategy = require("passport-local");

passport.use(new localStrategy(userModel.authenticate()));
mongoose
  .connect("mongodb://0.0.0.0/mark")
  .then(() => {})
  .catch((err) => {
    err;
  });
/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index");
});
router.get("/signup", function (req, res, next) {
  res.render("signup");
});
router.post("/register", function (req, res) {
  var newUser = new userModel({
    username: req.body.username,
    email: req.body.email,
  });
  userModel
    .register(newUser, req.body.password)
    .then(function (u) {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/dashboard");
      });
    })
    .catch((e) => {
      console.log(e);
      res.redirect("/signup");
    });
});
router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "dashboard",
    failureRedirect: "/",
  }),
  function (req, res, next) {}
);
router.get("/logout", function (req, res, next) {
  req.logOut();
  res.redirect("/");
});
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect("/");
  }
}

router.get("/dashboard", (req, res, next) => {
  res.render("dashboard");
});
// Course routes
router.get("/course", (req, res, next) => {
  courseModel.find().then((course) => {
    res.render("course", { course });
  });
});
router.post("/course", (req, res, next) => {
  courseModel
    .create({
      courseName: req.body.courseName,
      courseCode: req.body.courseCode,
      courseDuration: req.body.courseDuration,
    })
    .then(() => {
      res.redirect("/course");
    });
});
router.get("/addFeeStructure", (req, res, next) => {
  courseModel.find().then((course) => {
    res.render("addFeeStructure", { course });
  });
});
router.post("/addFeeStructure", async (req, res, next) => {
  const { selectCourse, totalFee } = req.body;
  const course = await courseModel.findOne({ _id: selectCourse });
  course.totalFee = totalFee;
  await course.save();
  res.redirect("/addFeeStructure");
});
router.get("/deletecourse/:id", async (req, res, next) => {
  await courseModel.findOneAndDelete({ _id: req.params.id });
  res.redirect("back");
});

// Inquiry routes
router.get("/inquiry", async (req, res, next) => {
  const course = await courseModel.find();
  res.render("inquiry", { course });
});
router.post("/inquiry", async (req, res, next) => {
  console.log(req.body);
  await studentModel.create(req.body);
  res.redirect("/allenquiry");
});
router.get("/allenquiry", async (req, res, next) => {
  const students = await studentModel
    .find({ rejected: false })
    .populate("course");
  res.render("allenquiry", { students });
});
router.get("/delete/enquiry/:id", async (req, res, next) => {
  const student = await studentModel.findById({ _id: req.params.id });
  student.rejected = true;
  await student.save();
  res.redirect("back");
});
router.get("/accepted/enquiry/:id", async (req, res, next) => {
  const student = await studentModel.findById({ _id: req.params.id });
  student.rejected = false;
  await student.save();
  res.redirect("back");
});
router.get("/rejected", async (req, res, next) => {
  const students = await studentModel
    .find({ rejected: true })
    .populate("course");
  res.render("rejected", { students });
});

router.get("/student", (req, res, next) => {
  studentModel.find().then((std) => {
    res.render("student", { std });
  });
});
router.get("/addStaff", (req, res, next) => {
  res.render("addStaff");
});
router.post("/addStaff", (req, res, next) => {
  staffModel
    .create({
      firstName: req.body.firstName,
      secondName: req.body.secondName,
      gender: req.body.gender,
      maritalStatus: req.body.maritalStatus,
      qualification: req.body.qualification,
      contactNumber: req.body.contactNumber,
      email: req.body.email,
      dob: req.body.dob,
      address: req.body.address,
      totalExperience: req.body.totalExperience,
      salary: req.body.salary,
      joinDate: req.body.joinDate,
      jobTiming: req.body.jobTiming,
      position: req.body.position,
    })
    .then(() => {
      res.redirect("/allStaff");
    });
});
router.get("/profile", (req, res, next) => {
  res.render("profile");
});
router.get("/fees", async (req, res, next) => {
  const students = await studentModel.find().populate("course");
  students.sort(function (a, b) {
    return new Date(b.dueDate) - new Date(a.dueDate);
  });
  res.render("fees", { students: students });
});
router.get("/getdate", async (req, res, next) => {
  const students = await studentModel.find().populate("course");
  students.sort(function (a, b) {
    return new Date(a.dueDate) - new Date(b.dueDate);
  });
  res.json({ students: students });
});
router.get("/stdprofile/:username", async (req, res, next) => {
  const founduser = await studentModel
    .findOne({
      firstName: req.params.username,
    })
    .populate("course");
  res.render("stdprofile", { founduser });
});
router.get("/allStaff", (req, res, next) => {
  staffModel.find().then((staff) => {
    res.render("allStaff", { staff });
  });
});

module.exports = router;
