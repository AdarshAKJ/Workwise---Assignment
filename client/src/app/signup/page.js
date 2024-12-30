'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-toastify';

export default function Signup() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [number, setNumber] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const router = useRouter();

    const handleSignup = async () => {
        // Input validation
        try {
            const response = await axios.post(
                'http://localhost:5000/api/user/register', // Use relative URL for portability
                { name, email, password, number },
                { headers: { 'Content-Type': 'application/json' } }
            );
            console.log(response);
            if (Math.floor(response.status / 10) == 20) {
                // alert('Signup successful! Please login.');
                toast.success('Signup successful! Please login.');
                setTimeout(() => {
                    router.push('/login');
                }, 1000);
            } else {
                setErrorMessage(response.data.message || 'Signup failed.');
            }
        } catch (error) {
            console.error('Error signing up:', error);
            setErrorMessage('An error occurred. Please try again later.');
        }
    };

    return (
        <div className="container">
            <h1>Sign Up</h1>
            <form onSubmit={(e) => e.preventDefault()}>
                <input
                    type="text"
                    placeholder="Enter your Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
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
                <input
                    type="text"
                    placeholder="Enter your mobile number"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                />
                <button className="button" onClick={handleSignup}>
                    Sign Up
                </button>
            </form>
            {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
            <p>
                Already have an account? <a href="/login">Log in</a>
            </p>
        </div>
    );
}
