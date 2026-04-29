import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Toaster, toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

import { Workbench } from './components/workbench/Workbench';
import { Header } from './components/layout/Header';
import { ChatLog } from './components/chat/ChatLog';
import { ChatInput } from './components/chat/ChatInput';
import { Navbar as FloatingNav } from './components/layout/Navbar';
import { SettingsPanel, SettingsDialogs } from './components/settings/SettingsPanel';
import { SecurityModal } from './components/settings/SecurityModal';

import { 
  APIPreset, AgentDefinition, Message
} from './types';
import { Button } from './components/ui/button';
import { 
  Dialog, DialogContent, DialogTitle 
} from './components/ui/dialog';

import { useChatSession } from './hooks/useChatSession';
import { useVoiceRecognition } from './hooks/useVoiceRecognition';
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
  debounce,
  extractFilesFromMarkdown
} from './lib/utils';
import { NEXUS_MODELS, DEFAULT_MODEL } from './lib/models';
import { SidebarHistory } from './components/layout/SidebarHistory';

import { ErrorBoundary } from './components/common/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const { 
    apiKey, setApiKey, 
    selectedModel, setSelectedModel, 
    activeAgentId, setActiveAgentId,
    apiPresets, setApiPresets,
    activePresetId, setActivePresetId,
    temperature, setTemperature,
    searchGrounding,
    customAgents, setCustomAgents
  } = useSettingsStore();

  const { 
    activeTab, setActiveTab,
    settingsTab, setSettingsTab,
    isSidebarOpen, setIsSidebarOpen,
    setIsSaving
  } = useUIStore();

  const { sessions, addSession, clearHistory } = useChatHistoryStore();

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

  const { isListening, toggleListening } = useVoiceRecognition((transcript) => {
    setInputMessage(prev => prev + (prev ? ' ' : '') + transcript);
  });

  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  
  // Mounted ref for async safety
  const isMounted = useRef(true);

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
  const [showScrollButton, setShowScrollButton] = useState(false);

  const [isSystemPromptExpanded, setIsSystemPromptExpanded] = useState(false);

  const [isPresetFormOpen, setIsPresetFormOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<APIPreset | null>(null);
  const [presetForm, setPresetForm] = useState<Partial<APIPreset>>({});

  const [isAgentFormOpen, setIsAgentFormOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AgentDefinition | null>(null);
  const [agentForm, setAgentForm] = useState<Partial<AgentDefinition>>({});

  const [isClearHistoryModalOpen, setIsClearHistoryModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);

  useEffect(() => {
    const handleOpenSecurity = () => setIsSecurityModalOpen(true);
    window.addEventListener('open-security-modal', handleOpenSecurity);
    return () => window.removeEventListener('open-security-modal', handleOpenSecurity);
  }, []);

  const scrollRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const agent = AGENTS.find(a => a.id === activeAgentId);
    if (agent) {
      setSystemPrompt(agent.systemPrompt);
      setDraftSystemPrompt(agent.systemPrompt);
    }
  }, [activeAgentId]);

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

  useEffect(() => {
    const handleLoadSession = (e: any) => {
      const sessionId = e.detail;
      const sessArray = Array.isArray(sessions) ? sessions : [];
      const chat = sessArray.find(c => c && c.id === sessionId);
      if (chat && Array.isArray(chat.messages)) {
        setCurrentChatId(chat.id);
        setMessages([...chat.messages]);
        if (chat.fileHistory && Array.isArray(chat.fileHistory)) {
          setFileHistory([...chat.fileHistory]);
          const latestFiles = chat.fileHistory.length > 0 ? chat.fileHistory[chat.fileHistory.length - 1].files : [];
          setGeneratedFiles(Array.isArray(latestFiles) ? [...latestFiles] : []);
        } else {
          const fullContent = chat.messages.filter(m => m && m.role === 'model').map(m => m.content).join('\n');
          const files = extractFilesFromMarkdown(fullContent);
          setFileHistory(files.length > 0 ? [{ timestamp: Date.now(), files }] : []);
          setGeneratedFiles(files);
        }
        setActiveFileIndex(0);
        setIsSidebarOpen(false);
        setActiveTab('chat');
      }
    };
    
    window.addEventListener('loadSession', handleLoadSession as EventListener);
    
    const handleNewChat = () => resetChat();
    window.addEventListener('newChat', handleNewChat);

    return () => {
      window.removeEventListener('loadSession', handleLoadSession as EventListener);
      window.removeEventListener('newChat', handleNewChat);
    };
  }, [sessions, setMessages, setFileHistory, setGeneratedFiles, setActiveFileIndex, resetChat, setIsSidebarOpen, setActiveTab]);

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

  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      console.error('Captured global error:', event.error);
    };
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Log more details to help debugging
      console.error('Unhandled promise rejection source:', event.promise);
      console.error('Unhandled promise rejection reason:', event.reason);
      
      const reason = event.reason;
      const message = (reason instanceof Error ? reason.message : 
                       typeof reason === 'string' ? reason : 
                       reason?.message || JSON.stringify(reason)) || 'Unknown async error';
      
      console.error('Rejection message extracted:', message);
      toast.error(`Erro assíncrono detectado: ${message.slice(0, 50)}...`);
    };
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const [isAtBottom, setIsAtBottom] = useState(true);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior
      });
    }
  }, []);

  useEffect(() => {
    return () => {
    };
  }, []);

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
    handleSendMessage(undefined, lastUserMessage.content, previousMessages).catch(err => {
      console.error("Failed to regenerate message:", err);
    });
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
    if (messages.length > 1 && currentChatId && !isLoading) {
      const firstUserMsg = messages.find(m => m.role === 'user');
      const title = firstUserMsg ? deriveChatTitle(firstUserMsg.content) : 'Projeto Sincronizado';
      
      const session = {
        id: currentChatId,
        title,
        timestamp: Date.now(),
        lastMessage: (messages[messages.length - 1]?.content || '').slice(0, 100),
        messages: messages,
        fileHistory: fileHistory || []
      };
      
      // Delay saving slightly to ensure state is settled
      const timeout = setTimeout(() => {
        addSession(session as any);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [messages.length, currentChatId, addSession, isLoading]);

  const hasFiles = generatedFiles.length > 0;

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage().catch(err => {
        console.error("Failed to send message via Enter:", err);
      });
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
      
      <Header 
        activeAgent={activeAgent}
        messages={messages}
        currentChatTitle={(Array.isArray(sessions) ? sessions : []).find(s => s?.id === currentChatId)?.title || ''}
      />

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative min-h-0">
        <div className={cn(
          "flex-1 flex flex-col bg-background border-r border-white/10 min-h-0 relative",
          (activeTab !== 'chat' && activeTab !== 'settings') && "hidden md:flex",
          ['settings', 'chat'].includes(activeTab) ? "flex" : "hidden md:flex"
        )}>
          <AnimatePresence mode="wait">
            {activeTab === 'settings' ? (
              <motion.div 
                key="settings"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="flex-1 overflow-hidden h-full flex flex-col"
              >
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
              </motion.div>
            ) : (
              <motion.div 
                key="chat"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="flex-1 flex flex-col min-h-0 h-full"
              >
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
                  handleSendMessage={handleSendMessage}
                  handleRegenerate={handleRegenerate}
                />

                <ChatInput 
                  inputMessage={inputMessage}
                  setInputMessage={setInputMessage}
                  attachedFiles={attachedFiles}
                  setAttachedFiles={setAttachedFiles}
                  isLoading={isLoading}
                  handleSendMessage={handleSendMessage}
                  onKeyDown={onKeyDown}
                  isListening={isListening}
                  toggleListening={toggleListening}
                  pushToInputHistory={pushToInputHistory}
                  selectedModel={selectedModel}
                  setSelectedModel={setSelectedModel}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait">
          {['preview', 'code', 'files'].includes(activeTab) || window.innerWidth >= 768 ? (
            <motion.div
              key="workbench"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className={cn(
                "flex-1 flex flex-col md:flex",
                !['preview', 'code', 'files'].includes(activeTab) && "hidden md:flex"
              )}
            >
              <Workbench
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                generatedFiles={generatedFiles}
                setGeneratedFiles={setGeneratedFiles}
                activeFileIndex={activeFileIndex}
                setActiveFileIndex={setActiveFileIndex}
                previewKey={previewKey}
                setPreviewKey={setPreviewKey}
                isLoading={isLoading}
                handleSendMessage={handleSendMessage}
                fileHistory={fileHistory}
                setFileHistory={setFileHistory}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>

      <FloatingNav 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasFiles={hasFiles}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
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

      <SecurityModal isOpen={isSecurityModalOpen} onClose={() => setIsSecurityModalOpen(false)} />

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
      <SidebarHistory />
    </div>
  );
}
