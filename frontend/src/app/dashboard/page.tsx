
'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
    const [profile, setProfile] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        axios.get('http://localhost:3001/api/users/profile', {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => setProfile(res.data))
            .catch(() => router.push('/login'));
    }, []);

    if (!profile) return <div>Loading...</div>;

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p>Welcome, {profile.fullName} ({profile.role})</p>

            <div className="mt-4 p-4 border rounded bg-gray-50">
                <h2 className="text-xl font-semibold">Your Profile</h2>
                <pre className="mt-2 text-sm">{JSON.stringify(profile, null, 2)}</pre>
            </div>

            <button
                onClick={() => { localStorage.removeItem('token'); router.push('/login'); }}
                className="mt-4 p-2 bg-red-500 text-white rounded hover:bg-red-600"
            >Logout</button>
        </div>
    );
}
