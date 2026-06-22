// --- 1. CONFIGURATION & API ENGINE (DO NOT DELETE) ---
// REPLACE THIS LINK WITH YOUR ACTUAL GOOGLE APPS SCRIPT WEB APP URL
const API_URL = "https://script.google.com/macros/s/AKfycbyE3zs1OIZamJFv6beldzijirdsRFH2nq07rJCxjuAidXT0w0sA3q5vHsnQPwn4NFwwjg/exec"; 

async function apiCall(action, data) {
    try {
        const response = await fetch(API_URL, { 
            method: 'POST', 
            headers: {
                'Content-Type': 'text/plain;charset=utf-8' 
            },
            body: JSON.stringify({ action, ...data }) 
        });
        
        return await response.json();
    } catch (error) {
        console.error("Vault Connection Error:", error);
        return { success: false, message: "Connection failed. Check browser console." };
    }
}

// --- 2. DOM NAVIGATION FUNCTIONS ---

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

// --- 3. AUTHENTICATION LOGIC ---

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

// --- 4. PAGE INITIALIZATION ---

// Run automatically when the webpage loads
window.onload = async function() {
    // 1. Double check that API_URL is defined at the top of your file
    if (typeof API_URL === 'undefined' || API_URL === "YOUR_APP_SCRIPT_URL_HERE") {
        console.warn("API_URL is not set up yet. Loading preview data.");
        displaySampleCourses();
        return;
    }

    // 2. Attempt to fetch real courses from Google Sheets
    const response = await apiCall('getPublicCourses');
    if (response && response.success) {
        displayCourses(response.courses);
    } else {
        displaySampleCourses(); // Fallback so page doesn't look empty
    }
};

// Helper function to build course cards visually
function displayCourses(courses) {
    const list = document.getElementById('courses-list');
    if (!list) return;
    
    if (!courses || courses.length === 0) {
        list.innerHTML = "<p style='text-align:center; color:#64748b;'>No active academy streams found.</p>";
        return;
    }

    list.innerHTML = ""; // Clear loader text
    courses.forEach(course => {
        list.innerHTML += `
            <div class="card">
                <h4 class="primary-text" style="font-size:1.2rem; margin-bottom:5px;">${course.name}</h4>
                <p style="color:#64748b; font-size:0.95rem; margin-bottom:10px;">${course.desc}</p>
                <span style="font-weight:600; color:#004d99;">Cost: ₹${course.price}</span>
            </div>
        `;
    });
}

// Fallback preview data so your page looks professional even if your Google Sheet is offline
function displaySampleCourses() {
    const sample = [
        { name: "JAIIB / CAIIB Elite Masterclass", desc: "Comprehensive mock papers and advanced practice configurations.", price: "4999" },
        { name: "Credit Management & Risk Analysis", desc: "Targeted operational test sets tailored for promotional exams.", price: "2999" }
    ];
    displayCourses(sample);
}
