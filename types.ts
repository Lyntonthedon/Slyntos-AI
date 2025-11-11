
export interface Source {
  uri: string;
  title: string;
}

export interface Message {
  role: 'user' | 'model';
  content: string;
  images?: string[]; // base64 data
  audioUrl?: string; // URL for TTS audio
  sources?: Source[];
  files?: FileData[]; // For user-uploaded files
}

export interface FileData {
  name: string;
  type: string;
  data: string; // base64
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
  password?: string;
  profilePicture?: string;
  plan: 'free' | 'paid';
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  messages: Message[];
}