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

function isLoggedIn(req, res, next) {
  return next();
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect("/");
  }
}

// function buildPDF(Datacallback, Endcallback) {
//   const doc = new pdfDoc();
//   doc.on("data", Datacallback);
//   doc.on("end", Endcallback);
//   doc.text("Fee Amount: ");

//   doc.end();
// }
function buildPDF(Datacallback, Endcallback,reg_no,date,name,course,reg_fee,paid_fee,payment_mode) {
  const doc = new pdfDoc();
  doc.on("data", Datacallback);
  doc.on("end", Endcallback);

  // Student Section
  doc.fontSize(16).text("MAA COMPUTER EDUCATION INSTITUTE", 70, 10, {
    align: "center",
    underline: true,
  });
  doc.fontSize(12).text("SPOKEN ENGLISH & P.D. CLASSES", { align: "center" });
  doc
    .fontSize(10)
    .text("An ISO 9001: 2015 Certified Institute", { align: "center" });

  // Branch Info
  doc
    .moveDown()
    .fontSize(10)
    .text("Location: Above Andhra Bank, 2nd Floor, Station Road, Rau", 50)
    .text("Mobile: +91 9617678702, 9229697696, 9039442551", 50)
    .text("Email: mceiindia229@gmail.com", { underline: true });

  // Receipt Details
  doc
    .fontSize(10)
    .text(
      "Reg. No.: ..........................................................",
      50,
      105
    )
    .text(
      "Date: ..........................................................",
      350,
      105
    );

  // Name and Course
  doc
    .moveDown()
    .text(
      "Name: .............................................................",
      50,
      125
    )
    .text(
      "Course: ......................................................",
      350,
      125
    );

  // Table Header
  doc
    .moveDown()
    .text("S.No.", 50, 145)
    .text("Particulars", 150, 145)
    .text("Amount", 450, 145);

  // Table Rows
  const tableRows = [
    { sno: "1.", particulars: "Reg. Fee", amount: "1000" },
    { sno: "2.", particulars: "Paid Fee", amount: "3000" },
  ];

  let y = 165;
  tableRows.forEach((row) => {
    doc
      .text(row.sno, 50, y)
      .text(row.particulars, 150, y)
      .text(row.amount, 450, y);
    y += 20;
  });

  // Total
  doc
    .moveDown()
    .text("Total", 150, y)
    .text("................................", 450, y);

  // Footer Section
  doc
    .fontSize(10)
    .text(
      "Received a sum of Rupee ........................................................ Payment By: .............................",
      50,
      y + 40
    )
    .text("Dated ........................................", 50, y + 60)
    .text("Student's/Parent's Signature", 50, y + 80)
    .text("Receiver's Signature", 400, y + 80);

  doc
    .fontSize(10)
    .text(
      "Note: Fee is not refundable or transferable in any condition. Late fee is applicable after due date.",
      50,
      y + 120
    );

  // Faculty Section
  y = y + 20;
  doc
    .moveDown()
    .fontSize(16)
    .text("MAA COMPUTER EDUCATION INSTITUTE", 70, y + 130, {
      align: "center",
      underline: true,
    });
  doc.fontSize(12).text("SPOKEN ENGLISH & P.D. CLASSES", { align: "center" });
  doc
    .fontSize(10)
    .text("An ISO 9001: 2015 Certified Institute", { align: "center" });

  // Branch Info
  doc
    .moveDown()
    .fontSize(10)
    .text("Location: Above Andhra Bank, 2nd Floor, Station Road, Rau", 50)
    .text("Mobile: +91 9617678702, 9229697696, 9039442551", 50)
    .text("Email: mceiindia229@gmail.com", { underline: true });

  // Receipt Details
  doc
    .fontSize(10)
    .text(
      "Reg. No.: ..........................................................",
      50,
      y + 130 + 105
    )
    .text(
      "Date: ..........................................................",
      350,
      y + 130 + 105
    );

  // Name and Course
  doc
    .moveDown()
    .text(
      "Name: .............................................................",
      50,
      y + 130 + 125
    )
    .text(
      "Course: ......................................................",
      350,
      y + 130 + 125
    );

  // Table Header
  doc
    .moveDown()
    .text("S.No.", 50, y + 130 + 145)
    .text("Particulars", 150, y + 130 + 145)
    .text("Amount", 450, y + 130 + 145);

  // Table Rows
  y = y + 295;
  tableRows.forEach((row) => {
    doc
      .text(row.sno, 50, y)
      .text(row.particulars, 150, y)
      .text(row.amount, 450, y);
    y += 20;
  });

  // Total
  doc
    .moveDown()
    .text("Total", 150, y)
    .text("................................", 450, y);

  // Footer Section
  doc
    .fontSize(10)
    .text(
      "Received a sum of Rupee ........................................................ Payment By: .............................",
      50,
      y + 40
    )
    .text("Dated ........................................", 50, y + 60)
    .text("Student's/Parent's Signature", 50, y + 80)
    .text("Receiver's Signature", 400, y + 80);

  doc
    .fontSize(10)
    .text(
      "Note: Fee is not refundable or transferable in any condition. Late fee is applicable after due date.",
      50,
      y + 120
    );

  doc.text(
    "--------------------------------------------------------------------------------------------------------------------------------------",
    50,
    340,
    { align: "center" }
  );
  doc.text("(For Student)", 50, 10);
  doc.text("(For Faculty)", 50, 360);

  doc
    .rotate(330)
    .opacity(0.2)
    .image("./public/images/black.png", -100, 200, {
      width: 470,
      height: 170,
    });
  doc
    .opacity(0.2)
    .image("./public/images/black.png", -250, 510, {
      width: 470,
      height: 170,
    });
  doc.on("end", Endcallback);
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
router.get("/register", function (req, res, next) {
  res.render("register");
});

router.get("/invoice", isLoggedIn, (req, res, next) => {
  const stream = res.writeHead(200, {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment;filename=receipt.pdf`,
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

router.get("/dashboard", isLoggedIn, (req, res, next) => {
  studentModel.find().then((student) => {
    res.render("dashboard", { student });
  });
});
// Course routes
router.get("/course", isLoggedIn, (req, res, next) => {
  courseModel.find().then((course) => {
    res.render("course", { course });
  });
});
router.post("/course", isLoggedIn, (req, res, next) => {
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
router.get("/addFeeStructure", isLoggedIn, (req, res, next) => {
  courseModel.find().then((course) => {
    res.render("addFeeStructure", { course });
  });
});
router.post("/addFeeStructure", isLoggedIn, async (req, res, next) => {
  const { selectCourse, totalFee } = req.body;
  const course = await courseModel.findOne({ _id: selectCourse });
  course.totalFee = totalFee;
  await course.save();
  res.redirect("/addFeeStructure");
});
router.get("/deletecourse/:id", isLoggedIn, async (req, res, next) => {
  await courseModel.findOneAndDelete({ _id: req.params.id });
  res.redirect("back");
});

// Inquiry routes
router.get("/inquiry", isLoggedIn, async (req, res, next) => {
  const course = await courseModel.find();
  res.render("inquiry", { course });
});
router.post("/inquiry", isLoggedIn, async (req, res, next) => {
  console.log(req.body);
  await studentModel.create(req.body);
  res.redirect("/allenquiry");
});
router.get("/allenquiry", isLoggedIn, async (req, res, next) => {
  const students = await studentModel
    .find({ rejected: false })
    .populate("course");
  res.render("allenquiry", { students });
});
router.get("/delete/enquiry/:id", isLoggedIn, async (req, res, next) => {
  const student = await studentModel.findById({ _id: req.params.id });
  student.rejected = true;
  await student.save();
  res.redirect("back");
});
router.get("/accepted/enquiry/:id", isLoggedIn, async (req, res, next) => {
  const student = await studentModel.findById({ _id: req.params.id });
  student.rejected = false;
  await student.save();
  res.redirect("back");
});
router.get("/rejected", isLoggedIn, async (req, res, next) => {
  const students = await studentModel
    .find({ rejected: true })
    .populate("course");
  res.render("rejected", { students });
});

router.get("/student", isLoggedIn, (req, res, next) => {
  studentModel.find().then((std) => {
    res.render("student", { std });
  });
});
router.get("/addStaff", isLoggedIn, (req, res, next) => {
  res.render("addStaff");
});
router.post("/addStaff", isLoggedIn, (req, res, next) => {
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
router.get("/profile", isLoggedIn, (req, res, next) => {
  res.render("profile");
});
router.get("/fees", isLoggedIn, async (req, res, next) => {
  const students = await studentModel.find().populate("course");
  students.sort(function (a, b) {
    return new Date(b.dueDate) - new Date(a.dueDate);
  });
  res.render("fees", { students: students.filter((e) => e.due > 0) });
});
router.get("/getdate", isLoggedIn, async (req, res, next) => {
  const students = await studentModel.find().populate("course");
  students.sort(function (a, b) {
    return new Date(a.dueDate) - new Date(b.dueDate);
  });
  res.json({ students: students.filter((e) => e.due > 0) });
});
router.get("/stdprofile/:id", isLoggedIn, async (req, res, next) => {
  const founduser = await studentModel
    .findOne({
      _id: req.params.id,
    })
    .populate("course");
  res.render("stdprofile", { founduser });
});
router.get("/allStaff", isLoggedIn, (req, res, next) => {
  staffModel.find().then((staff) => {
    res.render("allStaff", { staff });
  });
});
router.get("/edit/:id", isLoggedIn, async (req, res, next) => {
  const founduser = await studentModel.findOne({
    _id: req.params.id,
  });
  res.render("edit", { founduser });
});
router.post("/update/profile/:id", isLoggedIn, async (req, res, next) => {
  await studentModel.findOneAndUpdate(
    {
      _id: req.params.id,
    },
    req.body
  );

  res.redirect("/student");
});
router.post("/update/due/:id", isLoggedIn, async (req, res, next) => {
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
router.get("/feesManagement", isLoggedIn, async (req, res, next) => {
  if (req.query.prev) {
    var fees = await feesModel
      .find({ payDate: { $gte: req.query.prev, $lte: req.query.next } })
      .populate("student");
  } else {
    var fees = await feesModel.find().populate("student");
  }
  res.render("feesManagement", { fees });
});
router.get("/delete/transaction/:id", isLoggedIn, async (req, res, next) => {
  await feesModel.findOneAndDelete({
    _id: req.params.id,
  });
  res.redirect("/feesManagement");
});

module.exports = router;
