var express = require("express");
var router = express.Router();
const mongoose = require("mongoose");
const userModel = require("../models/Usermodel");
const staffModel = require("../models/staff");
const studentModel = require("../models/student");
const courseModel = require("../models/course");
const feesModel = require("../models/fees");
const universityModel = require("../models/university");
const passport = require("passport");
const localStrategy = require("passport-local");
var fs = require("fs");
const pdfDoc = require("pdfkit");
const { MessageMedia } = require("whatsapp-web.js");
const whatsappClient = require("./whatsapp"); // your whatsapp.js file
const { WritableStreamBuffer } = require("stream-buffers");

function isLoggedIn(req, res, next) {
  return next();
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect("/");
  }
}

function buildPDF(
  Datacallback,
  Endcallback,
  reg_no,
  date,
  name,
  lastName,
  course,
  reg_fee,
  paid_fee,
  contactNumber,
  payment_mode
) {
  const doc = new pdfDoc({
    size: "A4",
    margin: 100,
  });

  // Set up event listeners
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

  // Receipt Details - Use actual values instead of dots
  doc
    .fontSize(10)
    // .text(`Reg. No.: ${reg_no || "N/A"}`, 50, 105)
    .text(`Date: ${date || new Date().toLocaleDateString("en-GB")}`, 350, 105);

  // Name and Course - Use actual values
  doc
    .moveDown()
    .text(`Name: ${name || "N/A"} ${lastName || "N/A"}`, 50, 125)
    .text(`Contact: ${contactNumber || "N/A"}`, 350, 125);

  // Table Header
  doc
    .moveDown()
    .text("S.No.", 50, 145)
    .text("Particulars", 150, 145)
    .text("Amount", 450, 145);

  // Table Rows - Use actual values
  const tableRows = [
    { sno: "1.", particulars: "Paid Fee", amount: paid_fee || "3000" },
    // { sno: "1.", particulars: "Reg. Fee", amount: reg_fee || "1000" },
  ];

  let y = 165;
  tableRows.forEach((row) => {
    doc
      .text(row.sno, 50, y)
      .text(row.particulars, 150, y)
      .text(row.amount, 450, y);
    y += 20;
  });

  // Calculate total
  const total = parseInt(reg_fee || 0) + parseInt(paid_fee || 0);

  // Total
  doc.moveDown().text("Total", 150, y).text(total.toString(), 450, y);

  // Footer Section
  doc
    .fontSize(10)
    .text(
      `Received a sum of Rupee ${total} Payment By: ${payment_mode || "Cash"}`,
      50,
      y + 40
    )
    .text(`Dated ${date || new Date().toLocaleDateString("en-GB")}`, 50, y + 60)
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

  doc.text("(For Student)", 50, 10);
  // doc.text("(For Faculty)", 50, 360);

  // Comment out or remove image operations that might be causing issues
  // Only include if the image files exist and are accessible
  try {
    if (fs.existsSync("./public/images/black.png")) {
      doc
        .rotate(330)
        .opacity(0.2)
        .image("./public/images/black.png", -100, 200, {
          width: 470,
          height: 170,
        });
      // doc.opacity(0.2).image("./public/images/black.png", -250, 510, {
      //   width: 470,
      //   height: 170,
      // });
    }
  } catch (error) {
    console.log("Warning: Could not load watermark image");
  }

  // Remove the duplicate 'end' event listener - it's already set up at the top
  // doc.on("end", Endcallback); // Remove this line

  doc.end();
}

passport.use(new localStrategy(userModel.authenticate()));
mongoose
  .connect("mongodb://0.0.0.0/mark")
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    err;
  });
/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index");
});
router.get("/register", async function (req, res, next) {
  const course = await courseModel.find();
  const universities = await universityModel.find();
  res.render("register", { course, universities });
});

