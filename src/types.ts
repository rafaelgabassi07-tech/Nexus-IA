

import { AgentDefinition } from './agents';

export type { AgentDefinition };

export type TechnicalStep = {
  id: string;
  label: string;
  status: 'running' | 'success' | 'error' | 'pending';
  details?: string;
  icon?: any;
};

export type Message = {
  id: string;
  role: 'user' | 'model';
  content: string;
  isError?: boolean;
  steps?: TechnicalStep[];
  images?: { mimeType: string; data: string }[];
};

export type APIPreset = {
  id: string;
  name: string;
  apiKey: string;
};

export type ChatSession = {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
  timestamp?: number;
  lastMessage?: string;
  fileHistory?: { timestamp: number, files: GeneratedFile[] }[];
};

export type GeneratedFile = {
  name: string;
  lang: string;
  code: string;
};

export type FileHistoryEntry = {
  timestamp: number;
  files: GeneratedFile[];
};
