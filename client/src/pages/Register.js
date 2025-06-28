import React, { useState } from 'react';

function validatePassword(password) {
  const minLength = /.{8,}/;
  const upper = /[A-Z]/;
  const number = /[0-9]/;
  if (!minLength.test(password)) return 'Password must be at least 8 characters.';
  if (!upper.test(password)) return 'Password must contain at least one uppercase letter.';
  if (!number.test(password)) return 'Password must contain at least one number.';
  return '';
}

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    const pwdError = validatePassword(password);
    if (pwdError) {
      setError(pwdError);
      return;
    }
    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) setMessage('Registered!');
      else setError(data.error || 'Error');
    } catch {
      setError('Network error');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '50px auto' }}>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required /><br /><br />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required /><br /><br />
        <input type="password" placeholder="Confirm Password" value={confirm} onChange={e => setConfirm(e.target.value)} required /><br /><br />
        <small>Password must be at least 8 characters, include 1 uppercase letter and 1 number.</small><br /><br />
        <button type="submit">Register</button>
      </form>
      <p style={{color:'red'}}>{error}</p>
      <p>{message}</p>
    </div>
  );
} 