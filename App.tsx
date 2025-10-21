import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import ChatInterface from './components/ChatInterface';
import Disclaimer from './components/Disclaimer';
import AuthPage from './components/AuthPage';
import WebsiteCreatorPage from './components/WebsiteCreatorPage';
import ChatHistorySidebar from './components/ChatHistorySidebar';
import { Page, User, ChatSession } from './types';
import { getAllSessions, saveSession, deleteSession } from './services/chatHistoryService';
import { SYSTEM_INSTRUCTION_GENERAL, SYSTEM_INSTRUCTION_ACADEMIC } from './constants';
import SlyntosLogo from './components/icons/SlyntosLogo';

const SESSION_KEY = 'slyntos-session';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.General);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const storedSession = sessionStorage.getItem(SESSION_KEY);
      return storedSession ? JSON.parse(storedSession) : null;
    } catch (e) {
      return null;
    }
  });
  
  const createNewChat = useCallback(() => {
    if (!currentUser) return;
    const newSession: ChatSession = {
      id: `session_${Date.now()}`,
      title: 'New Chat',
      createdAt: Date.now(),
      messages: [],
    };
    
    setSessions(prevSessions => {
      const updatedSessions = [newSession, ...prevSessions];
      // Immediately save the new session to prevent it from being lost if the user navigates away.
      saveSession(currentUser.id, currentPage, newSession);
      return updatedSessions;
    });
    
    setActiveSessionId(newSession.id);
  }, [currentUser, currentPage]);

  useEffect(() => {
    if (currentUser) {
      // First, always ensure no chat is active when the user or page context changes.
      // This prevents a chat from being automatically selected on login or page switch.
      setActiveSessionId(null);
      
      // Then, load the sessions for the new context.
      const loadedSessions = getAllSessions(currentUser.id, currentPage);
      setSessions(loadedSessions);
    }
  }, [currentUser, currentPage]);

  const handleAuthSuccess = (user: User) => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    setCurrentUser(user);
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setCurrentUser(null);
    setCurrentPage(Page.General);
    setSessions([]);
    setActiveSessionId(null);
  };
  
  const handleSessionUpdate = (updatedSession: ChatSession) => {
      if (!currentUser) return;
      setSessions(prev => {
          const newSessions = [...prev];
          const index = newSessions.findIndex(s => s.id === updatedSession.id);
          if (index !== -1) {
              newSessions[index] = updatedSession;
          }
          return newSessions;
      });
      saveSession(currentUser.id, currentPage, updatedSession);
  };

  const handleDeleteSession = (sessionId: string) => {
    if (!currentUser) return;
    const updatedSessions = deleteSession(currentUser.id, currentPage, sessionId);
    setSessions(updatedSessions);
    if (activeSessionId === sessionId) {
        // After deleting the active session, return to the placeholder view.
        setActiveSessionId(null);
    }
  };
  
  if (!currentUser) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }
  
  const activeSession = sessions.find(s => s.id === activeSessionId);

  const renderPageContent = () => {
    if (!activeSession) return null;

    switch (currentPage) {
      case Page.General:
        return (
          <ChatInterface
            key={activeSession.id}
            session={activeSession}
            onSessionUpdate={handleSessionUpdate}
            page={currentPage}
            systemInstruction={SYSTEM_INSTRUCTION_GENERAL}
            placeholderText="Ask me anything, or try 'generate an image of a robot cat'..."
            currentUser={currentUser}
          />
        );
      case Page.Academic:
        return (
          <ChatInterface
            key={activeSession.id}
            session={activeSession}
            onSessionUpdate={handleSessionUpdate}
            page={currentPage}
            systemInstruction={SYSTEM_INSTRUCTION_ACADEMIC}
            placeholderText="Enter your academic prompt..."
            currentUser={currentUser}
          >
            <Disclaimer />
          </ChatInterface>
        );
      case Page.WebsiteCreator:
        return <WebsiteCreatorPage 
            key={activeSession.id}
            session={activeSession}
            onSessionUpdate={handleSessionUpdate}
            currentUser={currentUser} 
        />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col">
      <div className="w-full max-w-7xl mx-auto p-2 sm:p-4 flex flex-col flex-grow h-screen">
        <Header 
          currentPage={currentPage} 
          onNavigate={setCurrentPage}
          currentUser={currentUser}
          onLogout={handleLogout}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        <div className="flex-grow flex overflow-hidden gap-4">
            <ChatHistorySidebar
                sessions={sessions}
                activeSessionId={activeSessionId}
                onSelectSession={setActiveSessionId}
                onNewChat={createNewChat}
                onDeleteSession={handleDeleteSession}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />
            <main className="flex-grow flex flex-col overflow-hidden">
                {activeSession ? (
                  renderPageContent()
                ) : (
                  <div className="relative flex-grow flex flex-col items-center justify-center bg-gray-800/50 rounded-lg text-center text-gray-500 p-4">
                    <SlyntosLogo className="w-24 h-24 opacity-20" />
                    <h2 className="mt-4 text-xl font-semibold">Select or start a new chat</h2>
                    <p className="mt-2 text-sm max-w-xs">Your conversations are saved here. Choose one from the sidebar or click "New Chat" to begin.</p>
                  </div>
                )}
            </main>
        </div>
      </div>
    </div>
  );
};

export default App;