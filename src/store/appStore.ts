

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
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
  autoRefine: boolean;
  showDiff: boolean;
  autoSave: boolean;
  errorLogs: Array<{ timestamp: number; message: string; type: 'lint' | 'runtime' | 'vfs' }>;
  collectiveIntelligence: {
    lessonsLearned: string[];
    successfulPatterns: Array<{ id: string; description: string; code: string }>;
  };
  snapshots: Array<{ id: string; timestamp: number; name: string; files: any[] }>;
  searchQuery: string;
  securityRules: SecurityRule[];
  
  setApiKey: (key: string) => void;
  setSelectedModel: (model: string) => void;
  setActiveAgentId: (id: string) => void;
  setActivePresetId: (id: string | null) => void;
  setApiPresets: (presets: APIPreset[]) => void;
  setCustomAgents: (agents: AgentDefinition[]) => void;
  setTemperature: (temp: number) => void;
  setSearchGrounding: (active: boolean) => void;
  setAutoRefine: (active: boolean) => void;
  setShowDiff: (active: boolean) => void;
  setAutoSave: (active: boolean) => void;
  addErrorLog: (log: { message: string; type: 'lint' | 'runtime' | 'vfs' }) => void;
  clearErrorLogs: () => void;
  addLessonLearned: (lesson: string) => void;
  removeLessonLearned: (index: number) => void;
  addSuccessfulPattern: (pattern: { description: string; code: string }) => void;
  createSnapshot: (name: string, files: any[]) => void;
  deleteSnapshot: (id: string) => void;
  setSearchQuery: (query: string) => void;
  setSecurityRules: (rules: SecurityRule[]) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    immer((set) => ({
      apiKey: '',
      selectedModel: DEFAULT_MODEL,
      activeAgentId: 'general-specialist',
      activePresetId: null,
      apiPresets: [],
      customAgents: [],
      temperature: 0.7,
      searchGrounding: false,
      autoRefine: true,
      showDiff: true,
      autoSave: true,
      errorLogs: [],
      collectiveIntelligence: {
        lessonsLearned: [
          'Prever o uso de tailwind v4 com @import "tailwindcss"',
          'Usar framer-motion (motion/react) para todas as animações',
          'Nexus Engine prefere Lucide React para ícones',
          'Componentes devem ser funcionais e usar hooks'
        ],
        successfulPatterns: []
      },
      snapshots: [],
      searchQuery: '',
      securityRules: defaultSecurityRules,
      
      setApiKey: (key) => set((state) => { state.apiKey = key; }),
      setSelectedModel: (selectedModel) => set((state) => { state.selectedModel = selectedModel; }),
      setActiveAgentId: (activeAgentId) => set((state) => { state.activeAgentId = activeAgentId; }),
      setActivePresetId: (activePresetId) => set((state) => { state.activePresetId = activePresetId; }),
      setApiPresets: (apiPresets) => set((state) => { state.apiPresets = apiPresets; }),
      setCustomAgents: (customAgents) => set((state) => { state.customAgents = customAgents; }),
      setTemperature: (temperature) => set((state) => { state.temperature = temperature; }),
      setSearchGrounding: (searchGrounding) => set((state) => { state.searchGrounding = searchGrounding; }),
      setAutoRefine: (autoRefine) => set((state) => { state.autoRefine = autoRefine; }),
      setShowDiff: (showDiff) => set((state) => { state.showDiff = showDiff; }),
      setAutoSave: (autoSave) => set((state) => { state.autoSave = autoSave; }),
      addErrorLog: (log) => set((state) => { 
        state.errorLogs = [
          { ...log, timestamp: Date.now() }, 
          ...state.errorLogs.slice(0, 19) 
        ]; 
      }),
      clearErrorLogs: () => set((state) => { state.errorLogs = []; }),
      addLessonLearned: (lesson) => set((state) => {
        if (!state.collectiveIntelligence.lessonsLearned.includes(lesson)) {
          state.collectiveIntelligence.lessonsLearned = [lesson, ...state.collectiveIntelligence.lessonsLearned.slice(0, 49)];
        }
      }),
      removeLessonLearned: (index) => set((state) => {
        state.collectiveIntelligence.lessonsLearned.splice(index, 1);
      }),
      addSuccessfulPattern: (pattern) => set((state) => {
        state.collectiveIntelligence.successfulPatterns = [
          { ...pattern, id: Math.random().toString(36).substr(2, 9) },
          ...state.collectiveIntelligence.successfulPatterns.slice(0, 19)
        ];
      }),
      createSnapshot: (name, files) => set((state) => {
        state.snapshots = [
          { id: Math.random().toString(36).substr(2, 9), timestamp: Date.now(), name, files: JSON.parse(JSON.stringify(files)) },
          ...state.snapshots.slice(0, 9)
        ];
      }),
      deleteSnapshot: (id) => set((state) => {
        state.snapshots = state.snapshots.filter(s => s.id !== id);
      }),
      setSearchQuery: (searchQuery) => set((state) => { state.searchQuery = searchQuery; }),
      setSecurityRules: (securityRules) => set((state) => { state.securityRules = securityRules; }),
    })),
    {
      name: 'nexus-settings-storage',
    }
  )
);

interface UIState {
  activeTab: 'chat' | 'code' | 'preview' | 'settings' | 'files';
  settingsTab: 'general' | 'agent' | 'security' | 'intelligence';
  isSidebarOpen: boolean;
  isSaving: boolean;
  isCommandPaletteOpen: boolean;
  activeFilePath: string | null;
  
  setActiveTab: (tab: 'chat' | 'code' | 'preview' | 'settings' | 'files') => void;
  setSettingsTab: (tab: 'general' | 'agent' | 'security' | 'intelligence') => void;
  setIsSidebarOpen: (isOpen: boolean) => void;
  setIsSaving: (isSaving: boolean) => void;
  setIsCommandPaletteOpen: (isOpen: boolean) => void;
  setActiveFilePath: (path: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: 'chat',
  settingsTab: 'general',
  isSidebarOpen: false,
  isSaving: false,
  isCommandPaletteOpen: false,
  activeFilePath: null,
  
  setActiveTab: (activeTab) => set({ activeTab }),
  setSettingsTab: (settingsTab) => set({ settingsTab }),
  setIsSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
  setIsSaving: (isSaving) => set({ isSaving }),
  setIsCommandPaletteOpen: (isCommandPaletteOpen) => set({ isCommandPaletteOpen }),
  setActiveFilePath: (activeFilePath) => set({ activeFilePath }),
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
