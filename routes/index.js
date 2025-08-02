var express = require("express");
var router = express.Router();
const userModel = require("../models/Usermodel");
const staffModel = require("../models/staff");
const studentModel = require("../models/student");
const admissionModel = require("../models/admission");
const courseModel = require("../models/course");
const shortCourseModel = require("../models/shortCourse");
const feesModel = require("../models/fees");
const universityModel = require("../models/university");
const inquiryModel = require("../models/inquiry");
const passport = require("passport");
const localStrategy = require("passport-local");
var fs = require("fs");
const PDFDocument = require("pdfkit");
const { MessageMedia } = require("whatsapp-web.js");
const { startWhatsAppClient, getWhatsAppClient } = require("./whatsapp");
startWhatsAppClient(); // your whatsapp.js file

const { WritableStreamBuffer } = require("stream-buffers");

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect("/");
  }
}
function checkLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    res.redirect("/dashboard");
  } else {
    return next();
  }
}

function buildPDF(
  Datacallback,
  Endcallback,
  r_no,
  feeType,
  date,
  name,
  lastName,
  course,
  reg_fee,
  paid_fee,
  contactNumber,
  payment_mode
) {
  const doc = new PDFDocument({ size: "A4", margin: 50 });

  doc.on("data", Datacallback);
  doc.on("end", Endcallback);

  const blue = "#0000ff";
  const red = "#ff0000";

  // Draw the header logo/image at the top
  try {
    if (fs.existsSync("./public/images/real.jpeg")) {
      doc.image("./public/images/real.jpeg", 50, 0, {
        width: 495,
        align: "top",
      });
      doc.moveDown(8); // Move down after logo
    } else {
      // Fallback: Create a placeholder header
      doc
        .fontSize(24)
        .fillColor(blue)
        .font("Helvetica-Bold")
        .text("MAA COMPUTERS", 50, 50, { align: "center" })
        .fontSize(14)
        .text("EDUCATION INSTITUTE", 50, 80, { align: "center" });
      doc.moveDown(3);
    }
  } catch (err) {
    console.warn("Header logo image not found, using text header.");
    // Fallback header
    doc
      .fontSize(24)
      .fillColor(blue)
      .font("Helvetica-Bold")
      .text("MAA COMPUTERS", 50, 50, { align: "center" })
      .fontSize(14)
      .text("EDUCATION INSTITUTE", 50, 80, { align: "center" });
    doc.moveDown(3);
  }

  // Receipt header info with larger font - exactly as in original
  const currentY = doc.y;
  doc
    .fontSize(12)
    .fillColor("black")
    .font("Helvetica")
    .text(`Reg. No.: ${r_no || "N/A"}`, 50, currentY - 50)
    .text(
      `Date: ${date || new Date().toLocaleDateString("en-GB")}`,
      400,
      currentY - 50
    );

  // Student details with larger font
  // doc.moveDown(1);
  const detailsY = doc.y;
  doc
    .fontSize(12)
    .text(
      `Name: ${name || "N/A"}${lastName ? " " + lastName : ""}`,
      50,
      detailsY
    )
    .text(`Contact: ${contactNumber || "N/A"}`, 400, detailsY);

  doc.moveDown(0.5);

  doc.fontSize(12).text(`Course Enrolled: ${course || "N/A"}`, 50);

  // Table section with proper borders and increased font size - reduced height for 2 rows only
  doc.moveDown(1.5);
  const tableStartY = doc.y - 10;
  const tableWidth = 495;
  const col1Width = 60;
  const col2Width = 285;
  const col3Width = 150;

  // Draw table border - reduced height to 75 (header + 1 row + total)
  doc.rect(50, tableStartY, tableWidth, 75).stroke();

  // Draw vertical lines
  doc
    .moveTo(50 + col1Width, tableStartY)
    .lineTo(50 + col1Width, tableStartY + 75)
    .stroke();
  doc
    .moveTo(50 + col1Width + col2Width, tableStartY)
    .lineTo(50 + col1Width + col2Width, tableStartY + 75)
    .stroke();

  // Draw horizontal lines
  doc
    .moveTo(50, tableStartY + 25)
    .lineTo(545, tableStartY + 25)
    .stroke(); // After header
  doc
    .moveTo(50, tableStartY + 50)
    .lineTo(545, tableStartY + 50)
    .stroke(); // After row 1

  // Table headers with blue color and larger font
  doc
    .fillColor("black")
    .fontSize(12)
    .font("Helvetica-Bold")
    .text("S.No.", 55, tableStartY + 8, {
      width: col1Width - 10,
      align: "center",
    })
    .text("Particulars", 115, tableStartY + 8, {
      width: col2Width - 10,
      align: "center",
    })
    .text("Amount", 405, tableStartY + 8, {
      width: col3Width - 10,
      align: "center",
    });

  // Table rows with larger font
  doc.fillColor("black").font("Helvetica").fontSize(11);

  // Row 1: Fee Type (only row now)
  doc
    .text("1", 55, tableStartY + 33, { width: col1Width - 10, align: "center" })
    .text(feeType, 115, tableStartY + 33, {
      width: col2Width - 10,
      align: "left",
    })
    .text(`${paid_fee || "0"}`, 395, tableStartY + 33, {
      width: col3Width - 10,
      align: "center",
    });

  // Total row with bold font (moved up to position where row 2 was)
  const total = parseInt(paid_fee || 0); // Only paid_fee since we removed the other row
  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .text("Total", 115, tableStartY + 58, {
      width: col2Width - 10,
      align: "left",
    })
    .text(`${total}`, 395, tableStartY + 58, {
      width: col3Width - 10,
      align: "center",
    });

  // Payment information with larger font
  doc.moveDown(1);
  doc
    .font("Helvetica")
    .fontSize(12)
    .text(
      `Received a sum of Rupees ${total} by ${payment_mode || "UPI"}.`,
      50,
      250
    );
  // Signature section with larger font
  doc.moveDown(1);
  const signatureY = doc.y;
  doc
    .fontSize(12)
    .text("Student's/Parent's Signature", 50, signatureY)
    .text("Receiver's Signature", 400, signatureY);

  // Important note in red with larger font
  doc.moveDown(1);
  doc
    .fontSize(11)
    .fillColor(red)
    .text(
      "Note: Fee is not refundable or transferable in any condition. Late fee is applicable after due date.",
      50,
      doc.y,
      { width: 495 }
    );

  // Footer contact information with larger font
  doc.moveDown(1);
  doc.fontSize(11).fillColor("black").text("Visit Us: www.mceiindia.in", 50);

  doc.text("Help line: 9617767802, 9229967996, 9039442551, 9131990309", 50);
  doc.text("Email: mceiindia229@gmail.com | Social: @mceiindiarau", 50);

  doc.end();
}
passport.use(new localStrategy(userModel.authenticate()));

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

  const { payment, registrationPaymentMode, payDate, feeType } = Fees;
  const { firstName, lastName, course, reg_fee, contactNumber, r_no, _id } =
    student;
  const stream = res.writeHead(200, {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment;filename=receipt.pdf`,
  });
  buildPDF(
    (chunk) => stream.write(chunk),
    () => stream.end(),
    r_no ? r_no : _id,
    feeType,
    payDate
      ? payDate.toLocaleDateString("en-GB")
      : new Date().toLocaleDateString("en-GB"),
    firstName,
    lastName,
    course.courseName,
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
    return res.status(400)
      .send(`<div style="text-align: center; margin-top: 50px; font-family: Arial, sans-serif;">
    <h2>❌ Invalid Contact Number</h2>
    <p>Redirecting in <span id="countdown">3</span> seconds...</p>
    <p><a href="/fees" style="color: #007bff; text-decoration: none;">Click here if not redirected automatically</a></p>
    <script>
      let count = 3;
      const countdown = document.getElementById('countdown');
      const timer = setInterval(() => {
        count--;
        countdown.textContent = count;
        if (count <= 0) {
          clearInterval(timer);
          window.location.href = '/feesManagement';
        }
      }, 1000);
    </script>
  </div>`);
  }

  const { payment, registrationPaymentMode, payDate, feeType } = Fees;
  const { firstName, lastName, course, reg_fee, contactNumber, r_no, _id } =
    student;
  if (!contactNumber || !/^[6-9]\d{9}$/.test(contactNumber)) {
    return res
      .status(400)
      .send("❌ Invalid Indian phone number (10 digits required)");
  }

  const chatId = `91${contactNumber}@c.us`;
  // const chatId = `917089369114@c.us`;

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
        const whatsappClient = getWhatsAppClient();

        await whatsappClient.sendMessage(chatId, media);

        if (!responseSent) {
          responseSent = true;
          return res.send(
            `<html>
            <body>
              <h1>✅ Invoice Sent Successfully!</h1>
              <p>Invoice has been sent to ${contactNumber} on WhatsApp.</p>
              <p><a href="/invoice/download?id=${Fees._id}">Download Invoice</a></p>
              <p>Redirecting in <span id="countdown">3</span> seconds...</p>
              <p><a href="/feesManagement">Go Back</a></p>
            </body>
            <script>
      let count = 3;
      const countdown = document.getElementById('countdown');
      const timer = setInterval(() => {
        count--;
        countdown.textContent = count;
        if (count <= 0) {
          clearInterval(timer);
          window.location.href = '/feesManagement';
        }
      }, 1000);
    </script>
  </div>
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
              `<div>❌ Failed to send invoice. Make sure the number is registered on WhatsApp.<p><a href="/feesManagement">Go Back</a></p></div>`
            );
        }
      }
    },
    r_no ? r_no : _id,
    feeType,
    payDate
      ? payDate.toLocaleDateString("en-GB")
      : new Date().toLocaleDateString("en-GB"),
    firstName,
    lastName,
    course.courseName,
    reg_fee,
    payment,
    contactNumber,
    registrationPaymentMode
  );
});

