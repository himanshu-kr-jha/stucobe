const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const calendareventSchema = new mongoose.Schema({
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  eventId:{ type: Schema.Types.ObjectId, ref: 'Event', required: true},
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true } // Reference to User
});

module.exports = mongoose.model('CalendarEvents', calendareventSchema);