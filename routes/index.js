var express = require("express");
var router = express.Router();
const mongoose = require("mongoose");
const userModel = require("../models/Usermodel");
const staffModel = require("../models/staff");
const studentModel = require("../models/student");
const courseModel = require("../models/course");
const feesModel = require("../models/fees");
const passport = require("passport");
const localStrategy = require("passport-local");
var fs = require("fs");
const pdfDoc = require("pdfkit");

function buildPDF(Datacallback, Endcallback) {
  const doc = new pdfDoc();
  doc.on("data", Datacallback);
  doc.on("end", Endcallback);
  doc
    .image("./images/logo.png", {
      fit: [250, 300],
      align: "center",
      valign: "center",
    })
    .fontSize(25)
    .text("Name: ")
    .text("Course: ")
    .text("Registration Numbe: ")
    .text("Date: ")
    .text("Fee Amount: ");

  doc.end();
}

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

router.get("/invoice", (req, res, next) => {
  const stream = res.writeHead(200, {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment;filename=invoice.pdf`,
  });
  buildPDF(
    (chunk) => stream.write(chunk),
    () => stream.end()
  );
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
  studentModel.find().then((student) => {
    res.render("dashboard", { student });
  });
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
  res.render("fees", { students: students.filter((e) => e.due > 0) });
});
router.get("/getdate", async (req, res, next) => {
  const students = await studentModel.find().populate("course");
  students.sort(function (a, b) {
    return new Date(a.dueDate) - new Date(b.dueDate);
  });
  res.json({ students: students.filter((e) => e.due > 0) });
});
router.get("/stdprofile/:id", async (req, res, next) => {
  const founduser = await studentModel
    .findOne({
      _id: req.params.id,
    })
    .populate("course");
  res.render("stdprofile", { founduser });
});
router.get("/allStaff", (req, res, next) => {
  staffModel.find().then((staff) => {
    res.render("allStaff", { staff });
  });
});
router.get("/edit/:id", async (req, res, next) => {
  const founduser = await studentModel.findOne({
    _id: req.params.id,
  });
  res.render("edit", { founduser });
});
router.post("/update/profile/:id", async (req, res, next) => {
  await studentModel.findOneAndUpdate(
    {
      _id: req.params.id,
    },
    req.body
  );

  res.redirect("back");
});
router.post("/update/due/:id", async (req, res, next) => {
  const foundstudent = await studentModel.findOne({
    _id: req.params.id,
  });
  foundstudent.due = foundstudent.due - +req.body.paid;
  await foundstudent.save();
  await feesModel.create({
    registrationPaymentMode: req.body.registrationPaymentMode,
    student: foundstudent._id,
    payment: req.body.paid,
  });
  res.redirect("/fees");
});

router.get("/feesManagement", async (req, res, next) => {
  if (req.query.prev) {
    var fees = await feesModel
      .find({ payDate: { $gte: req.query.prev, $lte: req.query.next } })
      .populate("student");
  } else {
    var fees = await feesModel.find().populate("student");
  }
  res.render("feesManagement", { fees });
});

router.get("/delete/transaction/:id", async (req, res, next) => {
  await feesModel.findOneAndDelete({
    _id: req.params.id,
  });
  res.redirect("/feesManagement");
});

module.exports = router;
