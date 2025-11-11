import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { User, ChatSession, Page } from '../types';

const DB_NAME = 'slyntos-ai-db';
const DB_VERSION = 1;
const USERS_STORE = 'users';
const SESSIONS_STORE = 'chat-sessions';

interface SlyntosDB extends DBSchema {
  [USERS_STORE]: {
    key: string;
    value: User;
    indexes: { 'username_lower': string };
  };
  [SESSIONS_STORE]: {
    key: string;
    value: ChatSession;
    indexes: { 'user_page_date': [string, Page, number] };
  };
}

let dbPromise: Promise<IDBPDatabase<SlyntosDB>>;

const initDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<SlyntosDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(USERS_STORE)) {
          const usersStore = db.createObjectStore(USERS_STORE, { keyPath: 'id' });
          usersStore.createIndex('username_lower', 'username_lower', { unique: true });
        }
        if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
          const sessionsStore = db.createObjectStore(SESSIONS_STORE, { keyPath: 'id' });
          sessionsStore.createIndex('user_page_date', ['userId', 'page', 'createdAt'], { unique: false });
        }
      },
    });
  }
  return dbPromise;
};

// --- User Functions ---

export const addUser = async (user: User): Promise<void> => {
  const db = await initDB();
  const userWithIndex = { ...user, username_lower: user.username.toLowerCase() };
  await db.add(USERS_STORE, userWithIndex as any); // Add 'username_lower'
};

export const getUserByUsername = async (username: string): Promise<User | undefined> => {
  const db = await initDB();
  return db.getFromIndex(USERS_STORE, 'username_lower', username.toLowerCase());
};

// --- Chat Session Functions ---

export const saveChatSession = async (session: ChatSession, userId: string, page: Page): Promise<void> => {
    const db = await initDB();
    // Ensure session has necessary fields for indexing
    const sessionToIndex = { ...session, userId, page };
    await db.put(SESSIONS_STORE, sessionToIndex as any);
};

export const getAllChatSessionsForPage = async (userId: string, page: Page): Promise<ChatSession[]> => {
    const db = await initDB();
    const range = IDBKeyRange.bound([userId, page, -Infinity], [userId, page, Infinity]);
    const sessions = await db.getAllFromIndex(SESSIONS_STORE, 'user_page_date', range);
    // Sort descending by date (most recent first)
    return sessions.sort((a, b) => b.createdAt - a.createdAt);
};

export const deleteChatSession = async (sessionId: string): Promise<void> => {
    const db = await initDB();
    await db.delete(SESSIONS_STORE, sessionId);
};