import React, { useState } from 'react';
import ChatInterface from './ChatInterface';
import DisclaimerWebsite from './DisclaimerWebsite';
import { Page, User } from '../types';
import { SYSTEM_INSTRUCTION_WEBSITE_CREATOR } from '../constants';

interface WebsiteCreatorPageProps {
  currentUser: User;
}

const WebsiteCreatorPage: React.FC<WebsiteCreatorPageProps> = ({ currentUser }) => {
  const [htmlCode, setHtmlCode] = useState<string>('<!DOCTYPE html><html><head><style>body { background-color: #111827; color: #9ca3af; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }</style></head><body><div><h1>Live Preview</h1><p>Your generated website will appear here.</p></div></body></html>');

  return (
    <div className="flex flex-col md:flex-row flex-grow h-full gap-4">
      {/* Chat Panel */}
      <div className="flex flex-col md:w-1/2 h-full">
         <ChatInterface
            key={`${currentUser.id}-website`}
            page={Page.WebsiteCreator}
            systemInstruction={SYSTEM_INSTRUCTION_WEBSITE_CREATOR}
            placeholderText="Describe the website you want to build..."
            currentUser={currentUser}
            onCodeGenerated={setHtmlCode}
          >
            <DisclaimerWebsite />
          </ChatInterface>
      </div>
      {/* Preview Panel */}
      <div className="md:w-1/2 h-full flex flex-col">
        <div className="flex-shrink-0 p-2 bg-gray-800 rounded-t-lg">
            <h2 className="text-sm font-semibold text-gray-300">Live Preview</h2>
        </div>
        <iframe
          srcDoc={htmlCode}
          title="Live Website Preview"
          className="w-full h-full border-2 border-gray-700 rounded-b-lg bg-white"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  );
};

export default WebsiteCreatorPage;
