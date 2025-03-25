const bcrypt = require("bcrypt");
const User = require("../models/user"); // Path to your User model
const Society = require("../models/society")
const SocietyAdmin = require("../models/societyAdmin");
const jwt = require("jsonwebtoken"); // Use JWT for authentication
const calendarEvent = require("../models/calendarEvent");
// {
//   "name":"testuser1",
//   "email":"testuser1@gmail.com",
//   "password":"1234"
// }

module.exports.register = async (req, res) => {
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
  };

  module.exports.login = async (req, res) => {
    const { email, password } = req.body;
  
    try {
      // Convert email to lowercase for case-insensitive matching
      const normalizedEmail = email.toLowerCase();
  
      // Find the user by email
      const user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
  
      // Validate password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
  
      // Check if the user is a society admin
      const societyAdmin = await SocietyAdmin.findOne({ societyAdmin: user._id });
      if (societyAdmin) {
        req.session.societyadmin = societyAdmin;
      }
  
      // Check if the user is the main admin
      if (user.email === process.env.MAIN_ADMIN_EMAIL) {
        req.session.adminuser = user;
      }
  
      // Store minimal user data in the session
      req.session.user = {
        _id: user._id,
        email: user.email,
        role: user.role // if you have a role field
      };
  
      // Generate a JWT token (optional, if needed for stateless authentication)
      const token = jwt.sign(
        { _id: user._id },
        process.env.JWT_SECRET_TOKEN,
        { expiresIn: "1h" }
      );

      req.session.token=token;
      // Send success response
      res.json({
        message: "Logged in successfully",
        user: {
          _id: user._id,
          email: user.email,
          role: user.role // if you have a role field
        },
        token: token // optional, if using JWT
      });
    } catch (err) {
      console.error("Login error:", err.message);
      res.status(500).json({ error: "An internal server error occurred" });
    }
  };

  module.exports.logout = async(req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to log out" });
      }
      res.json("Logged out");
      // res.redirect("/");
    });
  };

  module.exports.profile = async (req, res) => {
    const user = await User.findById(req.session.user._id);
    res.json(user);
    // res.render("user/profile.ejs",{user});
  };

  module.exports.updateProfile = async (req, res) => {
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
  };

  module.exports.userSocietyFollow = async (req, res) => {
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
      return res.status(200).json("You are now following the society")
    //   res.redirect('/society/all');
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  module.exports.userEvents = async(req,res)=>{
    const userid = req.session.user._id;
    try
    {
        const calendarEvents = await calendarEvent.find({userId:userid});
        if(!calendarEvents){
          return res.status(404).json({error:"no events are there"});
        };

        res.json({
          message:"Success",
          events: calendarEvents
        })
    }catch(err){
      console.log(err);
      res.json({
        message:"Error in userEvents router"
      })
    }
};

module.exports.addEvent = async(req,res)=>{
 // add to calend of the user
};