if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}

const port = process.env.PORT;
const jwt_secret_token = process.env.JWT_SECRET_TOKEN;
const express = require("express");
const app = express();
const ejsMate = require("ejs-mate");
const mongoose = require("mongoose");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken"); // Use JWT for authentication
const session = require("express-session");
const MongoStore = require("connect-mongo"); // Store session in MongoDB
const { isMainAdmin, isSocietyAdmin,isAuthenticated, isLogged} = require("./middleware");
const User = require("./models/user"); // Path to your User model
const Society = require("./models/society"); // Path to the Society model

app.engine("ejs", ejsMate);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "/public")));
app.use(express.static(path.join(__dirname, "/public/js")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.engine("ejs", ejsMate);

// Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET, // Secure session secret
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: "mongodb://localhost:27017/stucobe", // MongoDB URL for session storage
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 1 day session expiration
    },
  })
);

main().catch((err) => console.log(err));

async function main() {
  console.log("making connection");
  try {
    await mongoose.connect("mongodb://localhost:27017/stucobe");
    console.log("Connected to local MongoDB successfully");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
}

// Register route
// app.get("/register", (req, res) => {
//   res.render("user/register.ejs");
// });
app.use((req, res, next) => {
  console.log("Session data:", req.session);
  console.log("Token from session:", req.session?.token);
  next();
});
app.use((req,res,next)=>{
  res.locals.currUser=req.session.user;
  console.log(res.locals.currUser)
  next();
});

app.get("/register", (req, res) => {
  res.render("user/register.ejs");
});
app.post("/register", async (req, res) => {
  console.log(req.body);
  const { name, email, password } = req.body;

  // Validate input
  if (!name || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with only required fields
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: "User registered successfully", userId: user._id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login route
app.get("/login", (req, res) => {
  res.render("user/login.ejs");
});

app.post("/login",async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Store user info in session
    req.session.user = user;
    req.session.token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET_TOKEN, { expiresIn: '1h' });

    console.log(req.session);

    // res.status(200).json({ message: "Login successful" });
    res.redirect("/");
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Logout route
app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Failed to log out" });
    }
    res.status(200).json({ message: "Logout successful" });
  });
});

// Create society route (Protected by Main Admin)
app.get("/create-society",isAuthenticated, isMainAdmin, async (req, res) => {
  console.log("inside the get api of create society");
});
app.post("/create-society",isAuthenticated, isMainAdmin, async (req, res) => {
  const { name, description, societyAdminEmail } = req.body;

  if (!name || !description || !societyAdminEmail) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const mainAdmin = req.user;

    const societyAdmin = await User.findOne({ email: societyAdminEmail });
    if (!societyAdmin) {
      return res.status(400).json({ error: "Society Admin not found with the provided email." });
    }

    const newSociety = new Society({
      name,
      description,
      mainAdmin: mainAdmin._id, // Single ObjectId for the main admin
      societyAdmin: [societyAdmin._id]
    });
    

    await newSociety.save();

    res.status(201).json({ message: "Society created successfully!", societyId: newSociety._id });
  } catch (err) {
    console.error(err); // Log error for debugging
    res.status(500).json({ error: "Error creating society." });
  }
});

app.get("/society/all",async(req,res)=>{
  try {
    // Fetch all societies, populating references like mainAdmin and societyAdmin
    const societies = await Society.find();

    if (!societies) {
      return res.status(404).json({ message: "No societies found" });
    }
    res.send(societies);
    // Return the societies data
    // return res.json(societies);
  } catch (err) {
    console.error("Error fetching societies:", err);
    return res.status(500).json({ message: "Server error" });
  }
})

app.get("/", (req, res) => {
  res.render("home/home.ejs");
});

app.listen(port, () => {
  console.log(`Server started at port ${port}`);
});
