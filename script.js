// script.js

// API Base URL - You can change this or add an input field for it later
let apiBaseUrl = 'http://aws-chek-free-tier-bucket.s3-website.eu-north-1.amazonaws.com/';

// Variable to store the JWT token (will be null initially)
let jwtToken = null;

// Get references to main UI sections and response area
const loginSection = document.getElementById('loginSection');
const protectedContentWrapper = document.getElementById('protectedContentWrapper'); // The wrapper for protected content
const responseSection = document.getElementById('responseSection');
const responseDiv = document.getElementById('response').querySelector('pre'); // The <pre> element for response text

// --- Functions to show/hide protected content ---
function showProtectedContent() {
    if (protectedContentWrapper) {
        protectedContentWrapper.classList.remove('d-none'); // Remove Bootstrap's d-none to show
        loginSection.classList.add('d-none'); // Hide the login section
    }
}

function hideProtectedContent() {
    if (protectedContentWrapper) {
        protectedContentWrapper.classList.add('d-none'); // Add Bootstrap's d-none to hide
        loginSection.classList.remove('d-none'); // Show the login section
    }
}
// --- End of show/hide functions ---


// --- Code to run when the page loads ---
document.addEventListener('DOMContentLoaded', function() {
    // Initially hide the protected content sections
    hideProtectedContent();
    // Clear response area and set initial message
    responseDiv.textContent = 'Please log in to use the API.';

    // Note: Login section is visible by default in HTML (it doesn't have d-none initially)
    // hideProtectedContent() will hide the protected wrapper and ensure login is visible.
});
// --- End of code to run when the page loads ---

// script.js

// ... (your existing variable declarations and show/hide functions) ...

// Get references to login form elements
const loginUsernameInput = document.getElementById('loginUsername');
const loginPasswordInput = document.getElementById('loginPassword');
const loginStatusP = document.getElementById('loginStatus'); // Already defined, but ensuring context


// --- Login function implementation ---
async function loginUser() {
    const username = loginUsernameInput.value;
    const password = loginPasswordInput.value;

    // Clear previous status message
    loginStatusP.textContent = '';
    loginStatusP.style.color = 'initial'; // Reset color

    if (!username || !password) {
        loginStatusP.textContent = 'Please enter both username and password.';
        loginStatusP.style.color = 'red';
        return; // Stop if fields are empty
    }

    try {
        const response = await fetch(`${apiBaseUrl}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        updateResponseDisplay(data); // Use the updateResponseDisplay function

        if (response.ok) { // Check if the response status is 2xx
            // Assuming your API returns an access_token on success
            jwtToken = data.access_token;
            loginStatusP.textContent = 'Login successful!';
            loginStatusP.style.color = 'green';

            // --- Show the protected content ---
            showProtectedContent();

            // Optional: Clear login fields after successful login
            loginUsernameInput.value = '';
            loginPasswordInput.value = '';

        } else { // Handle non-2xx response statuses (e.g., 401 Unauthorized)
            jwtToken = null;
            loginStatusP.textContent = 'Login failed: ' + (data.message || response.statusText);
            loginStatusP.style.color = 'red';

            // --- Hide the protected content ---
            hideProtectedContent();
        }

    } catch (error) { // Handle network errors or issues with the fetch call
        console.error('Login error:', error);
        jwtToken = null; // Ensure token is null on error
        loginStatusP.textContent = 'An error occurred during login.';
        loginStatusP.style.color = 'red';
        updateResponseDisplay({ error: 'Client-side error during login', details: error.message });

        // --- Hide the protected content on error ---
        hideProtectedContent();
    }
}
// --- End of Login function implementation ---


// ... (your existing DOMContentLoaded listener and updateResponseDisplay function) ...

// Other API functions (listTeams, getEplTeamDetails, etc.) will be added later
// ...


// --- API Interaction Functions (will be added incrementally) ---

// Function to update the response display area
function updateResponseDisplay(data) {
    responseDiv.textContent = JSON.stringify(data, null, 2);
}

// Login function (will be added next)
async function loginUser() {
    // ... login API call logic will go here ...
}

// Other API functions (listTeams, getEplTeamDetails, etc.) will be added later
// ...