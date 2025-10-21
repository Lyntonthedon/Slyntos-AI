// FIX: Provide full content for types.ts to define application-wide types.
export interface Source {
  uri: string;
  title: string;
}

export interface Message {
  role: 'user' | 'model';
  content: string;
  images?: string[]; // To hold base64 image data
  sources?: Source[];
}

export interface FileData {
  name: string;
  type: string;
  data: string;
  size: number;
}

export enum Page {
  General = 'General',
  Academic = 'Academic',
  WebsiteCreator = 'Website Creator',
}

export interface User {
  id: string;
  username: string;
  password?: string; // Hashed password, for storage only
  profilePicture?: string; // base64 data URL
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  messages: Message[];
}
