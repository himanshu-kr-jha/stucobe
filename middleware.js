const jwt = require('jsonwebtoken');
const User = require('./models/user');
const Society = require('./models/society');
const SocietyAdmin = require('./models/societyAdmin');
// changes done
// Authentication Middleware (general)
module.exports.isAuthenticated = async (req, res, next) => {
    try {
        // console.log(req.session);
        const token = req.session?.passport?.user?.token; // Retrieve token from session
        // console.log("token================",req.session);
        
        if (!token) {
            return res.status(401).render("./error/error.ejs", { message: "No token provided. Please log in." });
        }

        const decoded = jwt.verify(token, process.env.JWT_TOKEN);
        const user = await User.findById(decoded._id);

        if (!user) {
            return res.status(404).render("error/error.ejs", { message: "User not found" });
        }

        req.user = user; // Attach the user to the request object
        if(user.role=='mainAdmin'){
            req.session.mainAdmin=user.role;
        }

        // if(user.role=='societyAdmin'){
        //     req.session.societyadmin=user.role;
        // }
        const society = await SocietyAdmin.find({ societyAdmin: user._id });
        if ((society)) {
            // req.user = user; // Attach user to the request for further use
            req.session.societyadmin=society
        }

        next(); // Proceed to the next middleware/route
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).render("error/error.ejs", { message: "Token has expired. Please log in again." });
        }
        console.log(err);
        res.status(500).render("error/error.ejs", { message: "Authentication failed." });
    }
};

module.exports.verifyToken = (req, res, next) => {
    const token = req.session.token
    // console.log(token);
    if (!token){
        res.redirect("/user/login");
        return res.status(401).json({ message: "Access Denied" });
    } 
    try {
        const verified = jwt.verify(token, process.env.JWT_TOKEN);
        req.user = verified; // Attach user data to request
        next();
    } catch (err) {
        res.status(400).json({ message: "Invalid Token" });
    }
};

module.exports.isGuest = (req, res, next) => {
    if (req.user && req.user.isGuest) {
        return next();
    }
    return res.status(403).json({ message: "Access restricted to guest users only" });
};
// Middleware to check if the user is the main admin
module.exports.isMainAdmin = async (req, res, next) => {
    try {
        const token = req.session?.passport?.user?.token; // Retrieve token from session
        if (!token) {
            return res.status(401).render('error/error.ejs', { message: 'No token provided. Please log in.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_TOKEN);
        const user = await User.findById(decoded._id);
        // console.log(user);
        if (user.role!=='mainAdmin') {
            return res.status(403).render('error/error.ejs', { message: 'You are not authorized to create a society.' });
        }
        req.session.mainAdmin = user; // Attach user to the request for use in other routes
        // console.log("is mainadmin middleware. "+req.session.mainAdmin);
        next(); // Proceed to the next middleware/route
    } catch (err) {
        // console.log(err);
        res.status(500).render('error/error.ejs', { message: 'Error verifying admin role.' });
    }
};

// Middleware to check if the user is a society admin or the main admin
module.exports.isSocietyAdmin = async (req, res, next) => {
    try {
        const token = req.session?.passport?.user?.token; // Retrieve token from session
        if (!token) {
            return res.status(401).render('error/error.ejs', { message: 'No token provided. Please log in.', });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET_TOKEN);
        const user = await User.findById(decoded._id);
        // const society =  await SocietyAdmin.find({societyAdmin:user._id});

        if (!user) {
            return res.status(404).render('error/error.ejs', { message: 'User not found' });
        }

        const society = await Society.findOne({ societyAdmin: user._id });

        if (user.email === process.env.MAIN_ADMIN_EMAIL || (society && society.societyAdmin.equals(user._id))) {
            // req.user = user; // Attach user to the request for further use
            req.session.societyadmin=user
            // console.log("society admin"+user);
            next(); // Proceed to the next middleware/route
        } else {
            return res.status(403).render('error/error.ejs', { message: 'You are not authorized to manage this society.' });
        }
    } catch (err) {
        res.status(500).render('error/error.ejs', { message: 'Error checking society admin status.' });
    }
};
