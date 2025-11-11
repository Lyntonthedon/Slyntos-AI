
import React from 'react';
import { Page, User } from '../types';
import SlyntosLogo from './icons/SlyntosLogo';
import UserIcon from './icons/UserIcon';
import MenuIcon from './icons/MenuIcon';
import LockIcon from './icons/LockIcon';

interface HeaderProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  currentUser: User;
  onLogout: () => void;
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentPage, onNavigate, currentUser, onLogout, onToggleSidebar }) => {
  const NavButton: React.FC<{ page: Page, children: React.ReactNode }> = ({ page, children }) => {
    const isActive = currentPage === page;
    const isRestricted = (page === Page.Academic || page === Page.WebsiteCreator) && currentUser.plan !== 'paid';

    const handleClick = () => {
        if (!isRestricted) {
            onNavigate(page);
        } else {
            alert("This feature is available on the Paid Plan. Please create a new account with a valid Pro Access Code to use it.");
        }
    };

    return (
      <button
        onClick={handleClick}
        className={`px-3 sm:px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
          isActive
            ? 'bg-blue-600 text-white'
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
        } ${isRestricted ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        {children}
        {isRestricted && <LockIcon className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />}
      </button>
    );
  };

  return (
    <header className="mb-4 flex-shrink-0">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button onClick={onToggleSidebar} className="md:hidden p-1 text-gray-400 hover:text-white">
            <MenuIcon className="w-6 h-6" />
          </button>
          <SlyntosLogo className="w-10 h-10 hidden sm:block" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-100">Slyntos AI</h1>
        </div>
        <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-200">
                  {currentUser.username} 
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${currentUser.plan === 'paid' ? 'bg-gradient-to-r from-yellow-600 to-yellow-400 text-black font-bold' : 'bg-gray-600 text-gray-300'}`}>
                    {currentUser.plan === 'paid' ? 'PRO' : 'FREE'}
                  </span>
                </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center ring-2 ring-gray-600">
                {currentUser.profilePicture ? (
                    <img src={currentUser.profilePicture} alt="Profile" className="w-full h-full rounded-full object-cover" />
                ) : (
                    <UserIcon className="w-6 h-6 text-gray-400" />
                )}
            </div>
            <button 
              onClick={onLogout}
              className="px-3 py-1.5 text-sm font-medium rounded-md bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white transition-colors"
            >
              Logout
            </button>
        </div>
      </div>
      <nav className="flex items-center gap-2 p-1 bg-gray-800 rounded-lg overflow-x-auto">
        <NavButton page={Page.General}>General Chat</NavButton>
        <NavButton page={Page.Academic}>Academic Writer</NavButton>
        <NavButton page={Page.WebsiteCreator}>Website Creator</NavButton>
      </nav>
    </header>
  );
};

export default Header;
