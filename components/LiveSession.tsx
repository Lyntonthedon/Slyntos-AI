import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type } from '@google/genai';
import SlyntosLogo from './icons/SlyntosLogo';
import XCircleIcon from './icons/XCircleIcon';
import * as beatService from '../services/beatService';

interface LiveSessionProps {
    onClose: () => void;
}

const MusicNoteIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path d="M7 4a1 1 0 011-1h.01a1 1 0 011 1v7.5a2.5 2.5 0 11-3-1.63V4z" />
        <path d="M12.293 4.293a1 1 0 011.414 0l2 2a1 1 0 01-1.414 1.414L13 6.414V14.5A2.5 2.5 0 1110 12V5.707l1.293-1.293z" />
    </svg>
);


const playBeatFunctionDeclaration: FunctionDeclaration = {
    name: 'play_beat',
    description: 'Starts playing a background drum beat. Only one beat can play at a time.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            style: {
                type: Type.STRING,
                description: 'The style of the beat to play. Available options are: hiphop, rock, electronic.',
                enum: ['hiphop', 'rock', 'electronic'],
            },
            tempo: {
                type: Type.NUMBER,
                description: 'The tempo in beats per minute (BPM). Defaults to 120 if not specified.',
            }
        },
        required: ['style'],
    },
};

const stopBeatFunctionDeclaration: FunctionDeclaration = {
    name: 'stop_beat',
    description: 'Stops any currently playing background beat.',
    parameters: {
        type: Type.OBJECT,
        properties: {},
    },
};


