

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_MODEL } from '../lib/models';
import { APIPreset, ChatSession, SecurityRule, AgentDefinition } from '../types';

export const defaultSecurityRules: SecurityRule[] = [
  {
    id: 'sr-001',
    name: 'eval() detectado',
    enabled: true,
    conditions: [{ field: 'code', operator: 'matches', pattern: '\\beval\\s*\\(' }],
    action: 'block',
    severity: 'critical',
    message: 'eval() bloqueado — risco de injeção de código arbitrário',
    suggestion: 'Use JSON.parse() para dados JSON. Para lógica dinâmica, prefira Function() com escopo controlado.',
  },
  {
    id: 'sr-002',
    name: 'Chave de API hardcoded',
    enabled: true,
    conditions: [{
      field: 'code',
      operator: 'matches',
      pattern: '(api[_-]?key|apikey|secret|password|token|auth)\\s*[:=]\\s*[\'"][a-zA-Z0-9_\\-]{20,}[\'"]',
    }],
    action: 'block',
    severity: 'critical',
    message: 'Possível chave/senha hardcoded detectada no código',
    suggestion: 'Use variáveis de ambiente: process.env.API_KEY ou import.meta.env.VITE_API_KEY',
  },
  {
    id: 'sr-003',
    name: 'innerHTML não sanitizado',
    enabled: true,
    conditions: [{ field: 'code', operator: 'matches', pattern: '\\.innerHTML\\s*=' }],
    action: 'warn',
    severity: 'high',
    message: 'innerHTML detectado — risco de XSS se o conteúdo vier do usuário',
    suggestion: 'Use textContent para texto simples, ou sanitize com DOMPurify antes de usar innerHTML.',
  },
  {
    id: 'sr-004',
    name: 'console.log em produção',
    enabled: true,
    conditions: [{ field: 'code', operator: 'matches', pattern: 'console\\.log\\(' }],
    action: 'warn',
    severity: 'low',
    message: 'console.log detectado — remova antes de publicar em produção',
  },
  {
    id: 'sr-005',
    name: 'Tipo any no TypeScript',
    enabled: true,
    conditions: [
      { field: 'lang', operator: 'contains', pattern: 'ts' },
      { field: 'code', operator: 'matches', pattern: ':\\s*any\\b' },
    ],
    action: 'warn',
    severity: 'medium',
    message: 'Tipo "any" detectado — viola TypeScript estrito',
    suggestion: 'Use "unknown" com type narrowing, ou defina um tipo específico.',
  },
  {
    id: 'sr-006',
    name: 'fetch sem tratamento de erro',
    enabled: true,
    conditions: [{ field: 'code', operator: 'matches', pattern: 'fetch\\([^)]+\\)\\.then\\(' }],
    action: 'warn',
    severity: 'high',
    message: 'fetch() encadeado com .then() sem .catch() detectado',
    suggestion: 'Adicione .catch() ou use async/await com try/catch e verifique res.ok.',
  },
];

interface SettingsState {
  apiKey: string;
  selectedModel: string;
  activeAgentId: string;
  activePresetId: string | null;
  apiPresets: APIPreset[];
  customAgents: AgentDefinition[];
  temperature: number;
  searchGrounding: boolean;
  autoSave: boolean;
  securityRules: SecurityRule[];
  
  setApiKey: (key: string) => void;
  setSelectedModel: (model: string) => void;
  setActiveAgentId: (id: string) => void;
  setActivePresetId: (id: string | null) => void;
  setApiPresets: (presets: APIPreset[]) => void;
  setCustomAgents: (agents: AgentDefinition[]) => void;
  setTemperature: (temp: number) => void;
  setSearchGrounding: (active: boolean) => void;
  setAutoSave: (active: boolean) => void;
  setSecurityRules: (rules: SecurityRule[]) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      apiKey: '',
      selectedModel: DEFAULT_MODEL,
      activeAgentId: 'general-specialist',
      activePresetId: null,
      apiPresets: [],
      customAgents: [],
      temperature: 0.7,
      searchGrounding: false,
      autoSave: true,
      securityRules: defaultSecurityRules,
      
      setApiKey: (key) => set({ apiKey: key }),
      setSelectedModel: (selectedModel) => set({ selectedModel }),
      setActiveAgentId: (activeAgentId) => set({ activeAgentId }),
      setActivePresetId: (activePresetId) => set({ activePresetId }),
      setApiPresets: (apiPresets) => set({ apiPresets }),
      setCustomAgents: (customAgents) => set({ customAgents }),
      setTemperature: (temperature) => set({ temperature }),
      setSearchGrounding: (searchGrounding) => set({ searchGrounding }),
      setAutoSave: (autoSave) => set({ autoSave }),
      setSecurityRules: (securityRules) => set({ securityRules }),
    }),
    {
      name: 'nexus-settings-storage',
    }
  )
);

interface UIState {
  activeTab: 'chat' | 'code' | 'preview' | 'settings' | 'files';
  settingsTab: 'overview' | 'general' | 'agent' | 'security';
  isSidebarOpen: boolean;
  isSaving: boolean;
  isCommandPaletteOpen: boolean;
  
  setActiveTab: (tab: 'chat' | 'code' | 'preview' | 'settings' | 'files') => void;
  setSettingsTab: (tab: 'overview' | 'general' | 'agent' | 'security') => void;
  setIsSidebarOpen: (isOpen: boolean) => void;
  setIsSaving: (isSaving: boolean) => void;
  setIsCommandPaletteOpen: (isOpen: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: 'chat',
  settingsTab: 'overview',
  isSidebarOpen: false,
  isSaving: false,
  isCommandPaletteOpen: false,
  
  setActiveTab: (activeTab) => set({ activeTab }),
  setSettingsTab: (settingsTab) => set({ settingsTab }),
  setIsSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
  setIsSaving: (isSaving) => set({ isSaving }),
  setIsCommandPaletteOpen: (isCommandPaletteOpen) => set({ isCommandPaletteOpen }),
}));

interface ChatHistoryState {
  sessions: ChatSession[];
  
  addSession: (session: ChatSession) => void;
  updateSession: (id: string, updates: Partial<ChatSession>) => void;
  removeSession: (id: string) => void;
  clearHistory: () => void;
}

export const useChatHistoryStore = create<ChatHistoryState>()(
  persist(
    (set) => ({
      sessions: [],
      
      addSession: (session) => set((state) => ({ 
        sessions: [session, ...state.sessions.filter(s => s.id !== session.id)] 
      })),
      
      updateSession: (id, updates) => set((state) => ({
        sessions: state.sessions.map(s => s.id === id ? { ...s, ...updates } : s)
      })),
      
      removeSession: (id) => set((state) => ({
        sessions: state.sessions.filter(s => s.id !== id)
      })),
      
      clearHistory: () => set({ sessions: [] }),
    }),
    {
      name: 'nexus-chat-history-storage',
    }
  )
);
