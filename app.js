#!/usr/bin/env node
// require("dotenv").config();

const createError = require("http-errors");
const MongoStore = require("connect-mongo");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const methodOverride = require("method-override");
const flash = require("connect-flash");
const passport = require("passport");
const expressSession = require("express-session");
const mongoose = require("mongoose");
const http = require("http");
const indexRouter = require("./routes/index");
const usersRouter = require("./models/Usermodel"); // This is likely NOT a router, rename it if needed

const app = express();
const MongoURI = "mongodb+srv://yash:yash@cluster0.8f4wpmt.mongodb.net";
/* ---------------------- DB Connection ---------------------- */
mongoose
  .connect(MongoURI)
  // .connect("mongodb://localhost/maa")
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

/* ---------------------- View Engine ---------------------- */
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

/* ---------------------- Middleware ---------------------- */
app.use( 
  expressSession({
    secret: process.env.SESSION_SECRET || "saenrsn",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: MongoURI,
      collectionName: "sessions",
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(usersRouter.serializeUser());
passport.deserializeUser(usersRouter.deserializeUser());

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(methodOverride("_method"));
app.use(flash());

/* ---------------------- Routes ---------------------- */
app.use("/", indexRouter);
app.use("/users", usersRouter); // If this is not a router, fix it

/* ---------------------- Error Handling ---------------------- */
// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// general error handler
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  res.render("error");
});

/* ---------------------- Server Startup ---------------------- */
const port = normalizePort(process.env.PORT || "1080");
// const port = normalizePort(process.env.PORT || "3000");
app.set("port", port);
const server = http.createServer(app);

server.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
server.on("error", onError);

/* ---------------------- Helper Functions ---------------------- */
function normalizePort(val) {
  const port = parseInt(val, 10);
  if (isNaN(port)) return val;
  if (port >= 0) return port;
  return false;
}

function onError(error) {
  if (error.syscall !== "listen") throw error;
  const bind = typeof port === "string" ? "Pipe " + port : "Port " + port;
  switch (error.code) {
    case "EACCES":
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
    case "EADDRINUSE":
      console.error(`${bind} is already in use`);
      process.exit(1);
    default:
      throw error;
  }
}
