// Run this in browser console on http://localhost:3001
// Open DevTools (F12) -> Console tab -> Paste this code and press Enter

(async function diagnoseAuth() {
    console.log('=== Authentication Diagnostics ===\n');

    // 1. Check localStorage
    console.log('1. Checking localStorage:');
    console.log('  - access_token:', localStorage.getItem('access_token') ? '✓ EXISTS' : '✗ MISSING');
    console.log('  - user_info:', localStorage.getItem('user_info') ? '✓ EXISTS' : '✗ MISSING');

    // 2. Test backend health
    console.log('\n2. Testing Backend Health:');
    try {
        const health = await fetch('http://localhost:3000/health');
        console.log('  - Status:', health.status, health.statusText);
    } catch (e) {
        console.log('  - Error:', e.message);
    }

    // 3. Test login
    console.log('\n3. Testing Login:');
    try {
        const loginRes = await fetch('http://localhost:3000/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@test.com',
                password: 'xK9#mP2$vL8@nQ5*wR4'
            })
        });

        const loginData = await loginRes.json();
        console.log('  - Login status:', loginRes.status);
        console.log('  - Has token:', !!loginData.access_token);

        // Store token
        if (loginData.access_token) {
            localStorage.setItem('access_token', loginData.access_token);
            localStorage.setItem('user_info', JSON.stringify(loginData.user));
            console.log('  - ✓ Token stored to localStorage');
        }
    } catch (e) {
        console.log('  - ✗ Login failed:', e.message);
    }

    // 4. Test admin API
    console.log('\n4. Testing Admin API:');
    const token = localStorage.getItem('access_token');
    console.log('  - Token (first 50 chars):', token ? token.substring(0, 50) + '...' : 'NO TOKEN');

    try {
        const adminRes = await fetch('http://localhost:3000/v1/admin/posts', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('  - Response status:', adminRes.status, adminRes.statusText);

        if (adminRes.ok) {
            const data = await adminRes.json();
            console.log('  - ✓ Success! Posts count:', data.posts?.length || 0);
            console.log('  - Total posts:', data.total);
        } else {
            const errorText = await adminRes.text();
            console.log('  - ✗ Failed:', errorText);
        }
    } catch (e) {
        console.log('  - ✗ Error:', e.message);
    }

    console.log('\n=== End Diagnostics ===');

    // 5. Recommend action
    console.log('\n💡 If admin API failed, try reloading the page: location.reload()');
})();
