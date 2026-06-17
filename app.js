async function apiCall(action, data) {
    try {
        const response = await fetch(API_URL, { 
            method: 'POST', 
            headers: {
                // This exact header is required to bypass GAS CORS restrictions
                'Content-Type': 'text/plain;charset=utf-8' 
            },
            body: JSON.stringify({ action, ...data }) 
        });
        
        return await response.json();
    } catch (error) {
        console.error("Vault Connection Error:", error);
        // Returns a safe object so your UI doesn't freeze
        return { success: false, message: "Connection failed. Check browser console." };
    }
}
