const express = require("express");
const { createSociety, allSocietyInfo, societyProfileManageAdmin, societyProfilewithoutID, societySearchByID, updateBasicInfo, updateOraddAdmin, removeAdmin, updateFacultyAdvisor, addAchievements, updateAchivement, addAnnouncements, updateAnnouncement, deleteAnnouncement, addRecruitment, updateRecruitment, deleteAchievement, deleteRecruitment } = require("../controllers/society.controller");
const router = express.Router();
const { isMainAdmin, isAuthenticated} = require("../middleware");


router.post("/create-society",createSociety);
router.post("/:id/basic-info", updateBasicInfo);
router.post("/:id/society-admin",updateOraddAdmin);
router.post("/:id/faculty-advisor",updateFacultyAdvisor);
router.post("/:id/achievements",addAchievements);
router.post("/:id/announcements",addAnnouncements);
router.post("/:id/recruitments",addRecruitment);

router.get("/all",isAuthenticated,allSocietyInfo);
router.get("/:id/profile",societyProfileManageAdmin);
router.get("/profile",isAuthenticated,societyProfilewithoutID);
router.get("/:id",societySearchByID);

// remaining to modularize : announcement, recruitments, events

router.put("/:id/achievements/:achievementId", updateAchivement);
router.put("/:id/announcement/:announcementid", updateAnnouncement);
router.put("/:id/recruitment/:recruitmentId",updateRecruitment);


router.delete("/:id/society-admin/:adminId",removeAdmin);
router.delete("/:id/:achievementid/remove",deleteAchievement);
router.delete("/:id/:announcementid/remove/announcement",deleteAnnouncement);
router.delete(":id/recruitment/:recruitmentid/remove",deleteRecruitment)

router.get("/create-society",isAuthenticated);

module.exports = router;