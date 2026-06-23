// ==========================================
// FILE: test.js (Mock Exam Engine & Scoring)
// ==========================================
let currentQuestions = [];
let currentQIndex = 0;
let userAnswers = [];
let activeCourse = "";
let activeTest = "";

async function startTest(courseName, testName) {
    activeCourse = courseName;
    activeTest = testName;
    
    document.getElementById('dashboard-section').classList.add('hidden');
    document.getElementById('test-section').classList.remove('hidden');
    
    document.getElementById('q-text').innerText = "Loading questions from vault...";
    document.getElementById('options-container').innerHTML = "";
    
    const res = await apiCall('getTestQuestions', { course: courseName, testName: testName });
    
    if (res.success && res.data.length > 0) {
        currentQuestions = res.data;
        currentQIndex = 0;
        userAnswers = [];
        document.getElementById('total-q').innerText = currentQuestions.length;
        renderQuestion();
    } else {
        document.getElementById('q-text').innerText = `No active questions found for ${courseName}.`;
        document.getElementById('next-btn').style.display = "none";
    }
}

function renderQuestion() {
    const qData = currentQuestions[currentQIndex];
    document.getElementById('q-num').innerText = currentQIndex + 1;
    document.getElementById('q-text').innerText = qData.q;
    
    const optContainer = document.getElementById('options-container');
    optContainer.innerHTML = ""; // Clear old options
    
    const options = [qData.a, qData.b, qData.c, qData.d];
    options.forEach((optText, index) => {
        if(optText) {
            optContainer.innerHTML += `
                <div class="option-btn" onclick="selectOption(this, '${optText}')">
                    ${String.fromCharCode(65 + index)}. ${optText}
                </div>
            `;
        }
    });
    
    document.getElementById('next-btn').disabled = true; // Wait for answer
}

function selectOption(element, selectedAnswer) {
    // Remove highlight from all
    const allOptions = document.querySelectorAll('.option-btn');
    allOptions.forEach(opt => opt.classList.remove('selected'));
    
    // Highlight clicked
    element.classList.add('selected');
    
    // Save answer temporarily
    userAnswers[currentQIndex] = {
        questionId: currentQuestions[currentQIndex].id,
        selected: selectedAnswer,
        correct: currentQuestions[currentQIndex].correct
    };
    
    document.getElementById('next-btn').disabled = false;
}

function nextQuestion() {
    if (currentQIndex < currentQuestions.length - 1) {
        currentQIndex++;
        renderQuestion();
    } else {
        finishTest();
    }
    
    // Update button text on last question
    if (currentQIndex === currentQuestions.length - 1) {
        document.getElementById('next-btn').innerText = "Submit Exam";
    }
}

async function finishTest() {
    document.getElementById('test-section').innerHTML = `
        <h2 class="primary-text" style="text-align:center;">Calculating Score...</h2>
        <p style="text-align:center;">Please do not close this window.</p>
    `;
    
    const res = await apiCall('submitTest', {
        userId: currentUser.id,
        userName: currentUser.name,
        course: activeCourse,
        testName: activeTest,
        answers: userAnswers,
        totalQs: currentQuestions.length
    });
    
    if (res.success) {
        document.getElementById('test-section').innerHTML = `
            <div style="text-align:center;">
                <h2 style="color:green; font-size:2rem; margin-bottom:10px;">Exam Complete</h2>
                <h1 class="primary-text" style="font-size:3rem; margin-bottom:20px;">${res.percentage}%</h1>
                <p style="font-size:1.2rem;">You scored ${res.score} out of ${currentQuestions.length}</p>
                <button onclick="exitTest()" style="margin-top:30px;">Return to Dashboard</button>
            </div>
        `;
    } else {
        alert("Error saving results. Please take a screenshot of your answers.");
        exitTest();
    }
}

function exitTest() {
    // Force page reload to safely clear memory and go back to dashboard
    window.location.reload(); 
}
