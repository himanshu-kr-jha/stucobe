if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}

const port = process.env.PORT;
const jwt_secret_token = process.env.JWT_SECRET_TOKEN;
const express = require("express");
const app = express();
const ejsMate = require("ejs-mate");
const mongoose = require("mongoose");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken"); // Use JWT for authentication
const session = require("express-session");
const MongoStore = require("connect-mongo"); // Store session in MongoDB
const { isMainAdmin, isSocietyAdmin, isAuthenticated, isLogged } = require("./middleware");
const User = require("./models/user"); // Path to your User model
const Society = require("./models/society"); // Path to the Society model
const SocietyAdmin = require("./models/societyAdmin");
const RecruitmentSchema = require("./models/recruitment");
// const { configDotenv } = require("dotenv");
const methodOverride = require('method-override');


app.engine("ejs", ejsMate);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "/public")));
app.use(express.static(path.join(__dirname, "/public/js")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.engine("ejs", ejsMate);


// Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET, // Secure session secret
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: "mongodb://localhost:27017/stucobe", // MongoDB URL for session storage
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 1 day session expiration
    },
  })
);

main().catch((err) => console.log(err));

async function main() {
  console.log("making connection");
  try {
    await mongoose.connect("mongodb://localhost:27017/stucobe");
    console.log("Connected to local MongoDB successfully");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
}

// Register route
// app.get("/register", (req, res) => {
//   res.render("user/register.ejs");
// });
// app.use((req, res, next) => {
//   console.log("Session data:", req.session);
//   console.log("Token from session:", req.session?.token);
//   next();
// });
app.use((req, res, next) => {
  res.locals.currUser = req.session.user;
  res.locals.Sadmin = req.session.societyadmin || null;
  res.locals.mainAdmin=req.session.adminuser || null;
  // console.log(res.locals.currUser)
  next();
});
const logUserDetails = (req, res, next) => {
  const user = req.session.user || 'Guest'; // Assuming user details are stored in req.user (e.g., from authentication)
  const method = req.method;
  const url = req.originalUrl;
  const timestamp = new Date().toISOString();

  console.log(`[${timestamp}] ${method} request to ${url} by ${user}`);
  
  // Pass control to the next middleware or route handler
  next();
};

// Use the middleware globally (for all routes)
app.use(logUserDetails);
app.get("/register", (req, res) => {
  res.render("user/register.ejs");
});
app.post("/register", async (req, res) => {
  // console.log(req.body);
  const { name, email, password } = req.body;

  // Validate input
  if (!name || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with only required fields
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: "User registered successfully", userId: user._id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login route
app.get("/login", (req, res) => {
  res.render("user/login.ejs");
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const societyAdmin = await SocietyAdmin.findOne({ societyAdmin: user._id });
    if (societyAdmin) {
      req.session.societyadmin = societyAdmin;
    };

    // 3. Check if the user exists and if their email matches the main admin email from the .env file
    if (!user || user.email === process.env.MAIN_ADMIN_EMAIL) {
      req.session.adminuser = user;
    }

    // Attach user to the request for use in other routes
    // Store user info in session
    req.session.user = user;
    req.session.token = jwt.sign(
      { _id: user._id },
      process.env.JWT_SECRET_TOKEN,
      { expiresIn: "1h" }
    );

    res.redirect("/");
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: "An internal server error occurred" });
  }
});


// Logout route
app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Failed to log out" });
    }
    res.redirect("/");
  });
});


app.get("/create-society",isAuthenticated,async(req,res)=>{
  res.render("society/createsociety.ejs");
});
app.post("/create-society", isAuthenticated, isMainAdmin, async (req, res) => {
  const { name, description, societyAdminEmail, logourl} = req.body;

  if (!name || !description || !societyAdminEmail || !logourl) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const mainAdmin = req.user;

    const societyAdmin = await User.findOne({ email: societyAdminEmail });
    if (!societyAdmin) {
      return res.status(400).json({ error: "Society Admin not found with the provided email." });
    }

    const newSociety = new Society({
      name,
      description,
      mainAdmin: mainAdmin._id, // Single ObjectId for the main admin
      societyAdmin: [societyAdmin._id],
      logo:logourl
    });


    const savedSociety = await newSociety.save();
    // console.log(savedSociety);
    const newAdmin = new SocietyAdmin({
      society: savedSociety._id,
      societyAdmin: societyAdmin._id
    });
    const savedAdmin = await newAdmin.save();
    // console.log("saved admin----", savedAdmin)
    res.status(201).json({ message: "Society created successfully!", societyId: newSociety._id });
  } catch (err) {
    console.error(err); // Log error for debugging
    res.status(500).json({ error: "Error creating society." });
  }
});

