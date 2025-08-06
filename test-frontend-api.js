// Test script to check if frontend can call API correctly
// Run this in browser console when you're on the MFA setup page

console.log('Testing frontend API calls...');

// Test API configuration
console.log('Current environment:', import.meta.env.PROD ? 'PRODUCTION' : 'DEVELOPMENT');
console.log('API Base URL will be:', import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:4000'));

// Test API call directly
async function testAPI() {
    try {
        const response = await fetch('/api/mfa/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                uid: 'test-uid',
                email: 'test@example.com'
            })
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', [...response.headers.entries()]);
        
        if (response.ok) {
            const data = await response.json();
            console.log('Success! QR Data URL length:', data.qrDataURL?.length);
            console.log('QR starts with:', data.qrDataURL?.substring(0, 50));
        } else {
            const errorText = await response.text();
            console.error('Error response:', errorText);
        }
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

// Run the test
testAPI();
