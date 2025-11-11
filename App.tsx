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
  
  // Security Check: If user is free but on a paid page, redirect to General.
  useEffect(() => {
      if (currentUser && currentUser.plan !== 'paid') {
          if (currentPage === Page.Academic || currentPage === Page.WebsiteCreator) {
              setCurrentPage(Page.General);
          }
      }
  }, [currentPage, currentUser]);
  
  const createNewChat = useCallback(async () => {
    if (!currentUser) return;
    const newSession: ChatSession = {
      id: `session_${Date.now()}`,
      title: 'New Chat',
      createdAt: Date.now(),
      messages: [],
    };
    
    await saveSession(currentUser.id, currentPage, newSession);
    const updatedSessions = await getAllSessions(currentUser.id, currentPage);

    setSessions(updatedSessions);
    setActiveSessionId(newSession.id);
  }, [currentUser, currentPage]);

  useEffect(() => {
    if (currentUser) {
      const loadSessions = async () => {
        const loadedSessions = await getAllSessions(currentUser.id, currentPage);
        setSessions(loadedSessions);
        
        if (loadedSessions.length > 0) {
          setActiveSessionId(loadedSessions[0].id); // Select the most recent one
        } else {
          await createNewChat(); // Create a new one if none exist
        }
      };
      loadSessions();
    }
  }, [currentUser, currentPage, createNewChat]);

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
  
  const handleSessionUpdate = async (updatedSession: ChatSession) => {
      if (!currentUser) return;
      await saveSession(currentUser.id, currentPage, updatedSession);
      setSessions(prev => {
          const newSessions = [...prev];
          const index = newSessions.findIndex(s => s.id === updatedSession.id);
          if (index !== -1) {
              newSessions[index] = updatedSession;
          } else {
              newSessions.unshift(updatedSession);
          }
          return newSessions.sort((a, b) => b.createdAt - a.createdAt);
      });
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!currentUser) return;
    const updatedSessions = await deleteSession(currentUser.id, currentPage, sessionId);
    setSessions(updatedSessions);

    if (updatedSessions.length === 0) {
      await createNewChat(); // If the last chat was deleted, create a new one
    } else if (activeSessionId === sessionId) {
      // If the active chat was deleted, select the new most recent one
      setActiveSessionId(updatedSessions[0].id);
    }
  };
  
  if (!currentUser) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }
  
  const activeSession = sessions.find(s => s.id === activeSessionId);

  const renderPageContent = () => {
    if (!activeSession) return null;

    // Double check permissions during render
    if ((currentPage === Page.Academic || currentPage === Page.WebsiteCreator) && currentUser.plan !== 'paid') {
        return (
             <div className="relative flex-grow flex flex-col items-center justify-center bg-gray-800/50 rounded-lg text-center text-gray-400 p-4">
                 <p>Access Restricted. Please upgrade to Pro.</p>
             </div>
        );
    }

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
                  // This view is now only briefly visible during loading states
                  <div className="relative flex-grow flex flex-col items-center justify-center bg-gray-800/50 rounded-lg text-center text-gray-500 p-4">
                    <SlyntosLogo className="w-24 h-24 opacity-20 animate-pulse" />
                    <h2 className="mt-4 text-xl font-semibold">Loading Chat...</h2>
                  </div>
                )}
            </main>
        </div>
      </div>
    </div>
  );
};

export default App;