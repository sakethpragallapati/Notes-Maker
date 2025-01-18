const express = require("express");
const {body,validationResult} = require("express-validator");
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 8000;
const MONGOURL = "mongodb://127.0.0.1:27017/mydatabase";
const SECRET_KEY = "b4e8ba64668c1b69b80d0c62b99047845654dc72a63f0f213dd071dcc410fbb5802c80c587f81c2ca85df2d2f7ff23292cc04a89e39d828241db5ac62ec27760";

app.use(express.urlencoded({extended : true}));
app.use(express.static(path.join(__dirname,"public")));
app.set("view engine","ejs");

app.use(session({
    secret: "yourSecretKey", 
    resave: false, 
    saveUninitialized: true, 
    cookie: { secure: false }
}));

mongoose.connect(MONGOURL).then(()=>{
    console.log("Connected to Database...");
    app.listen(PORT,()=>{
        console.log(`Connected to PORT: ${PORT}`);
    })
}).catch((error)=> `We encountered an error \n ${error}`);

const validator1 = [
    body("username").notEmpty().withMessage("Please enter the unsername..."),
    body("password").notEmpty().withMessage("Enter the Password for the username entered...")
];

const validator2 = [
    body("title").notEmpty().withMessage("Please enter the Title..."),
    body("Notes").optional().isString().withMessage("Notes must be a string if provided.")
];

const authenticateToken = (req, res, next) => {
    const token = req.cookies.token; // Extract token from cookies

    if (!token) {
        return res.redirect("/login");
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.redirect("/login");
        }

        req.user = user; // Attach the decoded user data to the request object
        next();
    });
};



const Usermodel = mongoose.model("usercollection",mongoose.Schema({
    username: String,
    password: String
}));

const Notesmodel = mongoose.model("notescollection",mongoose.Schema({
    username: String,
    title: [String],
    notes: [String]
}));

app.get("/home",(req,res)=>{
    res.render("home");
});

app.post("/home",(req,res)=>{
    res.redirect("/login");
});

app.get("/login",(req,res)=>{
    if(req.session.username){
        return res.redirect("/account");
    }
    res.render("login");
});

app.post("/login",validator1,async(req,res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.render("login", {errorMessage: "Check Details Please"});
    }else{
        try{
            const {username,password} = req.body;
            const existinguser = await Usermodel.findOne({username});
            if (!existinguser) {
                return res.render("login",{errorMessage: "Username does not exist."});
            }
            bcrypt.compare(password, existinguser.password, function(err, result) {
                if(!result){
                    return res.render("login",{errorMessage: "Invalid username or password."});
                }

                const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: "1h" });
                res.cookie("token", token, { httpOnly: true });

                req.session.username = username;
                return res.redirect("/account");
            });
        }catch(error){
            return res.render("login",{errorMessage: `Try again later... \n ${error}`});
        }
    }
});

app.get("/regester",(req,res)=>{
    res.render("regester");
});

app.post("/regester", validator1, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render("regester", { errorMessage: "Check the details again..." });
    } else {
        try {
            const { username, password } = req.body;

            const existinguser = await Usermodel.findOne({ username });
            if (existinguser) {
                return res.render("regester", { errorMessage: "Username already taken. Please choose a different one." });
            }
            bcrypt.genSalt(10, function(err, salt) {
                bcrypt.hash(password, salt, async function(err, hash) {
                    const newuser = new Usermodel({ username, password: hash });
                    await newuser.save();
                });
            });

            const newNotes = new Notesmodel({
                username: username,  
                title: [],           
                notes: []           
            });
            await newNotes.save();
            return res.redirect("/login");
        } catch (error) {
            return res.status(500).send(`Data is not stored in the Database... try again later... \n ${error}`);
        }
    }
});

app.get("/account",authenticateToken, async (req,res)=>{
    if(!req.session.username){
        return res.redirect("/login");
    }
    const username = req.session.username;
    const notespresent = await Notesmodel.findOne({username});
    if(!notespresent){
        return res.render("accountpage", {username, titles: [], notes : []});
    }
    return res.render("accountpage", {username, titles: notespresent.title, notes: notespresent.notes });
});

app.post("/account",authenticateToken,(req,res)=>{
    if(!req.session.username){
        return res.redirect("/login");
    }
    return res.redirect("/create");
});

app.get("/create",authenticateToken,(req,res)=>{
    if(!req.session.username){
        return res.redirect("/login");
    }
    res.render("notesform");
})

app.post("/create", validator2, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send("Check the details again...");
    }
    if (!req.session.username) {
        return res.redirect("/login");
    }
    try {
        const username = req.session.username;
        let { title, notes } = req.body;
        if (!notes) notes = "";

        const notesdetails = await Notesmodel.findOne({ username });

        if (notesdetails) {
            notesdetails.title.push(title);
            notesdetails.notes.push(notes);
            await notesdetails.save();
        } else {
            await Notesmodel.create({
                username,
                title: [title],
                notes: [notes],
            });
        }
        return res.redirect("/account");
    } catch (error) {
        console.log(error);
        return res.status(500).send(`Data is not stored in the Database... try again later... \n ${error}`);
    }
});

app.get("/delete/:notetitle", async (req,res)=>{
    const username = req.session.username;
    const notesdetails = await Notesmodel.findOne({username});
    const notestitle = decodeURIComponent(req.params.notetitle);
    const index = notesdetails.title.indexOf(notestitle)
    notesdetails.title.splice(index, 1);
    notesdetails.notes.splice(index, 1);
    await notesdetails.save();
    return res.redirect("/account");
});

app.get("/logout",(req,res)=>{
    req.session.username = undefined;
    return res.redirect("/home")
})