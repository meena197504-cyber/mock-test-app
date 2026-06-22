// ==========================================
// FILE 2: auth.js (Login, Registration & Navigation)
// ==========================================

function showAuth() {
    if (currentUser) {
        document.getElementById('landing-section').classList.add('hidden');
        document.getElementById('auth-section').classList.add('hidden');
        document.getElementById('dashboard-section').classList.remove('hidden');
        loadDashboard();
    } else {
        document.getElementById('landing-section').classList.add('hidden');
        document.getElementById('auth-section').classList.remove('hidden');
    }
}

function toggleAuth() {
    const loginBox = document.getElementById('login-box');
    const regBox = document.getElementById('reg-box');
    const msg = document.getElementById('auth-msg');
    
    msg.innerText = ""; 
    
    if (loginBox.classList.contains('hidden')) {
        loginBox.classList.remove('hidden');
        regBox.classList.add('hidden');
    } else {
        loginBox.classList.add('hidden');
        regBox.classList.remove('hidden');
    }
}

function browseCatalog() {
    document.getElementById('dashboard-section').classList.add('hidden');
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('landing-section').classList.remove('hidden');
}

async function login() {
    const email = document.getElementById('log-email').value;
    const pass = document.getElementById('log-pass').value;
    const msg = document.getElementById('auth-msg');

    if (!email || !pass) { msg.innerText = "Please fill in all fields."; msg.style.color = "#d32f2f"; return; }

    msg.innerText = "Authenticating..."; msg.style.color = "#0066cc";
    const res = await apiCall('login', { email: email, password: pass });
    
    if (res.success) {
        msg.innerText = "Access Granted."; msg.style.color = "green";
        currentUser = res.user; 
        
        setTimeout(() => {
            document.getElementById('auth-section').classList.add('hidden');
            document.getElementById('dashboard-section').classList.remove('hidden');
            document.getElementById('user-name').innerText = currentUser.name;
            loadDashboard(); 
        }, 800);
    } else {
        msg.innerText = res.message || "Invalid credentials."; msg.style.color = "#d32f2f";
    }
}

async function register() {
    const name = document.getElementById('reg-name').value;
    const mobile = document.getElementById('reg-mobile').value;
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-pass').value;
    const msg = document.getElementById('auth-msg');

    if (!name || !mobile || !email || !pass) { msg.innerText = "Please fill all details."; msg.style.color = "#d32f2f"; return; }

    msg.innerText = "Creating profile..."; msg.style.color = "#0066cc";
    const res = await apiCall('register', { name, mobile, email, password: pass });
    
    if (res.success) {
        msg.innerText = res.message; msg.style.color = "green";
        setTimeout(() => { toggleAuth(); }, 1500);
    } else {
        msg.innerText = res.message; msg.style.color = "#d32f2f";
    }
}

function logout() {
    currentUser = null; 
    document.getElementById('dashboard-section').classList.add('hidden');
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('landing-section').classList.remove('hidden');
    document.getElementById('log-email').value = "";
    document.getElementById('log-pass').value = "";
    document.getElementById('auth-msg').innerText = "";
}
