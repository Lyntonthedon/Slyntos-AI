import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Message as MessageType, FileData, Page, Source } from '../types';
import { generateContentStream } from '../services/geminiService';
import Message from './Message';
import Loader from './Loader';
import PaperAirplaneIcon from './icons/PaperAirplaneIcon';
import PaperclipIcon from './icons/PaperclipIcon';
import XCircleIcon from './icons/XCircleIcon';

interface ChatInterfaceProps {
  page: Page;
  systemInstruction: string;
  placeholderText: string;
  children?: React.ReactNode;
}

const SUPPORTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_MB = 4; // Gemini Pro vision limit

const fileToData = (file: File): Promise<FileData> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            if (base64) {
                resolve({ name: file.name, type: file.type, data: base64 });
            } else {
                reject(new Error("Failed to read file as base64"));
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
};


const ChatInterface: React.FC<ChatInterfaceProps> = ({
  page,
  systemInstruction,
  placeholderText,
  children,
}) => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [userInput, setUserInput] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const selectedFiles = Array.from(event.target.files);
      const newFiles = [...files];
      let hasError = false;

      for (const file of selectedFiles) {
        if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
          setError(`Unsupported file type: ${file.name}. Please use JPEG, PNG, or WEBP.`);
          hasError = true;
          continue;
        }
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
           setError(`File too large: ${file.name}. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
           hasError = true;
           continue;
        }
        if (!files.some(f => f.name === file.name && f.size === file.size)) {
            newFiles.push(file);
        }
      }

      if(!hasError) setError(null);
      setFiles(newFiles);
      
      if(event.target) event.target.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!userInput.trim() && files.length === 0) || isLoading) return;

    const newUserMessage: MessageType = {
      id: Date.now().toString(),
      role: 'user',
      content: userInput.trim(),
    };
    
    const updatedMessages = [...messages, newUserMessage];
    const filesToSubmit = [...files];

    setMessages(updatedMessages);
    setUserInput('');
    setFiles([]);
    setIsLoading(true);
    setError(null);

    const modelMessageId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: modelMessageId,
      role: 'model',
      content: '',
      sources: [],
    }]);

    try {
      const fileData = await Promise.all(filesToSubmit.map(fileToData));
      const stream = generateContentStream(updatedMessages, systemInstruction, fileData, page);
      
      const sourceUris = new Set<string>();

      for await (const chunk of stream) {
        setMessages(prev => prev.map(msg => {
            if (msg.id === modelMessageId) {
              const newContent = msg.content + chunk.text;
              const currentSources = msg.sources || [];
              
              if (chunk.sources) {
                chunk.sources.forEach(source => {
                  if (!sourceUris.has(source.uri)) {
                    sourceUris.add(source.uri);
                    currentSources.push(source);
                  }
                });
              }
              return { ...msg, content: newContent, sources: [...currentSources] };
            }
            return msg;
          })
        );
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setMessages(prev => prev.map(msg => 
        msg.id === modelMessageId
          ? { ...msg, content: `Sorry, something went wrong. ${errorMessage}` }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  }, [userInput, files, isLoading, messages, systemInstruction, page]);

  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-700">
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-400">
             <div className="w-20 h-20 mb-4 p-3 bg-gradient-to-br from-purple-600 to-blue-500 rounded-full flex items-center justify-center">
                 <img src="https://i.imgur.com/2Y0s2sL.png" alt="Slyntos AI Logo" className="w-16 h-16"/>
             </div>
            <h2 className="text-2xl font-bold text-gray-200">Slyntos AI</h2>
            <p className="mt-2">{placeholderText}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {messages.map(msg => (
              <Message key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="p-4 bg-gray-900/50 border-t border-gray-700">
        {children && <div className="px-2 pb-2">{children}</div>}
        {error && <div className="text-red-400 text-sm mb-2 px-2">{error}</div>}
        
        {files.length > 0 && (
            <div className="mb-3 p-3 bg-gray-800 border border-gray-700 rounded-lg">
              <div className="flex flex-wrap gap-2">
                {files.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="bg-gray-600 rounded-full pl-3 pr-2 py-1 text-sm text-gray-200 flex items-center gap-2 max-w-xs">
                    <span className="truncate">{file.name}</span>
                    <button onClick={() => handleRemoveFile(index)} type="button" className="flex-shrink-0" aria-label={`Remove ${file.name}`}>
                      <XCircleIcon className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-start gap-3">
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
            accept={SUPPORTED_MIME_TYPES.join(',')}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="flex-shrink-0 h-12 w-12 bg-gray-700 rounded-lg flex items-center justify-center text-gray-300 hover:bg-gray-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Attach files"
          >
            <PaperclipIcon className="w-6 h-6" />
          </button>
          <div className="relative flex-1">
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Type your message or add files..."
              className="w-full min-h-[48px] bg-gray-700 text-gray-200 rounded-lg p-3 pr-14 resize-none focus:ring-2 focus:ring-purple-500 focus:outline-none transition-shadow duration-200"
              rows={1}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || (!userInput.trim() && files.length === 0)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 h-10 w-10 bg-purple-600 rounded-full flex items-center justify-center text-white hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200"
              aria-label="Send message"
            >
              {isLoading ? <Loader /> : <PaperAirplaneIcon className="w-5 h-5" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;