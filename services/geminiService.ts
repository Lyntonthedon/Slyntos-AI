import { GoogleGenAI } from "@google/genai";
import type { Message, FileData, Page, Source } from '../types';
import { Page as PageEnum } from '../types';

const buildGeminiContent = (history: Message[]) => {
    // Gemini expects alternating user/model roles.
    return history
        .map(msg => {
            const parts: ({ text: string } | { inlineData: { mimeType: string, data: string } })[] = [{ text: msg.content }];
            return {
                role: msg.role,
                parts
            };
        });
};

export async function* generateContentStream(
    history: Message[],
    systemInstruction: string,
    files: FileData[],
    page: Page
): AsyncGenerator<{ text: string, sources?: Source[] }> {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const contents = buildGeminiContent(history);
    
    if (files.length > 0 && contents.length > 0) {
        const lastMessage = contents[contents.length - 1];
        if (lastMessage.role === 'user') {
            const fileParts = files.map(file => ({
                inlineData: {
                    mimeType: file.type,
                    data: file.data
                }
            }));
            lastMessage.parts.push(...fileParts);
        }
    }
    
    try {
        const config: any = { 
            systemInstruction,
            temperature: 0.7,
            topP: 0.95,
        };

        if (page === PageEnum.General) {
            config.tools = [{googleSearch: {}}];
        }

        // FIX: Select model based on the page type to align with Gemini API guidelines for different task complexities.
        const modelName = page === PageEnum.Academic ? 'gemini-2.5-pro' : 'gemini-2.5-flash';

        const responseStream = await ai.models.generateContentStream({
            model: modelName,
            contents,
            config,
        });

        for await (const chunk of responseStream) {
            const sources = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks
                ?.map((chunk: any) => ({
                    uri: chunk.web?.uri,
                    title: chunk.web?.title,
                }))
                .filter((source): source is Source => !!(source.uri && source.title));

            yield {
                text: chunk.text,
                sources: sources && sources.length > 0 ? sources : undefined,
            };
        }

    } catch (error) {
        console.error("Gemini API stream failed:", error);
        if (error instanceof Error) {
            yield { text: `\n\nAn error occurred while contacting the AI: ${error.message}` };
        } else {
            yield { text: "\n\nAn unknown error occurred while contacting the AI." };
        }
    }
};