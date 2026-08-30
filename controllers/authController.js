const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");


// ==================================================
// Helper: Generate JWT Token
// ==================================================

const generateToken = (user) => {

    return jwt.sign(
        {
            id: user._id,
            username: user.username,
            email: user.email,
        },

        process.env.JWT_SECRET,

        {
            expiresIn: "1d",
        }
    );
};


// ==================================================
// POST /auth/register
// Create New User
// ==================================================

const registerUser = async (req, res, next) => {

    try {

        const {
            username,
            email,
            password,
        } = req.body;


        // ------------------------------------------
        // Validation
        // ------------------------------------------

        if (
            !username ||
            !email ||
            !password
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Username, email and password are required",

            });

        }


        const cleanUsername =
            username.trim();


        const cleanEmail =
            email.trim().toLowerCase();


        // ------------------------------------------
        // Username validation
        // ------------------------------------------

        if (
            cleanUsername.length < 3
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Username must contain at least 3 characters",

            });

        }


        // ------------------------------------------
        // Email validation
        // ------------------------------------------

        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


        if (
            !emailRegex.test(cleanEmail)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Please enter a valid email address",

            });

        }


        // ------------------------------------------
        // Password validation
        // ------------------------------------------

        if (
            password.length < 6
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Password must contain at least 6 characters",

            });

        }


        // ------------------------------------------
        // Check existing username
        // ------------------------------------------

        const existingUsername =
            await User.findOne({
                username: cleanUsername,
            });


        if (existingUsername) {

            return res.status(409).json({

                success: false,

                message:
                    "Username already exists",

            });

        }


        // ------------------------------------------
        // Check existing email
        // ------------------------------------------

        const existingEmail =
            await User.findOne({
                email: cleanEmail,
            });


        if (existingEmail) {

            return res.status(409).json({

                success: false,

                message:
                    "Email already registered",

            });

        }


        // ------------------------------------------
        // Hash password
        // ------------------------------------------

        const hashedPassword =
            await bcrypt.hash(
                password,
                12
            );


        // ------------------------------------------
        // Create user
        // ------------------------------------------

        const user =
            await User.create({

                username:
                    cleanUsername,

                email:
                    cleanEmail,

                password:
                    hashedPassword,

                authProvider:
                    "local",

            });


        // ------------------------------------------
        // Generate JWT
        // ------------------------------------------

        const token =
            generateToken(user);


        // ------------------------------------------
        // Response
        // ------------------------------------------

        res.status(201).json({

            success: true,

            message:
                "Account created successfully",

            token,

            user: {

                id: user._id,

                username:
                    user.username,

                email:
                    user.email,

            },

        });

    } catch (error) {

        next(error);

    }

};


// ==================================================
// POST /auth/login
// Login User
// ==================================================

const loginUser = async (req, res, next) => {

    try {

        const {
            email,
            password,
        } = req.body;


        // ------------------------------------------
        // Validation
        // ------------------------------------------

        if (
            !email ||
            !password
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Email and password are required",

            });

        }


        const cleanEmail =
            email.trim().toLowerCase();


        // ------------------------------------------
        // Find user
        // ------------------------------------------

        const user =
            await User.findOne({
                email: cleanEmail,
            }).select("+password");


        if (!user) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid email or password",

            });

        }


        // ------------------------------------------
        // Check password
        // ------------------------------------------

        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password
            );


        if (!passwordMatch) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid email or password",

            });

        }


        // ------------------------------------------
        // Generate token
        // ------------------------------------------

        const token =
            generateToken(user);


        // ------------------------------------------
        // Response
        // ------------------------------------------

        res.status(200).json({

            success: true,

            message:
                "Login successful",

            token,

            user: {

                id: user._id,

                username:
                    user.username,

                email:
                    user.email,

                authProvider:
                    user.authProvider,

            },

        });

    } catch (error) {

        next(error);

    }

};


// ==================================================
// GET /auth/me
// Get Current Logged-in User
// ==================================================

const getCurrentUser = async (
    req,
    res,
    next
) => {

    try {
        const user = req.user;

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                authProvider: user.authProvider,
                profilePicture: user.profilePicture,
                createdAt: user.createdAt,
            },
        });

    } catch (error) {


        next(error);

    }

};


// ==================================================
// POST /auth/logout
// Logout User
// ==================================================

const logoutUser = async (
    req,
    res,
    next
) => {

    try {

        /*
         * JWT is normally stored on the client.
         *
         * Therefore the frontend should remove
         * the stored token when logout is performed.
         *
         * If later you use HTTP-only cookies,
         * this function can also clear the cookie.
         */

        res.status(200).json({

            success: true,

            message:
                "Logout successful",

        });

    } catch (error) {

        next(error);

    }

};


// ==================================================
// Google Login / Registration via Google Identity Services
// POST /auth/google
// ==================================================

const googleLogin = async (req, res, next) => {
    try {
        const { credential, idToken } = req.body;
        const token = credential || idToken;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: "Google ID token / credential is required.",
            });
        }

        const googleClientId = process.env.GOOGLE_CLIENT_ID;
        if (
            !googleClientId ||
            googleClientId.includes("your_google_client_id")
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Google Client ID is not configured in .env. Please configure GOOGLE_CLIENT_ID first.",
            });
        }

        const client = new OAuth2Client(googleClientId);

        let payload;
        try {
            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: googleClientId,
            });
            payload = ticket.getPayload();
        } catch (verifyError) {
            console.error("Google token verification failed:", verifyError.message);
            return res.status(401).json({
                success: false,
                message: "Invalid or expired Google token. Verification failed.",
            });
        }

        const googleId = payload.sub;
        const email = payload.email.trim().toLowerCase();
        const name = payload.name || payload.given_name || email.split("@")[0];
        const picture = payload.picture || "";

        // Find existing user by googleId or email
        let user = await User.findOne({
            $or: [{ googleId: googleId }, { email: email }],
        });

        if (user) {
            // Link Google details if account was previously created locally
            let modified = false;
            if (!user.googleId) {
                user.googleId = googleId;
                modified = true;
            }
            if (!user.profilePicture && picture) {
                user.profilePicture = picture;
                modified = true;
            }
            if (modified) {
                await user.save();
            }
        } else {
            // Generate unique username
            let baseUsername = name.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20);
            if (baseUsername.length < 3) {
                baseUsername = "user_" + Date.now().toString().slice(-4);
            }

            let username = baseUsername;
            let counter = 1;
            while (await User.findOne({ username })) {
                username = `${baseUsername}_${counter}`;
                counter++;
            }

            user = await User.create({
                username,
                email,
                authProvider: "google",
                googleId,
                profilePicture: picture,
            });
        }

        const jwtToken = generateToken(user);

        res.status(200).json({
            success: true,
            message: "Google login successful",
            token: jwtToken,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                authProvider: user.authProvider,
                profilePicture: user.profilePicture,
            },
        });
    } catch (error) {
        next(error);
    }
};

// ==================================================
// GET /auth/google/client-id
// ==================================================

const getGoogleClientId = (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID || "";
    const isPlaceholder =
        !clientId || clientId.includes("your_google_client_id");

    res.status(200).json({
        success: true,
        clientId: isPlaceholder ? "" : clientId,
        configured: !isPlaceholder,
    });
};

// ==================================================
// Export Controllers
// ==================================================

module.exports = {
    registerUser,
    loginUser,
    getCurrentUser,
    logoutUser,
    googleLogin,
    getGoogleClientId,
};