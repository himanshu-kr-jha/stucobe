const express = require("express");
const { allevents, userEvents, theevent, createevent } = require("../controllers/events.controller");
const router = express.Router();

router.get("/all",allevents);
router.get("/:eventId",theevent);

router.post("/:id/create-event",createevent);

module.exports =router;