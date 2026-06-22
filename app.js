// --- DOM NAVIGATION FUNCTIONS ---

// Shows the login/signup section
function showAuth() {
    document.getElementById('landing-section').classList.add('hidden');
    document.getElementById('auth-section').classList.remove('hidden');
}

// Toggles between Login and Registration boxes
function toggleAuth() {
    const loginBox = document.getElementById('login-box');
    const regBox = document.getElementById('reg-box');
    const msg = document.getElementById('auth-msg');
    
    msg.innerText = ""; // Clear any error messages
    
    if (loginBox.classList.contains('hidden')) {
        loginBox.classList.remove('hidden');
        regBox.classList.add('hidden');
    } else {
        loginBox.classList.add('hidden');
        regBox.classList.remove('hidden');
    }
}

// --- AUTHENTICATION LOGIC ---

async function login() {
    const email = document.getElementById('log-email').value;
    const pass = document.getElementById('log-pass').value;
    const msg = document.getElementById('auth-msg');

    if (!email || !pass) {
        msg.innerText = "Please fill in all fields.";
        msg.style.color = "#d32f2f"; // Red error
        return;
    }

    msg.innerText = "Authenticating...";
    msg.style.color = "#0066cc"; // Blue loading

    const res = await apiCall('login', { email: email, password: pass });
    
    if (res.success) {
        msg.innerText = "Access Granted.";
        msg.style.color = "green";
        
        // Move to dashboard
        setTimeout(() => {
            document.getElementById('auth-section').classList.add('hidden');
            document.getElementById('dashboard-section').classList.remove('hidden');
            document.getElementById('user-name').innerText = res.user.name;
        }, 800);
    } else {
        msg.innerText = res.message || "Invalid credentials.";
        msg.style.color = "#d32f2f";
    }
}

async function register() {
    const name = document.getElementById('reg-name').value;
    const mobile = document.getElementById('reg-mobile').value;
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-pass').value;
    const msg = document.getElementById('auth-msg');

    if (!name || !mobile || !email || !pass) {
        msg.innerText = "Please fill in all details.";
        msg.style.color = "#d32f2f";
        return;
    }

    msg.innerText = "Creating profile...";
    msg.style.color = "#0066cc";

    const res = await apiCall('register', { name, mobile, email, password: pass });
    
    if (res.success) {
        msg.innerText = res.message; // "Profile created. Please login."
        msg.style.color = "green";
        
        // Automatically switch back to login screen after 1.5 seconds
        setTimeout(() => {
            toggleAuth(); 
        }, 1500);
    } else {
        msg.innerText = res.message;
        msg.style.color = "#d32f2f";
    }
}

function logout() {
    // Hide dashboard, show landing page, clear fields
    document.getElementById('dashboard-section').classList.add('hidden');
    document.getElementById('landing-section').classList.remove('hidden');
    document.getElementById('log-email').value = "";
    document.getElementById('log-pass').value = "";
    document.getElementById('auth-msg').innerText = "";
}
