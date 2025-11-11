import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message as MessageType, User, Source } from '../types';
import UserIcon from './icons/UserIcon';
import SlyntosLogo from './icons/SlyntosLogo';
import LinkIcon from './icons/LinkIcon';
import ClipboardIcon from './icons/ClipboardIcon';
import CheckIcon from './icons/CheckIcon';

interface MessageProps {
  message: MessageType;
  currentUser: User;
}

const Message: React.FC<MessageProps> = ({ message, currentUser }) => {
  const { role, content, sources, images, files, audioUrl } = message;
  const isUser = role === 'user';
  const [copied, setCopied] = useState(false);

  // Show blinking cursor while waiting for the first token
  const isStreaming = role === 'model' && content === '' && (!images || images.length === 0) && !audioUrl;

  const markdownProseClasses = "prose prose-invert prose-p:my-2 prose-headings:my-4 prose-blockquote:my-4 prose-ol:my-4 prose-ul:my-4 max-w-none text-gray-200";

  const handleCopy = () => {
      if (!content) return;
      navigator.clipboard.writeText(content).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
      });
  };

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
      <div className="flex-1 overflow-x-auto relative group">
        {files && files.length > 0 && (
          <div className="mb-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {files.map((file, index) => {
                if (file.type.startsWith('image/')) {
                   return (
                    <div key={index} className="relative group bg-gray-800 rounded-lg overflow-hidden">
                        <img
                            src={`data:${file.type};base64,${file.data}`}
                            alt={file.name}
                            className="rounded-lg border border-gray-700 w-full h-24 object-cover"
                        />
                    </div>
                   );
                }
                if (file.type.startsWith('video/')) {
                    return (
                        <div key={index} className="bg-gray-800 p-2 rounded text-xs text-gray-300 flex items-center gap-2">
                            <span className="font-bold">VIDEO:</span> {file.name}
                        </div>
                    )
                }
                if (file.type.startsWith('audio/')) {
                    return (
                        <div key={index} className="bg-gray-800 p-2 rounded text-xs text-gray-300 flex items-center gap-2">
                            <span className="font-bold">AUDIO:</span> {file.name}
                        </div>
                    )
                }
                return null;
            })}
          </div>
        )}
        
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

        {/* Copy Button for AI messages */}
        {!isUser && content && !isStreaming && (
             <div className="flex justify-end mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                 <button 
                    onClick={handleCopy} 
                    className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded border border-gray-700 transition-colors"
                    title="Copy to clipboard"
                 >
                     {copied ? <CheckIcon className="w-3 h-3 text-green-400" /> : <ClipboardIcon className="w-3 h-3" />}
                     {copied ? "Copied" : "Copy"}
                 </button>
             </div>
        )}

        {/* Render Generated Audio (TTS) */}
        {audioUrl && (
             <div className="mt-4">
                 <audio controls src={audioUrl} className="w-full max-w-md" />
             </div>
        )}

        {/* Render Generated Images (Imagen/Flash) */}
        {images && images.length > 0 && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {images.map((imgData, index) => (
              <img
                key={index}
                src={`data:image/png;base64,${imgData}`}
                alt={`AI generated image ${index + 1}`}
                className="rounded-lg border border-gray-700 shadow-md max-w-full h-auto"
              />
            ))}
          </div>
        )}

        {/* Render Sources (Search/Maps) */}
        {sources && sources.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-800">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Sources & Grounding</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sources.map((source, index) => (
                <a
                  key={index}
                  href={source.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 bg-gray-800 hover:bg-gray-700 p-3 rounded-lg transition-colors text-sm border border-gray-700 group"
                >
                   <div className="mt-0.5 text-gray-500 group-hover:text-blue-400">
                       <LinkIcon className="w-4 h-4" />
                   </div>
                   <div className="overflow-hidden">
                        <p className="font-medium text-gray-200 truncate">{source.title || "Google Search Result"}</p>
                        <p className="text-xs text-gray-500 truncate">{source.uri}</p>
                   </div>
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