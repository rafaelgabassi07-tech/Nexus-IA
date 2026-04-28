

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_MODEL } from '../lib/models';
import { APIPreset, ChatSession } from '../types';

interface SettingsState {
  apiKey: string;
  selectedModel: string;
  activeAgentId: string;
  activePresetId: string | null;
  apiPresets: APIPreset[];
  temperature: number;
  searchGrounding: boolean;
  autoSave: boolean;
  
  setApiKey: (key: string) => void;
  setSelectedModel: (model: string) => void;
  setActiveAgentId: (id: string) => void;
  setActivePresetId: (id: string | null) => void;
  setApiPresets: (presets: APIPreset[]) => void;
  setTemperature: (temp: number) => void;
  setSearchGrounding: (active: boolean) => void;
  setAutoSave: (active: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      apiKey: '',
      selectedModel: DEFAULT_MODEL,
      activeAgentId: 'general-specialist',
      activePresetId: null,
      apiPresets: [],
      temperature: 0.7,
      searchGrounding: false,
      autoSave: true,
      
      setApiKey: (key) => set({ apiKey: key }),
      setSelectedModel: (selectedModel) => set({ selectedModel }),
      setActiveAgentId: (activeAgentId) => set({ activeAgentId }),
      setActivePresetId: (activePresetId) => set({ activePresetId }),
      setApiPresets: (apiPresets) => set({ apiPresets }),
      setTemperature: (temperature) => set({ temperature }),
      setSearchGrounding: (searchGrounding) => set({ searchGrounding }),
      setAutoSave: (autoSave) => set({ autoSave }),
    }),
    {
      name: 'nexus-settings-storage',
    }
  )
);

interface UIState {
  activeTab: 'chat' | 'code' | 'preview' | 'settings';
  settingsTab: 'overview' | 'general' | 'agent' | 'security';
  isSidebarOpen: boolean;
  isSaving: boolean;
  
  setActiveTab: (tab: 'chat' | 'code' | 'preview' | 'settings') => void;
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
