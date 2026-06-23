// ==========================================
// FILE: api.js (Database & Global State)
// ==========================================
const API_URL = "https://script.google.com/macros/s/AKfycbyE3zs1OIZamJFv6beldzijirdsRFH2nq07rJCxjuAidXT0w0sA3q5vHsnQPwn4NFwwjg/exec"; 
let currentUser = null; 

async function apiCall(action, data) {
    try {
        const response = await fetch(API_URL, { 
            method: 'POST', 
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action, ...data }) 
        });
        return await response.json();
    } catch (error) {
        console.error("Vault Connection Error:", error);
        return { success: false, message: "Connection failed." };
    }
}
