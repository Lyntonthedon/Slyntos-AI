import React, { useState } from 'react';
import Header from './components/Header';
import ChatInterface from './components/ChatInterface';
import Disclaimer from './components/Disclaimer';
import { Page } from './types';
import { SYSTEM_INSTRUCTION_GENERAL, SYSTEM_INSTRUCTION_ACADEMIC } from './constants';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.General);

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col">
      <div className="w-full max-w-4xl mx-auto p-4 flex flex-col flex-grow">
        <Header currentPage={currentPage} onNavigate={setCurrentPage} />
        <main className="flex-grow flex flex-col">
          {currentPage === Page.General ? (
            <ChatInterface
              page={currentPage}
              systemInstruction={SYSTEM_INSTRUCTION_GENERAL}
              placeholderText="Ask me anything, from writing a poem to debugging code."
            />
          ) : (
            <ChatInterface
              page={currentPage}
              systemInstruction={SYSTEM_INSTRUCTION_ACADEMIC}
              placeholderText="Enter your academic prompt, e.g., 'Draft an introduction on the impact of quantum computing.'"
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