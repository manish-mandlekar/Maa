var express = require("express");
var router = express.Router();
const mongoose = require("mongoose");
const userModel = require("../models/Usermodel");
const staffModel = require('../models/staff')
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
  res.render("index", { title: "Express" });
});
router.get("/signup", function (req, res, next) {
  res.render("signup");
});
router.post("/register", function (req, res) {
  var newUser = new userModel({
    username: req.body.username,
    email: req.body.email,
  });
  userModel.register(newUser, req.body.password).then(function (u) {
    passport.authenticate("local")(req, res, function () {
      res.redirect("/dashboard");
    });
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

router.get("/inquiry", (req, res, next) => {
  res.render("inquiry");
});
router.get("/allenquiry", (req, res, next) => {
  studentModel.find({ rejected: false }).then((students) => {
    res.render("allenquiry", { students });
  });
});
router.get("/delete/enquiry/:id", async (req, res, next) => {
  const student = await studentModel.findById({ _id: req.params.id });
  student.rejected = true;
  await student.save();
  res.redirect("/allenquiry");
});
router.post("/allenquiry", (req, res, next) => {
  studentModel
    .create({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      visitorEmail: req.body.visitorEmail,
      gender: req.body.gender,
      contactNumber: req.body.contactNumber,
      qualification: req.body.qualification,
      address: req.body.address,
      course: req.body.course,
      enquiryDate: req.body.enquiryDate,
      fee: req.body.fee,
      joiningDate: req.body.joining,
      timing: req.body.timing,
    })
    .then((created) => {
      res.redirect("/allenquiry");
    });
});
router.get("/rejected", (req, res, next) => {
  studentModel.find({ rejected: true }).then((students) => {
    res.render("rejected", { students });
  });
});
router.get("/ifs", (req, res, next) => {
  res.render("ifs");
});
router.get("/addFeeStructure", (req, res, next) => {
  courseModel.find().then((course) => {
    res.render("addFeeStructure", { course });
  });
});
router.post("/addFeeStructure", (req, res, next) => {
  courseModel
    .create({
      selectCourse: req.body.selectCourse,
      totalFee: req.body.totalFee,
    })
    .then(() => {
      res.redirect("/addFeeStructure");
    });
});
router.get("/student", (req, res, next) => {
  studentModel.find().then((std)=>{

    res.render("student",{std});
  })
});
router.get("/addStaff", (req, res, next) => {
    res.render("addStaff");
});
router.post("/addStaff", (req, res, next) => {
  staffModel.create({
    firstName:req.body.firstName,
    secondName:req.body.secondName,
    gender:req.body.gender,
    maritalStatus:req.body.maritalStatus,
    qualification:req.body.qualification,
    contactNumber:req.body.contactNumber,
    email:req.body.email,
    dob:req.body.dob,
    address:req.body.address,
    totalExperience:req.body.totalExperience,
    salary:req.body.salary,
    joinDate:req.body.joinDate,
    jobTiming:req.body.jobTiming,
    position:req.body.position,
  }).then(()=>{

    res.redirect("/allStaff");
  })
});
router.get("/profile", (req, res, next) => {
  res.render("profile");
});
router.get("/allStaff", (req, res, next) => {
  staffModel.find().then((staff)=>{

    res.render("allStaff",{staff});
  })
});

module.exports = router;
