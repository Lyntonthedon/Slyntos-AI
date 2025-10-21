export enum Page {
  General = 'General',
  Academic = 'Academic',
}

export interface Source {
  uri: string;
  title: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  sources?: Source[];
}

export interface FileData {
  name: string;
  type: string;
  data: string; // base64 encoded
}