import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Loader2, ArrowUp, Key,
  Paperclip, Image as ImageIcon, Terminal, Layout,
  Plus, Trash2, X,
  Brain, Shield, ArrowLeft, Activity,
  RotateCcw, FolderOpen, Layers,
  Lock, EyeOff, CheckCircle2, ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'sonner';

import { FileTree } from './components/FileTree';
import { AgentIcon } from './components/AgentIcon';
import { CodeBlock } from './components/CodeBlock';
import { Header } from './components/Header';
import { ChatLog } from './components/ChatLog';
import { FloatingNav } from './components/FloatingNav';

import { 
  APIPreset, ChatSession 
} from './types';

import { AGENTS } from './agents';
import type { AgentDefinition } from './agents';
import { 
  cn, generateId, safeLocalStorageSet, safeStorageString, safeStorageNumber, extractFilesFromMarkdown 
} from './lib/utils';
import { useChatSession } from './hooks/useChatSession';

import { Button } from './components/ui/button';
import { Textarea } from './components/ui/textarea';
import { Input } from './components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';

export default function App() {
  const [customAgents, setCustomAgents] = useState<AgentDefinition[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nexus_custom_agents');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const allAgents = useMemo(() => [...AGENTS, ...customAgents], [customAgents]);

  const [activeAgentId, setActiveAgentId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return safeStorageString('nexus_active_agent_id', AGENTS[0].id);
    }
    return AGENTS[0].id;
  });

  const activeAgent = useMemo(() => {
    return allAgents.find(a => a.id === activeAgentId) || AGENTS[0];
  }, [allAgents, activeAgentId]);

  const [apiKey, setApiKey] = useState(() => safeStorageString('nexus_api_key', ''));
  const [selectedModel, setSelectedModel] = useState(() => safeStorageString('nexus_selected_model', 'gemini-2.0-flash'));
  const [temperature, setTemperature] = useState<number>(() => {
    return safeStorageNumber('nexus_temperature', 0.7);
  });
  const [systemPrompt, setSystemPrompt] = useState(() => {
    return safeStorageString('nexus_system_prompt', activeAgent.systemPrompt);
  });

  const {
    messages,
    setMessages,
    isLoading,
    generatedFiles,
    setGeneratedFiles,
    activeFileIndex,
    setActiveFileIndex,
    fileHistory,
    setFileHistory,
    resetChat: hookResetChat,
    sendMessage
  } = useChatSession({
    activeAgent,
    apiKey,
    selectedModel,
    systemPrompt,
    temperature
  });

  const [apiPresets, setApiPresets] = useState<APIPreset[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nexus_api_presets');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [activePresetId, setActivePresetId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = safeStorageString('nexus_active_preset_id', '');
      return saved ? saved : null;
    }
    return null;
  });

  const [chatHistory, setChatHistory] = useState<ChatSession[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nexus_chat_history');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return [];
  });
  
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'preview' | 'code' | 'settings'>('chat');
  const [previewKey, setPreviewKey] = useState(0);
  const [historySearch, setHistorySearch] = useState('');
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [chatInputHistory, setChatInputHistory] = useState<string[]>(['']);
  const [chatInputHistoryIndex, setChatInputHistoryIndex] = useState(0);

  const [isSystemPromptExpanded, setIsSystemPromptExpanded] = useState(false);

  const [settingsTab, setSettingsTab] = useState<'overview' | 'general' | 'agent' | 'security'>('overview');
  const [isPresetFormOpen, setIsPresetFormOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<APIPreset | null>(null);
  const [presetForm, setPresetForm] = useState<Partial<APIPreset>>({});

  const [isAgentFormOpen, setIsAgentFormOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AgentDefinition | null>(null);
  const [agentForm, setAgentForm] = useState<Partial<AgentDefinition>>({});

  const [isClearHistoryModalOpen, setIsClearHistoryModalOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [draftApiKey, setDraftApiKey] = useState(apiKey);
  const [draftSelectedModel, setDraftSelectedModel] = useState(selectedModel);
  const [draftTemperature, setDraftTemperature] = useState(temperature);
  const [draftSystemPrompt, setDraftSystemPrompt] = useState(systemPrompt);
  const [draftActiveAgentId, setDraftActiveAgentId] = useState(activeAgentId);
  const [draftActivePresetId, setDraftActivePresetId] = useState(activePresetId);

  useEffect(() => {
    const validModels = [
      'gemini-3.1-pro-preview',
      'gemini-3.1-flash-lite-preview',
      'gemini-3-flash-preview', 
      'gemini-2.5-flash', 
      'gemini-2.0-flash', 
      'gemini-2.0-flash-lite', 
      'gemini-flash-latest'
    ];
    if (!validModels.includes(selectedModel)) {
      setSelectedModel('gemini-3-flash-preview');
      setDraftSelectedModel('gemini-3-flash-preview');
      safeLocalStorageSet('nexus_selected_model', 'gemini-3-flash-preview');
    }
  }, [selectedModel]);

  const hasSettingsChanges = useMemo(() => {
    return draftApiKey !== apiKey || 
           draftSelectedModel !== selectedModel || 
           draftTemperature !== temperature || 
           draftSystemPrompt !== systemPrompt ||
           draftActiveAgentId !== activeAgentId ||
           draftActivePresetId !== activePresetId;
  }, [apiKey, selectedModel, temperature, systemPrompt, activeAgentId, activePresetId, draftApiKey, draftSelectedModel, draftTemperature, draftSystemPrompt, draftActiveAgentId, draftActivePresetId]);

  useEffect(() => {
    if (activeTab === 'settings') {
      setDraftApiKey(apiKey);
      setDraftSelectedModel(selectedModel);
      setDraftTemperature(temperature);
      setDraftSystemPrompt(systemPrompt);
      setDraftActiveAgentId(activeAgentId);
      setDraftActivePresetId(activePresetId);
    }
  }, [activeTab, apiKey, selectedModel, temperature, systemPrompt, activeAgentId, activePresetId]);

  const saveSettings = () => {
    setApiKey(draftApiKey);
    setSelectedModel(draftSelectedModel);
    setTemperature(draftTemperature);
    setSystemPrompt(draftSystemPrompt);
    setActiveAgentId(draftActiveAgentId);
    setActivePresetId(draftActivePresetId);
    
    safeLocalStorageSet('nexus_api_key', draftApiKey);
    safeLocalStorageSet('nexus_selected_model', draftSelectedModel);
    safeLocalStorageSet('nexus_temperature', draftTemperature.toString());
    safeLocalStorageSet('nexus_system_prompt', draftSystemPrompt);
    safeLocalStorageSet('nexus_active_agent_id', draftActiveAgentId);
    if (draftActivePresetId) safeLocalStorageSet('nexus_active_preset_id', draftActivePresetId);
    else localStorage.removeItem('nexus_active_preset_id');
    // REMOVED: setActiveTab('chat');
    toast.success('Configurações aplicadas com sucesso');
  };

  const saveApiPresets = (presets: APIPreset[]) => {
    setApiPresets(presets);
    safeLocalStorageSet('nexus_api_presets', presets);
  };

  const addOrUpdatePreset = () => {
    if (!presetForm.name || !presetForm.apiKey) return;
    if (editingPreset) {
      const updated = apiPresets.map(p => p.id === editingPreset.id ? { ...p, ...presetForm } as APIPreset : p);
      saveApiPresets(updated);
      toast.success('Preset atualizado com sucesso');
    } else {
      if (apiPresets.length >= 5) {
        toast.error('Limite de 5 chaves API atingido. Remova uma para adicionar outra.');
        return;
      }
      const newPreset: APIPreset = { id: generateId(), name: presetForm.name!, apiKey: presetForm.apiKey! };
      saveApiPresets([...apiPresets, newPreset]);
      toast.success('Novo preset de API registrado');
      if (!activePresetId) {
        setActivePresetId(newPreset.id);
        safeLocalStorageSet('nexus_active_preset_id', newPreset.id);
      }
    }
    setIsPresetFormOpen(false);
    setEditingPreset(null);
    setPresetForm({});
  };

  const deletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Deseja excluir este preset?')) {
      const updated = apiPresets.filter(p => p.id !== id);
      saveApiPresets(updated);
      if (activePresetId === id) {
        const nextId = updated.length > 0 ? updated[0].id : null;
        setActivePresetId(nextId);
        if (nextId) safeLocalStorageSet('nexus_active_preset_id', nextId);
        else localStorage.removeItem('nexus_active_preset_id');
      }
    }
  };

  const saveCustomAgents = (agents: AgentDefinition[]) => {
    setCustomAgents(agents);
    safeLocalStorageSet('nexus_custom_agents', agents);
  };

  const addOrUpdateAgent = () => {
    if (!agentForm.name || !agentForm.systemPrompt) return;
    if (editingAgent) {
      const updated = customAgents.map(a => a.id === editingAgent.id ? { ...a, ...agentForm } as AgentDefinition : a);
      saveCustomAgents(updated);
    } else {
      const newAgent: AgentDefinition = {
        id: generateId(),
        name: agentForm.name!,
        iconName: agentForm.iconName || 'Brain',
        color: agentForm.color || 'bg-purple-500',
        shortDescription: agentForm.shortDescription || '',
        systemPrompt: agentForm.systemPrompt!,
      };
      saveCustomAgents([...customAgents, newAgent]);
    }
    setIsAgentFormOpen(false);
    setEditingAgent(null);
    setAgentForm({});
  };

  const deleteAgent = (id: string) => {
    if (confirm('Deseja excluir este agente?')) {
      const updated = customAgents.filter(a => a.id !== id);
      saveCustomAgents(updated);
      if (draftActiveAgentId === id) setDraftActiveAgentId(AGENTS[0].id);
    }
  };
  
  const resetChat = useCallback(() => {
    hookResetChat();
    setCurrentChatId(generateId());
    setActiveTab('chat');
    setIsSidebarOpen(false);
    setChatInputHistory(['']);
    setChatInputHistoryIndex(0);
  }, [hookResetChat]);

  const undoInput = useCallback(() => {
    if (chatInputHistoryIndex > 0) {
      const prevIndex = chatInputHistoryIndex - 1;
      setChatInputHistoryIndex(prevIndex);
      setInputMessage(chatInputHistory[prevIndex]);
    }
  }, [chatInputHistory, chatInputHistoryIndex]);

  const redoInput = useCallback(() => {
    if (chatInputHistoryIndex < chatInputHistory.length - 1) {
      const nextIndex = chatInputHistoryIndex + 1;
      setChatInputHistoryIndex(nextIndex);
      setInputMessage(chatInputHistory[nextIndex]);
    }
  }, [chatInputHistory, chatInputHistoryIndex]);

  const undoCode = useCallback(() => {
    if (fileHistory.length > 1) {
      // Create a dummy "undo" by going back one version
      // In a real app we might want a separate pointer, 
      // but for now we'll just allow navigating the history.
      const newHistory = [...fileHistory];
      const reverted = newHistory.pop();
      if (reverted) {
        setFileHistory(newHistory);
        setGeneratedFiles(newHistory[newHistory.length - 1].files);
        setActiveFileIndex(0);
      }
    }
  }, [fileHistory, setFileHistory, setGeneratedFiles, setActiveFileIndex]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Undo/Redo Input
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (document.activeElement?.tagName === 'TEXTAREA') {
           e.preventDefault();
           undoInput();
        } else if (activeTab === 'code') {
           e.preventDefault();
           undoCode();
        }
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        if (document.activeElement?.tagName === 'TEXTAREA') {
           e.preventDefault();
           redoInput();
        }
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        resetChat();
        setActiveTab('chat');
        setIsSidebarOpen(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSidebarOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
      if (e.key === 'Escape') {
        setIsSidebarOpen(false);
        setIsPresetFormOpen(false);
        setIsAgentFormOpen(false);
      }
    };
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [resetChat]);

  useEffect(() => {
    const currentChat = chatHistory.find(c => c.id === currentChatId);
    document.title = currentChat ? `${currentChat.title} — Nexus IA` : 'Nexus IA';
  }, [currentChatId, chatHistory]);

  const [isAtBottom, setIsAtBottom] = useState(true);
  const [previewHtml, setPreviewHtml] = useState<string>('');

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior
      });
    }
  }, []);

  const handleSendMessage = useCallback(async (e?: React.FormEvent, overridePrompt?: string) => {
    if (e) e.preventDefault();
    if ((!inputMessage.trim() && !overridePrompt && attachedFiles.length === 0) || isLoading) return;

    const messageToSend = overridePrompt || inputMessage;
    
    // Manage input history for undo/redo
    if (!overridePrompt && inputMessage.trim()) {
      setChatInputHistory(prev => {
        const next = prev.slice(0, chatInputHistoryIndex + 1);
        if (next[next.length - 1] !== inputMessage) {
          return [...next, inputMessage];
        }
        return next;
      });
      setChatInputHistoryIndex(prev => prev + 1);
    }

    setInputMessage('');
    setAttachedFiles([]);
    setPreviewError(null);
    
    if (activeTab === 'preview' || activeTab === 'code' || activeTab === 'settings') {
      setActiveTab('chat');
    }

    try {
      await sendMessage(messageToSend, attachedFiles);
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  }, [inputMessage, attachedFiles, isLoading, activeTab, sendMessage]);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const atBottom = scrollHeight - scrollTop - clientHeight < 100;
      setIsAtBottom(atBottom);
      setShowScrollButton(!atBottom && isLoading);
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [isLoading]);

  useEffect(() => {
    if (isLoading && isAtBottom) {
      scrollToBottom('auto');
    }
  }, [messages, isLoading, isAtBottom, scrollToBottom]);

  useEffect(() => {
    if (currentChatId) {
      setTimeout(() => scrollToBottom('auto'), 100);
    }
  }, [currentChatId, scrollToBottom]);

  useEffect(() => {
    if (chatHistory.length > 0) {
      setIsSaving(true);
      safeLocalStorageSet('nexus_chat_history', chatHistory);
      const timer = setTimeout(() => setIsSaving(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [chatHistory]);

  useEffect(() => {
    if (messages.length > 1 && currentChatId) {
      setChatHistory(prev => {
        let exists = false;
        const newHistory = prev.map(chat => {
          if (chat.id === currentChatId) {
            exists = true;
            return {
              ...chat,
              messages,
              updatedAt: Date.now(),
              fileHistory,
              title: chat.title === 'Novo Projeto' && messages[1]?.role === 'user'
                ? messages[1].content.slice(0, 30) + (messages[1].content.length > 30 ? '...' : '')
                : chat.title
            };
          }
          return chat;
        });

        if (!exists) {
           return [{
             id: currentChatId,
             title: messages[1]?.role === 'user' ? (messages[1].content.slice(0, 30) + (messages[1].content.length > 30 ? '...' : '')) : 'Novo Projeto',
             messages,
             updatedAt: Date.now(),
             fileHistory
           }, ...newHistory];
        }

        return newHistory;
      });
    }
  }, [messages, currentChatId, fileHistory]);

  const hasFiles = generatedFiles.length > 0;

  useEffect(() => {
    const buildPreviewHtml = () => {
      const htmlFile = generatedFiles.find(f => f.lang === 'html');
      if (htmlFile) return htmlFile.code;

      if (generatedFiles.length > 0) {
        const entryFile = generatedFiles.find(f => 
          f.name.toLowerCase().includes('app') || 
          f.name.toLowerCase().includes('main') || 
          f.name.toLowerCase().includes('index')
        ) || generatedFiles[0];

        return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Nexus Preview</title>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <script type="importmap">
    {
      "imports": {
        "react": "https://esm.sh/react@19.0.0",
        "react-dom": "https://esm.sh/react-dom@19.0.0",
        "react-dom/client": "https://esm.sh/react-dom@19.0.0/client",
        "lucide-react": "https://esm.sh/lucide-react@0.344.0",
        "motion/react": "https://esm.sh/motion@11.11.13/react",
        "framer-motion": "https://esm.sh/framer-motion@11.11.13",
        "clsx": "https://esm.sh/clsx@2.1.0",
        "tailwind-merge": "https://esm.sh/tailwind-merge@2.2.1"
      }
    }
    </script>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
      body { margin: 0; font-family: 'Inter', sans-serif; background: #0d0d0e; color: #f1f3f4; }
      #root { min-height: 100vh; }
    </style>
</head>
<body>
    <div id="root"></div>
    <script type="text/babel" data-type="module">
      import React from 'react';
      import { createRoot } from 'react-dom/client';
      import * as LucideReact from 'lucide-react';
      
      window.React = React;
      window.LucideReact = LucideReact;

      // Persistence Layer
      const STORAGE_KEY = 'NEXUS_PREVIEW_STATE';
      
      const saveState = (state) => {
        try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
      };
      
      const loadState = () => {
        try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY)); } catch (e) { return null; }
      };

      try {
        ${entryFile.code}
        const root = createRoot(document.getElementById('root'));
        
        // Wrap original render to support state restoration if the app implements it
        root.render(<App initialNexusState={loadState()} />);
        
        // Periodically save state if needed, or rely on internal app logic
        window.addEventListener('beforeunload', () => {
          // If the app uses window.getNexusState, we save it
          if (window.getNexusState) saveState(window.getNexusState());
        });
      } catch (err) {
        console.error(err);
        window.parent.postMessage({ type: 'NEXUS_FIX_ERROR', error: err.stack || err.message }, '*');
      }
    </script>
</body>
</html>`;
      }
      return '';
    };

    if (!isLoading) {
      setPreviewHtml(buildPreviewHtml());
    }
  }, [generatedFiles, isLoading]);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'NEXUS_FIX_ERROR' && e.data?.error) {
        setPreviewError(e.data.error);
        // handleSendMessage(undefined, `O seguinte erro ocorreu no preview: ${e.data.error}. Por favor, corrija.`);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleSendMessage]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-[#131314] text-zinc-200 overflow-hidden font-sans relative pb-safe">
      
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <div className="fixed inset-0 z-[9999]" key="sidebar-overlay">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 w-[320px] max-w-[85%] bg-[#1a1b1e] border-l border-white/10 flex flex-col shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 h-[64px] border-b border-white/5 flex justify-between items-center bg-[#131314]">
                <h2 className="text-[#f1f3f4] font-medium flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[#a8c7fa]/10 text-[#a8c7fa]">
                    <Layers size={16} />
                  </div>
                  <span>Projetos</span>
                </h2>
                <button 
                  onClick={() => setIsSidebarOpen(false)} 
                  className="p-2 hover:bg-white/5 rounded-full text-[#8e918f] hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-4 pt-6">
                <Button 
                  onClick={() => {
                    resetChat();
                    setIsSidebarOpen(false);
                  }}
                  className="w-full bg-[#333538] hover:bg-[#4a4d51] text-[#f1f3f4] justify-start gap-3 h-12 border-none rounded-xl font-medium transition-all group"
                >
                  <Plus size={18} className="text-[#a8c7fa] group-hover:scale-110 transition-transform" />
                  <span>Novo projeto</span>
                </Button>
              </div>

              <div className="px-4 mb-2">
                <input
                  type="text"
                  ref={searchInputRef}
                  placeholder="Buscar projetos... (Ctrl+K)"
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                  className="w-full bg-[#282a2d] border border-[#333538] rounded-xl px-3 py-2 text-[13px] text-[#f1f3f4] placeholder:text-[#8e918f] outline-none focus:ring-1 focus:ring-[#a8c7fa]/30"
                />
              </div>

              <div className="flex-1 overflow-y-auto px-3 pb-8 space-y-2 custom-scrollbar">
                {chatHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center pt-24 px-6 text-center space-y-4 opacity-40">
                    <Layers size={48} className="text-[#8e918f]" strokeWidth={1} />
                    <p className="text-[14px] font-medium text-[#f1f3f4]">Nenhum projeto</p>
                    <p className="text-[12px] max-w-[180px]">Seus projetos anteriores aparecerão aqui.</p>
                  </div>
                ) : (
                  chatHistory
                    .filter(c => c.title.toLowerCase().includes(historySearch.toLowerCase()))
                    .sort((a, b) => b.updatedAt - a.updatedAt)
                    .map(chat => (
                    <div 
                      key={chat.id}
                      className={cn(
                        "group relative flex flex-col gap-1 p-3.5 rounded-xl border border-transparent cursor-pointer transition-all duration-200",
                        currentChatId === chat.id 
                          ? "bg-[#333538] border-[#4a4d51] text-white shadow-lg" 
                          : "text-[#b2b5b4] hover:bg-[#333538]/40 hover:text-white"
                      )}
                      onClick={() => {
                        setCurrentChatId(chat.id);
                        setMessages(chat.messages);
                        if (chat.fileHistory) {
                          setFileHistory(chat.fileHistory);
                          const latestFiles = chat.fileHistory.length > 0 ? chat.fileHistory[chat.fileHistory.length - 1].files : [];
                          setGeneratedFiles(latestFiles);
                        } else {
                          const fullContent = chat.messages.filter(m => m.role === 'model').map(m => m.content).join('\n');
                          const files = extractFilesFromMarkdown(fullContent);
                          setFileHistory(files.length > 0 ? [{ timestamp: Date.now(), files }] : []);
                          setGeneratedFiles(files);
                        }
                        setActiveFileIndex(0);
                        setIsSidebarOpen(false);
                      }}
                    >
                      <div className="flex items-center gap-2 pr-8">
                        <FolderOpen size={14} className={cn("shrink-0", currentChatId === chat.id ? "text-[#a8c7fa]" : "text-[#8e918f]")} />
                        <span className="text-[14px] font-medium truncate">{chat.title}</span>
                      </div>
                      <span className="text-[11px] opacity-50 pl-6">
                        {new Date(chat.updatedAt).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setChatHistory(prev => prev.filter(c => c.id !== chat.id));
                          if (currentChatId === chat.id) resetChat();
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 text-[#8e918f] hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all z-20"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {chatHistory.length > 0 && (
                <div className="p-4 border-t border-white/5 bg-[#131314]/50">
                  <button 
                    onClick={() => {
                      setIsClearHistoryModalOpen(true);
                      setIsSidebarOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-[12px] text-red-400/70 hover:text-red-400 hover:bg-red-400/5 rounded-lg transition-all font-medium"
                  >
                    <Trash2 size={14} />
                    Limpar tudo
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Header 
        activeAgent={activeAgent}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        setDraftSelectedModel={setDraftSelectedModel}
        isSaving={isSaving}
      />

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative min-h-0">
        <div className={cn(
          "flex flex-col flex-1 bg-[#131314] border-r border-[#333538] min-h-0",
          activeTab !== 'chat' && "hidden md:flex",
          activeTab === 'settings' && "md:hidden"
        )}>
          <ChatLog 
            messages={messages}
            isLoading={isLoading}
            activeAgent={activeAgent}
            generatedFiles={generatedFiles}
            activeFileIndex={activeFileIndex}
            setActiveFileIndex={setActiveFileIndex}
            setActiveTab={setActiveTab}
            scrollRef={scrollRef as React.RefObject<HTMLDivElement>}
            showScrollButton={showScrollButton}
            scrollToBottom={scrollToBottom}
            setInputMessage={setInputMessage}
            handleSendMessage={handleSendMessage}
          />

          <div className="p-3 pb-[84px] md:pt-4 md:px-6 md:pb-5 bg-[#131314] shrink-0 border-t border-[#333538]/50">
            <div className="max-w-3xl mx-auto flex flex-col px-1">
              <div className="relative bg-[#1e1f20] border border-[#333538] focus-within:border-[#a8c7fa]/50 focus-within:ring-1 focus-within:ring-[#a8c7fa]/20 rounded-2xl transition-all duration-200 shadow-xl flex flex-col">
                {attachedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 px-4 pt-3 pb-1">
                    {attachedFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-1 bg-[#282a2d] text-[12px] text-[#f1f3f4] px-2.5 py-1 rounded-md border border-[#333538]">
                        <span className="truncate max-w-[150px]">{f.name}</span>
                        <button onClick={() => setAttachedFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-[#8e918f] hover:text-white ml-1">×</button>
                      </div>
                    ))}
                  </div>
                )}

                <Textarea
                  value={inputMessage}
                  onChange={(e) => {
                    setInputMessage(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                  onKeyDown={onKeyDown}
                  placeholder="Descreva o que você quer construir..."
                  className={cn("w-full bg-transparent border-none text-base text-[#f1f3f4] px-4 py-3 min-h-[50px] max-h-[300px] resize-none outline-none leading-relaxed custom-scrollbar placeholder:text-[#8e918f] focus-visible:ring-0 shadow-none overflow-y-auto", attachedFiles.length > 0 && "pt-2")}
                  rows={1}
                />
                
                <div className="flex items-end justify-between p-2 pt-0">
                  <div className="flex items-center gap-1 text-[#8e918f]">
                    <input 
                      type="file" multiple className="hidden" id="file-upload" ref={fileInputRef}
                      onChange={(e) => {
                        if (e.target.files) {
                          const validFiles = Array.from(e.target.files).filter(f => f.size <= 10 * 1024 * 1024);
                          setAttachedFiles(prev => [...prev, ...validFiles]);
                        }
                      }}
                    />
                    <label htmlFor="file-upload" className="cursor-pointer p-2 hover:bg-[#333538]/50 hover:text-[#e3e3e3] rounded-lg transition-colors flex items-center justify-center">
                      <Paperclip size={18} strokeWidth={2} />
                    </label>

                    <input 
                      type="file" accept="image/*" multiple hidden ref={imageInputRef}
                      onChange={(e) => {
                        if (e.target.files) {
                          const validFiles = Array.from(e.target.files).filter(f => f.size <= 10 * 1024 * 1024);
                          setAttachedFiles(prev => [...prev, ...validFiles]);
                        }
                      }}
                    />
                    <button onClick={() => imageInputRef.current?.click()} className="p-2 hover:bg-[#333538]/50 hover:text-[#e3e3e3] rounded-lg transition-colors hidden sm:flex">
                      <ImageIcon size={18} strokeWidth={2} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Select value={selectedModel} onValueChange={(val) => {
                      if (val) {
                        setSelectedModel(val);
                        setDraftSelectedModel(val);
                        safeLocalStorageSet('nexus_selected_model', val);
                      }
                    }}>
                      <SelectTrigger className="flex h-8 bg-transparent border-none text-[11px] text-[#8e918f] hover:text-[#e3e3e3] font-bold uppercase tracking-widest focus:ring-0 px-2 py-0 border-none shadow-none">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Brain size={14} className="shrink-0" />
                          <span className="truncate max-w-[120px]">{selectedModel.replace('gemini-', '').replace('-preview', '')}</span>
                        </div>
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1b1e] border-white/10 text-[#f1f3f4] rounded-lg shadow-2xl">
                        <SelectItem value="gemini-3.1-pro-preview">Gemini 3.1 Pro</SelectItem>
                        <SelectItem value="gemini-3.1-flash-lite-preview">Gemini 3.1 Flash Lite</SelectItem>
                        <SelectItem value="gemini-3-flash-preview">Gemini 3 Flash</SelectItem>
                        <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                        <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
                        <SelectItem value="gemini-2.0-flash-lite">Gemini 2.0 Flash Lite</SelectItem>
                        <SelectItem value="gemini-flash-latest">Gemini 1.5 Flash (Latest)</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      onClick={handleSendMessage}
                      disabled={(!inputMessage.trim() && attachedFiles.length === 0) || isLoading}
                      size="icon"
                      className={cn(
                        "h-9 w-9 rounded-xl transition-all flex flex-shrink-0 items-center justify-center border-none mr-0.5 mb-0.5",
                        (inputMessage.trim() || attachedFiles.length > 0) && !isLoading 
                          ? "bg-[#c2e7ff] hover:bg-[#b5cffb] text-[#001d35] shadow" 
                          : "bg-[#282a2d] text-[#8e918f] cursor-not-allowed"
                      )}
                    >
                      {isLoading ? <Loader2 size={18} className="animate-spin" /> : <ArrowUp size={18} strokeWidth={2.5} />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={cn(
          "flex-1 flex flex-col bg-[#131314] min-h-0",
          (activeTab === 'chat' || activeTab === 'settings') && "hidden md:flex",
          activeTab === 'settings' && "md:hidden"
        )}>
          <div className="hidden md:flex h-[49px] border-b border-[#333538] bg-[#1a1b1e] items-center px-4 justify-between gap-4 flex-shrink-0 z-[60] shadow-sm w-full">
             <div className="bg-[#282a2d] p-1 rounded-lg flex items-center">
               <button onClick={() => setActiveTab('preview')} className={cn("px-5 py-1.5 rounded-md text-[13px] font-medium transition-all duration-200", activeTab === 'preview' ? "bg-[#444746] text-[#e3e3e3] shadow-sm" : "text-[#8e918f] hover:text-[#e3e3e3]")}>Canvas</button>
               <button onClick={() => setActiveTab('code')} className={cn("px-5 py-1.5 rounded-md text-[13px] font-medium transition-all duration-200 flex items-center gap-1.5", activeTab === 'code' ? "bg-[#444746] text-[#e3e3e3] shadow-sm" : "text-[#8e918f] hover:text-[#e3e3e3]")}>Arquivos {hasFiles && <span className="flex h-2 w-2 rounded-full bg-[#a8c7fa]" />}</button>
             </div>
             <div className="flex items-center gap-2">
                <button onClick={() => { const blob = new Blob([previewHtml], { type: 'text/html' }); const url = URL.createObjectURL(blob); window.open(url, '_blank'); }} className="p-1.5 text-[#8e918f] hover:text-[#e3e3e3] rounded-lg transition-colors"><ArrowUp size={16} className="rotate-45" /></button>
                <button onClick={() => setPreviewKey(k => k + 1)} className="p-1.5 text-[#8e918f] hover:text-[#e3e3e3] rounded-lg transition-colors"><RotateCcw size={16} /></button>
             </div>
          </div>

          <div className="flex-1 relative flex flex-col bg-white">
            {!hasFiles && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none bg-[#131314]">
                <div className="w-20 h-20 rounded-3xl bg-[#1e1f20] border border-[#333538] shadow-2xl flex items-center justify-center mb-6">
                  {activeTab === 'code' ? <Terminal size={32} className="text-emerald-400/80" /> : <Layout size={32} className="text-[#a8c7fa]" />}
                </div>
                <p className="text-[18px] font-semibold text-[#f1f3f4]">{activeTab === 'code' ? 'Área de Código vazia' : 'O Canvas está vazio'}</p>
                <p className="text-[14px] mt-2 text-[#8e918f] text-center max-w-[280px]">{activeTab === 'code' ? 'Descreva o que deseja criar no chat.' : 'Inicie um projeto para ver o preview aqui.'}</p>
              </div>
            )}

            {previewHtml && (
              <div className={cn("w-full h-full relative", activeTab !== 'preview' && "hidden")}>
                <iframe key={previewKey} srcDoc={previewHtml} className="w-full h-full border-none relative z-20" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />
                
                {previewError && (
                  <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
                    <div className="bg-[#1e1f20] border border-red-500/30 rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-6">
                      <div className="flex items-center gap-4 text-red-400">
                        <div className="p-3 rounded-full bg-red-400/10">
                          <Activity size={24} />
                        </div>
                        <h3 className="text-lg font-bold">Erro Detectado</h3>
                      </div>
                      
                      <div className="bg-black/40 rounded-xl p-4 font-mono text-xs text-red-200/80 overflow-auto max-h-[200px] border border-white/5">
                        {previewError}
                      </div>
                      
                      <div className="flex flex-col gap-3 pt-2">
                        <Button 
                          onClick={() => {
                            setPreviewError(null);
                            handleSendMessage(undefined, `Corrija o seguinte erro no código: ${previewError}`);
                          }}
                          className="w-full bg-red-500 hover:bg-red-600 text-white font-bold h-12 rounded-xl"
                        >
                          Tentar Corrigir com IA
                        </Button>
                        <Button 
                          variant="ghost"
                          onClick={() => setPreviewError(null)}
                          className="w-full text-[#8e918f] hover:text-white"
                        >
                          Fechar
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {hasFiles && (
              <div className={cn("absolute inset-0 z-20 flex flex-col bg-[#050505]", activeTab !== 'code' && "hidden")}>
                <div className="h-10 border-b border-[#1a1b1e] bg-[#0d0d0d] flex items-center px-4 gap-2 text-[11px] font-medium justify-between">
                   <div className="flex items-center gap-2">
                     <span className="text-[#5f6368]">Preview</span>
                     <span className="text-[#333538]">/</span>
                     <span className="text-[#8e918f]">{generatedFiles[activeFileIndex]?.name}</span>
                   </div>
                   <div className="flex items-center gap-4">
                     {fileHistory.length > 1 && (
                       <Select value={(fileHistory.length - 1).toString()} onValueChange={(val) => {
                         const idx = parseInt(val || '0', 10);
                         const updatedHistory = fileHistory.slice(0, idx + 1);
                         setFileHistory(updatedHistory);
                         setGeneratedFiles(updatedHistory[updatedHistory.length - 1].files);
                         setActiveFileIndex(0);
                       }}>
                         <SelectTrigger className="h-6 w-[160px] text-[10px] bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                         <SelectContent>
                           {fileHistory.map((h, i) => <SelectItem key={i} value={i.toString()} className="text-[11px]">v{i+1} - {new Date(h.timestamp).toLocaleTimeString()}</SelectItem>)}
                         </SelectContent>
                       </Select>
                     )}
                   </div>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                  <div className="hidden md:flex h-full border-r border-[#1a1b1e]">
                    <FileTree files={generatedFiles} activeFileIndex={activeFileIndex} onSelect={setActiveFileIndex} />
                  </div>
                  <div className="flex-1 overflow-auto bg-[#050505]">
                    <CodeBlock language={generatedFiles[activeFileIndex]?.lang} value={generatedFiles[activeFileIndex]?.code || ''} noMargin fastMode={isLoading} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {activeTab === 'settings' && (
          <div className="flex-1 flex flex-col bg-[#09090b] overflow-hidden animate-in fade-in duration-500">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="max-w-3xl mx-auto px-6 py-10 pb-[120px]">
                {settingsTab === 'overview' && (
                  <div className="space-y-10 text-center">
                    <h2 className="text-[18px] font-black text-white uppercase tracking-[0.3em]">Console de Orquestração</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { id: 'general', title: 'Motor', icon: Key, color: 'text-blue-400' },
                        { id: 'agent', title: 'Identidade', icon: Brain, color: 'text-purple-400' },
                        { id: 'security', title: 'Segurança', icon: Shield, color: 'text-emerald-400' }
                      ].map(card => (
                        <button key={card.id} onClick={() => setSettingsTab(card.id as any)} className="p-6 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] text-center space-y-4">
                          <div className={cn("mx-auto w-10 h-10 flex items-center justify-center rounded-lg bg-white/[0.02] border border-white/5", card.color)}><card.icon size={18} /></div>
                          <h3 className="text-[12px] font-black text-white uppercase tracking-widest">{card.title}</h3>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {settingsTab === 'general' && (
                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                      <button onClick={() => setSettingsTab('overview')} className="text-[#8e918f] hover:text-white text-[11px] font-black uppercase tracking-widest flex items-center gap-2"><ArrowLeft size={14} /> VOLTAR</button>
                      <h3 className="text-[14px] font-black text-white uppercase tracking-widest">Motor de Inteligência</h3>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-4">
                        <label className="text-[11px] font-black text-white/60 uppercase tracking-widest flex justify-between">
                          <span>API KEY Principal</span>
                          <span className="text-[10px] text-blue-400/60 lowercase italic font-medium">armazenada localmente</span>
                        </label>
                        <Input type="password" value={draftApiKey} onChange={(e) => setDraftApiKey(e.target.value)} className="bg-black/20 border-white/10 rounded-xl px-4 text-[13px] h-11" placeholder="Insira sua chave Gemini..." />
                      </div>

                      <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest italic">Presets Rápidos</label>
                            <span className="text-[8px] text-[#8e918f] uppercase font-bold tracking-tighter">{apiPresets.length}/5 Chaves</span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            disabled={apiPresets.length >= 5}
                            onClick={() => { setEditingPreset(null); setPresetForm({}); setIsPresetFormOpen(true); }}
                            className="h-6 text-[9px] uppercase tracking-widest font-black text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 disabled:opacity-30"
                          >
                            <Plus size={10} className="mr-1" /> Novo
                          </Button>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {apiPresets.map(preset => (
                            <div 
                              key={preset.id} 
                              onClick={() => setDraftApiKey(preset.apiKey)}
                              className={cn(
                                "group relative flex items-center gap-2 pl-3 pr-8 py-2 rounded-lg border transition-all cursor-pointer text-[12px] font-medium",
                                draftApiKey === preset.apiKey ? "bg-blue-400/20 border-blue-400/40 text-blue-100" : "bg-white/[0.02] border-white/5 text-[#8e918f] hover:bg-white/[0.04]"
                              )}
                            >
                              <Key size={12} className="shrink-0" />
                              <span className="truncate max-w-[80px]">{preset.name}</span>
                              <button 
                                onClick={(e) => { e.stopPropagation(); deletePreset(preset.id, e); }}
                                className="absolute right-1.5 opacity-0 group-hover:opacity-100 hover:text-red-400 p-1 transition-all"
                              >
                                <Trash2 size={10} />
                              </button>
                            </div>
                          ))}
                          {apiPresets.length === 0 && (
                            <p className="text-[10px] text-[#8e918f] italic uppercase tracking-widest opacity-40 py-1">Nenhum preset salvo</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <label className="text-[11px] font-black text-white/60 uppercase tracking-widest">Modelo Gemini</label>
                          <Select value={draftSelectedModel} onValueChange={(val) => val && setDraftSelectedModel(val)}>
                            <SelectTrigger className="bg-black/20 border-white/10 text-white rounded-xl h-11"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-[#1a1b1e] border-white/10">
                              <SelectItem value="gemini-2.0-pro-exp-02-05">Gemini 2.0 Pro (Exp)</SelectItem>
                              <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
                              <SelectItem value="gemini-2.0-flash-lite-preview-02-05">Gemini 2.0 Flash Lite</SelectItem>
                              <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                              <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash</SelectItem>
                              <SelectItem value="gemini-1.5-flash-8b">Gemini 1.5 Flash 8B</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-4">
                          <label className="text-[11px] font-black text-white/60 uppercase tracking-widest flex justify-between">
                            <span>Temperatura</span>
                            <span className="text-blue-400">{draftTemperature}</span>
                          </label>
                          <div className="pt-2">
                            <input 
                              type="range" 
                              min="0" max="1" step="0.1" 
                              value={draftTemperature} 
                              onChange={(e) => setDraftTemperature(parseFloat(e.target.value))}
                              className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-400"
                            />
                            <div className="flex justify-between text-[10px] text-[#8e918f] mt-1 font-medium italic">
                              <span>Preciso</span>
                              <span>Creativo</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <button 
                          onClick={() => setIsSystemPromptExpanded(!isSystemPromptExpanded)}
                          className="w-full flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group"
                        >
                          <div className="flex items-center gap-2">
                            <label className="text-[11px] font-black text-white/60 uppercase tracking-widest cursor-pointer group-hover:text-blue-400 transition-colors">Prompt de Sistema (Atual)</label>
                            {!isSystemPromptExpanded && <span className="text-[10px] text-[#8e918f] italic truncate max-w-[200px] opacity-40"> — {draftSystemPrompt.slice(0, 30)}...</span>}
                          </div>
                          <ChevronDown size={14} className={cn("text-[#8e918f] transition-transform duration-300", isSystemPromptExpanded && "rotate-180")} />
                        </button>
                        
                        <AnimatePresence>
                          {isSystemPromptExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <Textarea 
                                value={draftSystemPrompt} 
                                onChange={(e) => setDraftSystemPrompt(e.target.value)} 
                                className="bg-black/20 border-white/10 rounded-xl px-4 py-3 text-[12px] h-[80px] custom-scrollbar focus:ring-1 focus:ring-blue-500/30 resize-none" 
                                placeholder="Instruções de base para a IA..."
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                )}

                {settingsTab === 'agent' && (
                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                      <button onClick={() => setSettingsTab('overview')} className="text-[#8e918f] hover:text-white text-[11px] font-black uppercase tracking-widest flex items-center gap-2"><ArrowLeft size={14} /> VOLTAR</button>
                      <h3 className="text-[14px] font-black text-white uppercase tracking-widest">Identidades Nexus</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {allAgents.map(agent => (
                        <div 
                          key={agent.id} 
                          onClick={() => { setDraftActiveAgentId(agent.id); setDraftSystemPrompt(agent.systemPrompt); }} 
                          className={cn(
                            "group relative p-5 rounded-2xl border cursor-pointer transition-all duration-300 overflow-hidden", 
                            draftActiveAgentId === agent.id 
                              ? "bg-gradient-to-br from-purple-500/20 to-blue-500/10 border-purple-500/40 shadow-lg shadow-purple-500/5 text-white" 
                              : "bg-white/[0.02] border-white/5 text-[#8e918f] hover:bg-white/[0.04] hover:text-white"
                          )}
                        >
                          {draftActiveAgentId === agent.id && (
                            <div className="absolute top-0 right-0 p-1.5 bg-purple-500 text-white rounded-bl-xl">
                              <CheckCircle2 size={10} />
                            </div>
                          )}
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500 shadow-xl", 
                              agent.color,
                              draftActiveAgentId === agent.id ? "ring-2 ring-white/20" : ""
                            )}>
                              <AgentIcon iconName={agent.iconName} size={22} />
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="text-[13px] font-black uppercase tracking-widest truncate">{agent.name}</span>
                              <span className="text-[10px] font-medium opacity-50 truncate">{agent.shortDescription || 'Persona especializada'}</span>
                            </div>
                          </div>
                          
                          <div className="mt-4 pt-4 border-t border-white/5">
                            <p className="text-[10px] line-clamp-2 opacity-40 italic leading-relaxed">
                              {agent.systemPrompt}
                            </p>
                          </div>
                          
                          {customAgents.some(a => a.id === agent.id) && (
                            <div className="absolute bottom-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={(e) => { e.stopPropagation(); setEditingAgent(agent); setAgentForm(agent); setIsAgentFormOpen(true); }}
                                className="p-2 hover:bg-white/10 rounded-lg text-[#8e918f] hover:text-white transition-colors"
                              >
                                <Terminal size={12} />
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); deleteAgent(agent.id); }}
                                className="p-2 hover:bg-red-400/10 rounded-lg text-[#8e918f] hover:text-red-400 transition-colors"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                      
                      <button 
                        onClick={() => { setEditingAgent(null); setAgentForm({}); setIsAgentFormOpen(true); }}
                        className="p-5 rounded-2xl border border-dashed border-white/10 bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/20 transition-all flex flex-col items-center justify-center gap-4 group min-h-[140px]"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center group-hover:bg-white/[0.08] transition-all group-hover:-translate-y-1">
                          <Plus size={20} className="text-[#8e918f] group-hover:text-white transition-colors" />
                        </div>
                        <span className="text-[10px] font-black text-[#8e918f] group-hover:text-white uppercase tracking-[0.2em]">Sincronizar Nova Persona</span>
                      </button>
                    </div>
                  </div>
                )}
                
                {settingsTab === 'security' && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10">
                    <div className="flex items-center justify-between">
                      <button onClick={() => setSettingsTab('overview')} className="text-[#8e918f] hover:text-white text-[11px] font-black uppercase tracking-widest flex items-center gap-2"><ArrowLeft size={14} /> VOLTAR</button>
                      <h3 className="text-[14px] font-black text-white uppercase tracking-widest">Protocolos de Segurança</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                          <ShieldCheck size={20} />
                        </div>
                        <h4 className="text-[13px] font-black text-white uppercase tracking-wider">Storage Local Isolado</h4>
                        <p className="text-[12px] text-[#8e918f] leading-relaxed">Suas chaves de API e histórico de conversas são armazenados exclusivamente na memória local do seu navegador (LocalStorage). Nenhum dado é enviado para nossos servidores.</p>
                      </div>

                      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                          <Lock size={20} />
                        </div>
                        <h4 className="text-[13px] font-black text-white uppercase tracking-wider">Criptografia em Trânsito</h4>
                        <p className="text-[12px] text-[#8e918f] leading-relaxed">As comunicações com o modelo Gemini utilizam túneis HTTPS protegidos por TLS 1.3, garantindo que o conteúdo dos prompts seja inacessível por terceiros.</p>
                      </div>

                      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                          <EyeOff size={20} />
                        </div>
                        <h4 className="text-[13px] font-black text-white uppercase tracking-wider">Modo Privado Permanente</h4>
                        <p className="text-[12px] text-[#8e918f] leading-relaxed">Não utilizamos seus dados para treinamento de modelos de terceiros. Sua privacidade é o pilar central da arquitetura Nexus.</p>
                      </div>

                      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                          <Activity size={20} />
                        </div>
                        <h4 className="text-[13px] font-black text-white uppercase tracking-wider">Auditoria de Chamadas</h4>
                        <p className="text-[12px] text-[#8e918f] leading-relaxed">Você tem controle total sobre as chamadas de API, podendo monitorar o consumo e alternar entre diferentes chaves instantaneamente.</p>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-white/5 flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-emerald-400/60">
                      <CheckCircle2 size={14} />
                      SISTEMA STATUS: PROTEGIDO
                    </div>
                  </div>
                )}
              </div>
            </div>

            {hasSettingsChanges && (
              <div className="absolute bottom-20 inset-x-4 flex justify-center z-50">
                <div className="bg-[#1a1b1e]/95 backdrop-blur-xl border border-blue-500/30 p-4 rounded-2xl flex items-center justify-between gap-4 w-full max-w-2xl">
                  <span className="text-[12px] text-[#8e918f]">Modificações pendentes...</span>
                  <div className="flex gap-3">
                     <Button variant="ghost" onClick={() => setActiveTab('chat')} className="text-[#8e918f]">Cancelar</Button>
                     <Button onClick={saveSettings} className="bg-[#c2e7ff] text-[#001d35] font-bold">Salvar</Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <FloatingNav 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setSettingsTab={setSettingsTab}
        setIsSidebarOpen={setIsSidebarOpen}
        hasFiles={hasFiles}
      />

      <Dialog open={isPresetFormOpen} onOpenChange={setIsPresetFormOpen}>
        <DialogContent className="max-w-md bg-[#1a1b1e] border-[#333538] text-[#f1f3f4] p-6 rounded-2xl">
          <DialogHeader><DialogTitle>{editingPreset ? 'Editar Preset API' : 'Novo Preset API'}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
             <div className="space-y-2">
               <label className="text-[10px] uppercase font-black tracking-widest text-[#8e918f]">Identificação</label>
               <Input value={presetForm.name || ''} onChange={(e) => setPresetForm({ ...presetForm, name: e.target.value })} placeholder="Ex: Produção, Testes..." className="bg-transparent border-[#333538]" />
             </div>
             <div className="space-y-2">
               <label className="text-[10px] uppercase font-black tracking-widest text-[#8e918f]">Gemini API Key</label>
               <Input type="password" value={presetForm.apiKey || ''} onChange={(e) => setPresetForm({ ...presetForm, apiKey: e.target.value })} placeholder="Past key here..." className="bg-transparent border-[#333538]" />
             </div>
             <div className="flex justify-end gap-3 pt-4">
                <Button variant="ghost" onClick={() => setIsPresetFormOpen(false)}>Cancelar</Button>
                <Button onClick={addOrUpdatePreset} className="bg-blue-400 text-[#001d35] font-bold">Confirmar</Button>
             </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAgentFormOpen} onOpenChange={setIsAgentFormOpen}>
        <DialogContent className="max-w-md bg-[#1a1b1e] border-[#333538] text-[#f1f3f4] p-6 rounded-2xl">
          <DialogHeader><DialogTitle className="uppercase tracking-widest font-black text-sm">{editingAgent ? 'Ajustar Parâmetros de Identidade' : 'Forjar Nova Identidade'}</DialogTitle></DialogHeader>
          <div className="space-y-6 pt-6">
             <div className="space-y-2">
               <label className="text-[10px] uppercase font-black tracking-widest text-[#8e918f]">Nomenclatura</label>
               <Input value={agentForm.name || ''} onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })} placeholder="Ex: Engenheiro de React, Designer..." className="bg-transparent border-[#333538] h-11" />
             </div>
             
             <div className="space-y-2">
               <label className="text-[10px] uppercase font-black tracking-widest text-[#8e918f]">Breve Descrição</label>
               <Input value={agentForm.shortDescription || ''} onChange={(e) => setAgentForm({ ...agentForm, shortDescription: e.target.value })} placeholder="Ex: Especialista em UI/UX..." className="bg-transparent border-[#333538] h-11" />
             </div>

             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <label className="text-[10px] uppercase font-black tracking-widest text-[#8e918f]">Ícone (Lucide)</label>
                 <Select value={agentForm.iconName || 'Brain'} onValueChange={(val: string | null) => val && setAgentForm({ ...agentForm, iconName: val })}>
                   <SelectTrigger className="bg-transparent border-[#333538] h-11"><SelectValue /></SelectTrigger>
                   <SelectContent className="bg-[#1a1b1e] border-white/10">
                     <SelectItem value="Brain">Brain</SelectItem>
                     <SelectItem value="Code">Code</SelectItem>
                     <SelectItem value="Terminal">Terminal</SelectItem>
                     <SelectItem value="Layout">Layout</SelectItem>
                     <SelectItem value="Shield">Shield</SelectItem>
                     <SelectItem value="Zap">Zap</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] uppercase font-black tracking-widest text-[#8e918f]">Sinalização Visual</label>
                 <Select value={agentForm.color || 'bg-purple-500'} onValueChange={(val: string | null) => val && setAgentForm({ ...agentForm, color: val })}>
                   <SelectTrigger className="bg-transparent border-[#333538] h-11"><SelectValue /></SelectTrigger>
                   <SelectContent className="bg-[#1a1b1e] border-white/10">
                     <SelectItem value="bg-purple-500">Púrpura</SelectItem>
                     <SelectItem value="bg-blue-500">Azul</SelectItem>
                     <SelectItem value="bg-emerald-500">Esmeralda</SelectItem>
                     <SelectItem value="bg-amber-500">Âmbar</SelectItem>
                     <SelectItem value="bg-rose-500">Rosa</SelectItem>
                     <SelectItem value="bg-zinc-500">Zinco</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
             </div>

             <div className="space-y-2">
               <label className="text-[10px] uppercase font-black tracking-widest text-[#8e918f]">Matriz de Comportamento (System Prompt)</label>
               <Textarea value={agentForm.systemPrompt || ''} onChange={(e) => setAgentForm({ ...agentForm, systemPrompt: e.target.value })} placeholder="Defina como este agente deve se comportar..." className="bg-[#131314] border-[#333538] min-h-[150px] custom-scrollbar focus:ring-1 focus:ring-purple-500/30" />
             </div>

             <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <Button variant="ghost" onClick={() => setIsAgentFormOpen(false)} className="text-[#8e918f]">Abortar</Button>
                <Button onClick={addOrUpdateAgent} className="bg-purple-500 text-white font-black uppercase tracking-widest text-[11px] h-11 px-8">Sincronizar</Button>
             </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isClearHistoryModalOpen} onOpenChange={setIsClearHistoryModalOpen}>
        <DialogContent className="max-w-sm bg-[#131314] border-[#333538] text-white p-6 rounded-2xl">
          <DialogTitle>Limpar Histórico?</DialogTitle>
          <p className="text-[13px] text-[#8e918f] mt-2">Esta ação apagará todos os seus projetos salvos localmente.</p>
          <div className="flex justify-end gap-3 mt-8">
            <Button variant="ghost" onClick={() => setIsClearHistoryModalOpen(false)}>Melhor não</Button>
            <Button onClick={() => { setChatHistory([]); localStorage.removeItem('nexus_chat_history'); resetChat(); setIsClearHistoryModalOpen(false); }} className="bg-red-500 hover:bg-red-600">Sim, apagar tudo</Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333538; border-radius: 4px; border: 2px solid #131314; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #5f6368; }
      `}</style>
      <Toaster position="top-right" theme="dark" richColors closeButton />
    </div>
  );
}
