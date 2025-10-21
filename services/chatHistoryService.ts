// FIX: Provide content for chatHistoryService.ts to resolve module not found error.
import type { Message } from '../types';

const isBrowser = typeof window !== 'undefined';

export const saveHistory = (key: string, messages: Message[]): void => {
  if (!isBrowser) return;
  try {
    const serializedMessages = JSON.stringify(messages);
    localStorage.setItem(key, serializedMessages);
  } catch (e) {
    // FIX: Changed variable from 'error' to 'e' to resolve "Cannot find name 'error'" compilation error.
    console.error('Failed to save chat history:', e);
  }
};

export const getHistory = (key: string): Message[] => {
  if (!isBrowser) return [];
  try {
    const serializedMessages = localStorage.getItem(key);
    if (serializedMessages === null) {
      return [];
    }
    const messages: Message[] = JSON.parse(serializedMessages);
    // Basic validation to ensure it's an array of messages
    if (Array.isArray(messages) && messages.every(m => 'role' in m && 'content' in m)) {
      return messages;
    }
    return [];
  } catch (error) {
    console.error('Failed to retrieve chat history:', error);
    return [];
  }
};
