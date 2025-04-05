const express = require("express");
const { createSociety, allSocietyInfo, societyProfileManageAdmin, societyProfilewithoutID, societySearchByID, updateBasicInfo, updateOraddAdmin, removeAdmin, updateFacultyAdvisor, addAchievements, updateAchivement, addAnnouncements, updateAnnouncement, deleteAnnouncement, addRecruitment, updateRecruitment, deleteAchievement, deleteRecruitment, createSocietyform } = require("../controllers/society.controller");
const router = express.Router();
const { isMainAdmin, isAuthenticated, isGuest, verifyToken, isSocietyAdmin} = require("../middleware");


router.post("/create-society",createSociety);
router.post("/:id/basic-info",updateBasicInfo);
router.post("/:id/society-admin",updateOraddAdmin);
router.post("/:id/faculty-advisor",updateFacultyAdvisor);
router.post("/:id/achievements",addAchievements);
router.post("/:id/announcements",addAnnouncements);
router.post("/:id/recruitments",isAuthenticated,addRecruitment);

router.get("/create_society",isAuthenticated,createSocietyform);
router.get("/all",allSocietyInfo);
router.get("/:id/profile",societyProfileManageAdmin);
router.get("/profile",isAuthenticated,societyProfilewithoutID);
router.get("/:id",societySearchByID);
router.get("/create_event/form",(req,res)=>{
    res.render("event/create_event.ejs");
});
// remaining to modularize : announcement, recruitments, events

router.put("/:id/achievements/:achievementId", updateAchivement);
router.put("/:id/announcement/:announcementid", updateAnnouncement);
router.put("/:id/recruitment/:recruitmentId",updateRecruitment);


router.delete("/:id/society-admin/:adminId",isAuthenticated,removeAdmin);
router.delete("/:id/:achievementid/remove",isAuthenticated,deleteAchievement);
router.delete("/:id/:announcementid/remove/announcement",isAuthenticated,deleteAnnouncement);
router.delete(":id/recruitment/:recruitmentid/remove",isAuthenticated,deleteRecruitment)


module.exports = router;    