// ==========================================
// FILE: courses.js (Catalog & Dashboard)
// ==========================================
window.onload = async function() {
    if (typeof API_URL === 'undefined' || API_URL === "https://script.google.com/macros/s/AKfycbyE3zs1OIZamJFv6beldzijirdsRFH2nq07rJCxjuAidXT0w0sA3q5vHsnQPwn4NFwwjg/exec") {
        displaySampleCourses(); return;
    }
    const response = await apiCall('getPublicCourses');
    if (response && response.success) { displayCourses(response.courses); } 
    else { displaySampleCourses(); }
};

function displayCourses(courses) {
    const list = document.getElementById('courses-list');
    if (!list) return;
    if (!courses || courses.length === 0) { list.innerHTML = "<p style='text-align:center; color:#64748b;'>No active academy streams found.</p>"; return; }

    list.innerHTML = ""; 
    courses.forEach(c => {
        list.innerHTML += `
            <div class="card">
                <h4 class="primary-text" style="font-size:1.2rem; margin-bottom:5px;">${c.name}</h4>
                <p style="color:#64748b; font-size:0.95rem; margin-bottom:10px;">${c.desc}</p>
                <span style="font-weight:600; color:#004d99; display:block; margin-bottom:10px;">Cost: ₹${c.price}</span>
                <button onclick="enrollIn('${c.name}')" style="padding:10px;">Enroll Now</button>
            </div>`;
    });
}

function displaySampleCourses() {
    displayCourses([
        { name: "JAIIB / CAIIB Elite", desc: "Comprehensive mock papers.", price: "4999" },
        { name: "Credit Management", desc: "Targeted operational sets.", price: "2999" }
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

    // Razorpay deals in "paise" (subunits). So 50 RS = 50 * 100 paise.
    const coursePriceInPaise = 50 * 100; 

    // Configure the Razorpay Checkout Modal
    var options = {
        "key": "rzp_test_T59AnvCHSAwwr2", // CRITICAL: You must replace this!
        "amount": coursePriceInPaise, 
        "currency": "INR",
        "name": "MS ASTRA Academy",
        "description": "Enrollment for: " + courseName,
        "image": "https://cdn-icons-png.flaticon.com/512/2830/2830284.png", // Optional professional logo
        
        // This function runs ONLY if the payment is successful
        "handler": async function (response) {
            
            // 1. Payment succeeded! You can log the Payment ID for your records
            console.log("Payment ID: " + response.razorpay_payment_id);
            
            // 2. NOW we tell Google Sheets to unlock the course for the user
            alert("Payment of ₹50 successful! Unlocking your course...");
            
            const res = await apiCall('enrollCourse', { userId: currentUser.id, course: courseName });
            
            if (res.success) {
                currentUser.enrolled = res.newEnrolled; 
                document.getElementById('landing-section').classList.add('hidden');
                document.getElementById('auth-section').classList.add('hidden');
                document.getElementById('dashboard-section').classList.remove('hidden');
                loadDashboard(); 
            } else {
                alert("Vault error: Payment processed, but course unlock failed. Please contact admin with your Payment ID.");
            }
        },
        
        // Prefill the user's details so they don't have to type them again
        "prefill": {
            "name": currentUser.name,
            // Assuming your backend sends the mobile number, otherwise it leaves it blank
            "contact": currentUser.mobile || "" 
        },
        "theme": {
            "color": "#004d99" // Matches your corporate blue theme!
        }
    };

    // Initialize and open the payment window
    var rzp1 = new Razorpay(options);
    
    rzp1.on('payment.failed', function (response){
        alert("Payment failed or cancelled. Reason: " + response.error.description);
    });
    
    rzp1.open();
}

// Triggers the Test Engine!
function openCourse(courseName) {
    // For fast execution, we are passing a default 'Test 1'
    // Ensure you have questions in your Google Sheet mapped to 'Test 1'
    startTest(courseName, "Test 1"); 
}
