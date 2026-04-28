import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Loader2, ArrowUp,
  Paperclip, Image as ImageIcon, Terminal, Layout,
  Brain, Mic, MicOff,
  RotateCcw
} from 'lucide-react';
import { Toaster, toast } from 'sonner';

import { FileTree } from './components/FileTree';
import { CodeBlock } from './components/CodeBlock';
import { Header } from './components/Header';
import { ChatLog } from './components/ChatLog';
import { FloatingNav } from './components/FloatingNav';
import { SettingsPanel, SettingsDialogs } from './components/SettingsPanel';

import { 
  APIPreset, AgentDefinition, Message
} from './types';
import { Button } from './components/ui/button';
import { Textarea } from './components/ui/textarea';
import { 
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  SelectLabel, SelectGroup
} from './components/ui/select';
import { 
  Dialog, DialogContent, DialogTitle 
} from './components/ui/dialog';

import { useChatSession } from './hooks/useChatSession';
import { AGENTS } from './agents';

import { 
  useSettingsStore, 
  useUIStore, 
  useChatHistoryStore 
} from './store/appStore';
import { 
  cn, 
  generateId, 
  safeLocalStorageSet,
  deriveChatTitle,
  debounce
} from './lib/utils';
import { NEXUS_MODELS, DEFAULT_MODEL, GROUPED_MODELS } from './lib/models';
import { SidebarHistory } from './components/SidebarHistory';
import { PreviewPane } from './components/PreviewPane';