router.get("/invoice/download", isLoggedIn, async (req, res, next) => {
  const { id } = req.query;
  if (!id) return res.status(400).send("❌ Fee ID is required");
  // populate student and course details
  const Fees = await feesModel.findById(id).populate({
    path: "student",
    populate: {
      path: "course",
    },
  });
  if (!Fees) return res.status(404).send("❌ Fee record not found");

  const student = Fees.student;
  if (!student) return res.status(404).send("❌ Student record not found");
  // Validate contact number
  // res.json(Fees.student);

  const { payment, registrationPaymentMode, payDate } = Fees;
  const { reg_no, firstName, lastName, course, reg_fee, contactNumber } =
    student;
  const stream = res.writeHead(200, {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment;filename=receipt.pdf`,
  });
  buildPDF(
    (chunk) => stream.write(chunk),
    () => stream.end(),
    reg_no,
    payDate
      ? payDate.toLocaleDateString("en-GB")
      : new Date().toLocaleDateString("en-GB"),
    firstName,
    lastName,
    course,
    reg_fee,
    payment,
    contactNumber,
    registrationPaymentMode
  );
});
router.get("/invoice", async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).send("❌ Fee ID is required");
  // populate student and course details
  const Fees = await feesModel.findById(id).populate({
    path: "student",
    populate: {
      path: "course",
    },
  });
  if (!Fees) return res.status(404).send("❌ Fee record not found");

  const student = Fees.student;
  if (!student) return res.status(404).send("❌ Student record not found");
  // Validate contact number
  if (!student.contactNumber || !/^[6-9]\d{9}$/.test(student.contactNumber)) {
    return res
      .status(400)
      .send("❌ Invalid Indian phone number (10 digits required)");
  }
  // Prepare data for PDF
  console.log(Fees);

  const { payment, registrationPaymentMode, payDate } = Fees;
  const { reg_no, firstName, lastName, course, reg_fee, contactNumber } =
    student;
  if (!contactNumber || !/^[6-9]\d{9}$/.test(contactNumber)) {
    return res
      .status(400)
      .send("❌ Invalid Indian phone number (10 digits required)");
  }

  // const chatId = `91${contactNumber}@c.us`;
  const chatId = `917089369114@c.us`;

  const bufferStream = new WritableStreamBuffer();

  let responseSent = false;

  buildPDF(
    (chunk) => bufferStream.write(chunk),
    async () => {
      try {
        const buffer = bufferStream.getContents();
        if (!buffer) {
          if (!responseSent) {
            responseSent = true;
            return res.status(500).send("❌ PDF generation failed");
          }
          return;
        }

        const base64 = buffer.toString("base64");
        const media = new MessageMedia(
          "application/pdf",
          base64,
          "invoice.pdf"
        );

        await whatsappClient.sendMessage(chatId, media);

        if (!responseSent) {
          responseSent = true;
          return res.send(
            `<html>
            <body>
              <h1>✅ Invoice Sent Successfully!</h1>
              <p>Invoice has been sent to ${contactNumber} on WhatsApp.</p>
              <p><a href="/invoice/download?id=${Fees._id}">Download Invoice</a></p>
              <p><a href="/feesManagement">Go Back</a></p>
            </body>
            </html>`
          );
        }
      } catch (error) {
        console.error("❌ WhatsApp Send Error:", error.message);

        if (!responseSent) {
          responseSent = true;
          return res
            .status(500)
            .send(
              "❌ Failed to send invoice. Make sure the number is registered on WhatsApp."
            );
        }
      }
    },
    reg_no,
    payDate
      ? payDate.toLocaleDateString("en-GB")
      : new Date().toLocaleDateString("en-GB"),
    firstName,
    lastName,
    course,
    reg_fee,
    payment,
    contactNumber,
    registrationPaymentMode
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
router.get("/logout", (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
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
router.get("/addUniversity", isLoggedIn, (req, res, next) => {
  universityModel.find().then((universities) => {
    res.render("addUniversity", { universities });
  });
});
router.post("/addUniversity", isLoggedIn, async (req, res, next) => {
  universityModel
    .create({
      name: req.body.addUniversity,
      location: req.body.location,
    })
    .then(() => {
      res.redirect("/addUniversity");
    });
});
router.delete("/universities/:id", async (req, res) => {
  try {
    await universityModel.findByIdAndDelete(req.params.id);
    res.redirect("/addUniversity");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting university");
  }
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
  await studentModel.create(req.body);
  res.redirect("/allenquiry");
});
router.get("/allenquiry", isLoggedIn, async (req, res, next) => {
  const students = await studentModel
    .find({ rejected: true })
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
  studentModel
    .find()
    .populate("course")
    .then((std) => {
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
  const today = new Date(); // Get current date

  const filteredStudents = students
    .filter((e) => e.due > 0 && new Date(e.dueDate) < today) // Only past due dates
    .sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate)); // Sort in descending order

  res.render("fees", { students: filteredStudents });
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
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Dates
    const prev = req.query.prev ? new Date(req.query.prev) : null;
    const next = req.query.next ? new Date(req.query.next) : null;

    // If only prev is provided, default next to today
    const query = {};
    if (prev && next) {
      query.payDate = { $gte: prev, $lte: next };
    } else if (prev && !next) {
      query.payDate = { $gte: prev, $lte: new Date() };
    } else if (!prev && next) {
      query.payDate = { $lte: next };
    }

    // Fetch paginated and filtered fees
    const [fees, totalFees] = await Promise.all([
      await feesModel
        .find(query)
        .sort({ _id: -1 })
        .populate("student")
        .skip(skip)
        .limit(limit),
      feesModel.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalFees / limit);

    res.render("feesManagement", {
      fees,
      currentPage: page,
      totalPages,
      totalFees,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      query: req.query, // useful for keeping filters on the frontend
    });
  } catch (err) {
    next(err);
  }
});

router.get("/delete/transaction/:id", isLoggedIn, async (req, res, next) => {
  await feesModel.findOneAndDelete({
    _id: req.params.id,
  });
  res.redirect("/feesManagement");
});

module.exports = router;
