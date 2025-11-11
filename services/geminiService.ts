import { GoogleGenAI, Modality, FunctionCall, Type } from "@google/genai";
import type { Message, FileData, Page, Source } from '../types';
import { Page as PageEnum } from '../types';

const IMAGE_GENERATION_MODEL = 'imagen-4.0-generate-001';
const EDIT_IMAGE_MODEL = 'gemini-2.5-flash-image';

// API Key hardcoded for testing
const API_KEY = 'AIzaSyBRHMD0ckpgyjXqOhyH0m0tfF3oPOLkGPs';

export interface GenerationOptions {
    useThinking?: boolean;
    useLite?: boolean;
    aspectRatio?: string;
}

const buildGeminiContent = (history: Message[]) => {
    return history.map(msg => {
        const parts: any[] = [];
        
        // Add text
        if (msg.content) parts.push({ text: msg.content });

        // Add files
        if (msg.role === 'user' && msg.files && msg.files.length > 0) {
            const fileParts = msg.files.map(file => ({
                inlineData: {
                    mimeType: file.type,
                    data: file.data
                }
            }));
            parts.push(...fileParts);
        }

        return {
            role: msg.role,
            parts
        };
    });
};

// --- Imagen 4.0 Generation ---
export async function generateImageImagen(prompt: string, aspectRatio: string = '1:1'): Promise<string[]> {
    if (!API_KEY) throw new Error("API Key not set.");
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    try {
        const response = await ai.models.generateImages({
            model: IMAGE_GENERATION_MODEL,
            prompt: prompt,
            config: {
                numberOfImages: 1,
                aspectRatio: aspectRatio as any, 
                outputMimeType: 'image/jpeg'
            }
        });
        
        const images: string[] = [];
        if (response.generatedImages) {
            for (const img of response.generatedImages) {
               if(img.image?.imageBytes) images.push(img.image.imageBytes);
            }
        }
        return images;
    } catch (e: any) {
        console.error("Imagen failed", e);
        const errStr = (e.message || '') + (e.toString ? e.toString() : '') + JSON.stringify(e);
        // Handle safety filter errors specifically
        if (errStr.includes("violated Google's Responsible AI practices")) {
             throw new Error("Image generation blocked. The prompt triggered safety filters. Please try a different description.");
        }
        throw e;
    }
}

// --- Image Editing ---
export async function editImage(prompt: string, imageFile: FileData): Promise<string[]> {
    if (!API_KEY) throw new Error("API Key not set.");
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    try {
        const response = await ai.models.generateContent({
            model: EDIT_IMAGE_MODEL,
            contents: {
                parts: [
                    { inlineData: { data: imageFile.data, mimeType: imageFile.type } },
                    { text: prompt }
                ]
            },
            config: {
                responseModalities: [Modality.IMAGE],
            }
        });

        const images: string[] = [];
        for (const part of response.candidates?.[0]?.content?.parts ?? []) {
            if (part.inlineData) {
                images.push(part.inlineData.data);
            }
        }
        return images;
    } catch (e) {
        console.error("Image editing failed", e);
        throw e;
    }
}

// --- Text to Speech ---
export async function generateTTS(text: string): Promise<string | null> {
     if (!API_KEY) throw new Error("API Key not set.");
     const ai = new GoogleGenAI({ apiKey: API_KEY });
     
     try {
         const response = await ai.models.generateContent({
             model: 'gemini-2.5-flash-preview-tts',
             contents: [{ parts: [{ text }] }],
             config: {
                 responseModalities: [Modality.AUDIO],
                 speechConfig: {
                     voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' }}
                 }
             }
         });
         
         const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
         if (audioData) {
             return `data:audio/mp3;base64,${audioData}`;
         }
         return null;
     } catch (e) {
         console.error("TTS failed", e);
         return null;
     }
}

// --- Main Chat Stream ---
export async function* generateContentStream(
    history: Message[],
    systemInstruction: string,
    page: Page,
    options: GenerationOptions = {}
): AsyncGenerator<{ text?: string, sources?: Source[], functionCalls?: FunctionCall[] }> {
    if (!API_KEY) {
        throw new Error("API Key not set.");
    }
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    const contents = buildGeminiContent(history);
    
    try {
        const config: any = { 
            systemInstruction,
        };

        // Model Selection Logic
        // Default
        let modelName = 'gemini-2.5-flash';

        if (options.useThinking) {
             modelName = 'gemini-2.5-pro';
             config.thinkingConfig = { thinkingBudget: 32768 }; // Max for pro
        } else if (options.useLite) {
             modelName = 'gemini-flash-lite-latest';
        } else if (page === PageEnum.Academic || page === PageEnum.WebsiteCreator) {
             // If not explicitly using Lite/Thinking, these pages default to Pro
             modelName = 'gemini-2.5-pro';
        } else {
            // Check if there is a video file in the history - if so, we must use Pro for video understanding
            const hasVideo = history.some(m => m.files?.some(f => f.type.startsWith('video/')));
            if (hasVideo) {
                modelName = 'gemini-2.5-pro';
            }
        }

        // Tool Logic
        if (page === PageEnum.General && !options.useThinking && !options.useLite) {
            // Add Grounding
            config.tools = [
                { googleSearch: {} }, 
                { googleMaps: {} },
            ];
        }

        const responseStream = await ai.models.generateContentStream({
            model: modelName,
            contents,
            config,
        });

        for await (const chunk of responseStream) {
            // Grounding Metadata
            const sources: Source[] = [];
            
            // Search Grounding
            const searchChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
            if (searchChunks) {
                 searchChunks.forEach((c: any) => {
                     if (c.web?.uri && c.web?.title) {
                         sources.push({ uri: c.web.uri, title: c.web.title });
                     }
                 });
            }
            
            // Maps Grounding metadata is often integrated into the text response or via specific chunks, 
            // but we can extract basic URLs if present in the same chunks structure or if provided in chunks.maps
            
            yield {
                text: chunk.text,
                sources: sources.length > 0 ? sources : undefined,
                functionCalls: chunk.functionCalls
            };
        }

    } catch (error) {
        console.error("Gemini API stream failed:", error);
        if (error instanceof Error) {
            yield { text: `\n\nAn error occurred: ${error.message}` };
        } else {
            yield { text: "\n\nAn unknown error occurred." };
        }
    }
};