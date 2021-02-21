//jshint esversion:6
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true 
}));

// session init
app.use(session({
    secret: "thisisthesecretstringused.",
    resave: false,
    saveUninitialized: false
}));

// passport initialize and use using session
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://localhost:27017/userDB', {
    useNewUrlParser: true, 
    useUnifiedTopology: true
});
mongoose.set('useCreateIndex', true); //for DeprecationWarning: collection.ensureIndex is deprecated. Use createIndexes instead.

// schema
const userSchema = new mongoose.Schema({
    email: String,
    password: String 
});

// init passport local mongoose
userSchema.plugin(passportLocalMongoose);

// model using userSchema
const User = new mongoose.model("User",userSchema);

// passport local mongoose config
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//get requests

app.get("/",(req,res)=>{
    res.render("home");
});

app.get("/login",(req,res)=>{
    res.render("login");
});

app.get("/register",(req,res)=>{
    res.render("register");
});

app.get("/secrets",(req,res)=>{
    if (req.isAuthenticated()) {
        res.render('secrets');
    } else {
        res.redirect("/login");
    }
});

app.get("/logout", (req,res)=>{
    req.logout();
    res.redirect("/");
});

// post requests

app.post("/register",(req,res)=>{
    User.register({username: req.body.username}, req.body.password, (err, user)=>{
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req,res,()=>{
                res.redirect("/secrets");
            })
        }
    })
});

app.post("/login",(req,res)=>{
    const user = new User ({
        username: req.body.username,
        password: req.body.password
    });

    // passport to login
    req.login(user, (err)=>{
        if (err) {
            console.log(err);
            res.render('/login');
        } else {
            passport.authenticate("local")(req,res,()=>{
                res.redirect("/secrets");
            });
        }
    });

});




// app listener
app.listen(3000, () => {
  console.log(`Server started on port 3000`);
});