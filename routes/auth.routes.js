const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const router = express.Router();
const User = require("../models/user");
const session = require("express-session");
const MongoStore = require("connect-mongo");

router.use(
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
// Google OAuth login
router.get(
  "/google",
  passport.authenticate("google", { 
    scope: [
      "profile", 
      "email",
      "https://www.googleapis.com/auth/calendar.events", // Allow event creation
      "https://www.googleapis.com/auth/calendar" // Full calendar access
      ],
      accessType: "offline",
      prompt: "consent" 
    })
);

// Google OAuth callback/auth/google/callback?code=4%2F0AQSTgQFUjvsF_DUJWMjQVu3d2z9L27xhRiZ0HmixL93qaJOnXVL1Zu7T99Q3luNJ3kvc8w&scope=email+profile+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile+openid&authuser=0&hd=dtu.ac.in&prompt=none
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    if (!req.user) {
      return res.redirect("/");
    }

    // Store access token & refresh token in session
    // console.log("access toeknt -----------============-----------",req);
    req.session.accessToken = req.user.googleAccessToken;
    if(req.user.email == process.env.MAIN_ADMIN_EMAIL){
      req.session.mainAdmin = "mainAdmin";
    }
    res.redirect("/user/profile"); // Redirect to user dashboard
  }
);


// Logout route
router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.session.destroy(() => {
      res.redirect("/");
    });
  });
});

router.post("/guest-login", async (req, res) => {
  try {
      // Create a unique guest user
      const guestUser = new User({
          name: "Guest User",
          email: `guest_${Date.now()}@stucobeGuest.com`, 
          password: "guest123", // Store hashed password if required
          isGuest: true
      });

      await guestUser.save();

      // Generate token
      const token = jwt.sign({ id: guestUser._id, isGuest: true }, process.env.JWT_TOKEN, { expiresIn: "1h" });
      req.session.token=token;
      req.session.accessToken = req.user.googleAccessToken;
      console.log(req.session);
      res.redirect("/society/all");
      // res.json({ token, user: guestUser });
  } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Error logging in as guest" });
  }
});

module.exports = router;
