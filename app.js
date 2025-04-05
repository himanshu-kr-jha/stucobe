if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}

const port = process.env.PORT || 3000;
const express = require("express");
const app = express();
const ejsMate = require("ejs-mate");
const mongoose = require("mongoose");
const path = require("path");

const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("passport");

const userRouter = require("./routes/user.routes");
const societyRouter = require("./routes/society.routes");
const eventRouter = require("./routes/events.routes");
const authRouter = require("./routes/auth.routes");

require("./config/passport"); // Passport configuration file

const methodOverride = require("method-override");

app.engine("ejs", ejsMate);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "/public")));
app.use(express.static(path.join(__dirname, "/public/js")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));

// Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: "mongodb://localhost:27017/stucobe",
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

main().catch((err) => console.log(err));

async function main() {
  console.log("Making connection to MongoDB...");
  try {
    await mongoose.connect("mongodb://localhost:27017/stucobe");
    console.log("Connected to local MongoDB successfully");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
}

// Middleware for setting user info in templates
app.use((req, res, next) => {
  res.locals.currUser = req.user || null;
  res.locals.Sadmin = req.session.societyadmin || null;
  res.locals.mainAdmin = req.session.mainAdmin || null;
  console.log(res.locals);
  next();
});

const logUserDetails = (req, res, next) => {
  const user = req.user ? req.user.name : "Guest";
  const method = req.method;
  const url = req.originalUrl;
  const timestamp = new Date().toISOString();

  console.log(`[${timestamp}] ${method} request to ${url} by ${user}`);

  next();
};

app.use(logUserDetails);

app.use("/user", userRouter);
app.use("/society", societyRouter);
app.use("/event", eventRouter);
app.use("/auth", authRouter);

const calendarRouter = require("./routes/calendar.routes");
app.use("/calendar",calendarRouter);


app.get("/", (req, res) => {
  // res.render("home/home.ejs");
  res.json({ message: "This is the root page",
    req:req.user,
  session:req.session });
});



app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
