import fs from 'fs';

const authPayload = {
    email: 'super1@fitnexus.test',
    password: 'Admin@123'
};

const leadsToSeed = [
    { name: 'Rahul Sharma', email: 'rahul@example.com', phone: '9876543210', status: 'NEW', source: 'WALK_IN', fitnessGoal: 'Weight Loss' },
    { name: 'Priya Patel', email: 'priya@example.com', phone: '9876543211', status: 'CONTACTED', source: 'FACEBOOK', fitnessGoal: 'Muscle Gain' },
    { name: 'Amit Kumar', email: 'amit@example.com', phone: '9876543212', status: 'INTERESTED', source: 'INSTAGRAM', fitnessGoal: 'General Fitness' },
    { name: 'Sneha Reddy', email: 'sneha@example.com', phone: '9876543213', status: 'TRIAL_BOOKED', source: 'REFERRAL', fitnessGoal: 'Weight Loss' },
    { name: 'Vikram Singh', email: 'vikram@example.com', phone: '9876543214', status: 'TRIAL_COMPLETED', source: 'WEBSITE', fitnessGoal: 'Body Building' },
    { name: 'Neha Gupta', email: 'neha@example.com', phone: '9876543215', status: 'NEGOTIATION', source: 'CORPORATE', fitnessGoal: 'General Fitness' },
    { name: 'Karan Malhotra', email: 'karan@example.com', phone: '9876543216', status: 'WON', source: 'WALK_IN', fitnessGoal: 'Muscle Gain' },
    { name: 'Riya Desai', email: 'riya@example.com', phone: '9876543217', status: 'LOST', source: 'FACEBOOK', fitnessGoal: 'Weight Loss' },
    { name: 'Arjun Nair', email: 'arjun@example.com', phone: '9876543218', status: 'NEW', source: 'WHATSAPP', fitnessGoal: 'General Fitness' },
    { name: 'Ananya Iyer', email: 'ananya@example.com', phone: '9876543219', status: 'CONTACTED', source: 'GOOGLE_ADS', fitnessGoal: 'Weight Loss' },
    { name: 'Rohan Joshi', email: 'rohan@example.com', phone: '9876543220', status: 'TRIAL_BOOKED', source: 'WALK_IN', fitnessGoal: 'Muscle Gain' },
    { name: 'Meera Kapoor', email: 'meera@example.com', phone: '9876543221', status: 'WON', source: 'REFERRAL', fitnessGoal: 'General Fitness' }
];

async function seed() {
    console.log("Authenticating...");
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
    
    if (!token) {
        console.error("No token found in response", authData);
        return;
    }
    console.log("Got token. Seeding leads...");

    for (const lead of leadsToSeed) {
        const res = await fetch('http://localhost:8082/api/leads', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(lead)
        });
        if (res.ok) {
            console.log(`Created lead: ${lead.name}`);
        } else {
            console.error(`Failed to create ${lead.name}:`, await res.text());
        }
    }
    console.log("Seeding complete.");
}

seed();
