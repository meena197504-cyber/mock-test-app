// ==========================================
// MS ASTRA: ELITE BANKER ACADEMY
// MAIN APPLICATION LOGIC
// ==========================================

// --- 1. CONFIGURATION & STATE ---
// CRITICAL: Replace this link with your actual Google Apps Script Web App URL
const API_URL = "https://script.google.com/macros/s/AKfycbyE3zs1OIZamJFv6beldzijirdsRFH2nq07rJCxjuAidXT0w0sA3q5vHsnQPwn4NFwwjg/exec"; 
let currentUser = null; // Tracks the currently logged-in recruit


// --- 2. API CONNECTION ENGINE ---
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


// --- 3. DOM NAVIGATION FUNCTIONS ---
function showAuth() {
    document.getElementById('landing-section').classList.add('hidden');
    document.getElementById('auth-section').classList.remove('hidden');
}

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


// --- 4. AUTHENTICATION LOGIC ---
async function login() {
    const email = document.getElementById('log-email').value;
    const pass = document.getElementById('log-pass').value;
    const msg = document.getElementById('auth-msg');

    if (!email || !pass) {
        msg.innerText = "Please fill in all fields.";
        msg.style.color = "#d32f2f";
        return;
    }

    msg.innerText = "Authenticating...";
    msg.style.color = "#0066cc";

    const res = await apiCall('login', { email: email, password: pass });
    
    if (res.success) {
        msg.innerText = "Access Granted.";
        msg.style.color = "green";
        
        currentUser = res.user; // Save user data globally
        
        // Move to dashboard and load specific data
        setTimeout(() => {
            document.getElementById('auth-section').classList.add('hidden');
            document.getElementById('dashboard-section').classList.remove('hidden');
            document.getElementById('user-name').innerText = currentUser.name;
            
            loadDashboard(); 
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
        msg.innerText = res.message;
        msg.style.color = "green";
        
        // Switch back to login screen
        setTimeout(() => {
            toggleAuth(); 
        }, 1500);
    } else {
        msg.innerText = res.message;
        msg.style.color = "#d32f2f";
    }
}

function logout() {
    currentUser = null;
    document.getElementById('dashboard-section').classList.add('hidden');
    document.getElementById('landing-section').classList.remove('hidden');
    document.getElementById('log-email').value = "";
    document.getElementById('log-pass').value = "";
    document.getElementById('auth-msg').innerText = "";
}


// --- 5. INITIALIZATION & PUBLIC CATALOG ---
window.onload = async function() {
    if (typeof API_URL === 'undefined' || API_URL === "YOUR_APP_SCRIPT_URL_HERE") {
        console.warn("API_URL is not set up yet. Loading preview data.");
        displaySampleCourses();
        return;
    }

    const response = await apiCall('getPublicCourses');
    if (response && response.success) {
        displayCourses(response.courses);
    } else {
        displaySampleCourses(); 
    }
};

function displayCourses(courses) {
    const list = document.getElementById('courses-list');
    if (!list) return;
    
    if (!courses || courses.length === 0) {
        list.innerHTML = "<p style='text-align:center; color:#64748b;'>No active academy streams found.</p>";
        return;
    }

    list.innerHTML = ""; 
    courses.forEach(course => {
        list.innerHTML += `
            <div class="card">
                <h4 class="primary-text" style="font-size:1.2rem; margin-bottom:5px;">${course.name}</h4>
                <p style="color:#64748b; font-size:0.95rem; margin-bottom:10px;">${course.desc}</p>
                <span style="font-weight:600; color:#004d99; display:block; margin-bottom:10px;">Cost: ₹${course.price}</span>
                <button onclick="enrollIn('${course.name}')" style="padding:10px;">Enroll Now</button>
            </div>
        `;
    });
}

function displaySampleCourses() {
    const sample = [
        { name: "JAIIB / CAIIB Elite Masterclass", desc: "Comprehensive mock papers and advanced practice configurations.", price: "4999" },
        { name: "Credit Management & Risk Analysis", desc: "Targeted operational test sets tailored for promotional exams.", price: "2999" }
    ];
    displayCourses(sample);
}


// --- 6. DASHBOARD & ENROLLMENT ENGINE ---
async function loadDashboard() {
    const coursesArea = document.getElementById('my-courses-area');
    coursesArea.innerHTML = "<p style='color:#0066cc; font-weight:600;'>Syncing vault records...</p>";

    const res = await apiCall('getCourseData', { userId: currentUser.id });
    
    if (res.success) {
        window.academyStructure = res.structure; 
        renderMyCourses();
    } else {
        coursesArea.innerHTML = "<p style='color:#d32f2f;'>Failed to load academy data.</p>";
    }
}

function renderMyCourses() {
    const coursesArea = document.getElementById('my-courses-area');
    coursesArea.innerHTML = "<h3 style='margin-bottom:15px; color:#333;'>My Enrolled Modules</h3>";
    
    let enrolledArray = [];
    if (currentUser.enrolled) {
        enrolledArray = currentUser.enrolled.split(',').map(c => c.trim());
    }

    if (enrolledArray.length === 0) {
        coursesArea.innerHTML += `
            <div style="background:#f8fafc; padding:20px; border-radius:8px; text-align:center; border:1px dashed #cbd5e1;">
                <p style="color:#64748b; margin-bottom:15px;">You have not joined any masterclasses yet.</p>
                <button onclick="logout()" style="width:auto; padding:10px 20px;">Browse Catalog</button>
            </div>
        `;
        return;
    }

    enrolledArray.forEach(course => {
        // Ensure empty strings from trailing commas aren't rendered
        if(course.length > 0) {
            coursesArea.innerHTML += `
                <div class="card" style="border-left: 4px solid #004d99;">
                    <h4 class="primary-text" style="font-size:1.2rem; margin-bottom:10px;">${course}</h4>
                    <button onclick="openCourse('${course}')" style="margin-top:0; padding:10px; background:#f0f4f8; color:#004d99; border:1px solid #004d99;">
                        Access Modules
                    </button>
                </div>
            `;
        }
    });
}

async function enrollIn(courseName) {
    if (!currentUser) {
        alert("Please login to enroll in a course.");
        showAuth();
        return;
    }

    const res = await apiCall('enrollCourse', { userId: currentUser.id, course: courseName });
    
    if (res.success) {
        alert(`Successfully enrolled in ${courseName}!`);
        currentUser.enrolled = res.newEnrolled; 
        loadDashboard(); 
    } else {
        alert("Enrollment failed. Please try again.");
    }
}

// Placeholder for the Test Viewer transition
function openCourse(courseName) {
    alert("Module ready: " + courseName + ". \n(Test Viewer UI coming in next update!)");
}
