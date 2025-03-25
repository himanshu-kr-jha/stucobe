const express = require("express");
const { allevents, userEvents, theevent } = require("../controllers/events.controller");
const router = express.Router();

router.get("/all",allevents);
router.get("/:eventId",theevent);

module.exports =router;