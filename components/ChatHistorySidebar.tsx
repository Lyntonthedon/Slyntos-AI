import React from 'react';
import type { ChatSession } from '../types';
import TrashIcon from './icons/TrashIcon';

const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
    </svg>
);

interface ChatHistorySidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const ChatHistorySidebar: React.FC<ChatHistorySidebarProps> = ({ sessions, activeSessionId, onSelectSession, onNewChat, onDeleteSession, isOpen, onClose }) => {
  const handleDelete = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation(); // Prevent session selection when deleting
    if (window.confirm("Are you sure you want to delete this chat?")) {
      onDeleteSession(sessionId);
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-gray-800 text-white">
      <div className="p-2">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-semibold transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          New Chat
        </button>
      </div>
      <nav className="flex-grow overflow-y-auto p-2">
        <ul>
          {sessions.map(session => (
            <li key={session.id}>
              <button
                onClick={() => onSelectSession(session.id)}
                className={`w-full text-left group flex items-center justify-between p-2 my-1 rounded-md text-sm transition-colors ${
                  activeSessionId === session.id ? 'bg-gray-700' : 'hover:bg-gray-700/50'
                }`}
              >
                <span className="truncate flex-1">{session.title}</span>
                <span 
                  onClick={(e) => handleDelete(e, session.id)} 
                  className="ml-2 text-gray-500 group-hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Delete chat"
                >
                    <TrashIcon className="w-4 h-4" />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-black/60 z-30 md:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Sidebar */}
      <aside
        className={`fixed md:relative z-40 md:z-auto w-64 flex-shrink-0 h-full transition-transform transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default ChatHistorySidebar;
