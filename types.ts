// FIX: Provide full content for types.ts to define application-wide types.
export interface Source {
  uri: string;
  title: string;
}

export interface Message {
  role: 'user' | 'model';
  content: string;
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
}

export interface User {
  id: string;
  username: string;
}
