// ==========================================
// FILE 3: courses.js (Catalog, Dashboard & Enrollment)
// ==========================================

window.onload = async function() {
    if (typeof API_URL === 'undefined' || API_URL === "https://script.google.com/macros/s/AKfycbyE3zs1OIZamJFv6beldzijirdsRFH2nq07rJCxjuAidXT0w0sA3q5vHsnQPwn4NFwwjg/exec") {
        displaySampleCourses();
        return;
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
    courses.forEach(course => {
        list.innerHTML += `
            <div class="card">
                <h4 class="primary-text" style="font-size:1.2rem; margin-bottom:5px;">${course.name}</h4>
                <p style="color:#64748b; font-size:0.95rem; margin-bottom:10px;">${course.desc}</p>
                <span style="font-weight:600; color:#004d99; display:block; margin-bottom:10px;">Cost: ₹${course.price}</span>
                <button onclick="enrollIn('${course.name}')" style="padding:10px;">Enroll Now</button>
            </div>`;
    });
}

function displaySampleCourses() {
    const sample = [
        { name: "JAIIB / CAIIB Elite Masterclass", desc: "Comprehensive mock papers and advanced practice configurations.", price: "4999" },
        { name: "Credit Management & Risk Analysis", desc: "Targeted operational test sets tailored for promotional exams.", price: "2999" }
    ];
    displayCourses(sample);
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
                        Access Modules
                    </button>
                </div>`;
        }
    });
}

async function enrollIn(courseName) {
    if (!currentUser) { alert("Please login to enroll in a course."); showAuth(); return; }

    const res = await apiCall('enrollCourse', { userId: currentUser.id, course: courseName });
    if (res.success) {
        alert(`Successfully enrolled in ${courseName}!`);
        currentUser.enrolled = res.newEnrolled; 
        document.getElementById('landing-section').classList.add('hidden');
        document.getElementById('auth-section').classList.add('hidden');
        document.getElementById('dashboard-section').classList.remove('hidden');
        loadDashboard(); 
    } else {
        alert("Enrollment failed. Please try again.");
    }
}

function openCourse(courseName) {
    alert("Module ready: " + courseName + ". \n(Test Viewer UI coming in next update!)");
}