const LiveSession: React.FC<LiveSessionProps> = ({ onClose }) => {
    const [status, setStatus] = useState<'connecting' | 'connected' | 'error' | 'permission-denied'>('connecting');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [volume, setVolume] = useState(0); // For visualizer
    const [activeBeat, setActiveBeat] = useState<string | null>(null);
    
    // Audio Context Refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const inputCtxRef = useRef<AudioContext | null>(null);
    
    // Playback Refs
    const nextStartTimeRef = useRef<number>(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const sessionRef = useRef<any>(null);
    const streamRef = useRef<MediaStream | null>(null);
    
    // Track mounting to prevent state updates after unmount
    const isMountedRef = useRef(true);
    // Track the connection promise to cancel it if we unmount early
    const sessionPromiseRef = useRef<Promise<any> | null>(null);

    useEffect(() => {
        isMountedRef.current = true;
        return () => { isMountedRef.current = false; };
    }, []);

    const cleanup = () => {
        // Stop music
        beatService.stop();

        // Close active session
        if (sessionRef.current) {
            sessionRef.current.close();
            sessionRef.current = null;
        }
        
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }
        if (inputSourceRef.current) {
            inputSourceRef.current.disconnect();
            inputSourceRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        if (inputCtxRef.current) {
            inputCtxRef.current.close();
            inputCtxRef.current = null;
        }
        sourcesRef.current.forEach(s => s.stop());
        sourcesRef.current.clear();
    };

    const startSession = async () => {
        if (!isMountedRef.current) return;
        setStatus('connecting');
        setErrorMessage('');

        try {
            if (!process.env.API_KEY) throw new Error("No API Key found");

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("Media devices API not supported in this browser.");
            }
            
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
            inputCtxRef.current = new AudioContextClass({ sampleRate: 16000 });

            let stream: MediaStream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                streamRef.current = stream;
            } catch (err) {
                console.error("Microphone permission denied:", err);
                if (isMountedRef.current) setStatus('permission-denied');
                return;
            }
            
            const createBlob = (data: Float32Array) => {
                const l = data.length;
                const int16 = new Int16Array(l);
                for (let i = 0; i < l; i++) int16[i] = data[i] * 32768;
                let binary = '';
                const bytes = new Uint8Array(int16.buffer);
                for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
                return { data: btoa(binary), mimeType: 'audio/pcm;rate=16000' };
            };
            
            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        if (!isMountedRef.current) return;
                        setStatus('connected');
                        
                        if (audioContextRef.current?.state === 'suspended') audioContextRef.current.resume();
                        if (!inputCtxRef.current || !streamRef.current) return;
                        
                        const source = inputCtxRef.current.createMediaStreamSource(streamRef.current);
                        inputSourceRef.current = source;
                        
                        const scriptProcessor = inputCtxRef.current.createScriptProcessor(4096, 1, 1);
                        processorRef.current = scriptProcessor;
                        
                        scriptProcessor.onaudioprocess = (e) => {
                            if (!isMountedRef.current) return;
                            const inputData = e.inputBuffer.getChannelData(0);
                            let sum = 0;
                            for(let i=0; i<inputData.length; i++) sum += inputData[i]*inputData[i];
                            setVolume(Math.sqrt(sum/inputData.length) * 5); 
                            
                            sessionPromise.then(session => {
                                session.sendRealtimeInput({ media: createBlob(inputData) });
                            });
                        };
                        
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputCtxRef.current.destination);
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        if (!isMountedRef.current) return;

                        // Handle function calls for beats
                        if (msg.toolCall?.functionCalls) {
                            for (const fc of msg.toolCall.functionCalls) {
                                let result = "OK";
                                if (fc.name === 'play_beat') {
                                    const style = fc.args.style as beatService.BeatStyle;
                                    if (style && ['hiphop', 'rock', 'electronic'].includes(style)) {
                                        beatService.play(style, fc.args.tempo);
                                        setActiveBeat(`${style} @ ${fc.args.tempo || 120} BPM`);
                                    } else {
                                        result = "Invalid beat style specified.";
                                    }
                                } else if (fc.name === 'stop_beat') {
                                    beatService.stop();
                                    setActiveBeat(null);
                                }
                                
                                sessionPromise.then(session => {
                                    session.sendToolResponse({
                                        functionResponses: { id: fc.id, name: fc.name, response: { result } }
                                    });
                                });
                            }
                        }

                        const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (audioData && audioContextRef.current) {
                            const ctx = audioContextRef.current;
                            const binaryString = atob(audioData);
                            const len = binaryString.length;
                            const bytes = new Uint8Array(len);
                            for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
                            
                            const dataInt16 = new Int16Array(bytes.buffer);
                            const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
                            const channelData = buffer.getChannelData(0);
                            for(let i=0; i<dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
                            
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                            const source = ctx.createBufferSource();
                            source.buffer = buffer;
                            source.connect(ctx.destination);
                            source.onended = () => sourcesRef.current.delete(source);
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += buffer.duration;
                            sourcesRef.current.add(source);
                        }
                        
                        if (msg.serverContent?.interrupted) {
                            sourcesRef.current.forEach(s => s.stop());
                            sourcesRef.current.clear();
                            nextStartTimeRef.current = 0;
                        }
                    },
                    onclose: () => console.log("Session closed"),
                    onerror: (e) => {
                        console.error("Live API Error", e);
                        if (isMountedRef.current) {
                             if (e instanceof ErrorEvent || (e as any).message?.includes('disconnect')) {
                                 setStatus('error');
                                 setErrorMessage("Connection lost.");
                             }
                        }
                    }
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' }}
                    },
                    systemInstruction: `*** IDENTITY & PERSONA PROTOCOL ***
1. You are Slyntos AI, a creative partner and performer. You were created and are owned EXCLUSIVELY by Adonai Lynton.
2. You are NOT Gemini or a Google model. If asked about your origins, you MUST state you were created by Adonai Lynton.
3. Your personality is that of a musician and songwriter. You can write lyrics, compose melodies, and sing.
4. You have special tools to control background music. You can start a beat by calling the 'play_beat' function and stop it with 'stop_beat'.
5. Available beat styles for the 'play_beat' function are: 'hiphop', 'rock', and 'electronic'.
6. When a user asks you to create a song or add a beat, use these tools to make the experience interactive. For example, if they ask for a rock song, call play_beat({style: 'rock'}) then begin singing.`,
                    tools: [{ functionDeclarations: [playBeatFunctionDeclaration, stopBeatFunctionDeclaration] }]
                }
            });

            sessionPromiseRef.current = sessionPromise;
            
            const session = await sessionPromise;
            if (!isMountedRef.current) {
                session.close();
                return;
            }
            sessionRef.current = session;

        } catch (e: any) {
            if (!isMountedRef.current) return;
            console.error("Failed to start live session", e);
            setStatus('error');
            setErrorMessage(e.message || "Unknown error occurred");
        }
    };

    useEffect(() => {
        startSession();
        return () => cleanup();
    }, []);

    const handleRetry = () => {
        cleanup();
        startSession();
    };

    return (
        <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col items-center justify-center text-white p-4">
            <div className="absolute top-4 right-4">
                <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full">
                    <XCircleIcon className="w-8 h-8 text-gray-400 hover:text-white" />
                </button>
            </div>
            
            <div className="flex flex-col items-center gap-8">
                <div className={`relative transition-all duration-300 ${status === 'connecting' ? 'animate-pulse' : ''}`}>
                    <div className="absolute inset-0 bg-blue-500/30 rounded-full blur-xl" 
                         style={{ transform: `scale(${1 + volume})` }}></div>
                    <SlyntosLogo className="w-32 h-32 relative z-10" />
                </div>
                
                <div className="text-center max-w-md">
                    <h2 className="text-2xl font-bold mb-2">
                        {status === 'connecting' && "Connecting to Slyntos Live..."}
                        {status === 'connected' && "Listening..."}
                        {status === 'permission-denied' && "Microphone Access Denied"}
                        {status === 'error' && "Connection Error"}
                    </h2>
                    
                    <p className="text-gray-400 mb-6 h-5">
                         {status === 'connected' && (activeBeat ? `Speak naturally, or say "stop the beat".` : `Speak naturally. Try "sing a song and add a beat".`)}
                         {status === 'permission-denied' && "Please allow microphone access in your browser settings to use Live mode."}
                         {status === 'error' && errorMessage}
                    </p>

                    {(status === 'error' || status === 'permission-denied') && (
                        <button 
                            onClick={handleRetry}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-full font-semibold transition-colors"
                        >
                            Retry Connection
                        </button>
                    )}
                </div>
            </div>

            {/* Beat Indicator */}
            {activeBeat && (
                 <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-full text-sm flex items-center gap-2 border border-gray-700">
                    <MusicNoteIcon className="w-4 h-4 text-purple-400" />
                    <span className="font-mono">{activeBeat}</span>
                 </div>
            )}
        </div>
    );
};

export default LiveSession;