app.get("/main/society/all", async (req, res) => {
  try {
    // Fetch all societies
    const societies = await Society.find();
  // .populate('mainAdmin', 'name email') // Populate mainAdmin with selected fields
  // .populate('societyAdmin', 'name email') // Populate societyAdmin with selected fields
  // .populate('followers', 'name email'); // Populate followers with selected fields


    // Check if no societies are found

    if (!societies || societies.length === 0) {
      return res.status(404).json({ message: "No societies found" });
    }

    // Validate session user
    // if (!req.session || !req.session.user || !req.session.user._id) {
    //   return res.status(403).json({ message: "User not authenticated" });
    // }

// Sort societies based on the number of followers (in descending order)
    societies.sort((a, b) => b.followers.length - a.followers.length);

    // console.log(societies);
    res.render("society/home.ejs",{societies});
    // const userid = req.session.user._id;

    // // Check if the user is an admin in any society
    // let hasPermission = false;

    // societies.forEach((society) => {
    //   if (society.societyAdmin.includes(userid)) {
    //     hasPermission = true;
    //     console.log("User has permission");
    //   } else {
    //     console.log("User does not have permission");
    //   }
    // });

    // // Log and send societies data
    // console.log(societies);
    // res.json(societies);

  } catch (err) {
    console.error("Error fetching societies:", err);
    return res.status(500).json({ message: "Server error" });
  }
});



app.get("/user/profile", isAuthenticated, async (req, res) => {
  const user = await User.findById(req.session.user._id);
  res.render("user/profile.ejs",{user});
});

app.get('/user/update/profile',isAuthenticated,async(req,res)=>{
  const id = req.session.user._id;
  const user= await User.findById(id);

  res.render("user/update.ejs",{user});
});
app.post('/user/update/profile', isAuthenticated, async (req, res) => {
  const id = req.session.user._id;
  const { contact, department, year, resumeUrl, linkedinUrl, portfolioUrl } = req.body;

  try {
    // Validate that only allowed fields are updated
    const updates = { contact, department, year, resumeUrl, linkedinUrl, portfolioUrl };
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    // Find the user and update the profile
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { profile: filteredUpdates },
      { new: true, runValidators: true } // Return updated user and validate input
    );

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
    res.redirect("/user/profile");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while updating the profile' });
  }
});

