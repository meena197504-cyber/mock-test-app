const API_URL = "YOUR_NEW_APPS_SCRIPT_WEB_APP_URL";
const RAZORPAY_KEY = "rzp_test_YOUR_TEST_KEY_HERE";
const MAX_ATTEMPTS = 5;

let user = JSON.parse(localStorage.getItem('astraUser')) || null;
let publicCourses = [];
let userHierarchy = {};
let activeCourse = "";
let currentQuestions = [], currentQIndex = 0, userAnswers = [], testTimer;

window.onload = async () => {
    if (user) await loadDashboard();
    else {
        let res = await apiCall('getPublicCourses', {});
        publicCourses = res.courses;
        let html = '';
        publicCourses.forEach(c => {
            html += `<div class="card">
                <h3 class="gold-text">${c.name}</h3>
                <p>${c.desc}</p>
                <p class="neon-text" style="margin-top:10px;">₹${c.price}</p>
            </div>`;
        });
        document.getElementById('courses-list').innerHTML = html;
    }
};

function showAuth() {
    document.getElementById('landing-section').classList.add('hidden');
    document.getElementById('auth-section').classList.remove('hidden');
}

function toggleAuth() {
    document.getElementById('login-box').classList.toggle('hidden');
    document.getElementById('reg-box').classList.toggle('hidden');
}

async function apiCall(action, data) {
    const response = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action, ...data }) });
    return response.json();
}

async function login() {
    document.getElementById('auth-msg').innerText = "Authenticating...";
    const res = await apiCall('login', { email: document.getElementById('log-email').value, password: document.getElementById('log-pass').value });
    if(res.success) {
        user = res.user;
        localStorage.setItem('astraUser', JSON.stringify(user));
        document.getElementById('auth-section').classList.add('hidden');
        loadDashboard();
    } else document.getElementById('auth-msg').innerText = res.message;
}

function logout() { localStorage.removeItem('astraUser'); location.reload(); }

async function loadDashboard() {
    document.getElementById('landing-section').classList.add('hidden');
    document.getElementById('dashboard-section').classList.remove('hidden');
    document.getElementById('user-name').innerText = user.name;
    
    const res = await apiCall('getCourseData', { userId: user.id });
    userHierarchy = res.structure;
    
    let enrolledArr = user.enrolled ? user.enrolled.split(',') : [];
    let html = `<h3 class="neon-text" style="margin-bottom:15px;">Available Deployments</h3>`;
    
    Object.keys(userHierarchy).forEach(cName => {
        let isEnrolled = enrolledArr.includes(cName);
        html += `<div class="card">
            <h3 class="gold-text">${cName}</h3>
            ${isEnrolled ? 
                `<button onclick="showSubjects('${cName}')">Access Modules</button>` : 
                `<button onclick="buyCourse('${cName}')" class="btn-gold">Unlock Access (₹999)</button>`}
        </div>`;
    });
    document.getElementById('my-courses-area').innerHTML = html;
}

function showSubjects(courseName) {
    activeCourse = courseName;
    document.getElementById('my-courses-area').classList.add('hidden');
    let html = `<h3>Modules for ${courseName}</h3>`;
    Object.keys(userHierarchy[courseName]).forEach(subName => {
        html += `<div class="card" onclick="showTests('${subName}')" style="cursor:pointer;">
            <h4 class="neon-text">${subName}</h4><p>Click to view tests</p>
        </div>`;
    });
    html += `<button onclick="location.reload()" style="border-color:gray; color:gray;">Back</button>`;
    document.getElementById('subjects-area').innerHTML = html;
    document.getElementById('subjects-area').classList.remove('hidden');
}

function showTests(subName) {
    document.getElementById('subjects-area').classList.add('hidden');
    let html = `<h3>Operations for ${subName}</h3>`;
    let tests = userHierarchy[activeCourse][subName];
    
    Object.keys(tests).forEach(tName => {
        let attempts = tests[tName];
        let canAttempt = attempts < MAX_ATTEMPTS;
        html += `<div class="card">
            <h4 class="gold-text">${tName}</h4>
            <p>Attempts Used: <span style="color:${canAttempt?'#00f3ff':'#ff3366'}">${attempts} / ${MAX_ATTEMPTS}</span></p>
            <button onclick="startTest('${tName}')" ${!canAttempt ? 'disabled' : ''}>
                ${canAttempt ? 'Initiate sequence' : 'System Locked'}
            </button>
        </div>`;
    });
    html += `<button onclick="loadDashboard()" style="border-color:gray; color:gray;">Dashboard</button>`;
    document.getElementById('tests-area').innerHTML = html;
    document.getElementById('tests-area').classList.remove('hidden');
}

// Payment trigger to enroll in a specific course
function buyCourse(courseName) {
    var options = {
        "key": RAZORPAY_KEY, "amount": "99900", "currency": "INR", "name": "MS Astra", "description": `Unlock ${courseName}`,
        "handler": async function (response) {
            const res = await apiCall('enrollCourse', { userId: user.id, course: courseName });
            if(res.success) {
                user.enrolled = res.newEnrolled;
                localStorage.setItem('astraUser', JSON.stringify(user));
                alert("Clearance Granted.");
                location.reload();
            }
        },
        "prefill": { "name": user.name, "email": user.email },
        "theme": { "color": "#ffd700" }
    };
    new Razorpay(options).open();
}

/* --- REMAINDER OF TEST ENGINE CODE REMAINS THE SAME AS PREVIOUS --- */
// (Just replace apiCall('submitTest', ...) to include course and testName variables).
