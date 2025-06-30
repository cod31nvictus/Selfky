import React, { useState } from 'react';
import { Link } from 'react-router-dom';

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
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsLoading(true);
    
    if (password !== confirm) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }
    
    const pwdError = validatePassword(password);
    if (pwdError) {
      setError(pwdError);
      setIsLoading(false);
      return;
    }
    
    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Account created successfully! You can now sign in.');
        setEmail('');
        setPassword('');
        setConfirm('');
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch {
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8" style={{fontFamily: '"Public Sans", "Noto Sans", sans-serif'}}>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="size-24">
            <img src="/selfky-logo.png" alt="Selfky Logo" className="w-full h-full object-contain" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-[#101418]">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-[#5c728a]">
          Or{' '}
          <Link to="/login" className="font-medium text-[#101418] hover:text-[#5c728a]">
            sign in to your existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#101418]">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-[#d4dbe2] rounded-md shadow-sm placeholder-[#5c728a] focus:outline-none focus:ring-[#101418] focus:border-[#101418] sm:text-sm"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#101418]">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-[#d4dbe2] rounded-md shadow-sm placeholder-[#5c728a] focus:outline-none focus:ring-[#101418] focus:border-[#101418] sm:text-sm"
                  placeholder="Create a password"
                />
              </div>
              <p className="mt-1 text-xs text-[#5c728a]">
                Must be at least 8 characters with 1 uppercase letter and 1 number
              </p>
            </div>

            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-[#101418]">
                Confirm Password
              </label>
              <div className="mt-1">
                <input
                  id="confirm"
                  name="confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-[#d4dbe2] rounded-md shadow-sm placeholder-[#5c728a] focus:outline-none focus:ring-[#101418] focus:border-[#101418] sm:text-sm"
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#101418] hover:bg-[#2a2f36] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#101418] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating account...' : 'Create account'}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-3 rounded-md text-sm bg-red-50 text-red-800 border border-red-200">
              {error}
            </div>
          )}

          {message && (
            <div className="mt-4 p-3 rounded-md text-sm bg-green-50 text-green-800 border border-green-200">
              {message}
            </div>
          )}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#d4dbe2]" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-[#5c728a]">Already have an account?</span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/login"
                className="w-full inline-flex justify-center py-2 px-4 border border-[#d4dbe2] rounded-md shadow-sm bg-white text-sm font-medium text-[#101418] hover:bg-gray-50"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 