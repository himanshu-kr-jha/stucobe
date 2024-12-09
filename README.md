# First Draft

### Schema
- Society Collection
```json
{
  "_id": ObjectId,             // Unique identifier for the society
  "name": String,              // Name of the society
  "description": String,       // Brief about the society
  "facultyAdvisor": {          // Faculty advisor details
    "name": String,
    "email": String,
    "phone": String
  },
  "council": [                 // List of council members
    {
      "name": String,
      "position": String,
      "email": String
    }
  ],
  "members": [                 // List of members
    {
      "name": String,
      "role": String,
      "email": String
    }
  ],
  "achievements": [            // Array of achievements
    {
      "title": String,
      "description": String,
      "date": Date
    }
  ],
  "pastEvents": [              // List of past events
    {
      "eventId": ObjectId,     // Reference to an Event
      "title": String,
      "date": Date
    }
  ],
  "images": [String],          // URLs of society-related images
  "announcements": [           // List of announcements
    {
      "title": String,
      "content": String,
      "date": Date
    }
  ],
  "recruitments": [            // List of current recruitments
    {
      "recruitmentId": ObjectId, // Reference to a Recruitment
      "title": String,
      "deadline": Date
    }
  ]
}
```
- Event Collection
```json
{
  "_id": ObjectId,             // Unique identifier for the event
  "societyId": ObjectId,       // Reference to the Society collection
  "title": String,             // Name of the event
  "date": Date,                // Date of the event
  "time": String,              // Time of the event
  "location": String,          // Venue of the event
  "description": String,       // Details of the event
  "category": String,          // Category (e.g., technical, cultural)
  "images": [String]           // URLs of event-related images
}
```
- User Schema
```json
{
  "_id": ObjectId,               // Unique identifier for the user
  "name": String,                // Full name of the user
  "email": String,               // Email address (unique, for login/communication)
  "password": String,            // Encrypted password for authentication
  "role": {                      // Role of the user (e.g., student, society admin)
    "type": String,              
    "enum": ["student", "societyAdmin"],
    "default": "student"
  },
  "profile": {                   // Additional user details
    "contact": String,           // Contact number
    "department": String,        // Department or field of study
    "year": String,              // Year of study (e.g., First Year, Final Year)
    "resumeUrl": String,         // URL to the user's resume
    "linkedinUrl": String,       // LinkedIn profile URL (optional)
    "portfolioUrl": String       // Personal portfolio or project website (optional)
  },
  "recruitmentApplications": [   // List of recruitments the user has applied to
    {
      "recruitmentId": ObjectId, // Reference to the Recruitment collection
      "societyId": ObjectId,     // Reference to the Society collection
      "appliedAt": Date,         // Timestamp of the application
      "status": {                // Status of the application
        "type": String,
        "enum": ["Pending", "Approved", "Rejected"],
        "default": "Pending"
      },
      "coverLetter": String      // Cover letter submitted during application
    }
  ],
  "createdAt": Date,             // Account creation timestamp
  "updatedAt": Date              // Last updated timestamp
}
```
- Recruitment Schema
```json
{
  "_id": ObjectId,             // Unique identifier for the recruitment
  "societyId": ObjectId,       // Reference to the Society collection
  "title": String,             // Title of the recruitment opening (e.g., "Web Developer Intern")
  "description": String,       // Detailed description of the recruitment role or project
  "eligibility": String,       // Eligibility criteria for applicants (e.g., "Final Year Students")
  "deadline": Date,            // Deadline for submitting applications
  "tags": [String],            // Tags for easier filtering (e.g., ["Technical", "Internship"])
  "applications": [            // List of applications for this recruitment
    {
      "userId": ObjectId,      // Reference to the User collection (applicant)
      "coverLetter": String,   // Cover letter submitted by the applicant
      "resumeUrl": String,     // URL to the applicant's resume
      "status": {              // Status of the application
        "type": String,
        "enum": ["Pending", "Approved", "Rejected"],
        "default": "Pending"
      },
      "appliedAt": Date        // Date and time when the application was submitted
    }
  ],
  "createdBy": ObjectId,       // Reference to the User collection (Society Admin who created the recruitment)
  "createdAt": Date,           // Timestamp when the recruitment was created
  "updatedAt": Date            // Timestamp when the recruitment was last updated
}

```


