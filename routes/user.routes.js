const express = require("express");
const router = express.Router();
const {register, login, logout, profile, updateProfile, userSocietyFollow, userEvents, addEvent}=require("../controllers/user.controller");
const { isAuthenticated } = require("../middleware");
const wrapAsync = require("../utils/wrapAsync.js");


router.post("/register",wrapAsync(register));
router.post("/login",wrapAsync(login)
);
router.post("/logout",wrapAsync(logout));
router.get("/profile",isAuthenticated,wrapAsync(profile));
router.post("/update/profile",isAuthenticated,wrapAsync(updateProfile));
router.post("/:id/follow",isAuthenticated,wrapAsync(userSocietyFollow));
router.post("/add/event/:societyId/:eventid",addEvent);

// router.get("/register");
// router.get("/login");
// router.get("/update/profile",isAuthenticated)

router.get("/myevents",userEvents);

module.exports = router;