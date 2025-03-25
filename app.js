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
const MongoStore = require("connect-mongo"); // Store session in MongoDB
const userRouter=require("./routes/user.routes")
const societyRouter=require("./routes/society.routes");
const eventRouter =require("./routes/events.routes");
const methodOverride = require('method-override');


app.engine("ejs", ejsMate);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "/public")));
app.use(express.static(path.join(__dirname, "/public/js")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
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
// app.use((req, res, next) => {
//   console.log("Session data:", req.session);
//   console.log("Token from session:", req.session?.token);
//   next();
// });

app.use((req, res, next) => {
  res.locals.currUser = req.session.user;
  res.locals.Sadmin = req.session.societyadmin || null;
  res.locals.mainAdmin=req.session.adminuser || null;
  // console.log(res.locals.currUser)
  next();
});

const logUserDetails = (req, res, next) => {
  const user = req.session.user || 'Guest'; // Assuming user details are stored in req.user (e.g., from authentication)
  const method = req.method;
  const url = req.originalUrl;
  const timestamp = new Date().toISOString();

  console.log(`[${timestamp}] ${method} request to ${url} by ${user}`);
  
  // Pass control to the next middleware or route handler
  next();
};

// Use the middleware globally (for all routes)
app.use(logUserDetails);

app.use("/user",userRouter);
app.use("/society",societyRouter);
app.use("/event",eventRouter);

app.use((req, res, next) => {
  const originalSend = res.send;
  console.log("used---------")
  res.send = function (body) {
      if (body instanceof Error) {
          // Render the error page instead of sending raw error text
          return res.status(body.status || 500).render('error/error.ejs', { message: body.message });
      }
      return originalSend.apply(this, arguments);
  };
  next();
});

app.get("/", (req, res) => {
  res.json({message:"This is root page"});
  // res.render("home/home.ejs");
});

app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});