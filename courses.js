// ==========================================
// FILE: courses.js (Catalog, Dashboard & Enrollment)
// ==========================================

window.onload = async function() {
    if (typeof API_URL === 'undefined' || API_URL === "YOUR_APP_SCRIPT_URL_HERE") {
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
    courses.forEach(c => {
        list.innerHTML += `
            <div class="card">
                <h4 class="primary-text" style="font-size:1.2rem; margin-bottom:5px;">${c.name}</h4>
                <p style="color:#64748b; font-size:0.95rem; margin-bottom:10px;">${c.desc}</p>
                <span style="font-weight:600; color:#004d99; display:block; margin-bottom:10px;">Cost: ₹${c.price}</span>
                <button onclick="enrollIn('${c.name}')" style="padding:10px;">Enroll Now (₹50)</button>
            </div>`;
    });
}

function displaySampleCourses() {
    displayCourses([
        { name: "JAIIB / CAIIB Elite Masterclass", desc: "Comprehensive mock papers.", price: "50" },
        { name: "Credit Management", desc: "Targeted operational sets.", price: "50" }
    ]);
}

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
    
    let enrolledArray = currentUser.enrolled ? currentUser.enrolled.split(',').map(c => c.trim()) : [];

    if (enrolledArray.length === 0) {
        coursesArea.innerHTML += `
            <div style="background:#f8fafc; padding:20px; border-radius:8px; text-align:center; border:1px dashed #cbd5e1;">
                <p style="color:#64748b; margin-bottom:15px;">You have not joined any masterclasses yet.</p>
                <button onclick="browseCatalog()" style="width:auto; padding:10px 20px;">Browse Catalog</button>
            </div>`;
        return;
    }

    enrolledArray.forEach(course => {
        if(course.length > 0) {
            coursesArea.innerHTML += `
                <div class="card" style="border-left: 4px solid #004d99;">
                    <h4 class="primary-text" style="font-size:1.2rem; margin-bottom:10px;">${course}</h4>
                    <button onclick="openCourse('${course}')" style="margin-top:0; padding:10px; background:#f0f4f8; color:#004d99; border:1px solid #004d99;">
                        Launch Mock Test
                    </button>
                </div>`;
        }
    });
}

async function enrollIn(courseName) {
    if (!currentUser) { 
        alert("Please login to enroll."); 
        showAuth(); 
        return; 
    }

    // Safety Check: Did Razorpay actually load from index.html?
    if (typeof Razorpay === 'undefined') {
        alert("Payment gateway is blocked or loading. Please refresh the page or check your internet connection.");
        return;
    }

    // Razorpay deals in "paise" (subunits). So 50 RS = 50 * 100 paise.
    const coursePriceInPaise = 50 * 100; 

    // Configure the Razorpay Checkout Modal
    var options = {
        // CRITICAL: Replace this with your actual Razorpay Test Key ID!
        "key": "rzp_test_T59AnvCHSAwwr2", 
        "amount": coursePriceInPaise, 
        "currency": "INR",
        "name": "MS ASTRA Academy",
        "description": "Enrollment for: " + courseName,
        "image": "https://cdn-icons-png.flaticon.com/512/2830/2830284.png", 
        
        "handler": async function (response) {
            console.log("Payment ID: " + response.razorpay_payment_id);
            alert("Payment of ₹50 successful! Unlocking your course...");
            
            // Tell Google Sheets to unlock the course for the user
            const res = await apiCall('enrollCourse', { userId: currentUser.id, course: courseName });
            
            if (res.success) {
                currentUser.enrolled = res.newEnrolled; 
                document.getElementById('landing-section').classList.add('hidden');
                document.getElementById('auth-section').classList.add('hidden');
                document.getElementById('dashboard-section').classList.remove('hidden');
                loadDashboard(); 
            } else {
                alert("Vault error: Payment processed, but course unlock failed. Please contact admin.");
            }
        },
        "prefill": {
            "name": currentUser.name || "Recruit",
            "contact": currentUser.mobile || "" 
        },
        "theme": {
            "color": "#004d99" 
        }
    };

    try {
        var rzp1 = new Razorpay(options);
        rzp1.on('payment.failed', function (response){
            alert("Payment failed or cancelled. Reason: " + response.error.description);
        });
        rzp1.open();
    } catch (error) {
        alert("Payment system error. Please ensure your Razorpay Test Key is correct!");
        console.error("Razorpay Error:", error);
    }
}

// Triggers the Test Engine from test.js
function openCourse(courseName) {
    if (typeof startTest === 'function') {
        startTest(courseName, "Test 1"); 
    } else {
        alert("Test engine module is not loading properly.");
    }
}
