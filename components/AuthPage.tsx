
import React, { useState } from 'react';
import { login, register } from '../services/authService';
import type { User } from '../types';
import SlyntosLogo from './icons/SlyntosLogo';
import Loader from './Loader';
import UserIcon from './icons/UserIcon';

interface AuthPageProps {
  onAuthSuccess: (user: User) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        setError('Profile picture must be under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setProfilePicture(reader.result as string);
        setError(null);
      };
      reader.onerror = () => {
        setError('Failed to read image file.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isRegisterMode) {
      if (!username.trim() || !password || !confirmPassword) {
        setError('All fields are required.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (!profilePicture) {
        setError('Please upload a profile picture.');
        return;
      }
      setIsLoading(true);
      try {
        const user = await register(username, password, profilePicture, accessCode);
        onAuthSuccess(user);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Registration failed.');
      } finally {
        setIsLoading(false);
      }
    } else { // Login mode
      if (!username.trim() || !password) {
        setError('Username and password are required.');
        return;
      }
      setIsLoading(true);
      try {
        const user = await login(username, password);
        onAuthSuccess(user);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Login failed.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <SlyntosLogo className="w-20 h-20 mx-auto mb-4" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">Welcome to Slyntos AI</h1>
          <p className="text-gray-400 mt-2">{isRegisterMode ? 'Create your account' : 'Sign in to continue'}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-gray-800 p-6 sm:p-8 rounded-lg shadow-2xl">
          {isRegisterMode && (
             <div className="mb-4 flex flex-col items-center">
                <label htmlFor="profilePicture" className="cursor-pointer">
                    <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center ring-2 ring-gray-600 hover:ring-blue-500 transition-all">
                        {profilePicture ? (
                            <img src={profilePicture} alt="Profile Preview" className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <UserIcon className="w-12 h-12 text-gray-500" />
                        )}
                    </div>
                </label>
                <input id="profilePicture" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                <span className="text-xs text-gray-400 mt-2">Upload Picture</span>
             </div>
          )}
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">Username</label>
            <input
              type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., adonai" disabled={isLoading}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password"className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <input
              type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••" disabled={isLoading}
            />
          </div>
          {isRegisterMode && (
            <>
                <div className="mb-4">
                <label htmlFor="confirmPassword"className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
                <input
                    type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••" disabled={isLoading}
                />
                </div>
                <div className="mb-6">
                <label htmlFor="accessCode" className="block text-sm font-medium text-gray-300 mb-2">Pro Access Code <span className="text-gray-500 text-xs font-normal">(Optional)</span></label>
                <input
                    type="text" id="accessCode" value={accessCode} onChange={(e) => setAccessCode(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter code for Paid Plan" disabled={isLoading}
                />
                </div>
            </>
          )}

          {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}

          <button
            type="submit" disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader /> : (isRegisterMode ? 'Register' : 'Login')}
          </button>
          
          <p className="text-center text-sm text-gray-400 mt-6">
            {isRegisterMode ? 'Already have an account? ' : "Don't have an account? "}
            <button
              type="button"
              onClick={() => { setIsRegisterMode(!isRegisterMode); setError(null); }}
              className="font-medium text-blue-400 hover:text-blue-500"
            >
              {isRegisterMode ? 'Login' : 'Register'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;
