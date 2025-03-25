const jwt = require('jsonwebtoken');
const User = require('./models/user');
const Society = require('./models/society');
// changes done
// Authentication Middleware (general)
module.exports.isAuthenticated = async (req, res, next) => {
    try {
        const token = req.session?.token;
        if (!token) {
            return res.status(401).render('error/error.ejs', { message: 'No token provided. Please log in.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET_TOKEN);
        const user = await User.findById(decoded._id);

        if (!user) {
            return res.status(404).render('error/error.ejs', { message: 'User not found' });
        }

        req.user = user; // Attach the user to the request object
        next(); // Proceed to the next middleware/route
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).render('error/error.ejs', { message: 'Token has expired. Please log in again.' });
        }
        res.status(500).render('error/error.ejs', { message: 'Authentication failed.' });
    }
};

// Middleware to check if the user is the main admin
module.exports.isMainAdmin = async (req, res, next) => {
    try {
        const token = req.session?.token;
        if (!token) {
            return res.status(401).render('error/error.ejs', { message: 'No token provided. Please log in.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET_TOKEN);
        const user = await User.findById(decoded._id);

        if (!user || user.email !== process.env.MAIN_ADMIN_EMAIL) {
            return res.status(403).render('error/error.ejs', { message: 'You are not authorized to create a society.' });
        }

        req.admin = user; // Attach user to the request for use in other routes
        next(); // Proceed to the next middleware/route
    } catch (err) {
        res.status(500).render('error/error.ejs', { message: 'Error verifying admin role.' });
    }
};

// Middleware to check if the user is a society admin or the main admin
module.exports.isSocietyAdmin = async (req, res, next) => {
    try {
        const token = req.session?.token;
        if (!token) {
            return res.status(401).render('error/error.ejs', { message: 'No token provided. Please log in.', });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET_TOKEN);
        const user = await User.findById(decoded._id);

        if (!user) {
            return res.status(404).render('error/error.ejs', { message: 'User not found' });
        }

        const society = await Society.findOne({ societyAdmin: user._id });

        if (user.email === process.env.MAIN_ADMIN_EMAIL || (society && society.societyAdmin.equals(user._id))) {
            req.user = user; // Attach user to the request for further use
            next(); // Proceed to the next middleware/route
        } else {
            return res.status(403).render('error/error.ejs', { message: 'You are not authorized to manage this society.' });
        }
    } catch (err) {
        res.status(500).render('error/error.ejs', { message: 'Error checking society admin status.' });
    }
};
