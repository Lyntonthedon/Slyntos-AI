import React, { useState, useRef, useEffect, useCallback } from 'react';
import { generateContentStream, generateImageImagen, editImage, generateTTS } from '../services/geminiService';
import type { Message, FileData, Page, User, Source, ChatSession } from '../types';
import MessageComponent from './Message';
import PaperAirplaneIcon from './icons/PaperAirplaneIcon';
import PaperclipIcon from './icons/PaperclipIcon';
import XCircleIcon from './icons/XCircleIcon';
import Loader from './Loader';
import SlyntosLogo from './icons/SlyntosLogo';
import { Page as PageEnum } from '../types';
import { FunctionCall } from '@google/genai';
import LiveSession from './LiveSession';
import LockIcon from './icons/LockIcon';

// Icons
import SparklesIcon from './icons/SparklesIcon';
// Simple Brain Icon
const BrainIcon = ({className}: {className?: string}) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8Z" opacity="0.2"/>
    <path d="M12 6a3.5 3.5 0 0 0-3.5 3.5 1 1 0 0 0 2 0A1.5 1.5 0 1 1 12 11a1 1 0 0 0 0 2 1.5 1.5 0 1 1 1.5-1.5 1 1 0 0 0 2 0A3.5 3.5 0 1 0 12 6Z"/>
  </svg>
);
const MicrophoneIcon = ({className}: {className?: string}) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
    <path d="M10 2a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <path d="M17 8a1 1 0 1 0-2 0v2a5 5 0 0 1-10 0V8a1 1 0 1 0-2 0v2a7 7 0 0 0 6 6.92v2.08H7a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-2.08A7 7 0 0 0 17 10V8Z"/>
  </svg>
);
const PhotoIcon = ({className}: {className?: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M1 5.25A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25v9.5A2.25 2.25 0 0116.75 17H3.25A2.25 2.25 0 011 14.75v-9.5zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 00.75-.75v-2.69l-2.22-2.219a.75.75 0 00-1.06 0l-1.91 1.909.47.47a.75.75 0 11-1.06 1.06L6.53 8.091a.75.75 0 00-1.06 0l-2.97 2.97zM12 7a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
    </svg>
);
import RocketIcon from './icons/RocketIcon';

interface ChatInterfaceProps {
  session: ChatSession;
  onSessionUpdate: (session: ChatSession) => void;
  systemInstruction: string;
  placeholderText: string;
  currentUser: User;
  page: Page;
  children?: React.ReactNode;
  onLoadingStateChange?: (isLoading: boolean) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ session, onSessionUpdate, systemInstruction, placeholderText, currentUser, page, children, onLoadingStateChange }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<FileData[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Mode States
  const [isThinkingMode, setIsThinkingMode] = useState(false);
  const [isLiteMode, setIsLiteMode] = useState(false);
  const [isLiveSessionOpen, setIsLiveSessionOpen] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');

  // Audio Recording
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    onLoadingStateChange?.(isLoading);
  }, [isLoading, onLoadingStateChange]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session.messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
    const selectedFiles = Array.from(event.target.files);
    
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

  const handleGenerateImage = async () => {
      if (!input.trim()) return;
      setIsLoading(true);
      const userMessage: Message = { role: 'user', content: input };
      const modelMsg: Message = { role: 'model', content: 'Generating image with Imagen 4.0...' };
      onSessionUpdate({ ...session, messages: [...session.messages, userMessage, modelMsg] });
      setInput('');
      
      try {
          const images = await generateImageImagen(input, aspectRatio === '16:9' ? '16:9' : (aspectRatio === '9:16' ? '9:16' : '1:1'));
          onSessionUpdate({ ...session, messages: [...session.messages, userMessage, { role: 'model', content: 'Here is your image:', images }] });
      } catch (e) {
          const msg = e instanceof Error ? e.message : "Unknown error";
           onSessionUpdate({ ...session, messages: [...session.messages, userMessage, { role: 'model', content: `Image generation failed: ${msg}` }] });
      } finally {
          setIsLoading(false);
      }
  };

  // Audio recording handler
  const toggleRecording = async () => {
      if (isRecording) {
          mediaRecorderRef.current?.stop();
          setIsRecording(false);
      } else {
          try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              const mediaRecorder = new MediaRecorder(stream);
              mediaRecorderRef.current = mediaRecorder;
              const audioChunks: Blob[] = [];
              
              mediaRecorder.ondataavailable = (event) => {
                  audioChunks.push(event.data);
              };
              
              mediaRecorder.onstop = async () => {
                  const audioBlob = new Blob(audioChunks, { type: 'audio/wav' }); // Gemini likes wav/mp3 often, but base64 passed usually works if mapped to audio/wav
                  const reader = new FileReader();
                  reader.onloadend = () => {
                       const base64 = (reader.result as string).split(',')[1];
                       setFiles(prev => [...prev, { name: 'voice_note.wav', type: 'audio/wav', data: base64, size: audioBlob.size }]);
                       // Optional: Auto-submit? Let's keep it manual to allow adding text.
                  };
                  reader.readAsDataURL(audioBlob);
                  stream.getTracks().forEach(track => track.stop());
              };
              
              mediaRecorder.start();
              setIsRecording(true);
          } catch (e) {
              alert("Microphone access denied. Please allow microphone permission to record audio.");
          }
      }
  };

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isLoading || (!input.trim() && files.length === 0)) return;
    
    // Detect Intents (Simple heuristic if user didn't click specific buttons)
    const isEditingImage = files.length > 0 && files[0].type.startsWith('image/') && (input.toLowerCase().includes("edit") || input.toLowerCase().includes("filter") || input.toLowerCase().includes("remove") || input.toLowerCase().includes("add"));
    
    const filesToSubmit = [...files];
    const userMessage: Message = { role: 'user', content: input, files: filesToSubmit };
    const messagesWithUser: Message[] = [...session.messages, userMessage];
    const newTitle = session.messages.length === 0 ? input.trim().split(' ').slice(0, 5).join(' ') : session.title;
    
    onSessionUpdate({ ...session, messages: [...messagesWithUser, { role: 'model', content: '' }], title: newTitle });

    setInput('');
    setFiles([]);
    setIsLoading(true);

    try {
        // Image Editing Path
        if (isEditingImage) {
            const images = await editImage(input, filesToSubmit[0]);
            onSessionUpdate({ ...session, messages: [...messagesWithUser, { role: 'model', content: 'Here is the edited image:', images }], title: newTitle });
            setIsLoading(false);
            return;
        }

        // Standard Generation Stream
        let fullResponse = '';
        let allSources: Source[] = [];
        
        const stream = generateContentStream(
            messagesWithUser, 
            systemInstruction, 
            page, 
            { useThinking: isThinkingMode, useLite: isLiteMode }
        );
        
        for await (const chunk of stream) {
            fullResponse += chunk.text ?? '';
            if (chunk.sources) {
                allSources = [...allSources, ...chunk.sources.filter(s => !allSources.some(as => as.uri === s.uri))];
            }
             if (page !== PageEnum.WebsiteCreator) {
                onSessionUpdate({ ...session, messages: [...messagesWithUser, { role: 'model', content: fullResponse, sources: allSources }], title: newTitle });
             }
        }
        
        // TTS Check (If user asked for speech)
        let audioUrl;
        if (input.toLowerCase().includes("say") || input.toLowerCase().includes("speak") || input.toLowerCase().includes("tts")) {
             const audio = await generateTTS(fullResponse);
             if(audio) audioUrl = audio;
        }

        onSessionUpdate({ 
            ...session, 
            messages: [...messagesWithUser, { role: 'model', content: fullResponse, sources: allSources, audioUrl }], 
            title: newTitle 
        });

    } catch (error) {
         const msg = error instanceof Error ? error.message : "Unknown error";
         onSessionUpdate({ ...session, messages: [...messagesWithUser, { role: 'model', content: `Error: ${msg}` }], title: newTitle });
    } finally {
        setIsLoading(false);
    }
  }, [isLoading, input, files, session, onSessionUpdate, systemInstruction, page, isThinkingMode, isLiteMode]);
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="relative flex flex-col h-full flex-grow bg-gray-800/50 rounded-lg overflow-hidden">
      {children}
      {isLiveSessionOpen && <LiveSession onClose={() => setIsLiveSessionOpen(false)} />}
      
      {page !== PageEnum.WebsiteCreator && session.messages.length === 0 && (
         <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
            <div className="text-center text-gray-700 opacity-10">
            <SlyntosLogo className="w-40 h-40 mx-auto" />
            <p className="text-4xl font-bold mt-4">Slyntos AI</p>
            </div>
        </div>
      )}
      
      <div className="flex-grow overflow-y-auto relative" id="message-list">
        {session.messages.map((msg, index) => (
          <MessageComponent key={index} message={msg} currentUser={currentUser} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="mt-auto bg-gray-800 sticky bottom-0 w-full px-2 sm:px-4 pb-2 sm:pb-4 rounded-b-lg border-t border-gray-700">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-2 py-2 text-xs text-gray-400">
            <div className="flex items-center gap-2">
                 <button 
                    onClick={() => setIsLiveSessionOpen(true)}
                    className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-700 text-blue-400"
                    title="Start Live Conversation"
                >
                    <MicrophoneIcon className="w-4 h-4" /> Live
                </button>
                <div className="w-px h-4 bg-gray-600 mx-1"></div>
                <button 
                    onClick={() => { 
                        if (currentUser.plan !== 'paid') {
                            alert("Thinking Mode is available on the Pro Plan.");
                            return;
                        }
                        setIsThinkingMode(!isThinkingMode); 
                        setIsLiteMode(false); 
                    }}
                    className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-700 ${isThinkingMode ? 'text-purple-400 bg-gray-700' : ''} ${currentUser.plan !== 'paid' ? 'opacity-60' : ''}`}
                    title={currentUser.plan === 'paid' ? "Thinking Mode (Gemini Pro)" : "Thinking Mode (Pro Only)"}
                >
                    <BrainIcon className="w-4 h-4" /> Think
                    {currentUser.plan !== 'paid' && <LockIcon className="w-3 h-3 text-yellow-500" />}
                </button>
                 <button 
                    onClick={() => { 
                        if (currentUser.plan !== 'paid') {
                            alert("Lite Mode is available on the Pro Plan.");
                            return;
                        }
                        setIsLiteMode(!isLiteMode); 
                        setIsThinkingMode(false); 
                    }}
                    className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-700 ${isLiteMode ? 'text-green-400 bg-gray-700' : ''} ${currentUser.plan !== 'paid' ? 'opacity-60' : ''}`}
                    title={currentUser.plan === 'paid' ? "Lite Mode (Fast)" : "Lite Mode (Pro Only)"}
                >
                    <RocketIcon className="w-4 h-4" /> Lite
                    {currentUser.plan !== 'paid' && <LockIcon className="w-3 h-3 text-yellow-500" />}
                </button>
            </div>
            <div className="flex items-center gap-2">
                <select 
                    value={aspectRatio} 
                    onChange={(e) => setAspectRatio(e.target.value as any)}
                    className="bg-gray-900 border border-gray-600 rounded px-2 py-0.5 text-xs focus:outline-none"
                >
                    <option value="16:9">16:9</option>
                    <option value="9:16">9:16</option>
                    <option value="1:1">1:1</option>
                </select>
                <button onClick={handleGenerateImage} className="hover:text-white" title="Generate Image (Imagen)">
                    <PhotoIcon className="w-4 h-4" />
                </button>
            </div>
        </div>

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
          <div className={`flex items-end bg-gray-900 border border-gray-600 ${files.length > 0 ? 'rounded-b-md' : 'rounded-md'} focus-within:ring-1 focus-within:ring-blue-500 transition-shadow duration-200`}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-gray-400 hover:text-white"
              aria-label="Attach files"
            >
              <PaperclipIcon className="w-5 h-5" />
            </button>
            
            <button
              type="button"
              onClick={toggleRecording}
              className={`p-3 ${isRecording ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-white'}`}
              aria-label="Record Audio"
            >
              <MicrophoneIcon className="w-5 h-5" />
            </button>

            <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple hidden accept="image/*,video/*,audio/*,text/*,.pdf" />
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isRecording ? "Recording..." : placeholderText}
              rows={1}
              className="flex-1 bg-transparent p-3 resize-none outline-none placeholder-gray-600 text-gray-200 text-sm max-h-40"
              disabled={isLoading}
            />
            <button type="submit" className="p-3 text-blue-500 hover:text-blue-400 disabled:opacity-50" disabled={isLoading || (!input.trim() && files.length === 0)} aria-label="Send message">
              {isLoading ? <Loader /> : <PaperAirplaneIcon className="w-5 h-5" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;