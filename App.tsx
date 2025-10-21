import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ChatInterface from './components/ChatInterface';
import Disclaimer from './components/Disclaimer';
import AuthPage from './components/AuthPage';
import { Page, User } from './types';
import { SYSTEM_INSTRUCTION_GENERAL, SYSTEM_INSTRUCTION_ACADEMIC } from './constants';

const SESSION_KEY = 'slyntos-session';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.General);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const storedSession = sessionStorage.getItem(SESSION_KEY);
      return storedSession ? JSON.parse(storedSession) : null;
    } catch (e) {
      return null;
    }
  });

  const handleAuthSuccess = (user: User) => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    setCurrentUser(user);
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setCurrentUser(null);
    setCurrentPage(Page.General); // Reset to default page on logout
  };

  if (!currentUser) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col">
      <div className="w-full max-w-4xl mx-auto p-2 sm:p-4 flex flex-col flex-grow">
        <Header 
          currentPage={currentPage} 
          onNavigate={setCurrentPage}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
        <main className="flex-grow flex flex-col">
          {currentPage === Page.General ? (
            <ChatInterface
              key={`${currentUser.id}-general`} // Add key to force re-mount on user/page change
              page={currentPage}
              systemInstruction={SYSTEM_INSTRUCTION_GENERAL}
              placeholderText="Ask me anything, from writing a poem to debugging code."
              currentUser={currentUser}
            />
          ) : (
            <ChatInterface
              key={`${currentUser.id}-academic`} // Add key to force re-mount on user/page change
              page={currentPage}
              systemInstruction={SYSTEM_INSTRUCTION_ACADEMIC}
              placeholderText="Enter your academic prompt, e.g., 'Draft an introduction on the impact of quantum computing.'"
              currentUser={currentUser}
            >
              <Disclaimer />
            </ChatInterface>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;