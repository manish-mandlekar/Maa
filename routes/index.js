var express = require("express");
var router = express.Router();
const mongoose = require("mongoose");
const userModel = require("../models/Usermodel");
const staffModel = require("../models/staff");
const studentModel = require("../models/student");
const admissionModel = require("../models/admission");
const courseModel = require("../models/course");
const shortCourseModel = require("../models/shortCourse");
const feesModel = require("../models/fees");
const universityModel = require("../models/university");
const passport = require("passport");
const localStrategy = require("passport-local");
var fs = require("fs");
const pdfDoc = require("pdfkit");
// const { MessageMedia } = require("whatsapp-web.js");
// const whatsappClient = require("./whatsapp"); // your whatsapp.js file
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
  const doc = new pdfDoc({ size: "A4", margin: 50 });

  // Listeners
  doc.on("data", Datacallback);
  doc.on("end", Endcallback);

  const blue = '#0000ff';

  // Header
  doc
    .fillColor(blue)
    .fontSize(18)
    .text("MAA COMPUTER EDUCATION INSTITUTE™", { align: "center", underline: true })
    .fontSize(14)
    .text("SPOKEN ENGLISH & P.D. CLASSES", { align: "center" })
    .fontSize(10)
    .text("Many Mind's One Vision Quality Education", { align: "center", underline: true });

  doc
    .moveDown(0.5)
    .fontSize(10)
    .text("BRANCH -1: Above Union Bank 2nd Floor, Station Road Rau Indore", { align: "center" })
    .text("BRANCH -1: Cat Road Rau Indore    M. 9407093676", { align: "center" });

  // Space
  doc.moveDown(1);

  // Receipt Info
  doc
    .fontSize(10)
    .fillColor("black")
    .text(`Reg. No.: ${reg_no || "N/A"}`, 50)
    .text(`Date: ${date || new Date().toLocaleDateString("en-GB")}`, 400);

  doc
    .moveDown()
    .text(`Name: ${name || "N/A"} ${lastName || ""}`, 50)
    .text(`Course: ${course?.courseName || "N/A"}`, 50)
    .text(`Contact: ${contactNumber || "N/A"}`, 400);

  // Table Headers
  doc
    .moveDown()
    .fillColor(blue)
    .text("S.No.", 50)
    .text("Particulars", 150)
    .text("Amount", 450);

  // Table Data
  let y = doc.y + 5;
  doc
    .fillColor("black")
    .text("1.", 50, y)
    .text("Paid Fee", 150, y)
    .text(`${paid_fee || "0"}`, 450, y);

  y += 20;
  if (reg_fee) {
    doc
      .text("2.", 50, y)
      .text("Registration Fee", 150, y)
      .text(`${reg_fee}`, 450, y);
    y += 20;
  }

  const total = parseInt(reg_fee || 0) + parseInt(paid_fee || 0);
  doc
    .font("Helvetica-Bold")
    .text("Total", 150, y)
    .text(`${total}`, 450, y);

  // Payment Info
  doc
    .moveDown()
    .font("Helvetica")
    .text(
      `Received a sum of Rupees ${total} by ${payment_mode || "Cash"}.`,
      50,
      y + 40
    )
    .text(
      `Date: ${date || new Date().toLocaleDateString("en-GB")}`,
      50,
      y + 60
    )
    .text("Student's/Parent's Signature", 50, y + 100)
    .text("Receiver's Signature", 400, y + 100);

  // Footer Note
  doc
    .moveDown()
    .fontSize(9)
    .fillColor("red")
    .text(
      "Note: Fee is not refundable or transferable in any condition. Late fee is applicable after due date.",
      50,
      y + 130,
      { width: 500 }
    );

  // Bottom Footer
  doc
    .fontSize(9)
    .fillColor(blue)
    .text("Visit Us: www.mceiindia.in", 50, 770)
    .text("📞 Help line: 9617767802, 9229967996, 9039442551, 9131990309", 50, 785)
    .text("📧 Email: mceiindia229@gmail.com", 50, 800)
    .text("📱 Instagram/Facebook: @mceiindiarau", 50, 815);

  // Watermark (if available)
  try {
    if (fs.existsSync("./public/images/black.png")) {
      doc
        .rotate(330)
        .opacity(0.2)
        .image("./public/images/black.png", -100, 200, {
          width: 470,
          height: 170,
        });
    }
  } catch (error) {
    console.warn("Watermark image not found.");
  }

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
async function backfillReceiptNumbers() {
  const existing = await feesModel.find({}); // sort chronologically if needed
  let counter = 3502;

  for (const doc of existing) {
    if (!doc.receiptNumber) {
      doc.receiptNumber = counter++;
      await doc.save();
    }
  }
  console.log("backup fill");
}
// backfillReceiptNumbers()
// removeReceiptNumbers()
async function removeReceiptNumbers() {
  try {
    const result = await feesModel.updateMany(
      { receiptNumber: { $exists: true } },
      { $unset: { receiptNumber: 1 } }
    );

    console.log(
      `Removed receiptNumber from ${result.modifiedCount} documents.`
    );
  } catch (error) {
    console.error("Error while removing receiptNumber:", error);
  }
}

