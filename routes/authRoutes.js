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