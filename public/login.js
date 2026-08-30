// ==================================================
// LOGIN.JS
// Task Management System
// ==================================================


// ==================================================
// Login User
// ==================================================

async function loginUser(event) {

    event.preventDefault();

    // ------------------------------------------
    // Get form elements
    // ------------------------------------------

    const emailInput =
        document.getElementById("email");

    const passwordInput =
        document.getElementById("password");

    const loginButton =
        document.getElementById("loginButton");

    const errorBox =
        document.getElementById("loginError");


    // ------------------------------------------
    // Get values
    // ------------------------------------------

    const email =
        emailInput.value.trim().toLowerCase();

    const password =
        passwordInput.value;


    // ------------------------------------------
    // Clear previous error
    // ------------------------------------------

    errorBox.textContent = "";

    errorBox.style.display = "none";


    // ------------------------------------------
    // Basic validation
    // ------------------------------------------

    if (email === "") {

        showError(
            "Please enter your email."
        );

        return;
    }


    if (password === "") {

        showError(
            "Please enter your password."
        );

        return;
    }


    if (password.length < 6) {

        showError(
            "Password must contain at least 6 characters."
        );

        return;
    }


    // ------------------------------------------
    // Disable Login Button
    // ------------------------------------------

    loginButton.disabled = true;

    loginButton.innerHTML = `

        <i class="fa-solid fa-spinner fa-spin"></i>

        Logging in...

    `;


    try {

        // ------------------------------------------
        // Send Login Request
        // ------------------------------------------

        const response =
            await fetch(
                "/auth/login",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                    },

                    body:
                        JSON.stringify({

                            email:
                                email,

                            password:
                                password,

                        }),

                }
            );


        // ------------------------------------------
        // Read Response
        // ------------------------------------------

        const result =
            await response.json();


        console.log(
            "POST /auth/login response:",
            result
        );


        // ------------------------------------------
        // Handle API Error
        // ------------------------------------------

        if (!response.ok) {

            throw new Error(
                result.message ||
                "Invalid email or password."
            );

        }


        // ------------------------------------------
        // Make Sure Token Exists
        // ------------------------------------------

        if (!result.token) {

            throw new Error(
                "Login successful, but authentication token was not received."
            );

        }


        // ------------------------------------------
        // Store Authentication Token
        // ------------------------------------------

        localStorage.setItem(
            "token",
            result.token
        );


        // ------------------------------------------
        // Store User Information
        // ------------------------------------------

        if (result.user) {

            localStorage.setItem(
                "user",
                JSON.stringify(
                    result.user
                )
            );

        }


        // ------------------------------------------
        // Success Message
        // ------------------------------------------

        loginButton.innerHTML = `

            <i class="fa-solid fa-check"></i>

            Login Successful

        `;


        // ------------------------------------------
        // Redirect to Task Manager
        // ------------------------------------------

        setTimeout(
            () => {

                window.location.href =
                    "/task-manager.html";

            },
            500
        );


    } catch (error) {

        console.error(
            "Login error:",
            error
        );


        showError(
            error.message ||
            "Unable to login. Please try again."
        );


        // ------------------------------------------
        // Restore Login Button
        // ------------------------------------------

        loginButton.disabled =
            false;


        loginButton.innerHTML = `

            <i
                class="fa-solid fa-right-to-bracket"
            ></i>

            Login

        `;

    }

}


// ==================================================
// Show Error
// ==================================================

function showError(message) {

    const errorBox =
        document.getElementById(
            "loginError"
        );


    errorBox.textContent =
        message;


    errorBox.style.display =
        "block";

}


// ==================================================
// Toggle Password Visibility
// ==================================================

function togglePassword() {

    const passwordInput =
        document.getElementById(
            "password"
        );


    const passwordIcon =
        document.getElementById(
            "passwordIcon"
        );


    if (
        passwordInput.type ===
        "password"
    ) {

        // Show password

        passwordInput.type =
            "text";


        passwordIcon.classList.remove(
            "fa-eye"
        );


        passwordIcon.classList.add(
            "fa-eye-slash"
        );

    } else {

        // Hide password

        passwordInput.type =
            "password";


        passwordIcon.classList.remove(
            "fa-eye-slash"
        );


        passwordIcon.classList.add(
            "fa-eye"
        );

    }

}


// ==================================================
// Google Identity Services Integration
// ==================================================

let googleClientIdCache = null;

