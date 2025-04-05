const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/user"); // Adjust path if needed
const jwt = require("jsonwebtoken");

passport.serializeUser((user, done) => {
    // Store user ID and token in session
    done(null, { id: user.id, token: user.token });
});

passport.deserializeUser(async (sessionData, done) => {
    try {
        const user = await User.findById(sessionData.id);
        if (!user) {
            return done(null, false);
        }
        // Attach token from session to user object
        user.token = sessionData.token;
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// 🔹 Google OAuth Strategy
passport.use(new GoogleStrategy(
    {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:8000/auth/google/callback",
        passReqToCallback: true, // Allow access to `req` in callback
        scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar'], // Add Calendar scope
        accessType: 'offline', // Required to get a refresh token
    },
    async (req, accessToken, refreshToken, profile, done) => { // Added `req` parameter
        try {
            let user = profile.emails[0].value;
            user = await User.findOne({ email: user });
            
            if (!user) {
                user = new User({
                    name: profile.displayName,
                    email: profile.emails[0].value,
                    password: "",
                    role: "student",
                });
                await user.save();
            }

            // Generate JWT token (for your app)
            const jwtToken = jwt.sign(
                { _id: user._id, email: user.email },
                process.env.JWT_TOKEN,
                { expiresIn: "1d" }
            );

            // ✅ Store BOTH JWT token AND Google OAuth tokens in session
            done(null, { 
                id: user._id, 
                token: jwtToken, // Your app's JWT token
                googleAccessToken: accessToken, // Google OAuth token (for API calls)
                googleRefreshToken: refreshToken // Needed to refresh access token
            });
        } catch (error) {
            done(error, null);
        }
    }
));


module.exports = passport;
