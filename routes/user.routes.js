const express = require("express");
const router = express.Router();
const {register, login, logout, profile, updateProfile, userSocietyFollow, userEvents, addEvent}=require("../controllers/user.controller");
const { isAuthenticated } = require("../middleware");
const wrapAsync = require("../utils/wrapAsync.js");
const User = require("../models/user.js");
const jwt = require('jsonwebtoken');

// router.post("/register",wrapAsync(register));
// router.post("/login",wrapAsync(login)
// );
// router.post("/logout",wrapAsync(logout));
router.get("/profile",isAuthenticated,wrapAsync(profile));
router.post("/update/profile",isAuthenticated,wrapAsync(updateProfile));
router.post("/:id/follow",isAuthenticated,wrapAsync(userSocietyFollow));
router.post("/add/event/:societyId/:eventid",addEvent);

// router.get("/register");
router.get("/login",(req,res)=>{
    res.render("user/login.ejs");
});
router.get("/update/profile",isAuthenticated,async(req,res)=>{
    const token =req.session.passport.user.token;
    const decoded = jwt.verify(token, process.env.JWT_TOKEN);
    const user = await User.findById(decoded._id);
    res.render("user/update.ejs",{user:user});
})

router.get("/myevents",userEvents);

module.exports = router;