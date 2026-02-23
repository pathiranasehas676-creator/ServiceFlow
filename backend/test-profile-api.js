
async function testProfile() {
    const BASE_URL = 'http://127.0.0.1:3001/api/v1';
    try {
        console.log('Logging in...');
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'john.worker@example.com',
                password: 'Password123!'
            })
        });

        if (!loginRes.ok) {
            const data = await loginRes.json();
            console.error('Login Failed:', loginRes.status, data);
            return;
        }

        const loginData = await loginRes.json();
        const token = loginData.accessToken;
        console.log('Login successful. Fetching profile...');

        const profileRes = await fetch(`${BASE_URL}/users/profile`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` }
        });

        const status = profileRes.status;
        const contentType = profileRes.headers.get('content-type');
        console.log('Status:', status);
        console.log('Content-Type:', contentType);

        try {
            const data = await profileRes.json();
            console.log('Profile Response:', JSON.stringify(data, null, 2));
        } catch (e) {
            const text = await profileRes.text();
            console.log('Raw Response (Not JSON):', text);
        }

    } catch (e) {
        console.error('Test script failed:', e.message);
    }
}

testProfile();
