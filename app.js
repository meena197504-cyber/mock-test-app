// --- CONFIGURATION ---
const API_URL = "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL";
const RAZORPAY_KEY = "rzp_test_YOUR_TEST_KEY_HERE"; // Get this from Razorpay Dashboard

// --- STATE MANAGEMENT ---
let user = JSON.parse(localStorage.getItem('mockUser')) || null;
let questions = [];
let currentQIndex = 0;
let userAnswers = [];
let testTimer;

// --- INITIALIZATION ---
window.onload = () => {
    if (user) showDashboard();
    else document.getElementById('auth-section').classList.remove('hidden');
    
    // Strict Mode: Check if test was interrupted by refresh
    let savedSession = JSON.parse(localStorage.getItem('testSession'));
    if(savedSession) {
        questions = savedSession.questions;
        currentQIndex = savedSession.currentIndex;
        userAnswers = savedSession.answers;
        startTestUI(); // Resume test strictly from where they left
    }
};

// --- AUTHENTICATION ---
function toggleAuth() {
    document.getElementById('login-box').style.display = document.getElementById('login-box').style.display === 'none' ? 'block' : 'none';
    document.getElementById('reg-box').style.display = document.getElementById('reg-box').style.display === 'none' ? 'block' : 'none';
}

async function apiCall(action, data) {
    document.getElementById('auth-msg').innerText = "Processing...";
    const response = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({ action, ...data })
    });
    return response.json();
}

async function register() {
    const data = {
        name: document.getElementById('reg-name').value,
        mobile: document.getElementById('reg-mobile').value,
        email: document.getElementById('reg-email').value,
        password: document.getElementById('reg-pass').value
    };
    const res = await apiCall('register', data);
    document.getElementById('auth-msg').innerText = res.message;
    if(res.success) toggleAuth();
}

async function login() {
    const data = {
        email: document.getElementById('log-email').value,
        password: document.getElementById('log-pass').value
    };
    const res = await apiCall('login', data);
    if(res.success) {
        user = res.user;
        localStorage.setItem('mockUser', JSON.stringify(user));
        document.getElementById('auth-section').classList.add('hidden');
        showDashboard();
    } else {
        document.getElementById('auth-msg').innerText = res.message;
    }
}

function logout() {
    localStorage.removeItem('mockUser');
    localStorage.removeItem('testSession');
    location.reload();
}

// --- DASHBOARD & PAYMENT ---
function showDashboard() {
    document.getElementById('dashboard-section').classList.remove('hidden');
    document.getElementById('user-name').innerText = user.name;
    document.getElementById('pay-status').innerText = user.status;
    
    let attemptsLeft = user.allowed - user.attempts;
    document.getElementById('attempts-left').innerText = attemptsLeft > 0 ? attemptsLeft : "Exhausted";

    if (user.status === "UNPAID") {
        document.getElementById('payment-box').classList.remove('hidden');
        document.getElementById('pay-status').style.color = "red";
    } else if (attemptsLeft > 0) {
        document.getElementById('test-start-box').classList.remove('hidden');
        document.getElementById('pay-status').style.color = "green";
    }
}

function payWithRazorpay() {
    var options = {
        "key": RAZORPAY_KEY, 
        "amount": "9900", // ₹99 in paise
        "currency": "INR",
        "name": "Mock Test Platform",
        "description": "Unlock Premium Tests",
        "handler": async function (response){
            // On successful payment, verify with backend
            const res = await apiCall('updatePayment', { userId: user.id, paymentId: response.razorpay_payment_id });
            if(res.success) {
                user.status = "PAID";
                localStorage.setItem('mockUser', JSON.stringify(user));
                alert("Payment Successful!");
                location.reload();
            }
        },
        "prefill": { "name": user.name, "email": user.email },
        "theme": { "color": "#007bff" }
    };
    var rzp1 = new Razorpay(options);
    rzp1.open();
}

// --- STRICT EXAM ENGINE ---
async function startTest() {
    document.getElementById('dashboard-section').classList.add('hidden');
    document.getElementById('test-section').classList.remove('hidden');
    document.getElementById('q-text').innerText = "Fetching securely...";
    
    const res = await apiCall('getQuestions', {});
    questions = res.data;
    currentQIndex = 0;
    userAnswers = [];
    startTestUI();
}

function startTestUI() {
    document.getElementById('dashboard-section').classList.add('hidden');
    document.getElementById('test-section').classList.remove('hidden');
    document.getElementById('total-q').innerText = questions.length;
    
    // Prevent Back Button
    history.pushState(null, null, location.href);
    window.onpopstate = function () { history.go(1); };

    loadQuestion();
    startTimer(600); // 10 minutes (600 seconds)
}

function loadQuestion() {
    if(currentQIndex >= questions.length) return submitExam();
    
    // Save session strictly to prevent refresh hacks
    localStorage.setItem('testSession', JSON.stringify({ questions, currentIndex: currentQIndex, answers: userAnswers }));

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
    localStorage.removeItem('testSession'); // Clear strict session
    document.getElementById('test-section').classList.add('hidden');
    
    const res = await apiCall('submitTest', {
        userId: user.id, userName: user.name, answers: userAnswers, totalQs: questions.length
    });
    
    user.attempts += 1;
    localStorage.setItem('mockUser', JSON.stringify(user));

    showResults(res.score, res.percentage);
}

function showResults(score, percentage) {
    document.getElementById('result-section').classList.remove('hidden');
    document.getElementById('res-score').innerText = score;
    document.getElementById('res-total').innerText = questions.length;
    document.getElementById('res-percent').innerText = percentage.toFixed(2);
    
    let reviewHtml = '';
    userAnswers.forEach((ans, i) => {
        let isCorrect = ans.selected === ans.correct;
        reviewHtml += `<div class="review-item ${isCorrect ? 'correct' : 'wrong'}">
            <p><strong>Q${i+1}: ${ans.qText}</strong></p>
            <p>Your Answer: ${ans.selected}</p>
            <p>Correct Answer: ${ans.correct}</p>
        </div>`;
    });
    document.getElementById('review-box').innerHTML = reviewHtml;
}

function goHome() { location.reload(); }
