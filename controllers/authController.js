const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const { sendPasswordResetEmail } = require("../services/emailService");

const ADMIN_EMAILS = [
    "24aiml048@charusat.edu.in",
];

// ==================================================
// Helper: Generate JWT Token
// ==================================================

const generateToken = (user) => {
    const isSpecialAdmin = ADMIN_EMAILS.includes((user.email || "").toLowerCase());
    const roleToSet = isSpecialAdmin ? "admin" : (user.role || "user");

    return jwt.sign(
        {
            id: user._id,
            username: user.username,
            email: user.email,
            role: roleToSet,
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
        const { username, email, password, role } = req.body;

        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Username, email and password are required",
            });
        }

        const cleanUsername = username.trim();
        const cleanEmail = email.trim().toLowerCase();

        if (cleanUsername.length < 3) {
            return res.status(400).json({
                success: false,
                message: "Username must contain at least 3 characters",
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address",
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 6 characters",
            });
        }

        // Check existing username
        const existingUsername = await User.findOne({ username: cleanUsername });
        if (existingUsername) {
            return res.status(409).json({
                success: false,
                message: "Username already exists",
            });
        }

        // Check existing email
        const existingEmail = await User.findOne({ email: cleanEmail });
        if (existingEmail) {
            return res.status(409).json({
                success: false,
                message: "Email already registered",
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Role assignment (defaults to 'user')
        const allowedRoles = ["user", "manager", "admin"];
        const userRole = allowedRoles.includes(role) ? role : "user";

        // Create user
        const user = await User.create({
            username: cleanUsername,
            email: cleanEmail,
            password: hashedPassword,
            role: userRole,
            authProvider: "local",
            lastLogin: new Date(),
        });

        // Generate JWT
        const token = generateToken(user);

        res.status(201).json({
            success: true,
            message: "Account created successfully",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                lastLogin: user.lastLogin,
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
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        // Find user
        const user = await User.findOne({
            email: cleanEmail,
        }).select("+password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // Check password
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // Update last login & check admin email
        user.lastLogin = new Date();
        const isSpecialAdmin = ADMIN_EMAILS.includes(cleanEmail);
        if (isSpecialAdmin && user.role !== "admin") {
            user.role = "admin";
        }
        await user.save();

        const token = generateToken(user);

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role || "user",
                authProvider: user.authProvider,
                profilePicture: user.profilePicture,
                lastLogin: user.lastLogin,
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

const getCurrentUser = async (req, res, next) => {
    try {
        const user = req.user;

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Auto upgrade to admin if special admin email
        const isSpecialAdmin = ADMIN_EMAILS.includes((user.email || "").toLowerCase());
        if (isSpecialAdmin && user.role !== "admin") {
            user.role = "admin";
            await user.save();
        }

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role || "user",
                authProvider: user.authProvider,
                profilePicture: user.profilePicture,
                lastLogin: user.lastLogin,
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

const logoutUser = async (req, res, next) => {
    try {
        res.status(200).json({
            success: true,
            message: "Logout successful",
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
        if (!googleClientId || googleClientId.includes("your_google_client_id")) {
            return res.status(400).json({
                success: false,
                message: "Google Client ID is not configured in .env. Please configure GOOGLE_CLIENT_ID first.",
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
        const isAdminEmail = ADMIN_EMAILS.includes(email);

        let user = await User.findOne({
            $or: [{ googleId: googleId }, { email: email }],
        });

        if (user) {
            let modified = false;
            if (!user.googleId) {
                user.googleId = googleId;
                modified = true;
            }
            if (picture && user.profilePicture !== picture) {
                user.profilePicture = picture;
                modified = true;
            }
            if (isAdminEmail && user.role !== "admin") {
                user.role = "admin";
                modified = true;
            }
            user.lastLogin = new Date();
            modified = true;
            if (modified) {
                await user.save();
            }
        } else {
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
                role: isAdminEmail ? "admin" : "user",
                lastLogin: new Date(),
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
                role: user.role || "user",
                authProvider: user.authProvider,
                profilePicture: user.profilePicture,
                lastLogin: user.lastLogin,
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
    const isPlaceholder = !clientId || clientId.includes("your_google_client_id");

    res.status(200).json({
        success: true,
        clientId: isPlaceholder ? "" : clientId,
        configured: !isPlaceholder,
    });
};

// ==================================================
// POST /auth/forgot-password
// Request Password Reset Link
// ==================================================

const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email || !email.trim()) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address.",
            });
        }

        const cleanEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: cleanEmail });

        if (!user) {
            // For security, don't reveal if user does not exist
            return res.status(200).json({
                success: true,
                message: "If an account with that email exists, password reset instructions have been sent.",
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString("hex");

        // Set token and 1-hour expiration
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        // Construct reset URL
        const protocol = req.protocol;
        const host = req.get("host");
        const resetUrl = `${protocol}://${host}/reset-password.html?token=${resetToken}`;

        // Send email via Nodemailer
        await sendPasswordResetEmail(user, resetUrl);

        res.status(200).json({
            success: true,
            message: "Password reset instructions have been sent to your email.",
        });
    } catch (error) {
        next(error);
    }
};

// ==================================================
// POST /auth/reset-password
// Reset Password With Token
// ==================================================

const resetPassword = async (req, res, next) => {
    try {
        const { token, password, newPassword } = req.body;
        const passToSet = password || newPassword;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: "Reset token is required.",
            });
        }

        if (!passToSet || passToSet.length < 6) {
            return res.status(400).json({
                success: false,
                message: "New password must contain at least 6 characters.",
            });
        }

        // Find user by reset token and ensure expiration is in the future
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() },
        }).select("+resetPasswordToken +resetPasswordExpires");

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Password reset token is invalid or has expired.",
            });
        }

        // Hash new password and clear reset fields
        const hashedPassword = await bcrypt.hash(passToSet, 12);
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Password reset successfully! You can now login with your new password.",
        });
    } catch (error) {
        next(error);
    }
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
    forgotPassword,
    resetPassword,
};