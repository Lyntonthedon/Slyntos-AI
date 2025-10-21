import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message as MessageType } from '../types';
import SparklesIcon from './icons/SparklesIcon';
import UserIcon from './icons/UserIcon';

interface MessageProps {
  message: MessageType;
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const isModel = message.role === 'model';

  return (
    <div className={`flex items-start gap-4 p-4 md:p-6 ${isModel ? 'bg-white/5' : ''}`}>
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isModel ? 'bg-purple-600' : 'bg-blue-600'
        }`}
      >
        {isModel ? (
          <SparklesIcon className="w-5 h-5 text-white" />
        ) : (
          <UserIcon className="w-5 h-5 text-white" />
        )}
      </div>
      <div className="flex-1 pt-1 overflow-x-auto">
        <p className="font-bold text-gray-200">{isModel ? 'Slyntos AI' : 'You'}</p>
        <div className="prose prose-invert prose-p:text-gray-300 prose-p:my-2 prose-p:leading-relaxed whitespace-pre-wrap">
            {isModel && !message.content ? (
                <span className="animate-pulse">▌</span>
            ) : (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                </ReactMarkdown>
            )}
        </div>
        {message.sources && message.sources.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-700">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Sources</h4>
            <div className="flex flex-col space-y-2">
              {message.sources.map((source, index) => (
                <a
                  key={index}
                  href={source.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 hover:text-blue-300 hover:underline truncate block"
                  title={source.title}
                >
                  {index + 1}. {source.title}
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