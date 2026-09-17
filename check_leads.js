import fs from 'fs';

const authPayload = {
    email: 'super1@fitnexus.test',
    password: 'Admin@123'
};

async function check() {
    const authRes = await fetch('http://localhost:8082/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authPayload)
    });
    
    if (!authRes.ok) {
        console.error("Auth failed:", await authRes.text());
        return;
    }
    
    const authData = await authRes.json();
    const token = authData.token || authData.data?.token || authData.accessToken || authData.data?.accessToken;
    
    const res = await fetch('http://localhost:8082/api/leads', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log(res.status, res.statusText);
    console.log(await res.text());
}
check();
