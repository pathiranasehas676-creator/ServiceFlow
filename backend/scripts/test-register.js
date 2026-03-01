async function testRegister() {
    const payload = {
        fullName: 'sehas',
        email: 'pathiranasehas988@gmail.com',
        phoneNumber: '86212630',
        password: 'Password123!'
    };

    try {
        const response = await fetch('http://localhost:3001/api/v1/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

testRegister();
