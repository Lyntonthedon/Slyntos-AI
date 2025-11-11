
import React, { useState, useEffect, useRef } from 'react';
import ChatInterface from './ChatInterface';
import { Page, User, ChatSession, FileData } from '../types';
import { SYSTEM_INSTRUCTION_WEBSITE } from '../constants';
import DownloadIcon from './icons/DownloadIcon';
import ClipboardIcon from './icons/ClipboardIcon';
import CheckIcon from './icons/CheckIcon';
import LinkIcon from './icons/LinkIcon';
import PhotoIcon from './icons/PhotoIcon';
import XCircleIcon from './icons/XCircleIcon';
import Editor from '@monaco-editor/react';

interface WebsiteCreatorPageProps {
  session: ChatSession;
  onSessionUpdate: (session: ChatSession) => void;
  currentUser: User;
}

interface Asset {
  name: string;
  data: string; // Base64
  type: string;
}

const WebsiteCreatorPage: React.FC<WebsiteCreatorPageProps> = ({ session, onSessionUpdate, currentUser }) => {
  const [htmlCode, setHtmlCode] = useState<string>('<!-- Your website code will appear here -->');
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Assets State
  const [assets, setAssets] = useState<Asset[]>([]);
  const [showAssetsPanel, setShowAssetsPanel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract code from AI response
  useEffect(() => {
    const lastMessage = session.messages[session.messages.length - 1];
    if (lastMessage?.role === 'model' && lastMessage.content) {
      const codeBlockRegex = /```html\n([\s\S]*?)\n```/;
      const match = lastMessage.content.match(codeBlockRegex);
      if (match && match[1]) {
        setHtmlCode(match[1]);
        // Auto-switch to preview if it's a fresh generation
        if (!isLoading) {
            setActiveTab('preview');
        }
      }
    } else if (session.messages.length <= 1 && htmlCode.includes('Your website code')) {
        setHtmlCode('<!-- Describe your website in the chat to generate code. -->\n<!DOCTYPE html>\n<html>\n<head>\n<style>\n  body { background: #111; color: #fff; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; }\n</style>\n</head>\n<body>\n  <h1>Ready to Code</h1>\n</body>\n</html>');
    }
  }, [session.messages, isLoading]);

  // Update preview with Asset Injection
  useEffect(() => {
    if (iframeRef.current && activeTab === 'preview') {
        // Magic: Replace "src='filename.png'" with "src='data:image...'" in the preview only
        let injectedCode = htmlCode;
        assets.forEach(asset => {
            // Replace explicit src attributes
            const regexDouble = new RegExp(`src="${asset.name}"`, 'g');
            const regexSingle = new RegExp(`src='${asset.name}'`, 'g');
            // Replace CSS url(...)
            const regexUrl = new RegExp(`url\\("${asset.name}"\\)`, 'g');
            
            const dataUri = `data:${asset.type};base64,${asset.data}`;
            
            injectedCode = injectedCode
                .replace(regexDouble, `src="${dataUri}"`)
                .replace(regexSingle, `src='${dataUri}'`)
                .replace(regexUrl, `url("${dataUri}")`);
        });

        iframeRef.current.srcdoc = injectedCode;
    }
  }, [htmlCode, activeTab, assets]);

  const handleDownload = () => {
    // For download, we also want to inject assets so the file works offline? 
    // Or keep it relative? Better to inject for single-file portability.
    let injectedCode = htmlCode;
    assets.forEach(asset => {
        const regexDouble = new RegExp(`src="${asset.name}"`, 'g');
        const regexSingle = new RegExp(`src='${asset.name}'`, 'g');
        const dataUri = `data:${asset.type};base64,${asset.data}`;
        injectedCode = injectedCode.replace(regexDouble, `src="${dataUri}"`).replace(regexSingle, `src='${dataUri}'`);
    });

    const blob = new Blob([injectedCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(htmlCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShareCodePen = () => {
    // Inject assets before sending to CodePen so it works there too
    let injectedCode = htmlCode;
    assets.forEach(asset => {
        const regexDouble = new RegExp(`src="${asset.name}"`, 'g');
        const regexSingle = new RegExp(`src='${asset.name}'`, 'g');
        const dataUri = `data:${asset.type};base64,${asset.data}`;
        injectedCode = injectedCode.replace(regexDouble, `src="${dataUri}"`).replace(regexSingle, `src='${dataUri}'`);
    });

    const data = {
      title: "Built with Slyntos AI",
      description: "Generated by Slyntos AI Website Creator",
      html: injectedCode,
      editors: "100", // Open HTML editor
    };

    const json = JSON.stringify(data)
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

    const form = document.createElement("form");
    form.action = "https://codepen.io/pen/define";
    form.method = "POST";
    form.target = "_blank";

    const input = document.createElement("input");
    input.type = "hidden";
    input.name = "data";
    input.value = json;

    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };

  const handleAssetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          // Check if name exists
          if (assets.some(a => a.name === file.name)) {
              alert("A file with this name already exists.");
              return;
          }

          const reader = new FileReader();
          reader.onload = () => {
              const base64 = (reader.result as string).split(',')[1];
              setAssets(prev => [...prev, { name: file.name, data: base64, type: file.type }]);
              // Notify the AI about the new asset via a system-like message injection (invisible to user history logic usually, but here we can just let the user know)
              // We won't force a message, but the user can now say "Use the image logo.png"
          };
          reader.readAsDataURL(file);
      }
  };

  const removeAsset = (name: string) => {
      setAssets(prev => prev.filter(a => a.name !== name));
  };

  return (
    <div className="flex flex-col md:flex-row h-full gap-0 md:gap-4 overflow-hidden relative">
      {/* Left Panel: Chat */}
      <div className="w-full md:w-1/3 h-1/2 md:h-full flex flex-col border-b md:border-r md:border-b-0 border-gray-700 pr-0 md:pr-2">
        <ChatInterface
          session={session}
          onSessionUpdate={onSessionUpdate}
          page={Page.WebsiteCreator}
          systemInstruction={SYSTEM_INSTRUCTION_WEBSITE}
          placeholderText="Describe the website..."
          currentUser={currentUser}
          onLoadingStateChange={setIsLoading}
        >
            {assets.length > 0 && (
                <div className="mb-4 px-4 py-2 bg-gray-800 rounded text-xs text-gray-400">
                    <p className="font-semibold mb-1 text-blue-400">Available Assets:</p>
                    <ul className="list-disc list-inside">
                        {assets.map(a => (
                            <li key={a.name}>{a.name}</li>
                        ))}
                    </ul>
                    <p className="mt-1 italic opacity-75">Tip: Ask Slyntos to "use {assets[0].name}" in the code.</p>
                </div>
            )}
        </ChatInterface>
      </div>
      
      {/* Right Panel: IDE & Preview */}
      <div className="w-full md:w-2/3 h-1/2 md:h-full flex flex-col bg-gray-900 md:rounded-lg overflow-hidden border border-gray-800 shadow-2xl relative">
        
        {/* Toolbar */}
        <div className="flex items-center justify-between bg-gray-800 px-4 py-2 border-b border-gray-700">
            <div className="flex items-center gap-4">
                <div className="flex bg-gray-900 rounded-lg p-1">
                    <button 
                        onClick={() => setActiveTab('code')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === 'code' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                        Code
                    </button>
                    <button 
                        onClick={() => setActiveTab('preview')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === 'preview' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                        Preview
                    </button>
                </div>
                {activeTab === 'preview' && (
                    <span className="hidden sm:flex text-xs text-gray-500 items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Live
                    </span>
                )}
            </div>

            <div className="flex items-center gap-2">
                 <button 
                    onClick={() => setShowAssetsPanel(!showAssetsPanel)} 
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded transition-colors border border-gray-600 ${showAssetsPanel ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-200'}`}
                    title="Manage Images"
                 >
                    <PhotoIcon className="w-3 h-3" /> Assets
                    {assets.length > 0 && <span className="bg-blue-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{assets.length}</span>}
                </button>
                 <button 
                    onClick={handleShareCodePen} 
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs rounded transition-colors border border-gray-600"
                    title="Share on CodePen (Accessible Anywhere)"
                 >
                    <LinkIcon className="w-3 h-3" /> Share
                </button>
                <div className="w-px h-4 bg-gray-600 mx-1 hidden sm:block"></div>
                <button onClick={handleCopy} className="p-1.5 text-gray-400 hover:text-white transition-colors hidden sm:block" title="Copy Code">
                  {copied ? <CheckIcon className="w-4 h-4 text-green-500"/> : <ClipboardIcon className="w-4 h-4"/>}
                </button>
                 <button onClick={handleDownload} className="p-1.5 text-gray-400 hover:text-white transition-colors" title="Download .html file">
                    <DownloadIcon className="w-4 h-4" />
                </button>
            </div>
        </div>

        {/* Assets Panel Overlay */}
        {showAssetsPanel && (
            <div className="absolute top-12 right-0 bottom-0 w-64 bg-gray-800 border-l border-gray-700 z-20 shadow-xl flex flex-col p-4 overflow-y-auto transition-transform">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-200 text-sm">Website Assets</h3>
                    <button onClick={() => setShowAssetsPanel(false)} className="text-gray-400 hover:text-white">
                        <XCircleIcon className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="mb-4">
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <PhotoIcon className="w-6 h-6 text-gray-400 mb-2" />
                            <p className="text-xs text-gray-400">Click to upload image</p>
                        </div>
                        <input type="file" className="hidden" accept="image/*" onChange={handleAssetUpload} ref={fileInputRef} />
                    </label>
                </div>

                <div className="space-y-3">
                    {assets.map((asset, idx) => (
                        <div key={idx} className="bg-gray-900 rounded p-2 relative group">
                            <div className="w-full h-24 bg-gray-800 rounded mb-2 overflow-hidden flex items-center justify-center">
                                <img src={`data:${asset.type};base64,${asset.data}`} alt={asset.name} className="max-w-full max-h-full object-contain" />
                            </div>
                            <p className="text-xs text-gray-300 font-mono truncate mb-1" title={asset.name}>{asset.name}</p>
                            <button 
                                onClick={() => removeAsset(asset.name)} 
                                className="absolute top-1 right-1 p-1 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Remove asset"
                            >
                                <XCircleIcon className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                    {assets.length === 0 && <p className="text-xs text-gray-500 text-center italic">No assets uploaded.</p>}
                </div>
            </div>
        )}

        {/* Workspace Content */}
        <div className="flex-grow relative bg-[#1e1e1e]">
            {/* Editor View */}
            <div className={`absolute inset-0 ${activeTab === 'code' ? 'z-10' : 'z-0 opacity-0 pointer-events-none'}`}>
                 <Editor
                    height="100%"
                    defaultLanguage="html"
                    value={htmlCode}
                    theme="vs-dark"
                    onChange={(value) => setHtmlCode(value || "")}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        wordWrap: 'on',
                        padding: { top: 16 },
                        scrollBeyondLastLine: false,
                    }}
                 />
            </div>

            {/* Preview View */}
            <div className={`absolute inset-0 bg-white ${activeTab === 'preview' ? 'z-10' : 'z-0'}`}>
                <iframe
                    ref={iframeRef}
                    title="Website Preview"
                    className="w-full h-full border-none"
                    sandbox="allow-scripts allow-modals allow-same-origin allow-popups"
                />
            </div>
        </div>
      </div>
    </div>
  );
};

export default WebsiteCreatorPage;