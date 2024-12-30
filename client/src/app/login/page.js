'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-toastify';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();

    const handleLogin = async () => {
        try {
            const response = await axios.post('http://localhost:5000/api/user/login', {
                email,
                password,
            });
            if (Math.floor(response.status / 10) == 20) {
                localStorage.setItem('token', response.data.token);
                toast.success('login successful!');
                router.push('/');
            } else {
                alert('Invalid credentials');
            }
        } catch (error) {
            console.error('Error logging in:', error);
        }
    };

    return (
        <div className="container">
            <h1>Login</h1>
            <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <button className="button" onClick={handleLogin}>
                Login
            </button>
            <p>
                Don’t have an account? <a href="/signup">Sign up</a>
            </p>
        </div>
    );
}
