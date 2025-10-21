import type { Message, Page, ChatSession } from '../types';

const isBrowser = typeof window !== 'undefined';
const DB_KEY = 'slyntos_ai_chat_db_v2';

// DB Structure: { [userId: string]: { [page in Page]?: ChatSession[] } }
type ChatDb = Record<string, Partial<Record<Page, ChatSession[]>>>;

const getDb = (): ChatDb => {
  if (!isBrowser) return {};
  try {
    const dbJson = localStorage.getItem(DB_KEY);
    return dbJson ? JSON.parse(dbJson) : {};
  } catch (e) {
    console.error("Failed to parse chat DB:", e);
    return {};
  }
};

const saveDb = (db: ChatDb): void => {
  if (!isBrowser) return;
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch (e) {
    console.error("Failed to save chat DB:", e);
  }
};

export const getAllSessions = (userId: string, page: Page): ChatSession[] => {
  const db = getDb();
  const userChats = db[userId] || {};
  const sessions = userChats[page] || [];
  // Sort by most recent first
  return sessions.sort((a, b) => b.createdAt - a.createdAt);
};

export const saveSession = (userId: string, page: Page, session: ChatSession): void => {
  const db = getDb();
  if (!db[userId]) {
    db[userId] = {};
  }
  if (!db[userId][page]) {
    db[userId][page] = [];
  }
  
  const sessions = db[userId][page]!;
  const existingIndex = sessions.findIndex(s => s.id === session.id);

  if (existingIndex > -1) {
    sessions[existingIndex] = session;
  } else {
    sessions.push(session);
  }
  
  saveDb(db);
};


export const deleteSession = (userId: string, page: Page, sessionId: string): ChatSession[] => {
    const db = getDb();
    if (!db[userId] || !db[userId][page]) {
      return [];
    }
    
    const updatedSessions = db[userId][page]!.filter(s => s.id !== sessionId);
    db[userId][page] = updatedSessions;
    
    saveDb(db);
    return updatedSessions.sort((a, b) => b.createdAt - a.createdAt);
};