router.get("/", function (req, res, next) {
  res.render("index");
});
// A
router.get("/accepted/enquiry/:id", isLoggedIn, async (req, res, next) => {
  const student = await studentModel.findById({ _id: req.params.id });
  const course = await courseModel.find();
  const universities = await universityModel.find();
  res.render("acceptEnquiry", {
    student,
    course,
    universities,
  });
});
router.post("/accepted/enquiry/:id", isLoggedIn, async (req, res, next) => {
  const student = await studentModel.findById({ _id: req.params.id });
  console.log(req.body);

  student.registered = true;
  student.course = req?.body?.course;
  student.session = req?.body?.session;
  student.dueDate = req?.body?.dueDate;
  student.due = req?.body?.due;
  student.university = req?.body?.university;
  await student.save();
  await feesModel.create({
    registrationPaymentMode: req.body.registrationPaymentMode,
    student: student._id,
    payment: req.body.reg_fee,
  });
  res.redirect("/student");
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
router.get("/admission", async function (req, res, next) {
  const shortCourses = await shortCourseModel.find();
  res.render("admission", { shortCourses });
});
router.post("/admission", async function (req, res, next) {
  await admissionModel.create(req.body);
  console.log(req.body);
  res.redirect("back");
});
router.get("/admission-student", isLoggedIn, async (req, res, next) => {
  try {
    const { name, contactNumber, page = 1 } = req.query;
    const limit = 10;
    const skip = (page - 1) * limit;
    let query;

    // Build dynamic query

    if (name) {
      query.$or = [
        { firstName: new RegExp(name, "i") },
        { lastName: new RegExp(name, "i") },
      ];
    }

    if (contactNumber) {
      query.contactNumber = contactNumber;
    }

    console.log(query);

    const [std, totalCount] = await Promise.all([
      admissionModel
        .find(query)
        .populate("course")
        .skip(skip)
        .limit(limit)
        .sort({ joiningDate: -1 }),
      admissionModel.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalCount / limit);
    res.render("admissionStudent", {
      std,
      query: req.query,
      currentPage: parseInt(page),
      totalPages,
    });
  } catch (err) {
    next(err);
  }
});
router.get("/admprofile/:id", isLoggedIn, async (req, res, next) => {
  const courses = await shortCourseModel.find();
  const founduser = await admissionModel
    .findOne({
      _id: req.params.id,
    })
    .populate("course");

  res.render("admprofile", { founduser, courses });
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
router.get("/allenquiry", isLoggedIn, async (req, res, next) => {
  const students = await studentModel
    // registered: false and rejected: false
    .find({ registered: false, rejected: false })
    .populate("course");
  res.render("allenquiry", { students });
});
router.get("/allStaff", isLoggedIn, (req, res, next) => {
  staffModel.find().then((staff) => {
    res.render("allStaff", { staff });
  });
});

// C
router.get("/clear-session", async (req, res) => {
  try {
    // First logout if client is active
    await whatsappClient.logout();
    // Delete the authentication folder
    const authPath = path.join(__dirname, ".wwebjs_auth");
    if (fs.existsSync(authPath)) {
      fs.rmSync(authPath, { recursive: true, force: true });
      console.log("✅ Authentication files deleted");
    }

    res.send(
      "✅ WhatsApp session cleared! Restart the application to scan QR code again."
    );
  } catch (error) {
    console.error("❌ Clear Session Error:", error.message);
    res.status(500).send("❌ Failed to clear WhatsApp session");
  }
});
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

// D
router.get("/dashboard", isLoggedIn, async (req, res, next) => {
  const student = await studentModel.find().populate("course");
  const courses = await courseModel.find();
  res.render("dashboard", { student, courses });
});
router.get("/delete/transaction/:id", isLoggedIn, async (req, res, next) => {
  await feesModel.findOneAndDelete({
    _id: req.params.id,
  });
  res.redirect("/feesManagement");
});
router.get("/deletecourse/:id", isLoggedIn, async (req, res, next) => {
  await courseModel.findOneAndDelete({ _id: req.params.id });
  res.redirect("back");
});

// E
router.get("/edit/:id", isLoggedIn, async (req, res, next) => {
  const founduser = await studentModel.findOne({
    _id: req.params.id,
  });
  res.render("edit", { founduser });
});

// F
router.get("/feesManagement", isLoggedIn, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const prev = req.query.prev ? new Date(req.query.prev) : null;
    const nextDate = req.query.next ? new Date(req.query.next) : null;

    const query = {};

    if (prev && nextDate) {
      query.payDate = { $gte: prev, $lte: nextDate };
    } else if (prev && !nextDate) {
      query.payDate = { $gte: prev, $lte: new Date() };
    } else if (!prev && nextDate) {
      query.payDate = { $lte: nextDate };
    }

    const paymentMode = req.query.registrationPaymentMode;

    if (paymentMode === "cash") {
      query.registrationPaymentMode = "Cash";
    } else if (paymentMode === "upi") {
      query.registrationPaymentMode = {
        // not in cash
        $ne: "Cash",
      };
    }

    const [fees, totalFees] = await Promise.all([
      feesModel
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
      query: req.query,
    });
  } catch (err) {
    next(err);
  }
});
router.get("/fees", isLoggedIn, async (req, res, next) => {
  const students = await studentModel
    .find({ registered: true, rejected: false })
    .populate("course");
  const today = new Date(); // Get current date

  const filteredStudents = students
    .filter((e) => e.due > 0 && new Date(e.dueDate) < today) // Only past due dates
    .sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate)); // Sort in descending order

  res.render("fees", { students: filteredStudents });
});

// G
router.get("/getdate", isLoggedIn, async (req, res, next) => {
  const students = await studentModel
    .find({ registered: true, rejected: false })
    .populate("course");
  students.sort(function (a, b) {
    return new Date(a.dueDate) - new Date(b.dueDate);
  });
  res.json({ students: students.filter((e) => e.due > 0) });
});

// I
router.get("/inquiry", isLoggedIn, async (req, res, next) => {
  const course = await courseModel.find();
  res.render("inquiry", { course });
});
router.post("/inquiry", isLoggedIn, async (req, res, next) => {
  // add enquiryBy in student model from req.user
  try{
    console.log(req.body); 
    if (req.user) req.body.enquiryBy = req.user.username;
    await studentModel.create(req.body);
    res.redirect("/allenquiry");
  }catch(err){
    console.log(err.message);
    
    res.send("Internal Server Error")
  }
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

// L
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

// P
router.get("/profile", isLoggedIn, (req, res, next) => {
  res.render("profile");
});

// R
router.get("/register", async function (req, res, next) {
  const course = await courseModel.find();
  const universities = await universityModel.find();
  res.render("register", { course, universities });
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
router.get("/rejected", isLoggedIn, async (req, res, next) => {
  const students = await studentModel
    .find({ rejected: true })
    .populate("course");
  console.log(students);

  res.render("rejected", { students });
});
router.get("/reject/enquiry/:id", isLoggedIn, async (req, res, next) => {
  const student = await studentModel.findById({ _id: req.params.id });
  student.rejected = true;
  await student.save();
  res.redirect("back");
});

// S
router.get("/signup", function (req, res, next) {
  res.render("signup");
});
router.get("/student", isLoggedIn, async (req, res, next) => {
  try {
    const { name, contactNumber, session, page = 1 } = req.query;
    const limit = 10;
    const skip = (page - 1) * limit;

    // Build dynamic query
    const query = { rejected: false, registered: true };

    if (name) {
      query.$or = [
        { firstName: new RegExp(name, "i") },
        { lastName: new RegExp(name, "i") },
      ];
    }

    if (contactNumber) {
      query.contactNumber = contactNumber;
    }

    if (session) {
      query.session = session;
    }
    console.log(query);

    const [std, totalCount, sessions] = await Promise.all([
      studentModel
        .find(query)
        .populate("course")
        .skip(skip)
        .limit(limit)
        .sort({ joiningDate: -1 }),
      studentModel.countDocuments(query),
      studentModel.distinct("session"),
    ]);

    const totalPages = Math.ceil(totalCount / limit);
    res.render("student", {
      std,
      query: req.query,
      currentPage: parseInt(page),
      totalPages,
      sessions,
    });
  } catch (err) {
    next(err);
  }
});
router.get("/stdprofile/:id", isLoggedIn, async (req, res, next) => {
  const courses = await courseModel.find();
  const founduser = await studentModel
    .findOne({
      _id: req.params.id,
    })
    .populate("course");

  res.render("stdprofile", { founduser, courses });
});
router.post("/short-course", isLoggedIn, (req, res, next) => {
  shortCourseModel
    .create({
      courseName: req.body.courseName,
      courseCode: req.body.courseCode,
      courseDuration: req.body.courseDuration,
    })
    .then(() => {
      res.redirect("back");
    });
});
router.get("/shortTermCourse", async function (req, res, next) {
  const shortCourses = await shortCourseModel.find();
  res.render("shortTermCourse", { shortCourses });
});

// U
router.delete("/universities/:id", async (req, res) => {
  try {
    await universityModel.findByIdAndDelete(req.params.id);
    res.redirect("/addUniversity");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting university");
  }
});
router.post("/update/profile/:id", isLoggedIn, async (req, res, next) => {
  try {
    const updateData = { ...req.body };

    // Ensure course is always treated as an array of ObjectIds
    if (req.body.course) {
      updateData.course = Array.isArray(req.body.course)
        ? req.body.course
        : [req.body.course];
    }

    await studentModel.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    res.redirect("/student");
  } catch (error) {
    console.error("Error updating student profile:", error);
    res.status(500).send("Internal Server Error");
  }
});
router.post("/update/admprofile/:id", isLoggedIn, async (req, res, next) => {
  try {
    const updateData = { ...req.body };

    // Ensure course is always treated as an array of ObjectIds
    if (req.body.course) {
      updateData.course = Array.isArray(req.body.course)
        ? req.body.course
        : [req.body.course];
    }

    await admissionModel.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    res.redirect("back");
  } catch (error) {
    console.error("Error updating student profile:", error);
    res.status(500).send("Internal Server Error");
  }
});
router.post("/update-course/:id", isLoggedIn, async (req, res, next) => {
  try {
    await courseModel.findOneAndUpdate({ _id: req.params.id }, req.body);
    res.redirect("back");
  } catch (error) {
    console.error("Error updating student profile:", error);
    res.status(500).send("Internal Server Error");
  }
});
router.post("/update-short-course/:id", isLoggedIn, async (req, res, next) => {
  try {
    await shortCourseModel.findOneAndUpdate({ _id: req.params.id }, req.body);
    res.redirect("back");
  } catch (error) {
    console.error("Error updating student profile:", error);
    res.status(500).send("Internal Server Error");
  }
});
router.post("/update/due/:id", isLoggedIn, async (req, res, next) => {
  const foundstudent = await studentModel.findOne({
    _id: req.params.id,
  });
  await feesModel.create({
    registrationPaymentMode: req.body.registrationPaymentMode,
    student: foundstudent._id,
    payment: req.body.paid,
  });
  foundstudent.due = foundstudent.due - +req.body.paid;
  await foundstudent.save();
  res.redirect("/fees");
});

const studentdata = require("../data/student.json");
// insert many students
router.get("/insert-students", async (req, res) => {
  try {
    await studentModel.insertMany(studentdata);
    res.send("✅ Students inserted successfully!");
  } catch (error) {
    console.error("❌ Error inserting students:", error.message);
    res.status(500).send("❌ Failed to insert students");
  }
});
// delete all students whose name is "loku"
router.get("/delete-students", async (req, res) => {
  try {
    const result = await studentModel.deleteMany({ firstName: "loku" });
    res.send(`✅ Deleted ${result.deletedCount} students successfully!`);
  } catch (error) {
    console.error("❌ Error deleting students:", error.message);
    res.status(500).send("❌ Failed to delete students");
  }
});

module.exports = router;