async function fetchGoogleClientId() {
    if (googleClientIdCache !== null) return googleClientIdCache;
    try {
        const res = await fetch("/auth/google/client-id");
        const data = await res.json();
        googleClientIdCache = data.clientId || "";
        return googleClientIdCache;
    } catch (e) {
        console.error("Failed to fetch Google Client ID:", e);
        return "";
    }
}

async function initGoogleSignIn() {
    const clientId = await fetchGoogleClientId();
    if (!clientId) return;

    if (window.google && window.google.accounts && window.google.accounts.id) {
        try {
            google.accounts.id.initialize({
                client_id: clientId,
                callback: handleGoogleCredentialResponse,
                auto_select: false,
                cancel_on_tap_outside: true,
            });

            const container = document.getElementById("googleBtnContainer");
            if (container) {
                google.accounts.id.renderButton(container, {
                    theme: "outline",
                    size: "large",
                    width: 360,
                    text: "continue_with",
                    shape: "rectangular",
                    logo_alignment: "left",
                });
                const customBtn = document.getElementById("customGoogleBtn");
                if (customBtn) customBtn.style.display = "none";
            }
        } catch (e) {
            console.error("Google accounts init error:", e);
        }
    } else {
        setTimeout(initGoogleSignIn, 400);
    }
}

async function googleLogin() {
    const clientId = await fetchGoogleClientId();

    if (!clientId) {
        alert(
            "Google Sign-In is not configured yet.\n\nPlease add your GOOGLE_CLIENT_ID in the .env file and restart the server."
        );
        return;
    }

    if (!window.google || !window.google.accounts || !window.google.accounts.id) {
        alert("Google Sign-In library is loading. Please try again in a moment.");
        return;
    }

    try {
        google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleCredentialResponse,
        });

        google.accounts.id.prompt((notification) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                // If One-Tap is suppressed, notify user or fallback
                console.log("GIS Prompt status:", notification.getNotDisplayedReason?.() || notification.getSkippedReason?.());
            }
        });
    } catch (err) {
        console.error("Google login prompt error:", err);
        showError("Unable to initialize Google Sign-In.");
    }
}

async function handleGoogleCredentialResponse(response) {
    if (!response || !response.credential) {
        showError("Google authentication failed. No credentials received.");
        return;
    }

    const loginButton = document.getElementById("loginButton");
    const errorBox = document.getElementById("loginError");
    if (errorBox) {
        errorBox.textContent = "";
        errorBox.style.display = "none";
    }

    try {
        const res = await fetch("/auth/google", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                credential: response.credential,
            }),
        });

        const result = await res.json();

        if (!res.ok) {
            throw new Error(result.message || "Google authentication failed.");
        }

        if (!result.token) {
            throw new Error("Authentication succeeded but token was missing.");
        }

        localStorage.setItem("token", result.token);
        if (result.user) {
            localStorage.setItem("user", JSON.stringify(result.user));
        }

        window.location.href = "/task-manager.html";
    } catch (err) {
        console.error("Google backend verification error:", err);
        showError(err.message || "Google login failed.");
    }
}



// ==================================================
// Forgot Password
// ==================================================

function forgotPassword(event) {

    event.preventDefault();


    alert(
        "Forgot password functionality will be added soon."
    );

}


// ==================================================
// Check Existing Authentication
// ==================================================

async function checkExistingLogin() {

    const token =
        localStorage.getItem(
            "token"
        );


    // ------------------------------------------
    // No token
    // ------------------------------------------

    if (!token) {

        return;

    }


    try {

        // ------------------------------------------
        // Verify token with backend
        // ------------------------------------------

        const response =
            await fetch(
                "/auth/me",
                {

                    method: "GET",

                    headers: {

                        "Authorization":
                            `Bearer ${token}`,

                    },

                }
            );


        // ------------------------------------------
        // Token is valid
        // ------------------------------------------

        if (response.ok) {

            window.location.href =
                "/task-manager.html";

            return;

        }


        // ------------------------------------------
        // Token is invalid/expired
        // ------------------------------------------

        localStorage.removeItem(
            "token"
        );

        localStorage.removeItem(
            "user"
        );

    } catch (error) {

        console.error(
            "Authentication check error:",
            error
        );

    }

}


// ==================================================
// Page Load
// ==================================================

window.addEventListener(
    "DOMContentLoaded",
    () => {
        checkExistingLogin();
        setTimeout(initGoogleSignIn, 500);
    }
);