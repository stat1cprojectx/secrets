//jshint esversion:6
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');


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
    password: String,
    googleId: String,
    secret: String
});

// init passport local mongoose
userSchema.plugin(passportLocalMongoose);

// plugin for mongoose findOrCreate
userSchema.plugin(findOrCreate);

// model using userSchema
const User = new mongoose.model("User",userSchema);

// passport local mongoose config
passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
});
  
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
});


// google passport strategy use
passport.use(new GoogleStrategy(
    {
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/secrets"
    },
    function(accessToken, refreshToken, profile, cb)
    {
    // console.log(profile); //logging the profile sent by google
    User.findOrCreate({ googleId: profile.id }, (err, user)=>{
            return cb(err, user);
        });
    }
));

///////////////////////////////////////////get requests

app.get("/",(req,res)=>{
    res.render("home");
});

// google authentication using passport and oauth2.0
app.get('/auth/google', passport.authenticate('google', {
    scope: ['https://www.googleapis.com/auth/plus.login']
}));

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/secrets');
  });

// login get req
app.get("/login",(req,res)=>{
    res.render("login");
});

app.get("/register",(req,res)=>{
    res.render("register");
});

app.get("/secrets",(req,res)=>{
    // if (req.isAuthenticated()) {
    //     res.render('secrets');
    // } else {
    //     res.redirect("/login");
    // }
    User.find({ "secret": {$ne:null} }, (err,foundUsers)=>{
        if (err) {
            console.log(err);
        } else {
            if (foundUsers) {
                res.render('secrets', {usersWithSecrets: foundUsers});
            }
        }
    });
});

app.get("/logout", (req,res)=>{
    req.logout();
    res.redirect("/");
});

app.get('/submit', (req,res)=>{
    if (req.isAuthenticated()) {
        res.render('submit');
    } else {
        res.redirect("/login");
    }
});


///////////////////////////////////////// post requests

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

app.post('/submit',(req,res)=>{
    const submittedSecret = req.body.secret;
    // console.log(req.user.id); //user session current id log
    User.findById(req.user.id, (err,foundUser)=>{
        if (err) {
            console.log(err);
        } else {
            if (foundUser){
                foundUser.secret = submittedSecret;
                foundUser.save(()=>{
                    res.redirect('/secrets');
                });
            }
        }
    });
});

// app listener
app.listen(3000, () => {
  console.log(`Server started on port 3000`);
});