app.post('/user/:id/follow', isAuthenticated, async (req, res) => {
  try {
    const userid = req.session.user._id; // Current user ID
    const societyId = req.params.id; // Society ID

    // Check if the user is already a follower
    const society = await Society.findById(societyId);

    if (!society) {
      return res.status(404).json({ error: 'Society not found' });
    }

    if (!society.followers.includes(userid)) {
      society.followers.push(userid);
      await society.save();
    }

    // Add the user to the followers array
    
    res.redirect('/society/all');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});




// SOCIETY
app.get("/society/profile", isAuthenticated, async (req, res) => {
  const society = await Society.findById(req.session.societyadmin.society)
  .populate('societyAdmin','name email profile.department profile.year')
    .populate('achievements')
    .populate('announcements')
    .populate({
      path: 'recruitments.recruitmentId', // Populate recruitments
      model: 'Recruitment',
      select: 'title description eligibility deadline createdBy applications',
    });
  // console.log(society);
  res.render("society/show.ejs",{society});
});

app.get("/society/:id",async(req,res)=>{
  const society = await Society.findById(req.params.id)
  .populate('achievements','title description date')
    .populate('societyAdmin','name email profile.department profile.year')
    .populate('announcements')
    .populate('recruitments').lean();
    // console.log("society---------",society);
    // conso
  if(society!=undefined){
    res.render("society/show.ejs",{society});
  }
});
app.post('/society/:id/basic-info', async (req, res) => {
  try {
    const { name, description,logourl } = req.body;
    const updatedSociety = await Society.findByIdAndUpdate(
      req.params.id,
      { name:name, description:description,logo:logourl },
      { new: true }
    );
    res.redirect(`/society/${updatedSociety._id}`);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/society/:id/society-admin', async (req, res) => {
  try {
    const { adminEmail } = req.body;
    const societyAdmin = await User.findOne({ email: adminEmail });
    if (societyAdmin == null) {
      res.status(500).json({ error: "no user found" });
    }
    const updatedSociety = await Society.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { societyAdmin: societyAdmin._id } },
      { new: true }
    );
    const societyadmindetail=new SocietyAdmin({society:req.params.id,societyAdmin:societyAdmin._id});
    await societyadmindetail.save();
    // res.json(updatedSociety);
    res.redirect(`/society/profile`);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/society/:id/society-admin/:adminId', async (req, res) => {
  try {
    const { adminId } = req.params;
    if (req.session.user._id === adminId) {
      res.status(500).json({ error: "cannot delete yourself" });
    }
    if (req.session.user._id != adminId) {
      const updatedSociety = await Society.findByIdAndUpdate(
        req.params.id,
        { $pull: { societyAdmin: adminId } },
        { new: true }
      );
      res.json(updatedSociety);
    } else {
      res.status(500).json({ error: "cannot delete yourself" });
    }

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/society/:id/faculty-advisor', async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const updatedProfile = { name, email, phone };
    const updatedSociety = await Society.findByIdAndUpdate(
      req.params.id,
      { facultyAdvisor: updatedProfile },
      { new: true }
    );
    // res.json(updatedSociety);
    res.redirect(`/society/${updatedSociety._id}`);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/society/:id/achievements', async (req, res) => {
  try {
    const { title, description, date } = req.body;
    const parsedDate = new Date(date);
    // console.log("date",date,"parsed date",parsedDate);

    const achievements = { title:title, description:description, date:parsedDate };
    const updatedSociety = await Society.findByIdAndUpdate(
      req.params.id,
      { $push: { achievements: achievements } },
      { new: true }
    );
    res.redirect(`/society/profile`);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/society/:id/achievements/:achievementId', async (req, res) => {
  try {
    const { description } = req.body;

    const updatedSociety = await Society.findOneAndUpdate(
      {
        _id: req.params.id,
        "achievements._id": req.params.achievementId, // Match society ID and achievement ID
      },
      {
        $set: { "achievements.$.description": description }, // Update the description of the matched achievement
      },
      { new: true } // Return the updated document
    );

    if (!updatedSociety) {
      return res.status(404).json({ error: "Society or achievement not found" });
    }

    res.redirect(`/society/profile`);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/society/:id/:achievementid/remove", async (req, res) => {
  try {
    const { id, achievementid } = req.params;


    // Update the society document by pulling the specific achievement
    const updatedSociety = await Society.findByIdAndUpdate(
      id,
      { $pull: { achievements: { _id: achievementid } } }, // Adjust based on your schema
      { new: true } // Return the updated document
    );

    if (!updatedSociety) {
      return res.status(404).json({ error: "Society or achievement not found" });
    }

    // Redirect or respond based on the context
    res.redirect("/society/profile");
  } catch (error) {
    console.error("Error while deleting achievement:", error.message);
    res.status(500).json({ error: error.message });
  }
});


app.post('/society/:id/announcements', async (req, res) => {
  try {
    const { title, content } = req.body;
    const announcements = { title:title, content:content };
    const updatedSociety = await Society.findByIdAndUpdate(
      req.params.id,
      { $push: { announcements: announcements } },
      { new: true }
    );
    res.redirect("/society/profile");
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/society/:id/announcement/:announcementid', async (req, res) => {
  try {
    const { title, content } = req.body;

    const updatedSociety = await Society.findOneAndUpdate(
      {
        _id: req.params.id,
        "announcements._id": req.params.announcementid, // Match society ID and announcement ID
      },
      {
        $set: {
          "announcements.$.title": title,
          "announcements.$.content": content,
        }, // Update the title and content of the matched announcement
      },
      { new: true } // Return the updated document
    );

    if (!updatedSociety) {
      return res.status(404).json({ error: "Society or announcement not found" });
    }

    res.redirect(`/society/profile`);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/society/:id/:announcementid/remove/announcement", async (req, res) => {
  try {
    const { id, announcementid } = req.params;


    // Update the society document by pulling the specific achievement
    const updatedSociety = await Society.findByIdAndUpdate(
      id,
      { $pull: { announcements: { _id: announcementid } } }, // Adjust based on your schema
    );

    if (!updatedSociety) {
      return res.status(404).json({ error: "Society or achievement not found" });
    }

    // Redirect or respond based on the context
    res.redirect("/society/profile");
  } catch (error) {
    console.error("Error while deleting achievement:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/society/:id/recruitments', async (req, res) => {
  try {
    const { title, description, eligibility, deadline } = req.body;
    const societyId = req.params.id;

    // Create and save the recruitment
    const recruitment = new RecruitmentSchema({
      societyId: societyId,
      title: title,
      description: description,
      eligibility: eligibility,
      deadline: deadline,
      createdBy: req.session.user._id,
    });
    const savedRecruitment = await recruitment.save();
    
    const updatedSociety = await Society.findByIdAndUpdate(
      societyId,
      {
        $push: {
          recruitments: {
            recruitmentId: savedRecruitment._id,
            title: savedRecruitment.title,
            deadline: savedRecruitment.deadline,
          },
        },
      },
      { new: true }
    );

    if (!updatedSociety) {
      return res.status(404).json({ error: "Society not found" });
    }

    // console.log("Society updated:", updatedSociety);
    // res.status(201).json({
    //   message: "Recruitment added successfully",
    //   recruitment: savedRecruitment,
    //   society: updatedSociety,
    // });
    res.redirect("/society/profile");
  } catch (error) {
    console.error("Error adding recruitment:", error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/society/:id/recruitment/:recruitmentid/remove', async (req, res) => {
  try {

    // Create and save the recruitment
    
    const updatedSociety = await Society.findByIdAndUpdate(
      req.params.id,
      {$pull: { recruitments: { recruitmentId: req.params.recruitmentid}}},
    );
    const updatedRecruitment= await RecruitmentSchema.findByIdAndDelete(req.params.recruitmentid);
    if (!updatedSociety) {
      return res.status(404).json({ error: "Society not found" });
    }
    if (!updatedRecruitment) {
      return res.status(404).json({ error: "recruitment not found" });
    }

    // console.log("Society updated:", updatedSociety);
    // res.status(201).json({
    //   message: "Recruitment added successfully",
    //   recruitment: savedRecruitment,
    //   society: updatedSociety,
    // });
    res.redirect("/society/profile");
  } catch (error) {
    console.error("Error adding recruitment:", error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/society/:id/recruitment/:recruitmentId', async (req, res) => {
  try {
    const { title, description, eligibility, deadline } = req.body;
    const { id: societyId, recruitmentId } = req.params;
    const parsedDate = new Date(deadline);
    // Find and update the recruitment
    const updatedRecruitment = await RecruitmentSchema.findByIdAndUpdate(
      recruitmentId,
      {
        title,
        description,
        eligibility,
        deadline,
        updatedBy: req.session.user._id, // Optionally track who updated it
      },
      { new: true } // Return the updated document
    );

    if (!updatedRecruitment) {
      return res.status(404).json({ error: "Recruitment not found" });
    }
    // Update the corresponding entry in the society's recruitments array
    const updatedSociety = await Society.findOneAndUpdate(
      { _id: societyId, "recruitments.recruitmentId": recruitmentId },
      {
        $set: {
          "recruitments.$.title": updatedRecruitment.title,
          "recruitments.$.deadline": updatedRecruitment.deadline,
        },
      },
      { new: true } // Return the updated document
    );

    if (!updatedSociety) {
      return res.status(404).json({ error: "Society or recruitment in society not found" });
    }

    res.redirect("/society/profile"); // Redirect after successful update
  } catch (error) {
    console.error("Error updating recruitment:", error);
    res.status(500).json({ error: error.message });
  }
});


app.get("/events", async (req, res) => {
  try {
    // Fetch all societies
    const societies = await Society.find()
      .populate('recruitments.recruitmentId')
      .populate('followers')  // If needed
      .lean();  // .lean() returns plain JavaScript objects, not Mongoose documents

    let allData = [];

    // Iterate through each society
    societies.forEach(society => {
      // Add past events, announcements, and recruitments with respective tags
      if (society.pastEvents.length) {
        society.pastEvents.forEach(event => {
          allData.push({
            tag: 'event',
            title: event.title,
            description: event.description || '',
            logo:society.logo,
            date: event.date
          });
        });
      }

      if (society.announcements.length) {
        society.announcements.forEach(announcement => {
          allData.push({
            tag: 'announcement',
            title: announcement.title,
            content: announcement.content,
            logo:society.logo,
            date: announcement.date
          });
        });
      }

      if (society.recruitments.length) {
        society.recruitments.forEach(recruitment => {
          allData.push({
            tag: 'recruitment',
            title: recruitment.title,
            logo:society.logo,
            deadline: recruitment.deadline
          });
        });
      }
    });

    // Sort the allData array by date in descending order
    allData.sort((a, b) => new Date(b.date) - new Date(a.date));

    // console.log(allData); // Optional: For debugging

    // Render the sorted data
    res.render("event/event.ejs", { allData });
  } catch (error) {
    console.error(error);
    throw error;
  }
});


app.get("/", (req, res) => {
  res.render("home/home.ejs");
});

app.listen(port, () => {
  console.log(`Server started at port ${port}`);
});