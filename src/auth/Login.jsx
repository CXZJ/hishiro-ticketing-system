import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaApple, FaGoogle } from 'react-icons/fa';
import { useAuthState } from "react-firebase-hooks/auth";
import { logInWithEmailAndPassword, signInWithGoogle, auth } from '../firebase';
import bg   from '../assets/background-scaled.png';
import logo from '../assets/logo.png';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [user, loading, error] = useAuthState(auth);
  const navigate = useNavigate();
  const location = useLocation();

  // Get the redirect path from location state, or default to dashboard
  const from = location.state?.from || '/dashboard';

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await logInWithEmailAndPassword(email, password);
      navigate(from); // Redirect to the attempted URL or dashboard
    } catch (err) {
      alert(err.message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const user = await signInWithGoogle(); // returns the Firebase user object

      // Sends user profile to backend
      await fetch('http://localhost:5001/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          username: user.displayName, 
          gender: '', 
          phone: user.phoneNumber || '',
          address: '',
          authProvider: "google"
        })
      });

      navigate(from); // Redirect to the attempted URL or dashboard
    } catch (err) {
      setApiError(err.message);
    }
  };

  return (
    <div
    className="min-h-screen flex items-center justify-center"
    style={{
      backgroundImage: `url(${bg})`,
      backgroundRepeat: 'repeat',
      backgroundSize: '1000px 800px',
    }}
    >
      <button
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 bg-gray-200 hover:bg-gray-300 rounded-full px-4 py-2 text-sm font-medium shadow"
        style={{ zIndex: 10 }}
      >
        ← 
      </button>
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-lg p-8 w-full max-w-sm"
      >
        <img src={logo} alt="Hishiro" className="h-10 mx-auto mb-4" />
        <h2 className="text-center text-2xl font-semibold mb-6">
          Login to Account
        </h2>

        <label className="block mb-1 text-sm font-medium">Email address</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full border border-gray-300 rounded px-3 py-2 mb-4 focus:ring focus:outline-none"
          required
        />

        <div className="flex justify-between items-center mb-1">
          <label className="text-sm font-medium">Password</label>
          <Link to="/reset" className="text-sm text-blue-600 hover:underline">
            Forgot Password?
          </Link>
        </div>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full border border-gray-300 rounded px-3 py-2 mb-2 focus:ring focus:outline-none"
          required
        />

        <label className="flex items-center mb-4">
          <input
            type="checkbox"
            checked={remember}
            onChange={e => setRemember(e.target.checked)}
            className="mr-2"
          />
          Remember Password
        </label>

        <button
          type="submit"
          className="w-full bg-black text-white rounded px-4 py-2 mb-4 hover:opacity-90"
        >
          Sign In
        </button>

        <div className="space-y-2">
          <button
            type="button"
            className="w-full flex items-center justify-center border border-gray-300 rounded px-4 py-2 hover:bg-gray-100"
          >
            <FaApple className="mr-2" /> Login with Apple
          </button>
          <button
            type="button"
            className="w-full flex items-center justify-center border border-gray-300 rounded px-4 py-2 hover:bg-gray-100"
            onClick={handleGoogleSignIn}
          >
            <FaGoogle className="mr-2 text-red-500" /> Login with Google
          </button>
        </div>

        <p className="text-center text-sm text-gray-600 mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-blue-600 hover:underline">
            Create Account
          </Link>
        </p>
      </form>
    </div>
);
}
