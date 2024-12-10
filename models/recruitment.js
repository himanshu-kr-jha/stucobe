const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const RecruitmentSchema = new Schema({
  societyId: { type: Schema.Types.ObjectId, ref: 'Society', required: true }, // Reference to Society
  title: { type: String, required: true },
  description: { type: String, required: true },
  eligibility: { type: String, required: false }, // Criteria for applying
  deadline: { type: Date, required: true },
  tags: [{ type: String }], // Array of tags (e.g., "Technical", "Leadership")
  applications: [
    {
      userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to User
      coverLetter: { type: String, required: false }, // Optional cover letter
      resumeUrl: { type: String, required: true }, // Link to the applicant's resume
      status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
      },
      appliedAt: { type: Date, default: Date.now }
    }
  ],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // User who created the recruitment
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true }); // Automatically handles `createdAt` and `updatedAt`.

const Recruitment = model('Recruitment', RecruitmentSchema);

module.exports = Recruitment;
