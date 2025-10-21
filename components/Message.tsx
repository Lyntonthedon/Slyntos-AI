// FIX: Provide content for Message.tsx to resolve module not found error.
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message as MessageType, User, Source } from '../types';
import UserIcon from './icons/UserIcon';
import SlyntosLogo from './icons/SlyntosLogo';

interface MessageProps {
  message: MessageType;
  currentUser: User;
}

const Message: React.FC<MessageProps> = ({ message, currentUser }) => {
  const { role, content, sources, images } = message;
  const isUser = role === 'user';

  // Show blinking cursor while waiting for the first token
  const isStreaming = role === 'model' && content === '' && (!images || images.length === 0);

  // Tailwind's prose classes handle markdown styling beautifully.
  // prose-invert styles for dark mode. Customizations reduce spacing.
  const markdownProseClasses = "prose prose-invert prose-p:my-2 prose-headings:my-4 prose-blockquote:my-4 prose-ol:my-4 prose-ul:my-4 max-w-none text-gray-200";

  return (
    <div className={`py-4 px-4 sm:px-6 flex gap-3 sm:gap-4 ${isUser ? '' : 'bg-gray-900/50'}`}>
      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden ${isUser && !currentUser.profilePicture ? 'bg-blue-600' : ''}`}>
        {isUser ? (
          currentUser.profilePicture ? (
            <img src={currentUser.profilePicture} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <UserIcon className="w-5 h-5 text-white" />
          )
        ) : (
          <SlyntosLogo />
        )}
      </div>
      <div className="flex-1 overflow-x-auto">
        {(content || isStreaming) && (
            <div className={markdownProseClasses}>
            {isStreaming ? (
                <span className="animate-pulse">▌</span>
            ) : (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
                </ReactMarkdown>
            )}
            </div>
        )}
        {images && images.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            {images.map((imgData, index) => (
              <img
                key={index}
                src={`data:image/png;base64,${imgData}`}
                alt={`AI generated image ${index + 1}`}
                className="rounded-lg border border-gray-700"
              />
            ))}
          </div>
        )}
        {sources && sources.length > 0 && (
          <div className="mt-4">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Sources</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sources.map((source, index) => (
                <a
                  key={index}
                  href={source.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-gray-700 hover:bg-gray-600 p-3 rounded-lg transition-colors text-sm border border-gray-600"
                >
                  <p className="font-medium text-gray-200 truncate">{source.title}</p>

                  <p className="text-xs text-gray-400 truncate">{source.uri}</p>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Message;
