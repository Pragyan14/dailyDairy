//jshint esversion:6
require('dotenv').config();
const ejs = require("ejs");
const express = require("express");
const bodyparser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
mongoose.set("strictQuery", true);
mongoose.connect(process.env.MONGODBCONNECTION);

const app = express();
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyparser.urlencoded({ extended: true }));

app.set('trust proxy', 1)
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

var userSchema = new mongoose.Schema({ email: String,userId:String,password: String,contentArray:[{date:String,title:String,content:String}]});
userSchema.plugin(passportLocalMongoose);
const User = mongoose.model("users", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function (req, res) {
  res.render("login");
});

app.get("/signup", function (req, res) {
  res.render("signup");
});

app.get("/home", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("home");
  } else {
    res.redirect("/");
  }
});

app.get("/compose", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("compose");
  } else {
    res.redirect("/");
  }
});

app.get("/view", function (req, res) {
  if (req.isAuthenticated()) {
    var contentArray = req.user.contentArray;
    contentArray.reverse();
    res.render("view",{contentArray: contentArray});
  } else {
    res.redirect("/");
  }
});


app.get("/logout", function (req, res) {
  req.logout(function (err) {
    if (err) {
      console.log(err);
    }
    else {
        res.redirect("/");
    }
  });
});

app.post("/signup", function (req, res) {
  User.register(
    { username: req.body.username,userId:req.body.userId },
    req.body.password,
    function (err, user) {
      if (err) {
        console.log(err);
        res.redirect("/signup");
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/home");
        });
      }
    }
  );
});

app.post("/", function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });
  req.login(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/home");
      });
    }
  });
});

app.post("/compose",function(req,res){
  const submittedTitle = req.body.title;
  const submittedContent = req.body.content;

  let today = new Date();
  let options = {weekday: "short",day: "numeric",month: "short"};
  let day = today.toLocaleDateString("en-US", options)

  User.findOneAndUpdate({_id:req.user._id},{$push: {contentArray:{date:day,title:submittedTitle,content:submittedContent}}},function(err){
    if(err){
      console.log(err);
    } else {
      res.redirect("/view");
    }
  })
});

app.get("/view/:recordId",function(req,res){
  if (req.isAuthenticated()) {
    requestedId = req.params.recordId;
    var foundRecord = req.user.contentArray.find(contentArray => contentArray._id == requestedId);
    res.render("record",{clickedRecord: foundRecord});
  } else {
    res.redirect("/");
  }
});

app.listen(process.env.PORT || 5500, function () {
  console.log("Server is running on port 5500");
});
