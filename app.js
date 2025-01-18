const express = require("express");
const { body, validationResult } = require("express-validator");
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const app = express();
const PORT = 8000;
const MONGOURL = "mongodb://127.0.0.1:27017/mydatabase";
const SECRET_KEY = "b4e8ba64668c1b69b80d0c62b99047845654dc72a63f0f213dd071dcc410fbb5802c80c587f81c2ca85df2d2f7ff23292cc04a89e39d828241db5ac62ec27760";

// Middleware setup
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());
app.set("view engine", "ejs");

app.use(session({
    secret: "yourSecretKey",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

// Database Connection
mongoose.connect(MONGOURL).then(() => {
    console.log("Connected to Database...");
    app.listen(PORT, () => {
      console.log(`Connected to PORT: ${PORT}`);
    });
  }).catch((error) => console.error(`Database connection error: ${error}`));

// Validators
const validator1 = [
  body("username").notEmpty().withMessage("Please enter the username..."),
  body("password").notEmpty().withMessage("Enter the Password for the username entered..."),
];

const validator2 = [
  body("title").notEmpty().withMessage("Please enter the Title..."),
  body("Notes").optional().isString().withMessage("Notes must be a string if provided."),
];

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.redirect("/login");
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.redirect("/login");
    }
    req.user = user;
    next();
  });
};

// Models
const Usermodel = mongoose.model("usercollection",mongoose.Schema({
    username: String,
    password: String,
  })
);

const Notesmodel = mongoose.model("notescollection",mongoose.Schema({
    username: String,
    title: [String],
    notes: [String],
  })
);

// Routes
app.get("/home", (req, res) => {
  res.render("home");
});

app.post("/home", (req, res) => {
  res.redirect("/login");
});

app.get("/login", (req, res) => {
  if (req.session.username) {
    return res.redirect("/account");
  }
  res.render("login");
});

app.post("/login", validator1, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render("login", { errorMessage: "Check Details Please" });
  }

  try {
    const { username, password } = req.body;
    const existinguser = await Usermodel.findOne({ username });

    if (!existinguser) {
      return res.render("login", { errorMessage: "Username does not exist." });
    }

    const isPasswordValid = await bcrypt.compare(password, existinguser.password);

    if (!isPasswordValid) {
      return res.render("login", { errorMessage: "Invalid username or password." });
    }

    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: "1h" });
    res.cookie("token", token, { httpOnly: true });

    req.session.username = username;
    res.redirect("/account");
  } catch (error) {
    return res.render("login", { errorMessage: `Try again later... \n ${error}` });
  }
});

app.get("/regester", (req, res) => {
  res.render("regester");
});

app.post("/regester", validator1, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render("regester", { errorMessage: "Check the details again..." });
  }

  try {
    const { username, password } = req.body;

    const existinguser = await Usermodel.findOne({ username });
    if (existinguser) {
      return res.render("regester", { errorMessage: "Username already taken. Please choose a different one." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newuser = new Usermodel({ username, password: hashedPassword });
    await newuser.save();

    const newNotes = new Notesmodel({
      username: username,
      title: [],
      notes: [],
    });
    await newNotes.save();

    res.redirect("/login");
  } catch (error) {
    return res.status(500).send(`Data is not stored in the Database... try again later... \n ${error}`);
  }
});

app.get("/account", authenticateToken, async (req, res) => {
  const username = req.session.username;

  const notespresent = await Notesmodel.findOne({ username });
  const titles = notespresent ? notespresent.title : [];
  const notes = notespresent ? notespresent.notes : [];

  res.render("accountpage", { username, titles, notes });
});

app.post("/account", authenticateToken, (req, res) => {
  res.redirect("/create");
});

app.get("/create", authenticateToken, (req, res) => {
  res.render("notesform");
});

app.post("/create", validator2, authenticateToken, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send("Check the details again...");
  }

  try {
    const username = req.session.username;
    const { title, notes } = req.body;

    const notesdetails = await Notesmodel.findOne({ username });

    if (notesdetails) {
      notesdetails.title.push(title);
      notesdetails.notes.push(notes || "");
      await notesdetails.save();
    } else {
      await Notesmodel.create({
        username,
        title: [title],
        notes: [notes || ""],
      });
    }
    res.redirect("/account");
  } catch (error) {
    console.error(error);
    res.status(500).send(`Data is not stored in the Database... try again later... \n ${error}`);
  }
});

app.get("/delete/:notetitle", authenticateToken, async (req, res) => {
  const username = req.session.username;
  const notesdetails = await Notesmodel.findOne({ username });

  if (notesdetails) {
    const notestitle = decodeURIComponent(req.params.notetitle);
    const index = notesdetails.title.indexOf(notestitle);

    if (index > -1) {
      notesdetails.title.splice(index, 1);
      notesdetails.notes.splice(index, 1);
      await notesdetails.save();
    }
  }
  res.redirect("/account");
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.clearCookie("token");
  res.redirect("/home");
});