router.get("/", checkLoggedIn, function (req, res, next) {
  res.render("index");
});
// A
router.get("/accepted/enquiry/:id", isLoggedIn, async (req, res, next) => {
  const student = await inquiryModel.findById({ _id: req.params.id });
  const universities = await universityModel.find();
  let course;
  if (student.inquiryType == "student") {
    course = await courseModel.find();
    const lastStudent = await studentModel.find().sort({ r_no: -1 }).limit(1); // more efficient than accessing [0]

    const r_no = lastStudent.length > 0 ? lastStudent[0].r_no + 1 : 1;
    res.render("register", {
      student,
      course,
      universities,
      r_no,
    });
  } else {
    shortCourses = await shortCourseModel.find();
    res.render("admission", {
      student,
      shortCourses,
      universities,
    });
  }
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
  res.redirect("back");
});
router.get("/admission-student", isLoggedIn, async (req, res, next) => {
  try {
    const { name, contactNumber, page = 1 } = req.query;
    const limit = 10;
    const skip = (page - 1) * limit;
    let query = {}; // ✅ Always initialize

    // Build dynamic query
    if (name) {
      query.$or = [
        { firstName: new RegExp(name, "i") },
        { lastName: new RegExp(name, "i") },
      ];
    }

    if (contactNumber) {
      // If $or exists, merge it with contactNumber
      if (query.$or) {
        query.$and = [{ $or: query.$or }, { contactNumber }];
        delete query.$or;
      } else {
        query.contactNumber = contactNumber;
      }
    }

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
    console.log("Error fetching admission students:", err);
    res.send(`
      <html>
        <body>
          <h1>Something Went Wrong!</h1>
          <p><a href="/feesManagement">Go Back</a></p>
        </body>
      </html>
    `);
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
router.post("/addStaff", isLoggedIn, async (req, res, next) => {
  try {
    await staffModel.create({
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
    });
    res.redirect("/allStaff");
  } catch (err) {
    console.error("Error adding staff:", err);
    res.send(`<html>
            <body>
              <h1>Something Went Wrong!</h1>
              <p><a href="/feesManagement">Go Back</a></p>
            </body>
            </html>`);
  }
});

router.get("/addUniversity", isLoggedIn, async (req, res, next) => {
  try {
    const universities = await universityModel.find();
    res.render("addUniversity", {
      universities,
      messages: {
        success: req.flash("success"),
        error: req.flash("error"),
      },
    });
  } catch (error) {
    console.error("Error fetching universities:", error);
    req.flash("error", "Failed to load universities");
    res.redirect("/dashboard");
  }
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
  try {
    const filter = {
      registered: false,
      rejected: false,
    };

    // If contactNumber is present in query, add it to the filter
    if (req.query.contactNumber) {
      filter.contactNumber = req.query.contactNumber;
    }

    const students = await inquiryModel.find(filter);

    res.render("allenquiry", { students });
  } catch (err) {
    console.log(err.message);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/allStaff", isLoggedIn, (req, res, next) => {
  staffModel.find().then((staff) => {
    res.render("allStaff", { staff });
  });
});

// C
router.get("/course", isLoggedIn, async (req, res, next) => {
  try {
    const course = await courseModel.find();
    res.render("course", { course });
  } catch (err) {
    console.error("Error fetching courses:", err);
    res.send(`<html>
            <body>
              <h1>Something Went Wrong!</h1>
              <p><a href="/feesManagement">Go Back</a></p>
            </body>
            </html>`);
  }
});
router.post("/course", isLoggedIn, async (req, res, next) => {
  try {
    await courseModel.create({
      courseName: req.body.courseName,
      courseCode: req.body.courseCode,
      courseDuration: req.body.courseDuration,
    });
    res.redirect("/course");
  } catch (err) {
    console.error("Error creating course:", err);
    res.send(`<html>
            <body>
              <h1>Something Went Wrong!</h1>
              <p><a href="/feesManagement">Go Back</a></p>
            </body>
            </html>`);
  }
});

// D
router.get("/dashboard", isLoggedIn, async (req, res, next) => {
  try {
    const student = await studentModel.find().populate("course");
    const courses = await courseModel.find();

    // Get current date/time
    const now = new Date();

    // --- 📆 Today Range ---
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const todayFees = await feesModel.aggregate([
      {
        $match: {
          payDate: {
            $gte: todayStart,
            $lte: todayEnd,
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$payment" },
        },
      },
    ]);
    const totalFeesToday = todayFees[0]?.total || 0;

    // --- 🗓️ Current Month Range ---
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    const monthFees = await feesModel.aggregate([
      {
        $match: {
          payDate: {
            $gte: monthStart,
            $lte: monthEnd,
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$payment" },
        },
      },
    ]);
    const totalFeesMonth = monthFees[0]?.total || 0;

    // --- 📅 Current Year Range ---
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

    const yearFees = await feesModel.aggregate([
      {
        $match: {
          payDate: {
            $gte: yearStart,
            $lte: yearEnd,
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$payment" },
        },
      },
    ]);
    const totalFeesYear = yearFees[0]?.total || 0;

    // Fetch today's fee transactions (for table display)
    const fees = await feesModel
      .find({
        payDate: {
          $gte: todayStart,
          $lte: todayEnd,
        },
      })
      .populate("student");

    res.render("dashboard", {
      student,
      courses,
      fees,
      totalFeesToday,
      totalFeesMonth,
      totalFeesYear,
    });
  } catch (err) {
    res.send(`<html>
            <body>
              <h1>Something Went Wrong!</h1>
              <p><a href="/feesManagement">Go Back</a></p>
            </body>
            </html>`);
  }
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

router.get("/delete/shortcourse/:id", isLoggedIn, async (req, res, next) => {
  await shortCourseModel.findOneAndDelete({ _id: req.params.id });
  res.redirect("back");
});

router.get("/delete/enquiry/:id", isLoggedIn, async (req, res, next) => {
  try {
    await inquiryModel.deleteOne({ _id: req.params.id });
    res.redirect("back");
  } catch (err) {
    res.send(err.message);
  }
});

// E
router.get("/edit/:type/:id", isLoggedIn, async (req, res, next) => {
  const { type, id } = req.params;

  try {
    let founduser;

    if (type === "student") {
      founduser = await studentModel.findById(id).populate("course");
    } else if (type === "admission") {
      founduser = await admissionModel.findById(id).populate("course");
    } else {
      return res.status(400).send("Invalid type");
    }

    if (!founduser) {
      return res.status(404).send("User not found");
    }

    res.render("edit", { founduser, type }); // Optional: pass type to edit view if needed
  } catch (err) {
    console.error("Error in edit route:", err);
    res.send(`<html>
            <body>
              <h1>Something Went Wrong!</h1>
              <p><a href="/feesManagement">Go Back</a></p>
            </body>
            </html>`);
  }
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

    // Date range filter
    if (prev && nextDate) {
      query.payDate = { $gte: prev, $lte: nextDate };
    } else if (prev && !nextDate) {
      query.payDate = { $gte: prev, $lte: new Date() };
    } else if (!prev && nextDate) {
      query.payDate = { $lte: nextDate };
    }

    // Payment mode filter
    const paymentMode = req.query.registrationPaymentMode;
    if (paymentMode === "cash") {
      query.registrationPaymentMode = "Cash";
    } else if (paymentMode === "upi") {
      query.registrationPaymentMode = { $ne: "Cash" };
    }

    let filteredFees = [];
    let totalFees = 0;

    // r_no filtering after population
    if (req.query.r_no) {
      const allFees = await feesModel
        .find(query)
        .sort({ _id: -1 })
        .populate("student");

      filteredFees = allFees.filter((fee) =>
        fee.student?.r_no?.toString().includes(req.query.r_no.toString())
      );

      totalFees = filteredFees.length;
      filteredFees = filteredFees.slice(skip, skip + limit);
    } else {
      [filteredFees, totalFees] = await Promise.all([
        feesModel
          .find(query)
          .sort({ _id: -1 })
          .populate("student")
          .skip(skip)
          .limit(limit),
        feesModel.countDocuments(query),
      ]);
    }

    const totalPages = Math.ceil(totalFees / limit);

    res.render("feesmanagement", {
      fees: filteredFees,
      currentPage: page,
      totalPages,
      totalFees,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      query: req.query,
    });
  } catch (err) {
    res.send(`<html>
            <body>
              <h1>Something Went Wrong!</h1>
              <p><a href="/feesManagement">Go Back</a></p>
            </body>
            </html>`);
  }
});
router.get("/fees", isLoggedIn, async (req, res, next) => {
  try {
    const today = new Date();

    const studentData = await studentModel
      .find({ registered: true, rejected: false, due: { $gt: 0 } })
      .populate("course");

    const admissionData = await admissionModel
      .find({ due: { $gt: 0 } })
      .populate("course");

    // Common filter condition
    const filterDue = (data) =>
      data
        .filter((item) => item.dueDate && new Date(item.dueDate) < today)
        .sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));

    const filteredStudentData = filterDue(studentData);
    const filteredAdmissionData = filterDue(admissionData);

    res.render("fees", {
      students: filteredStudentData,
      admissions: filteredAdmissionData,
    });
  } catch (err) {
    console.error("Error fetching student and admission fees:", err);
    res.send(`<html>
            <body>
              <h1>Something Went Wrong!</h1>
              <p><a href="/feesManagement">Go Back</a></p>
            </body>
            </html>`);
  }
});

router.get("/new/fees", isLoggedIn, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const query = {};

    const result = await feesModel.aggregate([
      { $match: query }, // Your dynamic filters here
      {
        $group: {
          _id: { student: "$student", studentModelType: "$studentModelType" },
          totalPaid: { $sum: "$payment" },
          payments: { $push: "$$ROOT" },
        },
      },
      {
        $lookup: {
          from: "admissions", // collection name for Admission model (check in DB)
          localField: "_id.student",
          foreignField: "_id",
          as: "admission",
        },
      },
      {
        $lookup: {
          from: "students", // collection name for StudentEnquiry model (check in DB)
          localField: "_id.student",
          foreignField: "_id",
          as: "student",
        },
      },
      {
        $addFields: {
          studentDetails: {
            $cond: [
              { $eq: ["$_id.studentModelType", "admission"] },
              { $arrayElemAt: ["$admission", 0] },
              { $arrayElemAt: ["$student", 0] },
            ],
          },
        },
      },
      {
        $project: {
          _id: 0,
          studentId: "$_id.student",
          studentModelType: "$_id.studentModelType",
          totalPaid: 1,
          payments: 1,
          studentDetails: 1,
        },
      },
      { $sort: { studentId: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    res.render("newfees", {
      fees: result,
      currentPage: page,
      totalPages: Math.ceil(result.length / limit),
      totalFees: result.reduce((sum, fee) => sum + fee.totalPaid, 0),
      hasNextPage: result.length > skip + limit,
      hasPrevPage: page > 1,
      query: req.query,
    });
  } catch (err) {
    console.error("Error fetching student fees:", err);
  }
});

// G
router.get("/getdate", isLoggedIn, async (req, res, next) => {
  try {
    const studentData = (
      await studentModel
        .find({ registered: true, rejected: false, due: { $gt: 0 } })
        .populate("course")
    ).map((s) => ({ ...s.toObject(), source: "student" }));

    const admissionData = (
      await admissionModel.find({ due: { $gt: 0 } }).populate("course")
    ).map((a) => ({ ...a.toObject(), source: "admission" }));

    const combined = [...studentData, ...admissionData];

    combined.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    res.json({ students: combined });
  } catch (err) {
    console.error("Error in /getdate:", err);
    res.send(`<html>
            <body>
              <h1>Something Went Wrong!</h1>
              <p><a href="/feesManagement">Go Back</a></p>
            </body>
            </html>`);
  }
});

// I
router.get("/inquiry", isLoggedIn, async (req, res, next) => {
  const course = await courseModel.find();
  const admcourse = await shortCourseModel.find();
  res.render("inquiry", { course, admcourse });
});

router.post("/inquiry", isLoggedIn, async (req, res, next) => {
  try {
    const {
      inquiryType,
      firstName,
      lastName,
      email,
      fatherName,
      contactNumber,
      courseId,
      courseName,
      qualification,
      address,
    } = req.body;

    // Clean and validate contact number
    let contact = contactNumber.replace(/\D/g, "");
    if (contact.startsWith("91") && contact.length === 12) {
      contact = contact.slice(2); // remove '91'
    } else if (contact.startsWith("0") && contact.length === 11) {
      contact = contact.slice(1); // remove '0'
    }

    // Try to send WhatsApp message if number is valid
    if (/^[6-9]\d{9}$/.test(contact)) {
      try {
        const whatsappClient = getWhatsAppClient();
        const formattedNumber = "91" + contact + "@c.us";
        const thankYouMessage = `🙏 Thank you for your enquiry, ${
          firstName || "Student"
        }! We'll reach out to you shortly.`;

        await whatsappClient.sendMessage(formattedNumber, thankYouMessage);
      } catch (whatsappError) {
        console.error(
          "WhatsApp message not sent (client may not be ready):",
          whatsappError.message
        );
        // Continue with the inquiry even if WhatsApp fails
      }
    }

    // Build inquiry object
    const inquiryData = {
      inquiryType,
      firstName,
      lastName,
      email,
      fatherName,
      contactNumber: contact,
      qualification,
      address,
      course: {
        _id: courseId,
        courseName: courseName,
      },
    };

    // If user is logged in, add the enquirer info
    if (req.user) {
      inquiryData.enquiryBy = req.user.username;
    }

    await inquiryModel.create(inquiryData);

    res.redirect("/allenquiry");
  } catch (err) {
    console.error("Error creating inquiry:", err);
    res.status(500).send(`
      <html>
        <body>
          <h1>Something Went Wrong!</h1>
          <p><a href="/feesManagement">Go Back</a></p>
        </body>
      </html>
    `);
  }
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
  try {
    const course = await courseModel.find();
    const universities = await universityModel.find();

    const lastStudent = await studentModel.findOne().sort({ r_no: -1 }).lean(); // more efficient than accessing [0]

    console.log(lastStudent);

    const r_no = lastStudent ? lastStudent.r_no + 1 : 1;

    res.render("register", { course, universities, r_no });
  } catch (err) {
    console.error("Error in /register route:", err);
    res.send(
      `<html><body><h1>Something Went Wrong!</h1><p><a href="/feesManagement">Go Back</a></p></body></html>`
    );
  }
});

router.post("/register", async (req, res) => {
  try {
    const newUser = new userModel({
      username: req.body.username,
      email: req.body.email,
    });

    const user = await userModel.register(newUser, req.body.password);
    await new Promise((resolve, reject) => {
      passport.authenticate("local")(req, res, () => resolve());
    });

    res.redirect("/dashboard");
  } catch (err) {
    console.error("Registration error:", err);
    res.redirect("/signup");
  }
});
router.get("/rejected", isLoggedIn, async (req, res, next) => {
  try {
    const filter = { rejected: true };

    if (req.query.contactNumber) {
      filter.contactNumber = req.query.contactNumber;
    }

    const students = await inquiryModel.find(filter);

    res.render("rejected", {
      students,
      query: req.query,
    });
  } catch (err) {
    console.log(err.message);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/reject/enquiry/:id", isLoggedIn, async (req, res, next) => {
  try {
    const student = await inquiryModel.findById(req.params.id);
    if (!student) {
      throw new Error("Student not found");
    }
    student.rejected = true;
    await student.save();
    res.redirect("back");
  } catch (err) {
    console.error("Error rejecting enquiry:", err);
    res.send(
      `<html><body><h1>Something Went Wrong!</h1><p><a href="/feesManagement">Go Back</a></p></body></html>`
    );
  }
});

// S
router.get("/signup", function (req, res, next) {
  res.render("signup");
});
router.get("/student", isLoggedIn, async (req, res, next) => {
  try {
    const { name, contactNumber, session, sessionMonth, page = 1 } = req.query;
    const limit = 10;
    const skip = (page - 1) * limit;

    // Build dynamic query
    const query = {};

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

    if (sessionMonth) {
      query.sessionMonth = sessionMonth;
    }

    const [std, totalCount, sessions, sessionMonths] = await Promise.all([
      studentModel
        .find(query)
        .populate("course")
        .skip(skip)
        .limit(limit)
        .sort({ r_no: 1 }),
      studentModel.countDocuments(query),
      studentModel.distinct("session"),
      studentModel.distinct("sessionMonth"), // Get all distinct session months for filter dropdown
    ]);
    console.log(std);

    const totalPages = Math.ceil(totalCount / limit);
    res.render("student", {
      std,
      query: req.query,
      currentPage: parseInt(page),
      totalPages,
      sessions,
      sessionMonths, // Pass sessionMonths to the view
    });
  } catch (err) {
    res.send(
      `<html><body><h1>Something Went Wrong!</h1><p><a href="/feesManagement">Go Back</a></p></body></html>`
    );
  }
});

router.post("/student/register", isLoggedIn, async (req, res, next) => {
  try {
    // Create a new student

    const lastStudent = await studentModel.findOne().sort({ r_no: -1 }).lean();

    const newRno = lastStudent ? lastStudent.r_no + 1 : 1;

    const updateData = {
      ...req.body,
      r_no: newRno,
    };
    const newStudent = await studentModel.create(updateData);

    await inquiryModel.findOneAndUpdate(
      { _id: req.body.inquiryId },
      { registered: true, rejected: false },
      { new: true }
    );
    res.redirect("/student");
  } catch (err) {
    console.error("Error registering student:", err);
    res.send(
      `<html><body><h1>Something Went Wrong!</h1><p><a href="/feesManagement">Go Back</a></p></body></html>`
    );
  }
});
router.get("/stdprofile/:id", isLoggedIn, async (req, res, next) => {
  try {
    const [courses, founduser] = await Promise.all([
      courseModel.find(),
      studentModel.findOne({ _id: req.params.id }).populate("course"),
    ]);

    if (!founduser) {
      throw new Error("Student not found");
    }

    res.render("stdprofile", { founduser, courses });
  } catch (err) {
    console.error("Error fetching student profile:", err);
    res.send(`<html>
            <body>
              <h1>Something Went Wrong!</h1>
              <p><a href="/feesManagement">Go Back</a></p>
            </body>
            </html>`);
  }
});
router.post("/short-course", isLoggedIn, async (req, res, next) => {
  try {
    await shortCourseModel.create({
      courseName: req.body.courseName,
      courseCode: req.body.courseCode,
      courseDuration: req.body.courseDuration,
    });
    res.redirect("back");
  } catch (err) {
    console.error("Error creating short course:", err);
    res.send(`<html>
            <body>
              <h1>Something Went Wrong!</h1>
              <p><a href="/feesManagement">Go Back</a></p>
            </body>
            </html>`);
  }
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

    // Only process 'course' if it's provided and not empty
    if (updateData.course) {
      updateData.course = Array.isArray(updateData.course)
        ? updateData.course
        : [updateData.course];
    } else {
      // Explicitly remove 'course' field if it's not provided to avoid unintended overwrite
      delete updateData.course;
    }

    const updatedStudent = await studentModel.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updatedStudent) {
      return res.status(404).send("Student not found");
    }

    res.redirect("back");
  } catch (error) {
    console.error("Error updating student profile:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/update/admprofile/:id", isLoggedIn, async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    await admissionModel.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    res.redirect("/admission-student");
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
router.post("/update/due/:type/:id", isLoggedIn, async (req, res, next) => {
  try {
    const { type, id } = req.params;

    let foundstudent;

    if (type === "student") {
      foundstudent = await studentModel.findById(id).populate("course");
    } else if (type === "admission") {
      foundstudent = await admissionModel.findById(id).populate("course");
    } else {
      return res.status(400).send("Invalid type");
    }

    // Validate before proceeding
    const paidAmount = +req.body.paid;
    if (paidAmount > foundstudent.due) {
      return res.send(`
  <div style="text-align: center; margin-top: 50px; font-family: Arial, sans-serif;">
    <h2>❌ Invalid Entry: Paid amount is greater than due</h2>
    <p>Redirecting in <span id="countdown">3</span> seconds...</p>
    <p><a href="/fees" style="color: #007bff; text-decoration: none;">Click here if not redirected automatically</a></p>
    <script>
      let count = 3;
      const countdown = document.getElementById('countdown');
      const timer = setInterval(() => {
        count--;
        countdown.textContent = count;
        if (count <= 0) {
          clearInterval(timer);
          window.location.href = '/fees';
        }
      }, 1000);
    </script>
  </div>
`);
    }

    // Create the fee entry
    await feesModel.create({
      registrationPaymentMode: req.body.registrationPaymentMode,
      feeType: req.body.feeType,
      student: foundstudent._id,
      payment: paidAmount,
      studentModelType: type,
    });

    // Update the student's due
    foundstudent.due = foundstudent.due - paidAmount;
    await foundstudent.save();

    res.redirect("/fees");
  } catch (error) {
    console.error("❌ Error in /update/due:", error);
    next(error);
  }
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

router.put("/universities/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location } = req.body;

    await universityModel.findByIdAndUpdate(
      id,
      {
        name: name,
        location: location,
      },
      { new: true }
    );

    req.flash("success", "University updated successfully");
    return res.redirect("/addUniversity");
  } catch (error) {
    console.error("Update error:", error);
    req.flash("error", "Failed to update university");
    return res.redirect("/addUniversity");
  }
});

module.exports = router;
