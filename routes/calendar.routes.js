const express = require("express");
const { google } = require("googleapis");
const { isAuthenticated } = require("../middleware");
const router = express.Router();

// Create Google Calendar Event
router.get("/add",isAuthenticated,(req,res)=>{
  const token = req.session.accessToken; // Retrieve token from session
  // console.log(req)
  // console.log(token);
  // console.log("====================token",token);
    res.render("calendar/calendar.ejs");
})
router.post("/create-event-google",isAuthenticated,async (req, res) => {
  try {
    const { title, date, time, recurrence, notifyEmail, notifyPopup } = req.body;
    const oauth2Client = new google.auth.OAuth2();
    const token = req.session.accessToken; // Retrieve token from session
    // console.log(req)
    // console.log(token);
    // console.log("====================token",token);
    oauth2Client.setCredentials({ access_token: token });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    const event = {
      summary: title,
      start: { dateTime: `${date}T${time}:00`, timeZone: "Asia/Kolkata" },
      end: { dateTime: `${date}T${parseInt(time.split(":")[0]) + 1}:00:00`, timeZone: "Asia/Kolkata" },
      recurrence: recurrence ? [`RRULE:FREQ=${recurrence.toUpperCase()}`] : [],
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: notifyEmail ? 30 : 0 },
          { method: "popup", minutes: notifyPopup ? 10 : 0 },
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
    });

    res.json({ message: "Event added successfully!", event: response.data });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ message: "Failed to create event." });
  }
});

module.exports = router;
