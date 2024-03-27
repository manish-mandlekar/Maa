var express = require('express');
var router = express.Router();
const mongoose = require('mongoose')
const userModel = require('../models/Usermodel')
const passport = require("passport");
const localStrategy = require('passport-local');

passport.use(new localStrategy(userModel.authenticate()));
mongoose.connect('mongodb://0.0.0.0/mark').then(()=>{}).catch((err)=>{err})
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
router.get('/signup', function(req, res, next) {
  res.render('signup');
});
router.post('/register', function (req, res) {
  var newUser = new userModel({
    username: req.body.username,
    email: req.body.email
  })
  userModel.register(newUser, req.body.password)
  .then(function (u) {
    passport.authenticate('local')(req, res, function () {
      res.redirect('/dashboard');
    })
  })
});
router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "dashboard",
    failureRedirect: "/",
  }),
  function (req, res, next) {}
);
router.get('/logout', function (req, res, next) {
  req.logOut();
  res.redirect('/');
});
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  else {
    res.redirect('/');
  }
}

router.get('/dashboard',(req,res,next)=>{
  res.render('dashboard')
})

router.get('/course',(req,res,next)=>{
  res.render('course')
})

router.get('/inquiry',(req,res,next)=>{
  res.render('inquiry')
})
router.get('/allenquiry',(req,res,next)=>{
  res.render('allenquiry')
})
router.get('/rejected',(req,res,next)=>{
  res.render('rejected')
})
router.get('/ifs',(req,res,next)=>{
  res.render('ifs')
})
router.get('/addFeeStructure',(req,res,next)=>{
  res.render('addFeeStructure')
})
router.get('/student',(req,res,next)=>{
  res.render('student')
})
router.get('/addStaff',(req,res,next)=>{
  res.render('addStaff')
})
module.exports = router;
