// FIX: Provide content for AuthPage.tsx to resolve module not found error.
import React, { useState } from 'react';
import { login } from '../services/authService';
import type { User } from '../types';
import SlyntosLogo from './icons/SlyntosLogo';
import Loader from './Loader';

interface AuthPageProps {
  onAuthSuccess: (user: User) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter a username.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const user = await login(username);
      onAuthSuccess(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <SlyntosLogo className="w-20 h-20 mx-auto mb-4" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">Welcome to Slyntos AI</h1>
          <p className="text-gray-400 mt-2">Please enter a username to continue.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-gray-800 p-6 sm:p-8 rounded-lg shadow-2xl">
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., adonai"
              disabled={isLoading}
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm mb-4">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader /> : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;