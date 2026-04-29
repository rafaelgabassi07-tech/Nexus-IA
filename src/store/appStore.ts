

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_MODEL } from '../lib/models';
import { APIPreset, ChatSession, SecurityRule, AgentDefinition } from '../types';

export const defaultSecurityRules: SecurityRule[] = [
  { id: '1', name: 'Block eval()', pattern: 'eval\\(', action: 'warn', active: true },
  { id: '2', name: 'Warn innerHTML', pattern: '\\.innerHTML\\s*=', action: 'warn', active: true },
  { id: '3', name: 'Hardcoded Secrets', pattern: '(API_KEY|SECRET|PASSWORD)\\s*=', action: 'warn', active: true },
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
  
  setActiveTab: (tab: 'chat' | 'code' | 'preview' | 'settings' | 'files') => void;
  setSettingsTab: (tab: 'overview' | 'general' | 'agent' | 'security') => void;
  setIsSidebarOpen: (isOpen: boolean) => void;
  setIsSaving: (isSaving: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: 'chat',
  settingsTab: 'overview',
  isSidebarOpen: false,
  isSaving: false,
  
  setActiveTab: (activeTab) => set({ activeTab }),
  setSettingsTab: (settingsTab) => set({ settingsTab }),
  setIsSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
  setIsSaving: (isSaving) => set({ isSaving }),
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
