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
// mongoose.connect("mongodb://0.0.0.0:27017/keeperDB",{useNewUrlParser: true});


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

var userSchema = new mongoose.Schema({ email: String,password: String,taskArray:[{task:String,taskStatus:{type:String,default:"pending"}}]});
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

app.get("/taskList", function (req, res) {
  if (req.isAuthenticated()) {
    var taskArray = req.user.taskArray;
    let today = new Date();
  let options = {weekday: "short",day: "numeric",month: "short"};
  let day = today.toLocaleDateString("en-US", options)
    res.render("taskList",{taskArray: taskArray, listTitle:day});
  } else {
    res.redirect("/");
  }
});

app.post("/signup", function (req, res) {
  User.register(
    { username: req.body.username },
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

app.post("/addTask",function(req,res){
  const task = req.body.newTask
  User.findOneAndUpdate({_id:req.user._id},{$push: {taskArray:{task:task}}},function(err){
    if(err){
      console.log(err);
    } else {
      res.redirect("/taskList");
    }
  })
})

app.post("/delete",function(req,res){
  const itemId = req.body.itemId;
  // console.log(itemId);
  // console.log(req.body.checkBox);
  // if(req.body.checkBox){
  //   User.findOneAndUpdate(
  //     { 
  //       _id: req.user._id,
  //       "taskArray._id": itemId 
  //     },
  //     {
  //       $set: {
  //         "taskArray.$.taskStatus": "completed"
  //       }
  //     },
  //     { new: true }, 
  //     (err, updatedUser) => {
  //       if (err) {
  //         console.error('Error updating task status:', err);
  //       } else {
  //         console.log('Task status updated successfully:');
  //       }
  //     }
  //   );
  // }
  User.findOneAndUpdate({_id:req.user._id},{$pull: {taskArray: {_id: itemId }}},function(err){
    if(err){
      console.log(err);
    } else {
      res.redirect("/taskList");
    }
  })
})


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

app.listen(process.env.PORT || 5500, function () {
  console.log("Server is running on port 5500");
});
