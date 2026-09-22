const express = require("express");

const router = express.Router();


// Controller

const {
    registerUser,
    loginUser,
    getCurrentUser,
    logoutUser,
    googleLogin,
    getGoogleClientId,
    forgotPassword,
    resetPassword,
} = require("../controllers/authController");


// Middleware

const authMiddleware =
    require("../middleware/authMiddleware");


// ==================================================
// Register
// POST /auth/register
// ==================================================

router.post(
    "/register",
    registerUser
);


// ==================================================
// Login
// POST /auth/login
// ==================================================

router.post(
    "/login",
    loginUser
);


// ==================================================
// Forgot Password
// POST /auth/forgot-password
// ==================================================

router.post(
    "/forgot-password",
    forgotPassword
);


// ==================================================
// Reset Password
// POST /auth/reset-password
// ==================================================

router.post(
    "/reset-password",
    resetPassword
);


// ==================================================
// Current User
// GET /auth/me
// ==================================================

router.get(
    "/me",
    authMiddleware,
    getCurrentUser
);


// ==================================================
// Logout
// POST /auth/logout
// ==================================================

router.post(
    "/logout",
    authMiddleware,
    logoutUser
);


// ==================================================
// Google Login / Verification
// POST /auth/google
// ==================================================

router.post(
    "/google",
    googleLogin
);


// ==================================================
// Google Client ID Config
// GET /auth/google/client-id
// ==================================================

router.get(
    "/google/client-id",
    getGoogleClientId
);



module.exports = router;