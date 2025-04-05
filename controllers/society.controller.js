const Society = require("../models/society.js");
const SocietyAdmin = require("../models/societyAdmin.js");
const User = require("../models/user"); // Path to your User model
const RecruitmentSchema = require("../models/recruitment");
const jwt = require('jsonwebtoken');
module.exports.createSocietyform = async(req,res)=>{
    res.render("society/createsociety.ejs");
}
module.exports.createSociety = async (req, res) => {
  const { name, description, societyAdminEmail, logourl } = req.body;

  if (!name || !description || !societyAdminEmail || !logourl) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const mainAdmin = req.user;
    console.log(mainAdmin);

    const societyAdmin = await User.findOne({ email: societyAdminEmail });
    if (!societyAdmin) {
      return res.status(400).json({ error: "Society Admin not found with the provided email." });
    }

    const newSociety = new Society({
      name,                                                                                   
      description,
      mainAdmin: mainAdmin.id, // Single ObjectId for the main admin
      societyAdmin: [societyAdmin.id],
      logo: logourl
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
    console.log("==========",err);
    const mainAdmin = req.user;
    res.status(500).json({ 
      error: "Error creating society." ,
      mainadmin: mainAdmin
    });
  }
};


module.exports.allSocietyInfo = async (req, res) => {
  try {
    // Fetch all societies
    const societies = await Society.find();

    // Check if no societies are found

    if (!societies || societies.length === 0) {
      return res.status(404).json({ message: "No societies found" });
    }

    // Sort societies based on the number of followers (in descending order)
    societies.sort((a, b) => b.followers.length - a.followers.length);

    // console.log(societies);
    res.json(societies);
    // res.render("society/home.ejs",{societies});

  } catch (err) {
    console.error("Error fetching societies:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports.societyProfileManageAdmin = async (req, res) => {
  const societies = await SocietyAdmin.find({ societyAdmin: req.params.id })
    .populate({
      path: 'society',
      model: 'Society',
      select: 'logo name',
    });
  res.json(societies);
  // res.render("society/societyadmin.ejs",{societies});
  // console.log(societies);
}

module.exports.societyProfilewithoutID = async (req, res) => {
  const society = await Society.findById(req.session.societyadmin.society)
    .populate('societyAdmin', 'name email profile.department profile.year')
    .populate('achievements')
    .populate('announcements')
    .populate({
      path: 'recruitments.recruitmentId', // Populate recruitments
      model: 'Recruitment',
      select: 'title description eligibility deadline createdBy applications',
    });
  // console.log(society);
  res.json(society);
  // res.render("society/show.ejs",{society});
};

module.exports.societySearchByID = async (req, res) => {
  const society = await Society.findById(req.params.id)
    .populate('achievements', 'title description date')
    .populate('societyAdmin', 'name email profile.department profile.year')
    .populate('announcements')
    .populate('recruitments').lean();
  // console.log("society---------",society);
  // conso
  if (society != undefined) {
    res.render("society/show.ejs", { society });
  }
};

module.exports.updateBasicInfo = async (req, res) => {
  try {
    const { name, description, logourl } = req.body;
    const updatedSociety = await Society.findByIdAndUpdate(
      req.params.id,
      { name: name, description: description, logo: logourl },
      { new: true }
    );
    res.json(updatedSociety);
    // res.redirect(`/society/${updatedSociety._id}`);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports.updateOraddAdmin = async (req, res) => {
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
    const societyadmindetail = new SocietyAdmin({ society: req.params.id, societyAdmin: societyAdmin._id });
    await societyadmindetail.save();
    res.json(updatedSociety);
    // res.redirect(`/society/profile`);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports.removeAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;
    if (req.session.societyadmin.societyAdmin === adminId) {
      res.status(500).json({ error: "cannot delete yourself" });
    }
    if (req.session.societyadmin.societyAdmin != adminId) {
      const updatedSociety = await Society.findByIdAndUpdate(
        req.params.id,
        { $pull: { societyAdmin: adminId } },
        { new: true }
      );
      const societyAdmin = await SocietyAdmin.findOneAndDelete({
        societyAdmin: req.params.adminId,
        society: req.params.id
      });
      // res.redirect("/society/profile");
      res.json(updatedSociety);
    } else {
      res.status(500).json({ error: "cannot delete yourself" });
    }

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

module.exports.updateFacultyAdvisor = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const updatedProfile = { name, email, phone };
    const updatedSociety = await Society.findByIdAndUpdate(
      req.params.id,
      { facultyAdvisor: updatedProfile },
      { new: true }
    );
    res.json(updatedSociety);
    // res.redirect(`/society/${updatedSociety._id}`);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports.addAchievements = async (req, res) => {
  try {
    const { title, description, date } = req.body;
    const parsedDate = new Date(date);
    // console.log("date",date,"parsed date",parsedDate);

    const achievements = { title: title, description: description, date: parsedDate };
    
    const updatedSociety = await Society.findByIdAndUpdate(
      req.params.id,
      { $push: { achievements: achievements } },
      { new: true }
    );
    res.json(updatedSociety);
    // res.redirect(`/society/profile`);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports.updateAchivement = async (req, res) => {
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
    res.json(updatedSociety);
    // res.redirect(`/society/profile`);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports.deleteAchievement = async (req, res) => {
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
    // res.redirect("/society/profile");
    res.json(updatedSociety);
  } catch (error) {
    console.error("Error while deleting achievement:", error.message);
    res.status(500).json({ error: error.message });
  }
};

module.exports.addAnnouncements = async (req, res) => {
  try {
    const { title, content } = req.body;
    const announcements = { title: title, content: content };
    const updatedSociety = await Society.findByIdAndUpdate(
      req.params.id,
      { $push: { announcements: announcements } },
      { new: true }
    );
    res.json(updatedSociety);
    // res.redirect("/society/profile");
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports.updateAnnouncement = async (req, res) => {
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

    res.json(updatedSociety);
    // res.redirect(`/society/profile`);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports.deleteAnnouncement = async (req, res) => {
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
    // res.redirect("/society/profile");
    res.status(201).json({message: "Society deleted successfully",
      society:updatedSociety
    });
  } catch (error) {
    console.error("Error while deleting achievement:", error.message);
    res.status(500).json({ error: error.message });
  }
};

module.exports.addRecruitment = async (req, res) => {
  try {
    const { title, description, eligibility, deadline } = req.body;
    const societyId = req.params.id;
    const token = req.session?.passport?.user?.token; // Retrieve token from session
    const decoded = jwt.verify(token, process.env.JWT_TOKEN);
    // Create and save the recruitment
    const recruitment = new RecruitmentSchema({
      societyId: societyId,
      title: title,
      description: description,
      eligibility: eligibility,
      deadline: deadline,
      createdBy: decoded._id,
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
    res.status(201).json({
      message: "Recruitment added successfully",
      recruitment: savedRecruitment,
      society: updatedSociety,
    });
    // res.redirect("/society/profile");
  } catch (error) {
    console.error("Error adding recruitment:", error);
    res.status(500).json({ error: error.message });
  }
}

module.exports.deleteRecruitment = async (req, res) => {
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
    res.status(201).json({
      message: "Recruitment delete successfully",
      recruitment: updatedRecruitment,
      society: updatedSociety,
    });
    // res.redirect("/society/profile");
  } catch (error) {
    console.error("Error adding recruitment:", error);
    res.status(500).json({ error: error.message });
  }
}

module.exports.updateRecruitment = async (req, res) => {
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
    res.status(201).json({
      message:"updated recruitment",
      updatedRecruitment: updatedRecruitment
    });
    // res.redirect("/society/profile"); // Redirect after successful update
  } catch (error) {
    console.error("Error updating recruitment:", error);
    res.status(500).json({ error: error.message });
  }
};