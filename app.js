//jshint esversion:6
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require("mongoose");
const md5 = require('md5');

const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true 
}));

mongoose.connect('mongodb://localhost:27017/userDB', {
    useNewUrlParser: true, 
    useUnifiedTopology: true
});

// schema
const userSchema = new mongoose.Schema({
    email: String,
    password: String 
});

// model using userSchema
const User = new mongoose.model("User",userSchema);

app.get("/",(req,res)=>{
    res.render("home");
});

app.get("/login",(req,res)=>{
    res.render("login");
});

app.get("/register",(req,res)=>{
    res.render("register");
});

app.post("/register",(req,res)=>{
    const newUser = new User({
        email: req.body.username,
        password: md5(req.body.password)
    });
    newUser.save((err)=>{
        if(err){
            console.log(err);
            res.send(err);
        }else{
            res.render("secrets");
        }
    });
});

app.post("/login",(req,res)=>{
    const username = req.body.username;
    const password = md5(req.body.password);

    User.findOne({email:username},(err,foundUser)=>{
        if(err){
            console.log(err);
            res.redirect("/login");
        }else{
            if (foundUser) {
                if(foundUser.password==password){
                    res.render("secrets");
                }
            } else {
                res.redirect("/login");
            }
        }
    });
});


// app listener
app.listen(3000, () => {
  console.log(`Server started on port 3000`);
});