const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const UserSchema = new Schema({
  name: { type: String, required: true }, // Required during registration
  email: { type: String, required: true, unique: true }, // Required during registration
  password: { type: String, required: true }, // Required during registration
  role: {
    type: String,
    enum: ['societyAdmin', 'user'],
    default: 'student'
  },
  profile: { // Optional fields
    contact: { type: String, default: null },
    department: { type: String, default: null },
    year: { type: String, default: null },
    resumeUrl: { type: String, default: null },
    linkedinUrl: { type: String, default: null },
    portfolioUrl: { type: String, default: null }
  },
  recruitmentApplications: [ // Optional
    {
      recruitmentId: { type: Schema.Types.ObjectId, ref: 'Recruitment' },
      societyId: { type: Schema.Types.ObjectId, ref: 'Society' },
      appliedAt: { type: Date, default: Date.now },
      status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
      },
      coverLetter: { type: String, default: null }
    }
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const User = model('User', UserSchema);
module.exports = User;
