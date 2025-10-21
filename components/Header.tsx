// FIX: Provide content for Header.tsx to resolve module not found error.
import React from 'react';
import { Page, User } from '../types';
import SlyntosLogo from './icons/SlyntosLogo';

interface HeaderProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  currentUser: User;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentPage, onNavigate, currentUser, onLogout }) => {
  const NavButton: React.FC<{ page: Page, children: React.ReactNode }> = ({ page, children }) => {
    const isActive = currentPage === page;
    return (
      <button
        onClick={() => onNavigate(page)}
        className={`px-3 sm:px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          isActive
            ? 'bg-blue-600 text-white'
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
        }`}
      >
        {children}
      </button>
    );
  };

  return (
    <header className="mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <SlyntosLogo className="w-10 h-10" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-100">Slyntos AI</h1>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400 hidden sm:inline">Welcome, {currentUser.username}</span>
            <button 
              onClick={onLogout}
              className="px-3 py-1 text-sm font-medium rounded-md bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white transition-colors"
            >
              Logout
            </button>
        </div>
      </div>
      <nav className="flex items-center gap-2 p-1 bg-gray-800 rounded-lg">
        <NavButton page={Page.General}>General Chat</NavButton>
        <NavButton page={Page.Academic}>Academic Writer</NavButton>
      </nav>
    </header>
  );
};

export default Header;