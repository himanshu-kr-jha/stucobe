# First Draft

## Schema
- ## Society Collection
```bash
{
  "_id": ObjectId,    
  "name": String,     
  "description": String,
  "facultyAdvisor": 
  {   
    "name": String,
    "email": String,
    "phone": String
  },
  "council": [          
    {
      "name": String,
      "position": String,
      "email": String
    }
  ],
  "members": [          
    {
      "name": String,
      "role": String,
      "email": String
    }
  ],
  "achievements": [     
    {
      "title": String,
      "description": String,
      "date": Date
    }
  ],
  "pastEvents": [       
    {
      "eventId": ObjectId,     
      "title": String,
      "date": Date
    }
  ],
  "images": [String],          
  "announcements": [           
    {
      "title": String,
      "content": String,
      "date": Date
    }
  ],
  "recruitments": [            
    {
      "recruitmentId": ObjectId, 
      "title": String,
      "deadline": Date
    }
  ]
}
```
- ## Event Collection
```bash
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
- ## User Schema
```bash
{
  "_id": ObjectId,              
  "name": String,               
  "email": String,              
  "password": String,           
  "role": 
  {                     
    "type": String,              
    "enum": [
        "student", "societyAdmin" 
        ],
    "default": "student"
  },
  "profile": 
  {                   
    "contact": String,           
    "department": String,        
    "year": String,              
    "resumeUrl": String,         
    "linkedinUrl": String,       
    "portfolioUrl": String       
  },
  "recruitmentApplications": [   
    {
      "recruitmentId": ObjectId, // Reference to the Recruitment collection
      "societyId": ObjectId,     // Reference to the Society collection
      "appliedAt": Date,         // Timestamp of the application
      "status": 
      {    
        "type": String,
        "enum": [
            "Pending", "Approved", "Rejected"
            ],
        "default": "Pending"
      },
      "coverLetter": String    
    }
  ],
  "createdAt": Date,           
  "updatedAt": Date            
}
```

- ## Recruitment Schema
```bash
{
  "_id": ObjectId,             
  "societyId": ObjectId,       
  "title": String,             
  "description": String,       
  "eligibility": String,       
  "deadline": Date,            
  "tags": [String],            
  "applications": 
  [            
    {
      "userId": ObjectId,      
      "coverLetter": String,   
      "resumeUrl": String,     
      "status": {            
        "type": String,
        "enum": ["Pending", "Approved", "Rejected"],
        "default": "Pending"
      },
      "appliedAt": Date      
    }
  ],
  "createdBy": ObjectId, 
  "createdAt": Date,     
  "updatedAt": Date      
}
```


