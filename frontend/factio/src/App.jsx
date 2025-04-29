import React, { useState } from 'react';
import './App.css';
import { FaEnvelope, FaUser, FaKey, FaGoogle, FaApple, FaFacebookF } from 'react-icons/fa';

export default function App() {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSignUp = (e) => {
        e.preventDefault();
        // Aquí conectarías con tu API o base de datos
        console.log({ email, username, password });
    };

    return (
        <div style={styles.background}>
            <h1 style={styles.title}>Factio</h1>
            <form style={styles.form} onSubmit={handleSignUp}>
                <label style={styles.label}>Email Address</label>
                <div style={styles.inputWrapper}>
                    <FaEnvelope style={styles.icon} />
                    <input
                        type="email"
                        placeholder="yourname@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={styles.input}
                    />
                </div>

                <label style={styles.label}>Your Name</label>
                <div style={styles.inputWrapper}>
                    <FaUser style={styles.icon} />
                    <input
                        type="text"
                        placeholder="@yourname"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        style={styles.input}
                    />
                </div>

                <label style={styles.label}>Password</label>
                <div style={styles.inputWrapper}>
                    <FaKey style={styles.icon} />
                    <input
                        type="password"
                        placeholder="********"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={styles.input}
                    />
                </div>

                <button type="submit" style={styles.signUpButton}>Sign up</button>
            </form>

            <span style={styles.orText}>Or sign up with</span>
            <div style={styles.socialContainer}>
                <button style={styles.socialButton}><FaGoogle /></button>
                <button style={styles.socialButton}><FaApple /></button>
                <button style={styles.socialButton}><FaFacebookF /></button>
            </div>
        </div>
    );
}

const styles = {
    background: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#0a0a0a',
        padding: '0 20px',
    },
    title: {
        fontSize: '48px',
        color: '#fff',
        marginBottom: '40px',
    },
    form: {
        width: '100%',
        maxWidth: '400px',
        display: 'flex',
        flexDirection: 'column',
    },
    label: {
        color: '#fff',
        fontSize: '14px',
        marginBottom: '6px',
    },
    inputWrapper: {
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '20px',
    },
    icon: {
        marginRight: '8px',
        color: '#888',
    },
    input: {
        flex: 1,
        height: '32px',
        background: 'transparent',
        border: 'none',
        outline: 'none',
        color: '#fff',
        fontSize: '16px',
    },
    signUpButton: {
        background: 'linear-gradient(90deg, #C84DF5, #DE672A)',
        border: 'none',
        borderRadius: '8px',
        padding: '14px',
        color: '#fff',
        fontSize: '16px',
        cursor: 'pointer',
        marginTop: '10px',
    },
    orText: {
        color: '#aaa',
        margin: '30px 0 16px',
    },
    socialContainer: {
        display: 'flex',
        justifyContent: 'space-between',
        width: '180px',
    },
    socialButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        border: 'none',
        borderRadius: '8px',
        padding: '12px',
        cursor: 'pointer',
        color: '#fff',
        fontSize: '18px',
    },
};
