// --- CONFIGURATION ---
const API_URL = "https://script.google.com/macros/s/AKfycbzfpHgMS33n2RaiPWxE73KVzay56-f9y5EXmamXcHNEJiGrIuygFe2IJVQ3b-VRiAiauw/exec"; // PASTE YOUR URL HERE
const RAZORPAY_KEY = "rzp_test_T1D1B9oUvXaqs2"; // PASTE YOUR RAZORPAY KEY HERE
const MAX_ATTEMPTS = 5;

// --- STATE MANAGEMENT ---
let user = JSON.parse(localStorage.getItem('astraUser')) || null;
let publicCourses = [];
let userHierarchy = {};
let activeCourse = "";
let activeTest = "";
let questions = [];
let currentQIndex = 0;
let userAnswers = [];
let testTimer;

// --- INITIALIZATION ---
window.onload = async () => {
    if (user) {
        await loadDashboard();
    } else {
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

// --- AUTHENTICATION & NAVIGATION ---
function showAuth() {
    document.getElementById('landing-section').classList.add('hidden');
    document.getElementById('auth-section').classList.remove('hidden');
}

function toggleAuth() {
    document.getElementById('login-box').classList.toggle('hidden');
    document.getElementById('reg-box').classList.toggle('hidden');
}

async function apiCall(action, data) {
    const response = await fetch(API_URL, { 
        method: 'POST', 
        body: JSON.stringify({ action, ...data }) 
    });
    return response.json();
}

async function register() {
    document.getElementById('auth-msg').innerText = "Creating Profile...";
    const data = {
        name: document.getElementById('reg-name').value,
        mobile: document.getElementById('reg-mobile').value,
        email: document.getElementById('reg-email').value,
        password: document.getElementById('reg-pass').value
    };
    const res = await apiCall('register', data);
    document.getElementById('auth-msg').innerText = res.message;
    if(res.success) {
        setTimeout(toggleAuth, 1500); // Switch to login after 1.5 seconds
    }
}

async function login() {
    document.getElementById('auth-msg').innerText = "Authenticating...";
    const data = {
        email: document.getElementById('log-email').value,
        password: document.getElementById('log-pass').value
    };
    const res = await apiCall('login', data);
    if(res.success) {
        user = res.user;
        localStorage.setItem('astraUser', JSON.stringify(user));
        document.getElementById('auth-section').classList.add('hidden');
        loadDashboard();
    } else {
        document.getElementById('auth-msg').innerText = res.message;
    }
}

function logout() { 
    localStorage.removeItem('astraUser'); 
    location.reload(); 
}

// --- DASHBOARD & HIERARCHY ---
async function loadDashboard() {
    document.getElementById('landing-section').classList.add('hidden');
    document.getElementById('test-section').classList.add('hidden');
    document.getElementById('dashboard-section').classList.remove('hidden');
    document.getElementById('user-name').innerText = user.name;
    
    document.getElementById('my-courses-area').innerHTML = '<p>Loading your vault...</p>';
    
    const res = await apiCall('getCourseData', { userId: user.id });
    userHierarchy = res.structure;
    
    let enrolledArr = user.enrolled ? user.enrolled.split(',') : [];
    let html = `<h3 class="neon-text" style="margin-bottom:15px;">Available Deployments</h3>`;
    
    // Check if there are no courses in the database yet
    if (Object.keys(userHierarchy).length === 0) {
        html += `<p>No courses available in the database yet. Admin needs to add questions.</p>`;
    } else {
        Object.keys(userHierarchy).forEach(cName => {
            let isEnrolled = enrolledArr.includes(cName);
            html += `<div class="card">
                <h3 class="gold-text">${cName}</h3>
                ${isEnrolled ? 
                    `<button onclick="showSubjects('${cName}')">Access Modules</button>` : 
                    `<button onclick="buyCourse('${cName}')" class="btn-gold">Unlock Access (₹999)</button>`}
            </div>`;
        });
    }
    
    document.getElementById('my-courses-area').innerHTML = html;
    document.getElementById('my-courses-area').classList.remove('hidden');
    document.getElementById('subjects-area').classList.add('hidden');
    document.getElementById('tests-area').classList.add('hidden');
}

function showSubjects(courseName) {
    activeCourse = courseName;
    document.getElementById('my-courses-area').classList.add('hidden');
    let html = `<h3 style="margin-bottom: 15px;">Modules for ${courseName}</h3>`;
    
    Object.keys(userHierarchy[courseName]).forEach(subName => {
        html += `<div class="card" onclick="showTests('${subName}')" style="cursor:pointer;">
            <h4 class="neon-text">${subName}</h4>
            <p style="margin-top:5px; color: #a0aab5;">Click to view tests</p>
        </div>`;
    });
    html += `<button onclick="loadDashboard()" style="border-color:gray; color:gray;">Back to Courses</button>`;
    
    document.getElementById('subjects-area').innerHTML = html;
    document.getElementById('subjects-area').classList.remove('hidden');
}

function showTests(subName) {
    document.getElementById('subjects-area').classList.add('hidden');
    let html = `<h3 style="margin-bottom: 15px;">Operations for ${subName}</h3>`;
    let tests = userHierarchy[activeCourse][subName];
    
    Object.keys(tests).forEach(tName => {
        let attempts = tests[tName];
        let canAttempt = attempts < MAX_ATTEMPTS;
        html += `<div class="card">
            <h4 class="gold-text">${tName}</h4>
            <p style="margin: 10px 0;">Attempts Used: <span style="color:${canAttempt?'#00f3ff':'#ff3366'}; font-weight: bold;">${attempts} / ${MAX_ATTEMPTS}</span></p>
            <button onclick="startTest('${tName}')" ${!canAttempt ? 'disabled' : ''}>
                ${canAttempt ? 'Initiate Sequence' : 'System Locked'}
            </button>
        </div>`;
    });
    html += `<button onclick="showSubjects('${activeCourse}')" style="border-color:gray; color:gray;">Back to Modules</button>`;
    
    document.getElementById('tests-area').innerHTML = html;
    document.getElementById('tests-area').classList.remove('hidden');
}

function buyCourse(courseName) {
    var options = {
        "key": RAZORPAY_KEY, 
        "amount": "99900", // ₹999 in paise
        "currency": "INR", 
        "name": "MS Astra", 
        "description": `Unlock ${courseName}`,
        "handler": async function (response) {
            const res = await apiCall('enrollCourse', { userId: user.id, course: courseName });
            if(res.success) {
                user.enrolled = res.newEnrolled;
                localStorage.setItem('astraUser', JSON.stringify(user));
                alert("Clearance Granted. Course Unlocked.");
                location.reload();
            }
        },
        "prefill": { "name": user.name, "email": user.email },
        "theme": { "color": "#ffd700" }
    };
    var rzp1 = new Razorpay(options);
    rzp1.open();
}

// --- STRICT EXAM ENGINE ---
async function startTest(testName) {
    activeTest = testName;
    document.getElementById('dashboard-section').classList.add('hidden');
    document.getElementById('test-section').classList.remove('hidden');
    document.getElementById('q-text').innerText = "Establishing secure connection to database...";
    
    const res = await apiCall('getTestQuestions', { course: activeCourse, testName: activeTest });
    questions = res.data;
    
    if(questions.length === 0) {
        alert("No questions found for this test in the database!");
        loadDashboard();
        return;
    }
    
    currentQIndex = 0;
    userAnswers = [];
    startTestUI();
}

function startTestUI() {
    document.getElementById('total-q').innerText = questions.length;
    
    // Prevent Back Button
    history.pushState(null, null, location.href);
    window.onpopstate = function () { history.go(1); };

    loadQuestion();
    startTimer(600); // 10 minutes (600 seconds)
}

function loadQuestion() {
    if(currentQIndex >= questions.length) return submitExam();
    
    const q = questions[currentQIndex];
    document.getElementById('q-num').innerText = currentQIndex + 1;
    document.getElementById('q-text').innerText = q.q;
    
    const optsContainer = document.getElementById('options-container');
    optsContainer.innerHTML = '';
    
    [q.a, q.b, q.c, q.d].forEach(opt => {
        let btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt;
        btn.onclick = () => selectOption(btn, opt);
        optsContainer.appendChild(btn);
    });
    
    document.getElementById('next-btn').disabled = true;
}

let selectedAnswer = null;
function selectOption(btn, text) {
    document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedAnswer = text;
    document.getElementById('next-btn').disabled = false;
}

function nextQuestion() {
    userAnswers.push({
        qId: questions[currentQIndex].id,
        qText: questions[currentQIndex].q,
        selected: selectedAnswer,
        correct: questions[currentQIndex].correct
    });
    currentQIndex++;
    loadQuestion();
}

function startTimer(duration) {
    let timer = duration, minutes, seconds;
    testTimer = setInterval(function () {
        minutes = parseInt(timer / 60, 10);
        seconds = parseInt(timer % 60, 10);
        document.getElementById('timer').innerText = minutes + ":" + (seconds < 10 ? "0" + seconds : seconds);
        if (--timer < 0) submitExam();
    }, 1000);
}

// --- SUBMISSION & RESULTS ---
async function submitExam() {
    clearInterval(testTimer);
    document.getElementById('test-section').classList.add('hidden');
    document.getElementById('dashboard-section').classList.remove('hidden');
    document.getElementById('my-courses-area').innerHTML = '<p class="neon-text">Uploading results to secure server...</p>';
    document.getElementById('my-courses-area').classList.remove('hidden');
    document.getElementById('subjects-area').classList.add('hidden');
    document.getElementById('tests-area').classList.add('hidden');
    
    const res = await apiCall('submitTest', {
        userId: user.id, 
        userName: user.name, 
        course: activeCourse,
        testName: activeTest,
        answers: userAnswers, 
        totalQs: questions.length
    });
    
    showResults(res.score, res.percentage);
}

function showResults(score, percentage) {
    let html = `
        <h2 class="gold-text" style="margin-bottom: 20px;">Operation Complete</h2>
        <div class="card" style="text-align: center;">
            <h3>Final Score: <span class="neon-text">${score} / ${questions.length}</span></h3>
            <h3>Accuracy: <span class="neon-text">${percentage.toFixed(2)}%</span></h3>
        </div>
        <h3 style="margin-top: 20px; border-bottom: 1px solid #ffd700; padding-bottom: 10px;">After Action Report</h3>
        <div style="max-height: 400px; overflow-y: auto; margin-top: 15px;">
    `;
    
    userAnswers.forEach((ans, i) => {
        let isCorrect = ans.selected === ans.correct;
        let color = isCorrect ? '#00f3ff' : '#ff3366';
        html += `<div class="card" style="border-left: 4px solid ${color};">
            <p style="margin-bottom: 10px;"><strong>Q${i+1}: ${ans.qText}</strong></p>
            <p style="color: #a0aab5;">Your Answer: <span style="color: ${color};">${ans.selected}</span></p>
            ${!isCorrect ? `<p style="color: #a0aab5;">Correct Answer: <span style="color: #00f3ff;">${ans.correct}</span></p>` : ''}
        </div>`;
    });
    
    html += `</div><button onclick="loadDashboard()" class="btn-gold" style="margin-top: 20px;">Return to Vault</button>`;
    
    document.getElementById('my-courses-area').innerHTML = html;
}
