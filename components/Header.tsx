
import React from 'react';
import { Page } from '../types';

interface HeaderProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const Header: React.FC<HeaderProps> = ({ currentPage, onNavigate }) => {
  const navItemClasses = "px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200";
  const activeClasses = "bg-purple-600 text-white";
  const inactiveClasses = "text-gray-300 hover:bg-gray-700 hover:text-white";

  return (
    <header className="py-4 px-6 mb-4 flex flex-col sm:flex-row justify-between items-center text-white">
      <div className="flex items-center mb-4 sm:mb-0">
        <div className="w-10 h-10 mr-3 p-1 bg-gradient-to-br from-purple-600 to-blue-500 rounded-full flex items-center justify-center">
            <img src="https://i.imgur.com/2Y0s2sL.png" alt="Slyntos AI Logo" className="w-8 h-8"/>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Slyntos AI</h1>
      </div>
      <nav className="flex space-x-2 bg-gray-800 p-1.5 rounded-lg border border-gray-700">
        <button
          onClick={() => onNavigate(Page.General)}
          className={`${navItemClasses} ${currentPage === Page.General ? activeClasses : inactiveClasses}`}
        >
          General
        </button>
        <button
          onClick={() => onNavigate(Page.Academic)}
          className={`${navItemClasses} ${currentPage === Page.Academic ? activeClasses : inactiveClasses}`}
        >
          Academic
        </button>
      </nav>
    </header>
  );
};

export default Header;
