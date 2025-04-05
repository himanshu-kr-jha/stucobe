const Society = require("../models/society"); // Path to the Society model
const Event =require("../models/event");
const { google } = require("googleapis");
module.exports.allevents = async (req, res) => {
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
                        id:event.eventId,
                        tag: 'event',
                        title: event.title,
                        description: event.description || '',
                        logo: society.logo,
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
                        logo: society.logo,
                        date: announcement.date
                    });
                });
            }

            if (society.recruitments.length) {
                society.recruitments.forEach(recruitment => {
                    allData.push({
                        id: recruitment.recruitmentId,
                        tag: 'recruitment',
                        title: recruitment.title,
                        logo: society.logo,
                        deadline: recruitment.deadline
                    });
                });
            }
        });

        // Sort the allData array by date in descending order
        allData.sort((a, b) => new Date(b.date) - new Date(a.date));

        // console.log(allData); // Optional: For debugging

        // Render the sorted data
        // res.json({
        //     data:allData
        // })
        res.render("event/event.ejs", { allData });
    } catch (error) {
        console.error(error);
        throw error;
    }
};


module.exports.theevent = async(req,res)=>{
    const eventid=req.params.id;

    try{
        const event = Event.findById(eventid);
        if(!event){
            return res.json({
                message: "no such event"
            })
        }
        res.status(201).json({
            message:"Event fetched",
            event:event
        })
    }catch(Err){
        console.log(Err);
        res.json({
            message:"some error occured in catch block"
        })
    }
};

module.exports.createevent = async (req, res) => {
    try {
      const { title,dateofevent, time,description,location,category } = req.body;
      const id=req.params.id;
      const event = new Event({
        societyId:id,
        title:title,
        date:dateofevent,
        time:time,
        location:location,
        description:description,
        category:category
      });
      const savedevent = await event.save();
      
      const society_event ={eventId:savedevent._id, title:title,date:date }
      const updatedSociety = await Society.findByIdAndUpdate(
        req.params.id,
        { $push: { events: society_event } },
        { new: true }
      );
      res.status(201).json({ message: "Society created successfully!",savedevent , updatedSociety });
    } catch (error) {
      return res.json({message:error.message});
    }
  };