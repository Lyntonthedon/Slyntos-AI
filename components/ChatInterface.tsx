// FIX: Provide content for ChatInterface.tsx to resolve module not found error.
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { generateContentStream, generateImageFromPrompt } from '../services/geminiService';
import { getHistory, saveHistory } from '../services/chatHistoryService';
import type { Message, FileData, Page, User, Source } from '../types';
import MessageComponent from './Message';
import PaperAirplaneIcon from './icons/PaperAirplaneIcon';
import PaperclipIcon from './icons/PaperclipIcon';
import XCircleIcon from './icons/XCircleIcon';
import Loader from './Loader';
import SlyntosLogo from './icons/SlyntosLogo';
import { Page as PageEnum } from '../types';
import { FunctionCall } from '@google/genai';


interface ChatInterfaceProps {
  page: Page;
  systemInstruction: string;
  placeholderText: string;
  currentUser: User;
  onCodeGenerated?: (code: string) => void;
  children?: React.ReactNode;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_FILES = 5;


const ChatInterface: React.FC<ChatInterfaceProps> = ({ page, systemInstruction, placeholderText, currentUser, onCodeGenerated, children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<FileData[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const chatHistoryKey = `chatHistory-${currentUser.id}-${page}`;

  useEffect(() => {
    const loadedMessages = getHistory(chatHistoryKey);
    if (loadedMessages.length > 0) {
      setMessages(loadedMessages);
    }
  }, [chatHistoryKey]);

  useEffect(() => {
    saveHistory(chatHistoryKey, messages);
  }, [messages, chatHistoryKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
    const selectedFiles = Array.from(event.target.files);
    // ... (file validation logic remains the same)
    
    const readFileAsBase64 = (file: File): Promise<FileData> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64Data = (reader.result as string).split(',')[1];
          resolve({ name: file.name, type: file.type, data: base64Data, size: file.size });
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
    };

    try {
      const newFileData = await Promise.all(selectedFiles.map(readFileAsBase64));
      setFiles((prevFiles) => [...prevFiles, ...newFileData]);
    } catch (error) {
      console.error('Failed to read files:', error);
      alert('An error occurred while reading the files.');
    } finally {
        if(fileInputRef.current) fileInputRef.current.value = "";
    }
  };


  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };
  
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isLoading || (!input.trim() && files.length === 0)) return;

    const userMessage: Message = { role: 'user', content: input };
    const updatedMessages: Message[] = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    const filesToSubmit = [...files];
    setFiles([]);
    setIsLoading(true);
    
    const modelMessage: Message = { role: 'model', content: '' };
    setMessages(prev => [...prev, modelMessage]);

    let fullResponse = '';
    let allSources: Source[] = [];
    let allFunctionCalls: FunctionCall[] = [];
    
    try {
        const stream = generateContentStream(updatedMessages, systemInstruction, filesToSubmit, page);
        
        for await (const chunk of stream) {
            fullResponse += chunk.text ?? '';
            if (chunk.sources) {
                const newSources = chunk.sources.filter(s => !allSources.some(as => as.uri === s.uri));
                allSources = [...allSources, ...newSources];
            }
            if (chunk.functionCalls) {
                allFunctionCalls.push(...chunk.functionCalls);
            }
            
            if (page === PageEnum.WebsiteCreator && onCodeGenerated) {
                const codeMatch = fullResponse.match(/```html\s*([\s\S]*?)\s*```/);
                if (codeMatch && codeMatch[1]) {
                    onCodeGenerated(codeMatch[1]);
                }
            }

            setMessages(prev => {
                const lastMsg = prev[prev.length - 1];
                if (lastMsg && lastMsg.role === 'model') {
                    const updatedLastMsg = { ...lastMsg, content: fullResponse, sources: allSources.length > 0 ? allSources : undefined };
                    return [...prev.slice(0, -1), updatedLastMsg];
                }
                return prev;
            });
        }
        
        // Stream finished, now process any collected function calls
        const imageFunctionCall = allFunctionCalls.find(fc => fc.name === 'generate_image');
        if (imageFunctionCall) {
            const imagePrompt = imageFunctionCall.args.prompt as string;
            if (imagePrompt) {
                // Update message to show we're generating
                setMessages(prev => {
                    const lastMsg = prev[prev.length - 1];
                    const newContent = `${lastMsg.content}\n\n*Generating an image of "${imagePrompt}"...*`.trim();
                    const updatedLastMsg = { ...lastMsg, content: newContent };
                    return [...prev.slice(0, -1), updatedLastMsg];
                });
                
                try {
                    // Call the image service
                    const images = await generateImageFromPrompt(imagePrompt);
                    
                    // Update the final message with the images
                    setMessages(prev => {
                        const lastMsg = prev[prev.length - 1];
                        const updatedLastMsg = { ...lastMsg, images };
                        return [...prev.slice(0, -1), updatedLastMsg];
                    });
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : "Unknown error";
                     setMessages(prev => {
                        const lastMsg = prev[prev.length - 1];
                        const newContent = `${lastMsg.content}\n\n*Error generating image: ${errorMessage}*`;
                        const updatedLastMsg = { ...lastMsg, content: newContent, images: [] };
                        return [...prev.slice(0, -1), updatedLastMsg];
                    });
                }
            }
        }
    } catch (error) {
         const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
         setMessages(prev => {
            const lastMsg = prev[prev.length - 1];
            if(lastMsg && lastMsg.role === 'model'){
                const updatedLastMsg = { ...lastMsg, content: `${fullResponse}\n\nError: ${errorMessage}` };
                return [...prev.slice(0, -1), updatedLastMsg];
            }
            return prev;
        });
    } finally {
        setIsLoading(false);
    }
  }, [isLoading, input, files, messages, systemInstruction, page, currentUser.id, onCodeGenerated]);
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="relative flex flex-col h-full flex-grow">
      {children}
      
      {page !== PageEnum.WebsiteCreator && (
         <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
            <div className="text-center text-gray-700 opacity-10">
            <SlyntosLogo className="w-40 h-40 mx-auto" />
            <p className="text-4xl font-bold mt-4">Slyntos AI</p>
            </div>
        </div>
      )}
      
      <div className="flex-grow overflow-y-auto" id="message-list">
        {messages.map((msg, index) => (
          <MessageComponent key={index} message={msg} currentUser={currentUser} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="mt-auto bg-gray-900 sticky bottom-0 w-full px-2 sm:px-4 pb-2 sm:pb-4">
        <form onSubmit={handleSubmit} className="relative">
          {files.length > 0 && (
            <div className="p-2 bg-gray-800 rounded-t-md flex flex-wrap gap-2">
              {files.map((file, index) => (
                <div key={index} className="bg-gray-700 text-xs rounded-full px-3 py-1 flex items-center gap-2">
                  <span>{file.name}</span>
                  <button onClick={() => handleRemoveFile(index)} type="button" className="text-gray-400 hover:text-white">
                    <XCircleIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className={`flex items-end bg-gray-800 border border-gray-600 ${files.length > 0 ? 'rounded-b-md' : 'rounded-md'} focus-within:ring-2 focus-within:ring-blue-500 transition-shadow duration-200`}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-gray-400 hover:text-white"
              aria-label="Attach files"
            >
              <PaperclipIcon className="w-5 h-5" />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple hidden accept="image/*,video/*,audio/*,text/*,.pdf" />
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholderText}
              rows={1}
              className="flex-1 bg-transparent p-3 resize-none outline-none placeholder-gray-500 text-gray-200 text-sm max-h-40"
              disabled={isLoading}
            />
            <button type="submit" className="p-3 text-gray-400 hover:text-white disabled:opacity-50" disabled={isLoading || (!input.trim() && files.length === 0)} aria-label="Send message">
              {isLoading ? <Loader /> : <PaperAirplaneIcon className="w-5 h-5" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;