export default function App() {
  const { 
    apiKey, setApiKey, 
    selectedModel, setSelectedModel, 
    activeAgentId, setActiveAgentId,
    apiPresets, setApiPresets,
    activePresetId, setActivePresetId,
    temperature, setTemperature,
    searchGrounding
  } = useSettingsStore();

  const { 
    activeTab, setActiveTab,
    settingsTab, setSettingsTab,
    isSidebarOpen, setIsSidebarOpen,
    setIsSaving
  } = useUIStore();

  const { sessions, addSession, removeSession, clearHistory } = useChatHistoryStore();

  const [customAgents, setCustomAgents] = useState<AgentDefinition[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nexus_custom_agents');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const allAgents = useMemo(() => [...AGENTS, ...customAgents], [customAgents]);

  const activeAgent = useMemo(() => {
    return allAgents.find(a => a.id === activeAgentId) || AGENTS[0];
  }, [allAgents, activeAgentId]);

  const [systemPrompt, setSystemPrompt] = useState(activeAgent.systemPrompt);

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
    temperature,
    searchGrounding
  });

  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  
  // Mounted ref for async safety
  const isMounted = useRef(true);
  useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);

  const [inputMessage, setInputMessage] = useState('');
  const [chatInputHistory, setChatInputHistory] = useState<string[]>(['']);
  const [chatInputHistoryIndex, setChatInputHistoryIndex] = useState(0);

  const pushToInputHistory = useCallback(debounce((val: string) => {
    setChatInputHistory(prev => {
      // Don't duplicate the last entry
      if (val === prev[prev.length - 1]) return prev;
      
      const next = [...prev, val];
      const newHistory = next.slice(-50);
      setChatInputHistoryIndex(newHistory.length - 1);
      return newHistory;
    });
  }, 500), []);

  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [previewKey, setPreviewKey] = useState(0);
  const [historySearch, setHistorySearch] = useState('');
  const [showScrollButton, setShowScrollButton] = useState(false);

  const [isSystemPromptExpanded, setIsSystemPromptExpanded] = useState(false);

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
    const validIds = NEXUS_MODELS.map(m => m.id);
    if (!validIds.includes(selectedModel)) {
      setSelectedModel(DEFAULT_MODEL);
      setDraftSelectedModel(DEFAULT_MODEL);
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
    } else {
      // Auto-save when leaving settings tab
      if (
        draftApiKey !== apiKey || 
        draftSelectedModel !== selectedModel || 
        draftTemperature !== temperature || 
        draftSystemPrompt !== systemPrompt || 
        draftActiveAgentId !== activeAgentId || 
        draftActivePresetId !== activePresetId
      ) {
        setApiKey(draftApiKey);
        setSelectedModel(draftSelectedModel);
        setTemperature(draftTemperature);
        setSystemPrompt(draftSystemPrompt);
        setActiveAgentId(draftActiveAgentId);
        setActivePresetId(draftActivePresetId);
      }
    }
  }, [activeTab]);

  const saveSettings = () => {
    setApiKey(draftApiKey);
    setSelectedModel(draftSelectedModel);
    setTemperature(draftTemperature);
    setSystemPrompt(draftSystemPrompt);
    setActiveAgentId(draftActiveAgentId);
    setActivePresetId(draftActivePresetId);
    
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
    const currentChat = sessions.find(c => c.id === currentChatId);
    document.title = currentChat ? `${currentChat.title} — Nexus IA` : 'Nexus IA';
  }, [currentChatId, sessions]);

  const [isAtBottom, setIsAtBottom] = useState(true);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior
      });
    }
  }, []);

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast.error('Reconhecimento de voz não suportado neste navegador.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      if (!recognitionRef.current) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'pt-BR';

        recognitionRef.current.onresult = (event: any) => {
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              const transcript = event.results[i][0].transcript;
              setInputMessage(prev => prev + (prev ? ' ' : '') + transcript);
            }
          }
        };

        recognitionRef.current.onstart = () => {
          setIsListening(true);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          if (event.error === 'not-allowed') {
            toast.error('Permissão de microfone negada.');
          } else {
            toast.error(`Erro no microfone: ${event.error}`);
          }
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }

      recognitionRef.current.start();
    } catch (error) {
      console.error('Failed to start recognition:', error);
      setIsListening(false);
    }
  };


  const handleSendMessage = useCallback(async (e?: React.FormEvent, overridePrompt?: string, messagesToUse?: Message[]) => {
    if (e) e.preventDefault();
    const messageToSend = overridePrompt || inputMessage;
    const isRegenerate = !!messagesToUse;
    
    if (!isRegenerate && ((!messageToSend.trim() && attachedFiles.length === 0) || isLoading)) return;

    // Reset UI state
    if (!isRegenerate) {
      setInputMessage('');
      setAttachedFiles([]);
    }
    
    if (activeTab !== 'chat') setActiveTab('chat');

    try {
      if (!isRegenerate && messageToSend.trim() && !overridePrompt) {
        pushToInputHistory(messageToSend);
      }
      
      await sendMessage(messageToSend, attachedFiles, messagesToUse);
      
      // Ensure we stay at bottom on success
      if (isMounted.current) {
        setTimeout(() => scrollToBottom('smooth'), 100);
      }
    } catch (err) {
      if (isMounted.current) {
        toast.error("Falha ao processar requisição.");
        console.error("SendMessage Error:", err);
      }
    }
  }, [inputMessage, attachedFiles, isLoading, activeTab, sendMessage, pushToInputHistory, scrollToBottom, setActiveTab]);

  const handleRegenerate = useCallback(() => {
    if (messages.length < 2 || isLoading) return;
    
    const lastUserIndex = [...messages].reverse().findIndex(m => m.role === 'user');
    if (lastUserIndex === -1) return;
    
    const actualIndex = messages.length - 1 - lastUserIndex;
    const lastUserMessage = messages[actualIndex];
    const previousMessages = messages.slice(0, actualIndex);
    
    setMessages(previousMessages);
    handleSendMessage(undefined, lastUserMessage.content, previousMessages);
  }, [messages, isLoading, handleSendMessage, setMessages]);

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
    setIsSaving(true);
    const timer = setTimeout(() => setIsSaving(false), 1200);
    return () => clearTimeout(timer);
  }, [sessions]);

  useEffect(() => {
    if (messages.length > 1 && currentChatId) {
      const firstUserMsg = messages.find(m => m.role === 'user');
      const title = firstUserMsg ? deriveChatTitle(firstUserMsg.content) : 'Projeto Sincronizado';
      
      const session = {
        id: currentChatId,
        title,
        timestamp: Date.now(),
        lastMessage: messages[messages.length - 1].content.slice(0, 100),
        messages,
        fileHistory
      };
      
      addSession(session as any);
    }
  }, [messages, currentChatId, fileHistory, addSession]);

  const hasFiles = generatedFiles.length > 0;

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
      if (e.shiftKey) {
        e.preventDefault();
        redoInput();
      } else {
        e.preventDefault();
        undoInput();
      }
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
      e.preventDefault();
      redoInput();
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-background text-foreground overflow-hidden font-sans relative pb-safe">
      
      <SidebarHistory 
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        historySearch={historySearch}
        setHistorySearch={setHistorySearch}
        sessions={sessions}
        currentChatId={currentChatId}
        setCurrentChatId={setCurrentChatId}
        setMessages={setMessages}
        setFileHistory={setFileHistory}
        setGeneratedFiles={setGeneratedFiles}
        setActiveFileIndex={setActiveFileIndex}
        removeSession={removeSession}
        resetChat={resetChat}
        setIsClearHistoryModalOpen={setIsClearHistoryModalOpen}
        deriveChatTitle={deriveChatTitle}
      />

      <Header 
        activeAgent={activeAgent}
        messages={messages}
        currentChatTitle={sessions.find(s => s.id === currentChatId)?.title}
      />

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative min-h-0">
        <div className={cn(
          "flex-1 flex flex-col bg-background border-r border-white/10 min-h-0",
          (activeTab !== 'chat' && activeTab !== 'settings') && "hidden md:flex",
          activeTab === 'settings' ? "flex" : (activeTab === 'chat' ? "flex" : "hidden md:flex")
        )}>
          {activeTab === 'settings' ? (
            <div className="flex-1 overflow-hidden h-full flex flex-col">
              <SettingsPanel 
                settingsTab={settingsTab} setSettingsTab={setSettingsTab}
                draftApiKey={draftApiKey} setDraftApiKey={setDraftApiKey}
                draftSelectedModel={draftSelectedModel} setDraftSelectedModel={setDraftSelectedModel}
                draftTemperature={draftTemperature} setDraftTemperature={setDraftTemperature}
                draftSystemPrompt={draftSystemPrompt} setDraftSystemPrompt={setDraftSystemPrompt}
                draftActiveAgentId={draftActiveAgentId} setDraftActiveAgentId={setDraftActiveAgentId}
                apiPresets={apiPresets} customAgents={customAgents}
                hasSettingsChanges={hasSettingsChanges} saveSettings={saveSettings}
                setIsPresetFormOpen={setIsPresetFormOpen} setEditingPreset={setEditingPreset} deletePreset={deletePreset} setPresetForm={setPresetForm}
                setIsAgentFormOpen={setIsAgentFormOpen} setEditingAgent={setEditingAgent} deleteAgent={deleteAgent} setAgentForm={setAgentForm}
                allAgents={allAgents}
                isSystemPromptExpanded={isSystemPromptExpanded} setIsSystemPromptExpanded={setIsSystemPromptExpanded}
                setActiveTab={setActiveTab}
              />
            </div>
          ) : (
            <>
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
                handleRegenerate={handleRegenerate}
              />

              <div className="p-3 pb-[84px] md:pt-4 md:px-6 md:pb-5 bg-background shrink-0 border-t border-white/5">
                <div className="max-w-3xl mx-auto flex flex-col px-1">
              <div className="relative bg-white/[0.02] border border-white/5 focus-within:border-white/10 focus-within:ring-2 focus-within:ring-blue-500/20 rounded-2xl transition-all duration-300 shadow-xl flex flex-col">
                {attachedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 px-4 pt-3 pb-1">
                    {attachedFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-1 bg-white/5 text-[12px] text-white/80 px-2.5 py-1 rounded-md border border-white/10">
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
                      pushToInputHistory(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                    onKeyDown={onKeyDown}
                  placeholder="Descreva o que você quer construir..."
                  className={cn("w-full bg-transparent border-none text-base text-[#f1f3f4] px-4 py-3 min-h-[50px] max-h-[300px] resize-none outline-none leading-relaxed custom-scrollbar placeholder:text-[#8e918f] focus-visible:ring-0 shadow-none overflow-y-auto", attachedFiles.length > 0 && "pt-2")}
                  rows={1}
                />
                
                <div className="flex items-center justify-between px-3 pb-3 pt-0 gap-2">
                  <div className="flex items-center gap-1 text-[#8e918f]">
                    <button
                      onClick={toggleListening}
                      className={cn(
                        "w-9 h-9 rounded-xl transition-colors flex items-center justify-center",
                        isListening ? "text-red-400 bg-red-400/10" : "hover:bg-[#333538]/50 hover:text-[#e3e3e3]"
                      )}
                      title={isListening ? "Parar gravação" : "Digitar por voz"}
                    >
                      {isListening ? <MicOff size={16} strokeWidth={2.5} /> : <Mic size={16} strokeWidth={2.5} />}
                    </button>

                    <input 
                      type="file" multiple className="hidden" id="file-upload" ref={fileInputRef}
                      onChange={(e) => {
                        if (e.target.files) {
                          const validFiles = Array.from(e.target.files).filter(f => f.size <= 10 * 1024 * 1024);
                          setAttachedFiles(prev => [...prev, ...validFiles]);
                        }
                      }}
                    />
                    <label htmlFor="file-upload" className="w-9 h-9 cursor-pointer text-white/60 hover:bg-white/5 hover:text-white rounded-xl transition-colors flex items-center justify-center" title="Arquivos">
                      <Paperclip size={16} strokeWidth={2.5} />
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
                    <button onClick={() => imageInputRef.current?.click()} className="w-9 h-9 text-white/60 hover:bg-white/5 hover:text-white rounded-xl transition-colors hidden sm:flex items-center justify-center" title="Imagens">
                      <ImageIcon size={16} strokeWidth={2.5} />
                    </button>
                    
                    <div className="h-4 w-px bg-white/5 mx-1" />
                  </div>

                  <div className="flex items-center gap-2">
                    <Select value={selectedModel} onValueChange={(val) => val && setSelectedModel(val)}>
                      <SelectTrigger className="flex h-9 bg-[#1e1f20] border border-white/10 text-[11px] text-[#a8c7fa] hover:text-white hover:bg-white/5 hover:border-white/20 font-bold uppercase tracking-widest focus:ring-0 px-3 py-0 min-w-0 sm:min-w-[110px] shadow-sm rounded-xl transition-all items-center">
                        <div className="flex items-center gap-2 min-w-0">
                          <Brain size={16} className="shrink-0 text-blue-400" />
                          <span className="truncate hidden sm:inline">{selectedModel.split('-').slice(0, 2).join('-')}</span>
                        </div>
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1b1e] border-white/10 text-[#f1f3f4] rounded-xl shadow-2xl min-w-[180px]">
                        {Object.entries(GROUPED_MODELS).map(([groupName, models]) => (
                          <SelectGroup key={groupName}>
                            <SelectLabel className="text-[#a8c7fa] text-[10px] uppercase font-bold tracking-wider pt-2 pb-1 px-2">{groupName}</SelectLabel>
                            {models.map(m => (
                              <SelectItem key={m.id} value={m.id}>
                                <div className="flex flex-col gap-0.5">
                                  <span className="font-bold text-[11px] truncate">{m.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      onClick={handleSendMessage}
                      disabled={(!inputMessage.trim() && attachedFiles.length === 0) || isLoading}
                      size="icon"
                      className={cn(
                        "h-9 w-9 rounded-xl transition-all flex flex-shrink-0 items-center justify-center border-none",
                        (inputMessage.trim() || attachedFiles.length > 0) && !isLoading 
                          ? "bg-[#c2e7ff] hover:bg-[#b5cffb] text-[#001d35] shadow-md" 
                          : "bg-[#282a2d] text-[#8e918f] cursor-not-allowed"
                      )}
                    >
                      {isLoading ? <Loader2 size={16} className="animate-spin" /> : <ArrowUp size={16} strokeWidth={3} />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>

        <div className={cn(
          "flex-1 flex flex-col bg-background min-h-0",
          (activeTab === 'chat' || activeTab === 'settings') && "hidden md:flex",
          activeTab === 'settings' && "md:hidden"
        )}>
          {(() => {
            const rightPaneTab = ['preview', 'code'].includes(activeTab) ? activeTab : 'preview';
            
            return (
              <>
                <div className="hidden md:flex h-[49px] border-b border-white/5 bg-white/[0.01] items-center px-4 justify-between gap-4 flex-shrink-0 z-[60] shadow-sm w-full">
                  <div className="bg-white/5 p-1 rounded-lg flex items-center">
                    <button onClick={() => setActiveTab('preview')} className={cn("px-5 py-1.5 rounded-md text-[13px] font-medium transition-all duration-200", rightPaneTab === 'preview' ? "bg-white/10 text-white shadow-sm" : "text-white/60 hover:text-white")}>Canvas</button>
                    <button onClick={() => setActiveTab('code')} className={cn("px-5 py-1.5 rounded-md text-[13px] font-medium transition-all duration-200 flex items-center gap-1.5", rightPaneTab === 'code' ? "bg-white/10 text-white shadow-sm" : "text-white/60 hover:text-white")}>Arquivos {hasFiles && <span className="flex h-2 w-2 rounded-full bg-blue-400" />}</button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setPreviewKey(k => k + 1)} className="p-1.5 text-white/50 hover:text-white rounded-lg transition-colors" title="Atualizar Preview"><RotateCcw size={16} /></button>
                  </div>
                </div>

                <div className="flex-1 relative flex flex-col bg-background">
                  {!hasFiles && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none bg-background">
                      <div className="w-20 h-20 rounded-3xl bg-secondary/10 border border-border shadow-2xl flex items-center justify-center mb-6">
                        {rightPaneTab === 'code' ? <Terminal size={32} className="text-emerald-400/80" /> : <Layout size={32} className="text-blue-400/80" />}
                      </div>
                      <p className="text-[18px] font-semibold text-foreground">{rightPaneTab === 'code' ? 'Área de Código vazia' : 'O Canvas está vazio'}</p>
                      <p className="text-[14px] mt-2 text-muted-foreground text-center max-w-[280px]">{rightPaneTab === 'code' ? 'Descreva o que deseja criar no chat.' : 'Inicie um projeto para ver o preview aqui.'}</p>
                    </div>
                  )}

                  <PreviewPane 
                    generatedFiles={generatedFiles}
                    previewKey={previewKey}
                    activeTab={rightPaneTab}
                    isLoading={isLoading}
                    handleSendMessage={handleSendMessage}
                  />
                  
                  {hasFiles && (
                    <div className={cn("absolute inset-0 z-20 flex flex-col bg-background", rightPaneTab !== 'code' && "hidden")}>
                <div className="h-10 border-b border-border bg-muted/20 flex items-center px-4 justify-between text-[12px] font-medium flex-shrink-0">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>Explorador de Projeto</span>
                  </div>
                  <div>
                    {fileHistory.length > 1 && (
                      <Select value={(fileHistory.length - 1).toString()} onValueChange={(val) => {
                        const idx = parseInt(val || '0', 10);
                        const updatedHistory = fileHistory.slice(0, idx + 1);
                        setFileHistory(updatedHistory);
                        setGeneratedFiles(updatedHistory[updatedHistory.length - 1].files);
                        setActiveFileIndex(0);
                      }}>
                        <SelectTrigger className="h-6 w-[160px] text-[10px] bg-white/5 border-white/10 text-white focus:ring-0 shadow-none"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-popover border-border text-popover-foreground rounded-lg">
                          {fileHistory.map((h, i) => <SelectItem key={i} value={i.toString()} className="text-[11px]">v{i+1} - {new Date(h.timestamp).toLocaleTimeString()}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                  <div className="hidden md:flex h-full border-r border-border">
                    <FileTree files={generatedFiles} activeFileIndex={activeFileIndex} onSelect={setActiveFileIndex} />
                  </div>
                  <div className="flex-1 flex flex-col min-w-0 bg-background">
                    {generatedFiles[activeFileIndex] && (
                      <div className="h-9 border-b border-border bg-muted/20 flex items-center px-4 text-[12px] font-mono text-muted-foreground flex-shrink-0 select-none">
                        <span className="opacity-50 mr-1">/</span>{generatedFiles[activeFileIndex].name}
                      </div>
                    )}
                    <div className="flex-1 overflow-auto relative">
                      <CodeBlock language={generatedFiles[activeFileIndex]?.lang} value={generatedFiles[activeFileIndex]?.code || ''} noMargin fastMode={isLoading} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      );
    })()}
  </div>
</main>

      <FloatingNav 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setSettingsTab={setSettingsTab}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        hasFiles={hasFiles}
      />

      <SettingsDialogs 
        isPresetFormOpen={isPresetFormOpen}
        setIsPresetFormOpen={setIsPresetFormOpen}
        editingPreset={editingPreset}
        presetForm={presetForm}
        setPresetForm={setPresetForm}
        addOrUpdatePreset={addOrUpdatePreset}
        isAgentFormOpen={isAgentFormOpen}
        setIsAgentFormOpen={setIsAgentFormOpen}
        editingAgent={editingAgent}
        agentForm={agentForm}
        setAgentForm={setAgentForm}
        addOrUpdateAgent={addOrUpdateAgent}
      />

      <Dialog open={isClearHistoryModalOpen} onOpenChange={setIsClearHistoryModalOpen}>
        <DialogContent className="max-w-sm bg-[#131314] border-[#333538] text-white p-6 rounded-2xl">
          <DialogTitle>Limpar Histórico?</DialogTitle>
          <p className="text-[13px] text-[#8e918f] mt-2">Esta ação apagará todos os seus projetos salvos localmente.</p>
          <div className="flex justify-end gap-3 mt-8">
            <Button variant="ghost" onClick={() => setIsClearHistoryModalOpen(false)}>Melhor não</Button>
            <Button onClick={() => { clearHistory(); resetChat(); setIsClearHistoryModalOpen(false); }} className="bg-red-500 hover:bg-red-600">Sim, apagar tudo</Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <footer className="px-4 py-1.5 flex items-center justify-end border-t border-white/5 bg-[#131314]/50 backdrop-blur-sm relative z-50">
        <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-[#8e918f]/40">
          <span className="hidden sm:inline">Engine: {selectedModel}</span>
          <div className="flex gap-1.5">
            <div className="w-1 h-1 rounded-full bg-white/10" />
            <div className="w-1 h-1 rounded-full bg-white/10" />
            <div className="w-1 h-1 rounded-full bg-white/10" />
          </div>
        </div>
      </footer>
      
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
