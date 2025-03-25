const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const EventSchema = new Schema({
  societyId: { type: Schema.Types.ObjectId, ref: 'Society', required: true }, // Reference to Society
  title: { type: String, required: true },
  date: { type: Date, required: true, default: Date.now },
  time: { type: String, required: true }, // Format: "HH:MM AM/PM"
  location: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true }, // Example categories: 'Technical', 'Cultural', etc.
//   images: [{ type: String }] // Array of image URLs or paths
});

const Event = model('Event', EventSchema);

module.exports = Event;