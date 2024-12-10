const jwt = require('jsonwebtoken');
const User = require('./models/user');
const Society = require('./models/society');

module.exports.isLogged = (req, res, next) => {
    // Check if the user is authenticated via JWT (stored in session or request headers)
    const token = req.session.token || req.headers['authorization'];
  
    if (token) {
      // If token exists, decode and verify the token (e.g., using jwt.verify)
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Set user info in the request object
        // Redirect logged-in users to a specific page (e.g., dashboard)
        // req.flash("info", "You are already logged in!");
        return res.redirect("/"); // Replace with the appropriate page
      } catch (error) {
        // If token is invalid or expired, you can clear the session and token
        req.session.token = null;
        return res.redirect("/login");
      }
    } else {
      // If no token, proceed to the next middleware (check if they need to log in)
      next();
    }
  };
  

// Authentication Middleware (general)
module.exports.isAuthenticated = async (req, res, next) => {
    try {
        const token = req.session?.token;
      console.log(token);
      if (token.le) {
        return res.status(401).json({ error: 'No token provided. Please log in.' });
      }
  
      const decoded = jwt.verify(token, process.env.JWT_SECRET_TOKEN);
      const user = await User.findById(decoded._id);
  
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      req.user = user;  // Attach the user to the request object
      next();  // Proceed to the next middleware/route
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token has expired. Please log in again.' });
      }
      res.status(500).json({ error: 'Authentication failed.' });
    }
  };
  
// Middleware to check if the user is the main admin
module.exports.isMainAdmin = async (req, res, next) => {
  try {
    // 1. Check if the token is provided
    const token = req.session?.token;
    if (!token) {
      return res.status(401).json({ error: 'No token provided. Please log in.' });
    }

    // 2. Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET_TOKEN);
    const user = await User.findById(decoded._id);

    // 3. Check if the user exists and if their email matches the main admin email from the .env file
    if (!user || user.email !== process.env.MAIN_ADMIN_EMAIL) {
      return res.status(403).json({ error: 'You are not authorized to create a society.' });
    }

    // Attach user to the request for use in other routes
    req.user = user;
    next(); // Proceed to the next middleware/route
  } catch (err) {
    res.status(500).json({ error: 'Error verifying admin role.' });
  }
};



// Middleware to check if the user is a society admin or the main admin
module.exports.isSocietyAdmin = async (req, res, next) => {
  try {
    // 1. Check if the token is provided
    const token = req.session?.token;
    if (!token) {
      return res.status(401).json({ error: 'No token provided. Please log in.' });
    }

    // 2. Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET_TOKEN);
    const user = await User.findById(decoded._id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 3. Check if the user is either the main admin or the society admin
    const society = await Society.findOne({ 'societyAdmin': user._id });

    if (user.email === process.env.MAIN_ADMIN_EMAIL || (society && society.societyAdmin.equals(user._id))) {
      req.user = user; // Attach user to the request for further use
      next(); // Proceed to the next middleware/route
    } else {
      return res.status(403).json({ error: 'You are not authorized to manage this society.' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Error checking society admin status.' });
  }
};

  
