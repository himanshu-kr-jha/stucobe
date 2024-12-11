const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const SocietySchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  mainAdmin: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the main admin
  societyAdmin: [
    { 
      type: Schema.Types.ObjectId, ref: 'User', required: true 
    }
  ], // Reference to the society admin
  facultyAdvisor: {
    name: { type: String },
    email: { type: String },
    phone: { type: String }
  },
  council: [
    { 
      type: Schema.Types.ObjectId, ref: 'User', required: true,
      position: { type: String },
    }
  ],
  members: [
    {
      name: { type: String },
      role: { type: String },
      email: { type: String }
    }
  ],
  achievements: [
    {
      title: { type: String },
      description: { type: String },
      date: { type: Date }
    }
  ],
  pastEvents: [
    {
      eventId: { type: Schema.Types.ObjectId, ref: 'Event' },
      title: { type: String },
      date: { type: Date }
    }
  ],
  images: [{ type: String }], // Array of image URLs or paths
  announcements: [
    {
      title: { type: String },
      content: { type: String },
      date: { type: Date, default:Date.now()}
    }
  ],
  recruitments: [
    {
      recruitmentId: { type: Schema.Types.ObjectId, ref: 'Recruitment' },
      title: { type: String },
      deadline: { type: Date }
    }
  ],
  followers:[
    { 
      type: Schema.Types.ObjectId, ref: 'User', required: true 
    }
  ]
});

// Method to check if a user is the admin of the society

const Society = model('Society', SocietySchema);

module.exports = Society;
