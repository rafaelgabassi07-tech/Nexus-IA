import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Loader2, ArrowUp, Settings, Key,
  Paperclip, Image as ImageIcon, Code, Terminal, Layout, Hexagon,
  Plus, MessageSquare, Trash2, X,
  Users, Edit2, Activity, Shield, Sparkles, Brain,
  ArrowLeft, Copy, Check,
  History as HistoryIcon, ListChecks
} from 'lucide-react';

export type TechnicalStep = {
  id: string;
  label: string;
  status: 'running' | 'success' | 'error' | 'pending';
  details?: string;
  icon?: any;
};
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'motion/react';

import { AGENTS, defaultWelcomeMessage } from './agents';
import type { AgentDefinition } from './agents';
import { cn } from './lib/utils';
import { Button } from './components/ui/button';
import { Textarea } from './components/ui/textarea';
import { Input } from './components/ui/input';
import { Avatar, AvatarFallback } from './components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';

export type Message = {
  id: string;
  role: 'user' | 'model';
  content: string;
};

export type APIPreset = {
  id: string;
  name: string;
  apiKey: string;
  model: string;
};

export type ChatSession = {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
};

const CodeBlock = ({ language, value, noMargin }: { language?: string; value: string; noMargin?: boolean }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("relative group/code", !noMargin && "my-4")}>
      <div className="absolute right-3 top-3 z-10 opacity-0 group-hover/code:opacity-100 transition-opacity flex items-center gap-2">
        {language && (
          <span className="text-[10px] font-bold text-[#8e918f] uppercase tracking-widest bg-black/40 px-2 py-0.5 rounded border border-white/5">
            {language}
          </span>
        )}
        <button
          onClick={copyToClipboard}
          className="p-1.5 rounded-lg bg-[#2d2e31] border border-white/10 text-zinc-400 hover:text-white transition-all hover:scale-105 active:scale-95 shadow-lg"
          title="Copiar código"
        >
          {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || 'text'}
        style={vscDarkPlus}
        PreTag="div"
        customStyle={{
          margin: 0,
          padding: '1.25rem',
          borderRadius: noMargin ? '0' : '0.75rem',
          fontSize: '13px',
          background: noMargin ? 'transparent' : '#0d0d0d',
          border: noMargin ? 'none' : '1px solid #333538',
          lineHeight: '1.6'
        }}
        codeTagProps={{
          style: {
            fontFamily: 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
          }
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
};

export default function App() {
  const [isRunning, setIsRunning] = useState(false);
  const [runTime, setRunTime] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isRunning) {
      interval = setInterval(() => {
        setRunTime(prev => prev + 1);
      }, 1000);
    } else {
      setRunTime(0);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

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
      return localStorage.getItem('nexus_active_agent_id') || AGENTS[0].id;
    }
    return AGENTS[0].id;
  });

  const activeAgent = useMemo(() => {
    return allAgents.find(a => a.id === activeAgentId) || AGENTS[0];
  }, [allAgents, activeAgentId]);

  const [apiPresets, setApiPresets] = useState<APIPreset[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nexus_api_presets');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [activePresetId, setActivePresetId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('nexus_active_preset_id');
    }
    return null;
  });

  const [chatHistory, setChatHistory] = useState<ChatSession[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nexus_chat_history');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return [];
  });
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'preview' | 'code' | 'settings'>('chat');
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview');
  const [temperature, setTemperature] = useState<number>(0.7);
  const [systemPrompt, setSystemPrompt] = useState(activeAgent.systemPrompt);

  const [settingsTab, setSettingsTab] = useState<'overview' | 'general' | 'agent' | 'security'>('overview');
  const [isPresetFormOpen, setIsPresetFormOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<APIPreset | null>(null);
  const [presetForm, setPresetForm] = useState<Partial<APIPreset>>({});

  // Subagents management state
  const [isAgentFormOpen, setIsAgentFormOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AgentDefinition | null>(null);
  const [agentForm, setAgentForm] = useState<Partial<AgentDefinition>>({});

  // Draft states for settings modal
  const [draftApiKey, setDraftApiKey] = useState(apiKey);
  const [draftSelectedModel, setDraftSelectedModel] = useState(selectedModel);
  const [draftTemperature, setDraftTemperature] = useState(temperature);
  const [draftSystemPrompt, setDraftSystemPrompt] = useState(systemPrompt);
  const [draftActiveAgentId, setDraftActiveAgentId] = useState(activeAgentId);
  const [draftActivePresetId, setDraftActivePresetId] = useState(activePresetId);

  const hasSettingsChanges = useMemo(() => {
    return draftApiKey !== apiKey || 
           draftSelectedModel !== selectedModel || 
           draftTemperature !== temperature || 
           draftSystemPrompt !== systemPrompt ||
           draftActiveAgentId !== activeAgentId ||
           draftActivePresetId !== activePresetId;
  }, [apiKey, selectedModel, temperature, systemPrompt, activeAgentId, activePresetId, draftApiKey, draftSelectedModel, draftTemperature, draftSystemPrompt, draftActiveAgentId, draftActivePresetId]);

  // Sync draft states when opening settings tab
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
    setDraftActivePresetId(null); // Clear preset if manual settings are saved or handled
    setActivePresetId(draftActivePresetId);
    localStorage.setItem('nexus_active_agent_id', draftActiveAgentId);
    if (draftActivePresetId) localStorage.setItem('nexus_active_preset_id', draftActivePresetId);
    else localStorage.removeItem('nexus_active_preset_id');
    setActiveTab('chat');
  };

  const saveApiPresets = (presets: APIPreset[]) => {
    setApiPresets(presets);
    localStorage.setItem('nexus_api_presets', JSON.stringify(presets));
  };

  const addOrUpdatePreset = () => {
    if (!presetForm.name || !presetForm.apiKey || !presetForm.model) return;

    if (editingPreset) {
      const updated = apiPresets.map(p => p.id === editingPreset.id ? { ...p, ...presetForm } as APIPreset : p);
      saveApiPresets(updated);
    } else {
      const newPreset: APIPreset = {
        id: generateId(),
        name: presetForm.name!,
        apiKey: presetForm.apiKey!,
        model: presetForm.model!,
      };
      saveApiPresets([...apiPresets, newPreset]);
      if (!activePresetId) {
        setActivePresetId(newPreset.id);
        localStorage.setItem('nexus_active_preset_id', newPreset.id);
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
        if (nextId) localStorage.setItem('nexus_active_preset_id', nextId);
        else localStorage.removeItem('nexus_active_preset_id');
      }
    }
  };

  const saveCustomAgents = (agents: AgentDefinition[]) => {
    setCustomAgents(agents);
    localStorage.setItem('nexus_custom_agents', JSON.stringify(agents));
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
      if (draftActiveAgentId === id) {
        setDraftActiveAgentId(AGENTS[0].id);
      }
    }
  };
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const generateId = () => {
    try {
      return crypto.randomUUID();
    } catch (e) {
      return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
  };

  const resetChat = () => {
    setCurrentChatId(generateId());
    setMessages([
      {
        id: generateId(),
        role: 'model',
        content: activeAgent.id === 'general-specialist' ? defaultWelcomeMessage : `Olá! Sou o **${activeAgent.name}**. Como posso te ajudar hoje?`
      }
    ]);
  };

  // Save to local storage when chat history changes
  useEffect(() => {
    localStorage.setItem('nexus_chat_history', JSON.stringify(chatHistory));
  }, [chatHistory]);

  // Auto-save current messages to the active chat session
  useEffect(() => {
    if (messages.length > 1 && currentChatId) {
      setChatHistory(prev => {
        let exists = false;
        const newHistory = prev.map(chat => {
          if (chat.id === currentChatId) {
            exists = true;
            return {
              ...chat,
              messages: messages,
              updatedAt: Date.now(),
              // Update title if it was named "Novo Chat" or empty based on first user message
              title: chat.title === 'Novo Chat' && messages[1]?.role === 'user'
                ? messages[1].content.slice(0, 30) + (messages[1].content.length > 30 ? '...' : '')
                : chat.title
            };
          }
          return chat;
        });

        if (!exists) {
           return [{
             id: currentChatId,
             title: messages[1]?.role === 'user' ? (messages[1].content.slice(0, 30) + (messages[1].content.length > 30 ? '...' : '')) : 'Novo Chat',
             messages: messages,
             updatedAt: Date.now()
           }, ...newHistory];
        }

        return newHistory;
      });
    }
  }, [messages, currentChatId]);

  // Clear conversation when switching agents (only on mount now since there's 1 agent)
  useEffect(() => {
    resetChat();
  }, []);

  // Scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Extract Files from the latest model message
  const generatedFiles = useMemo(() => {
    const reversedMessages = [...messages].reverse();
    const files: { name: string, lang: string, code: string }[] = [];
    
    for (const msg of reversedMessages) {
      if (msg.role === 'model') {
        const regex = /```(\w+)?(?:[:\s]([\w.-]+))?\n([\s\S]*?)```/g;
        let match;
        while ((match = regex.exec(msg.content)) !== null) {
          files.push({
            lang: match[1] || 'text',
            name: match[2] || `file_${files.length + 1}.${match[1] || 'txt'}`,
            code: match[3]
          });
        }
        if (files.length > 0) break; // Use files from the latest message that has them
      }
    }
    return files;
  }, [messages]);

  const previewHtml = generatedFiles.find(f => f.lang === 'html')?.code || '';
  const hasFiles = generatedFiles.length > 0;

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!inputMessage.trim() && attachedFiles.length === 0) || isLoading) return;

    let finalMessage = inputMessage.trim();

    if (attachedFiles.length > 0) {
      for (const file of attachedFiles) {
        if (file.type.startsWith('text/') || file.name.endsWith('.js') || file.name.endsWith('.ts') || file.name.endsWith('.tsx') || file.name.endsWith('.json') || file.name.endsWith('.md')) {
          try {
            const text = await file.text();
            finalMessage += `\n\n\`\`\`${file.name}\n${text}\n\`\`\``;
          } catch (e) {
            console.error('Failed to read file', file.name);
          }
        } else {
           finalMessage += `\n\n[Arquivo anexo: ${file.name}]`;
        }
      }
    }

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: finalMessage || 'Veja os arquivos anexos.'
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputMessage('');
    setAttachedFiles([]);
    setIsLoading(true);
    setIsRunning(true);

    const activePreset = apiPresets.find(p => p.id === activePresetId);
    const apiToUse = activePreset ? activePreset.apiKey : apiKey;
    const modelToUse = activePreset ? activePreset.model : selectedModel;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          systemPrompt: systemPrompt,
          temperature: temperature,
          agentId: activeAgent.id,
          apiKey: apiToUse,
          model: modelToUse
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned ${res.status}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      
      let fullResponse = "";
      const messageId = generateId();

      setMessages(prev => [...prev, {
        id: messageId,
        role: 'model',
        content: ''
      }]);

      if (reader) {
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() || "";

          for (const part of parts) {
            if (part.startsWith('data: ')) {
              const data = part.slice(6);
              if (data === '[DONE]') break;
              
              try {
                const parsed = JSON.parse(data);
                if (parsed.error) {
                  throw new Error(parsed.error);
                }
                if (parsed.text) {
                  fullResponse += parsed.text;
                  setMessages(prev => prev.map(m => 
                    m.id === messageId ? { ...m, content: fullResponse } : m
                  ));
                }
              } catch (e) {
                // Ignore parse errors from partial chunks
              }
            }
          }
        }
      }
      
      // Auto-switch to preview tab if the response contains HTML (mobile only behavior, harmless on desktop)
      if (fullResponse.includes('```html')) {
        setActiveTab('preview');
      }
    } catch (err: any) {
      console.error(err);
      setMessages(prev => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.role === 'model' && lastMsg.content === '') {
           return prev.map(m => m.id === lastMsg.id ? { ...m, content: `**Erro ao conectar com a IA:**\n\n${err.message || 'Tente novamente.'}` } : m);
        } else {
           return [...prev, {
            id: crypto.randomUUID(),
            role: 'model',
            content: `**Erro ao conectar com a IA:**\n\n${err.message || 'Tente novamente.'}`
          }];
        }
      });
    } finally {
      setIsLoading(false);
      setIsRunning(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-[#131314] text-zinc-200 overflow-hidden font-sans relative pb-safe">
      
      {/* Sidebar Drawer - Moved to top for reliability */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <div className="fixed inset-0 z-[9999]" key="sidebar-overlay">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            {/* Content Drawer */}
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
                    <MessageSquare size={16} />
                  </div>
                  <span>Histórico</span>
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
                  <span>Nova conversa</span>
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto px-3 pb-8 space-y-2 custom-scrollbar">
                {chatHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center pt-24 px-6 text-center space-y-4 opacity-40">
                    <MessageSquare size={48} className="text-[#8e918f]" strokeWidth={1} />
                    <p className="text-[14px] font-medium text-[#f1f3f4]">Nenhuma conversa</p>
                    <p className="text-[12px] max-w-[180px]">Suas conversas anteriores aparecerão aqui.</p>
                  </div>
                ) : (
                  [...chatHistory].sort((a, b) => b.updatedAt - a.updatedAt).map(chat => (
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
                        setIsSidebarOpen(false);
                      }}
                    >
                      <div className="flex items-center gap-2 pr-8">
                        <MessageSquare size={14} className={cn("shrink-0", currentChatId === chat.id ? "text-[#a8c7fa]" : "text-[#8e918f]")} />
                        <span className="text-[14px] font-medium truncate">{chat.title}</span>
                      </div>
                      <span className="text-[11px] opacity-50 pl-6">
                        {new Date(chat.updatedAt).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if(confirm('Apagar conversa permanentemente?')) {
                            setChatHistory(prev => prev.filter(c => c.id !== chat.id));
                            if (currentChatId === chat.id) {
                              resetChat();
                            }
                          }
                        }}
                        className="absolute right-2 top-3 p-2 opacity-0 group-hover:opacity-100 text-[#8e918f] hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {chatHistory.length > 0 && (
                <div className="p-4 border-t border-white/5 bg-[#131314]/50">
                  <button 
                    onClick={() => {
                      if(confirm('Limpar todo o histórico? Esta ação não pode ser desfeita.')) {
                        setChatHistory([]);
                        localStorage.removeItem('nexus_chat_history');
                        resetChat();
                        setIsSidebarOpen(false);
                      }
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

      {/* Header - AI Studio Style */}
      <header className="h-[64px] min-h-[64px] py-1 flex items-center justify-between px-4 md:px-6 bg-[#131314]/80 backdrop-blur-md flex-shrink-0 border-b border-white/5 relative z-[60]">
        <div className="flex items-center gap-4 group">
          <div className={cn(
            "flex items-center justify-center w-[38px] h-[38px] rounded-xl text-white shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:rotate-3 overflow-hidden border border-white/10",
            activeAgent.color || "bg-gradient-to-tr from-blue-600 to-indigo-600"
          )}>
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            {activeAgent.iconName === 'Hexagon' && <Hexagon size={18} strokeWidth={2.5} className="relative z-10" />}
            {activeAgent.iconName === 'Brain' && <Brain size={18} strokeWidth={2.5} className="relative z-10" />}
            {activeAgent.iconName === 'Sparkles' && <Sparkles size={18} strokeWidth={2.5} className="relative z-10" />}
            {activeAgent.iconName === 'Shield' && <Shield size={18} strokeWidth={2.5} className="relative z-10" />}
            {activeAgent.iconName === 'Terminal' && <Terminal size={18} strokeWidth={2.5} className="relative z-10" />}
            {activeAgent.iconName === 'Activity' && <Activity size={18} strokeWidth={2.5} className="relative z-10" />}
            {activeAgent.iconName === 'Users' && <Users size={18} strokeWidth={2.5} className="relative z-10" />}
            {(!activeAgent.iconName || !['Hexagon', 'Brain', 'Sparkles', 'Shield', 'Terminal', 'Activity', 'Users'].includes(activeAgent.iconName)) && <Hexagon size={18} strokeWidth={2.5} className="relative z-10" />}
          </div>
          <div className="flex flex-col">
            <h1 className="text-[14px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2 leading-none">
              {activeAgent.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
              <p className="text-[8px] text-[#5f6368] font-bold uppercase tracking-[0.3em] leading-none">Nexus Protocol Active</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Status Indicator (Desktop) */}
          <div className="hidden lg:flex items-center gap-4 px-4 py-1.5 rounded-full bg-white/[0.02] border border-white/5">
             <div className="flex flex-col items-end">
               <span className="text-[8px] font-black text-white/40 uppercase tracking-widest leading-none">Status</span>
               <span className="text-[9px] font-bold text-blue-400 uppercase tracking-tighter mt-1">Sincronizado</span>
             </div>
             <div className="w-px h-4 bg-white/10" />
             <div className="flex flex-col items-end">
               <span className="text-[8px] font-black text-white/40 uppercase tracking-widest leading-none">Motor</span>
               <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter mt-1">{selectedModel.split('-')[1] || 'Flash'}</span>
             </div>
          </div>
        </div>
      </header>


      {/* Main Workspace */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative min-h-0">
        
        {/* Chat / Prompt Section */}
        <div className={cn(
          "flex flex-col flex-1 bg-[#131314] border-r border-[#333538] min-h-0",
          activeTab !== 'chat' && "hidden md:flex",
          activeTab === 'settings' && "md:hidden"
        )}>
          {/* Technical Execution Bar (Simulating the image) */}
          <AnimatePresence>
            {isLoading && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-[#1e1f20] border-b border-[#333538] px-5 py-4 overflow-hidden z-20 shadow-md"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 text-[12px] text-[#8e918f]">
                     <span className="text-white font-black uppercase tracking-widest text-[10px] bg-white/5 px-2 py-0.5 rounded border border-white/10">{selectedModel}</span>
                     <span className="text-[#333538] font-bold">•</span>
                     <span className="flex items-center gap-1.5 font-bold uppercase tracking-tighter text-[10px] text-blue-400">
                       Running for {runTime}s
                     </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <div className="relative flex items-center justify-center shrink-0">
                        <div className="w-6 h-6 rounded-full border-2 border-dashed border-blue-500/20 border-t-blue-400 animate-[spin_4s_linear_infinite]" />
                        <div className="absolute w-4 h-4 rounded-full bg-blue-500/10 flex items-center justify-center">
                          <ListChecks size={10} className="text-blue-400" />
                        </div>
                      </div>
                      <div className="flex-1 flex items-center justify-between bg-[#131314] p-3 rounded-lg border border-white/5 shadow-sm">
                        <div className="flex flex-col">
                          <span className="text-[12px] font-black text-[#f1f3f4] uppercase tracking-tighter">Linter check</span>
                          <span className="text-[10px] text-[#5f6368] font-mono leading-none">src/App.tsx</span>
                        </div>
                        <div className="flex items-center gap-3">
                           <div className="hidden sm:block w-[60px] h-1 bg-[#1e1f20] rounded-full overflow-hidden border border-white/5">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: '100%' }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="h-full bg-blue-500"
                              />
                           </div>
                           <div className="w-5 h-5 rounded-full border border-emerald-500/30 flex items-center justify-center bg-emerald-500/5">
                             <Check size={12} className="text-emerald-400" />
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chat Log */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-5 py-4 space-y-5 scroll-smooth custom-scrollbar"
          >
            {/* Empty state removed as requested */}

            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className={cn("flex w-full mb-6", msg.role === 'user' ? "justify-end" : "justify-start")}
                >
                  {msg.role === 'user' ? (
                    <div className="bg-[#282a2d] text-[#e3e3e3] px-4 py-2.5 rounded-2xl rounded-br-sm max-w-[85%] text-[14px] leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  ) : (
                    <div className="flex flex-row gap-3 w-full max-w-3xl items-start group">
                      <Avatar className={cn(
                        "w-6 h-6 rounded-md shrink-0 mt-0.5 shadow-sm",
                        activeAgent.color || "bg-gradient-to-tr from-[#00d2ff] to-[#3a7bd5]"
                      )}>
                         <AvatarFallback className="bg-transparent text-white">
                           {activeAgent.iconName === 'Hexagon' && <Hexagon size={12} strokeWidth={2.5} />}
                           {activeAgent.iconName === 'Brain' && <Brain size={12} strokeWidth={2.5} />}
                           {activeAgent.iconName === 'Sparkles' && <Sparkles size={12} strokeWidth={2.5} />}
                           {activeAgent.iconName === 'Shield' && <Shield size={12} strokeWidth={2.5} />}
                           {activeAgent.iconName === 'Terminal' && <Terminal size={12} strokeWidth={2.5} />}
                           {activeAgent.iconName === 'Activity' && <Activity size={12} strokeWidth={2.5} />}
                           {activeAgent.iconName === 'Users' && <Users size={12} strokeWidth={2.5} />}
                           {(!activeAgent.iconName || !['Hexagon', 'Brain', 'Sparkles', 'Shield', 'Terminal', 'Activity', 'Users'].includes(activeAgent.iconName)) && <Hexagon size={12} strokeWidth={2.5} />}
                         </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-[14px] leading-[1.6] text-[#e3e3e3] pr-4">
                        <div className="markdown-prose">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                              code({ node, inline, className, children, ...props }: any) {
                                const match = /language-(\w+)/.exec(className || '');
                                return !inline && match ? (
                                  <CodeBlock
                                    language={match[1]}
                                    value={String(children).replace(/\n$/, '')}
                                    {...props}
                                  />
                                ) : (
                                  <code className={className} {...props}>
                                    {children}
                                  </code>
                                );
                              }
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                        
                        {/* Action History Visual (from Image 2) */}
                        {msg.content.includes('Edit') && (
                          <div className="mt-4 bg-[#111113] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                            <div className="px-4 py-3 border-b border-white/5 bg-[#161618] flex items-center gap-2">
                              <HistoryIcon size={14} className="text-blue-400" />
                              <span className="text-[12px] font-bold text-white uppercase tracking-widest">History</span>
                            </div>
                            <div className="p-4 space-y-4">
                               <p className="text-[12px] text-[#8e918f] font-bold uppercase tracking-wider">Aqui estão os passos realizados:</p>
                               <div className="space-y-3">
                                  <div className="flex items-start gap-4 p-4 rounded-xl bg-[#09090b] border border-white/5">
                                     <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                                       <Edit2 size={16} />
                                     </div>
                                     <div className="flex-1">
                                        <p className="text-[14px] font-bold text-[#f1f3f4]">Arquivo Editado</p>
                                        <div className="mt-2 pl-3 border-l-2 border-white/5 py-1">
                                           <div className="flex items-center justify-between text-[12px] text-[#8e918f]">
                                              <span className="font-mono">src/App.tsx</span>
                                              <div className="w-4 h-4 rounded-full border border-emerald-500/50 flex items-center justify-center bg-emerald-500/5">
                                                <Check size={10} className="text-emerald-400" />
                                              </div>
                                           </div>
                                        </div>
                                     </div>
                                  </div>
                               </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-row gap-3 w-full max-w-3xl items-start mb-6"
              >
                 <Avatar className={cn(
                        "w-6 h-6 rounded-md shrink-0 mt-0.5 shadow-sm",
                        activeAgent.color || "bg-gradient-to-tr from-[#00d2ff] to-[#3a7bd5]"
                      )}>
                   <AvatarFallback className="bg-transparent text-white">
                     {activeAgent.iconName === 'Hexagon' && <Hexagon size={12} strokeWidth={2.5} />}
                     {activeAgent.iconName === 'Brain' && <Brain size={12} strokeWidth={2.5} />}
                     {activeAgent.iconName === 'Sparkles' && <Sparkles size={12} strokeWidth={2.5} />}
                     {activeAgent.iconName === 'Shield' && <Shield size={12} strokeWidth={2.5} />}
                     {activeAgent.iconName === 'Terminal' && <Terminal size={12} strokeWidth={2.5} />}
                     {activeAgent.iconName === 'Activity' && <Activity size={12} strokeWidth={2.5} />}
                     {activeAgent.iconName === 'Users' && <Users size={12} strokeWidth={2.5} />}
                     {(!activeAgent.iconName || !['Hexagon', 'Brain', 'Sparkles', 'Shield', 'Terminal', 'Activity', 'Users'].includes(activeAgent.iconName)) && <Hexagon size={12} strokeWidth={2.5} />}
                   </AvatarFallback>
                 </Avatar>
                 <div className="py-1 flex items-center gap-3">
                   <div className="w-3.5 h-3.5 rounded-full border-[2px] border-[#a8c7fa] border-t-transparent animate-spin" />
                   <span className="text-[13px] text-[#8e918f]">Gerando código...</span>
                 </div>
              </motion.div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-3 pb-[84px] md:pt-4 md:px-6 md:pb-5 bg-[#131314] shrink-0 border-t border-[#333538]/50">
            <div className="max-w-3xl mx-auto flex flex-col px-1">
              {/* Main Input Container */}
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
                  spellCheck={false}
                  rows={1}
                />
                
                {/* Bottom Toolbar inside the input */}
                <div className="flex items-end justify-between p-2 pt-0">
                  {/* Left Side Icons */}
                  <div className="flex items-center gap-1 text-[#8e918f]">
                    <input 
                      type="file" 
                      multiple 
                      className="hidden" 
                      id="file-upload" 
                      ref={fileInputRef}
                      onChange={(e) => {
                        if (e.target.files) {
                          setAttachedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                        }
                      }}
                    />
                    <label htmlFor="file-upload" className="cursor-pointer p-2 hover:bg-[#333538]/50 hover:text-[#e3e3e3] rounded-lg transition-colors flex items-center justify-center" title="Anexar arquivo">
                      <Paperclip size={18} strokeWidth={2} />
                    </label>
                    <button className="p-2 hover:bg-[#333538]/50 hover:text-[#e3e3e3] rounded-lg transition-colors hidden sm:flex" title="Adicionar imagem">
                      <ImageIcon size={18} strokeWidth={2} />
                    </button>
                  </div>

                  {/* Send Button */}
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

        {/* Preview / Canvas Section */}
        <div className={cn(
          "flex-1 flex flex-col bg-[#131314] min-h-0",
          (activeTab === 'chat' || activeTab === 'settings') && "hidden md:flex",
          activeTab === 'settings' && "md:hidden"
        )}>
          {/* Section Header */}
          <div className="hidden md:flex h-[49px] border-b border-[#333538] bg-[#1a1b1e] items-center px-4 justify-between gap-4 flex-shrink-0 relative z-10 shadow-sm w-full">
             {/* Modern top segmented control for Canvas vs Code */}
             <div className="bg-[#282a2d] p-1 rounded-lg flex items-center">
               <button
                 onClick={() => setActiveTab('preview')}
                 className={cn(
                   "px-5 py-1.5 rounded-md text-[13px] font-medium transition-all duration-200",
                   activeTab === 'preview' || (activeTab === 'chat' && !hasFiles) 
                    ? "bg-[#444746] text-[#e3e3e3] shadow-sm" : "text-[#8e918f] hover:text-[#e3e3e3]"
                 )}
               >
                 Canvas
               </button>
               <button
                 onClick={() => setActiveTab('code')}
                 className={cn(
                   "px-5 py-1.5 rounded-md text-[13px] font-medium transition-all duration-200 flex items-center gap-1.5 relative",
                   activeTab === 'code' ? "bg-[#444746] text-[#e3e3e3] shadow-sm" : "text-[#8e918f] hover:text-[#e3e3e3]"
                 )}
               >
                 Arquivos
                 {hasFiles && <span className="flex h-2 w-2 rounded-full bg-[#a8c7fa]" />}
               </button>
             </div>
             
             <div className="bg-[#131314] border border-[#333538] rounded-md text-[11px] px-2.5 py-1.5 text-[#8e918f] font-mono tracking-wide hidden sm:block">
               localhost:3000
             </div>
          </div>

          <div 
            className="flex-1 relative flex flex-col bg-white"
            style={!hasFiles ? { 
              backgroundColor: activeTab === 'code' ? '#080809' : '#131314',
              backgroundImage: activeTab === 'code' 
                ? 'linear-gradient(#161617 1px, transparent 1px), linear-gradient(90deg, #161617 1px, transparent 1px)'
                : 'radial-gradient(#333538 1px, transparent 1px)', 
              backgroundSize: activeTab === 'code' ? '32px 32px' : '24px 24px' 
            } : undefined}
          >
            {!hasFiles && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.5, type: 'spring' }}
                  className="flex flex-col items-center justify-center"
                >
                  <div className="relative mb-6">
                    <div className={cn(
                      "absolute inset-0 blur-2xl rounded-full",
                      activeTab === 'code' ? "bg-emerald-500/10" : "bg-blue-500/20"
                    )} />
                    <div className="w-20 h-20 rounded-3xl bg-[#1e1f20] border border-[#333538] shadow-2xl flex items-center justify-center relative shadow-[0_0_40px_rgba(40,40,40,0.5)]">
                      {activeTab === 'code' ? (
                        <Terminal size={32} className="text-emerald-400/80" strokeWidth={1.5} />
                      ) : (
                        <Layout size={32} className="text-[#a8c7fa]" strokeWidth={1.5} />
                      )}
                    </div>
                  </div>
                  <p className="text-[18px] font-semibold text-[#f1f3f4] tracking-tight">
                    {activeTab === 'code' ? 'Área de Código vazia' : 'O Canvas está vazio'}
                  </p>
                  <p className="text-[14px] mt-2 text-[#8e918f] max-w-[280px] text-center leading-relaxed">
                    {activeTab === 'code' 
                      ? 'Descreva a lógica ou as funções que deseja criar para ver os arquivos aqui.'
                      : 'Comece a desenvolver descrevendo o que deseja construir no chat.'}
                  </p>
                </motion.div>
              </div>
            )}

            {previewHtml && activeTab === 'preview' && (
              <iframe 
                srcDoc={previewHtml}
                className="w-full h-full border-none bg-white relative z-20" 
                title="Application Preview"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            )}
            {!previewHtml && activeTab === 'preview' && hasFiles && (
              <div className="flex-1 flex items-center justify-center bg-[#131314] text-[#8e918f] z-20 absolute inset-0">
                Nenhum artefato web (HTML) encontrado. Verifique a aba de código.
              </div>
            )}
            
            {hasFiles && activeTab === 'code' && (
              <div 
                className="absolute inset-0 z-20 overflow-auto p-4 md:p-6 custom-scrollbar flex flex-col gap-6"
                style={{ 
                  backgroundColor: '#080809',
                  backgroundImage: 'linear-gradient(#161617 1px, transparent 1px), linear-gradient(90deg, #161617 1px, transparent 1px)',
                  backgroundSize: '32px 32px'
                }}
              >
                {generatedFiles.map((file, i) => (
                  <div key={i} className="flex flex-col border border-[#333538] rounded-xl overflow-hidden shadow-2xl bg-[#1e1f20]">
                    <div className="bg-[#282a2d] border-b border-[#333538] px-4 py-3 flex items-center justify-between text-xs font-mono text-[#e3e3e3]">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                          <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <Code size={14} className="text-[#a8c7fa]" />
                          <span className="font-medium tracking-wide text-[#f1f3f4]">{file.name}</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-[#0b0b0c] p-1">
                       <CodeBlock language={file.lang} value={file.code} noMargin />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>



      {/* Modern Global Bottom Navigation (Floating Pill) */}
      <div className="fixed bottom-4 inset-x-0 px-4 flex justify-center z-40 pointer-events-none">
        <nav className="relative flex items-center justify-between bg-[#1e1e1f]/95 backdrop-blur-xl border border-[#333538] py-1.5 px-3 rounded-full shadow-2xl w-full max-w-[480px] pointer-events-auto ring-1 ring-black/20">
          {[
            { id: 'chat', icon: MessageSquare, label: 'Chat' },
            { id: 'preview', icon: Layout, label: 'Canvas' },
            { id: 'code', icon: Terminal, label: 'Código', dot: hasFiles },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={cn(
                "relative flex flex-col items-center justify-center p-2 min-w-[56px] gap-1 transition-colors z-10",
                activeTab === item.id ? "text-white" : "text-[#8e918f] hover:text-[#f1f3f4]"
              )}
            >
              {activeTab === item.id && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  className="absolute inset-0 bg-[#a8c7fa]/20 rounded-full -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <div className="relative">
                <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} className={cn(activeTab === item.id ? "text-[#a8c7fa]" : "")} />
                {item.id === 'code' && item.dot && <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2 rounded-full bg-[#a8c7fa] border-2 border-[#1e1e1f]" />}
              </div>
              <span className="text-[10px] font-medium tracking-wide leading-none">{item.label}</span>
            </button>
          ))}

          <div className="w-[1px] h-6 bg-[#333538] mx-1 z-10"></div>

          <div className="flex items-center">
            <button
              onClick={() => {
                setActiveTab('settings');
                setSettingsTab('overview');
              }}
              className={cn(
                "relative flex flex-col items-center justify-center p-2 min-w-[56px] gap-1 transition-colors z-10",
                activeTab === 'settings' ? "text-white" : "text-[#8e918f] hover:text-[#f1f3f4]"
              )}
            >
              {activeTab === 'settings' && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  className="absolute inset-0 bg-[#a8c7fa]/20 rounded-full -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <div className="relative">
                <Settings size={20} strokeWidth={activeTab === 'settings' ? 2.5 : 2} className={cn(activeTab === 'settings' ? "text-[#a8c7fa] rotate-45 transition-transform duration-500" : "")} />
              </div>
              <span className="text-[10px] font-medium tracking-wide leading-none">Ajustes</span>
            </button>

            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="relative flex flex-col items-center justify-center p-2 min-w-[64px] gap-1 text-[#8e918f] hover:text-[#f1f3f4] transition-colors z-10 group"
            >
              <HistoryIcon size={20} className="group-hover:-rotate-12 transition-transform duration-300" strokeWidth={2} />
              <span className="text-[10px] font-medium tracking-wide leading-none">Histórico</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Settings Section */}
      {activeTab === 'settings' && (
          <div className="flex-1 flex flex-col bg-[#09090b] overflow-hidden animate-in fade-in duration-500 font-sans">
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="max-w-3xl mx-auto px-6 py-10 pb-[120px]">
                  {settingsTab === 'overview' && (
                    <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
                      <div className="space-y-1.5 text-center px-4">
                        <h2 className="text-[18px] font-black text-white uppercase tracking-[0.3em]">Console de Orquestração</h2>
                        <p className="text-[#8e918f] text-[10px] uppercase font-bold tracking-[0.4em]">Configuração de modelos, agentes e protocolos</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
                        {[
                          { id: 'general', title: 'Motor', desc: 'Conectividade', icon: Key, color: 'text-blue-400', border: 'hover:border-blue-500/20' },
                          { id: 'agent', title: 'Identidade', desc: 'Comportamento', icon: Brain, color: 'text-purple-400', border: 'hover:border-purple-500/20' },
                          { id: 'security', title: 'Segurança', desc: 'Privacidade', icon: Shield, color: 'text-emerald-400', border: 'hover:border-emerald-500/20' }
                        ].map((card) => (
                          <button
                            key={card.id}
                            onClick={() => setSettingsTab(card.id as any)}
                            className={cn(
                              "group p-3.5 rounded-xl border border-white/5 transition-all duration-300 text-left flex items-center gap-3.5 bg-white/[0.01] hover:bg-white/[0.03] active:scale-[0.98]",
                              card.border
                            )}
                          >
                            <div className={cn("w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg bg-white/[0.02] border border-white/5 transition-all duration-300 group-hover:scale-105", card.color)}>
                              <card.icon size={13} />
                            </div>
                            <div className="flex-1 space-y-0.5">
                              <div className="flex items-center justify-between">
                                <h3 className="text-[10.5px] font-black text-white uppercase tracking-[0.12em] leading-none">{card.title}</h3>
                                <ArrowUp size={7} className="rotate-45 text-white/10 group-hover:text-white/40 transition-colors" />
                              </div>
                              <p className="text-[#8e918f] text-[8.5px] uppercase font-bold tracking-tight">{card.desc}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {settingsTab === 'general' && (
                    <div className="space-y-8 animate-in fade-in duration-400">
                      <button onClick={() => setSettingsTab('overview')} className="flex items-center gap-2 text-[#8e918f] hover:text-white text-[11px] font-black uppercase tracking-widest group transition-colors">
                        <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
                        VOLTAR
                      </button>
                      <div className="space-y-8">
                        <div className="space-y-4">
                          <div className="space-y-1 border-l border-white/10 pl-4">
                             <h3 className="text-[13px] font-black text-white uppercase tracking-widest">Motor IA</h3>
                             <p className="text-[10px] text-[#8e918f] uppercase tracking-widest font-bold">Configuração básica</p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/[0.01] p-4 rounded-xl border border-white/5">
                            <div className="space-y-3">
                              <div className="space-y-1.5">
                                <label className="text-[12px] font-black text-[#8e918f] uppercase tracking-widest px-1">API Key</label>
                                <Input type="password" value={draftApiKey} onChange={(e) => setDraftApiKey(e.target.value)} placeholder="Chave de acesso..." className="bg-white/[0.02] border-white/10 rounded-lg h-9 px-3 text-[12px] focus-visible:ring-1 focus-visible:ring-blue-500/30 focus-visible:border-blue-500/50 transition-all" />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[12px] font-black text-[#8e918f] uppercase tracking-widest px-1">Modelo</label>
                                <Select value={draftSelectedModel} onValueChange={(val) => val && setDraftSelectedModel(val)}>
                                  <SelectTrigger className="bg-white/[0.02] border-white/10 text-[#f1f3f4] h-9 text-[12px] rounded-lg px-3 focus:ring-1 focus:ring-blue-500/30"><SelectValue /></SelectTrigger>
                                  <SelectContent className="bg-[#1a1b1e] border-white/10 text-[#f1f3f4] rounded-lg shadow-2xl">
                                    <SelectItem value="gemini-3-flash-preview">Gemini 3 Flash</SelectItem>
                                    <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
                                    <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="space-y-6 py-1">
                              <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                  <label className="text-[12px] font-black text-[#8e918f] uppercase tracking-widest">Criatividade</label>
                                  <span className="text-[11px] font-mono font-bold text-blue-400 tracking-widest bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">{draftTemperature}</span>
                                </div>
                                <div className="space-y-2">
                                  <input type="range" min="0" max="1.5" step="0.1" value={draftTemperature} onChange={(e) => setDraftTemperature(parseFloat(e.target.value))} className="w-full h-1 bg-white/5 rounded-full appearance-none cursor-pointer accent-blue-500 transition-all hover:accent-blue-400" />
                                  <div className="flex justify-between text-[8px] font-black text-[#5f6368] uppercase tracking-widest"><span>Precisão</span><span>Criatividade</span></div>
                                </div>
                              </div>
                              <div className="space-y-1 mt-2">
                                <p className="text-[10px] text-white/50 leading-tight uppercase font-bold tracking-tight">Controle de Variação de Resposta</p>
                                <p className="text-[10px] text-[#5f6368] leading-tight uppercase font-bold opacity-80">Alterne entre o rigor de códigos técnicos (0.0) e a fluidez de escrita criativa (1.0+).</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-6">
                          <div className="flex items-center justify-between border-b border-white/10 pb-3">
                             <div className="space-y-0.5"><h3 className="text-[13px] font-black text-white uppercase tracking-widest">Biblioteca Local</h3><p className="text-[10px] text-[#5f6368] font-bold uppercase tracking-widest">Endpoints pré-configurados</p></div>
                             <button onClick={() => { setEditingPreset(null); setPresetForm({ model: draftSelectedModel, apiKey: draftApiKey }); setIsPresetFormOpen(true); }} className="text-[10px] font-black text-white hover:opacity-70 transition-all border border-white/20 px-3 py-1.5 rounded uppercase tracking-widest">Novo Preset</button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {apiPresets.map((preset) => (
                              <div key={preset.id} onClick={() => setDraftActivePresetId(preset.id)} className={cn("group py-3 px-1 transition-all cursor-pointer flex flex-col gap-1 relative", draftActivePresetId === preset.id ? "border-l-2 border-white opacity-100 pl-3" : "border-l-2 border-transparent opacity-30 hover:opacity-100 hover:pl-3 transition-all")}>
                                <span className="text-[11px] font-black text-white uppercase tracking-wider">{preset.name}</span>
                                <span className="text-[9px] text-[#5f6368] font-mono tracking-tighter truncate uppercase">{preset.model}</span>
                                <div className="absolute top-3 right-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={(e) => { e.stopPropagation(); setEditingPreset(preset); setPresetForm(preset); setIsPresetFormOpen(true); }} className="hover:text-white text-[#5f6368]"><Edit2 size={12} /></button>
                                  <button onClick={(e) => deletePreset(preset.id, e)} className="hover:text-red-400 text-[#5f6368]"><Trash2 size={12} /></button>
                                </div>
                              </div>
                            ))}
                          </div>
                          {isPresetFormOpen && (
                            <div className="border-t border-white/5 pt-8 animate-in slide-in-from-top-2 duration-300">
                               <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                                 <div className="space-y-6">
                                   <div className="space-y-2"><label className="text-[9px] font-black text-[#5f6368] uppercase tracking-widest px-1">Identificação</label><Input placeholder="Nome da Instância" value={presetForm.name || ''} onChange={(e) => setPresetForm({ ...presetForm, name: e.target.value })} className="bg-transparent border-0 border-b border-white/10 rounded-none h-8 text-[11px] focus-visible:ring-0 focus-visible:border-white/30" /></div>
                                   <div className="space-y-2"><label className="text-[9px] font-black text-[#5f6368] uppercase tracking-widest px-1">API Key</label><Input type="password" placeholder="••••••••" value={presetForm.apiKey || ''} onChange={(e) => setPresetForm({ ...presetForm, apiKey: e.target.value })} className="bg-transparent border-0 border-b border-white/10 rounded-none h-8 text-[11px] focus-visible:ring-0 focus-visible:border-white/30" /></div>
                                 </div>
                                 <div className="flex items-end justify-end gap-8 mb-2">
                                   <button onClick={() => setIsPresetFormOpen(false)} className="text-[10px] font-black text-[#8e918f] hover:text-white uppercase tracking-widest">Descartar</button>
                                   <button onClick={addOrUpdatePreset} className="text-[10px] font-black text-white hover:bg-white hover:text-black transition-all uppercase tracking-widest border border-white/20 px-8 py-2 rounded">Gravar</button>
                                 </div>
                               </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {settingsTab === 'agent' && (
                    <div className="space-y-6 animate-in fade-in duration-400">
                      <button onClick={() => setSettingsTab('overview')} className="flex items-center gap-2 text-[#8e918f] hover:text-white text-[11px] font-black uppercase tracking-widest group transition-colors"><ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />VOLTAR</button>
                      <div className="space-y-8">
                        <div className="space-y-6">
                          <div className="flex items-center justify-between border-l border-white/10 pl-4">
                             <div className="space-y-0.5"><h3 className="text-[13px] font-black text-white uppercase tracking-widest">Identidade</h3><p className="text-[11px] text-[#8e918f] font-bold uppercase tracking-widest">Perfis configurados</p></div>
                             <button onClick={() => { setEditingAgent(null); setAgentForm({ iconName: 'Brain', color: 'bg-zinc-700' }); setIsAgentFormOpen(true); }} className="text-[10px] font-black text-white hover:opacity-70 transition-all border border-white/20 px-3 py-1.5 rounded-lg uppercase tracking-widest">NOVO</button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 px-1">
                            {allAgents.map(agent => {
                              const isDefault = AGENTS.some(a => a.id === agent.id);
                              const isSelected = draftActiveAgentId === agent.id;
                              return (
                                <div key={agent.id} onClick={() => { setDraftActiveAgentId(agent.id); setDraftSystemPrompt(agent.systemPrompt); }} className={cn("transition-all cursor-pointer flex items-center gap-3 group relative py-1.5", isSelected ? "opacity-100 pl-2 border-l border-blue-500" : "opacity-40 hover:opacity-100 hover:pl-2 border-l border-transparent transition-all")}>
                                  <div className={cn("w-7 h-7 rounded flex items-center justify-center text-white shrink-0 transition-all", isSelected ? "bg-white text-black" : "bg-white/[0.05] text-[#5f6368] border border-white/5")}>
                                       {agent.iconName === 'Hexagon' && <Hexagon size={12} />}{agent.iconName === 'Brain' && <Brain size={12} />}{agent.iconName === 'Sparkles' && <Sparkles size={12} />}{agent.iconName === 'Shield' && <Shield size={12} />}{agent.iconName === 'Terminal' && <Terminal size={12} />}{agent.iconName === 'Activity' && <Activity size={12} />}{agent.iconName === 'Users' && <Users size={12} />}
                                       {(!agent.iconName || !['Hexagon', 'Brain', 'Sparkles', 'Shield', 'Terminal', 'Activity', 'Users'].includes(agent.iconName)) && <MessageSquare size={12} />}
                                  </div>
                                  <div className="flex-1 min-w-0"><p className="text-[11px] font-black text-white uppercase tracking-wider truncate leading-tight">{agent.name}</p><p className="text-[8px] text-[#5f6368] font-bold uppercase tracking-widest leading-tight">{isDefault ? 'CORE' : 'CUSTOM'}</p></div>
                                  {!isDefault && (
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={(e) => { e.stopPropagation(); setEditingAgent(agent); setAgentForm(agent); setIsAgentFormOpen(true); }} className="hover:text-white text-[#5f6368]"><Edit2 size={10} /></button>
                                      <button onClick={(e) => { e.stopPropagation(); deleteAgent(agent.id); }} className="hover:text-red-400 text-[#5f6368]"><Trash2 size={10} /></button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        <div className="space-y-5">
                          <div className="space-y-1 border-l border-white/10 pl-4"><h3 className="text-[13px] font-black text-white uppercase tracking-widest">Procedimentos</h3><p className="text-[10px] text-[#8e918f] font-bold uppercase tracking-widest">Diretrizes de base do sistema</p></div>
                          <div className="relative group">
                            <Textarea value={draftSystemPrompt} onChange={(e) => setDraftSystemPrompt(e.target.value)} className="bg-white/[0.01] border border-white/5 focus:border-blue-500/50 min-h-[120px] text-[#f1f3f4] rounded-xl font-mono text-[11px] p-4 leading-relaxed resize-none shadow-none focus-visible:ring-1 focus-visible:ring-blue-500/20 transition-all scrollbar-hide" placeholder="Defina as diretrizes fundamentais..." />
                            <div className="absolute top-3 right-3 flex items-center gap-1.5 text-[8px] font-black text-[#5f6368] uppercase tracking-widest select-none pointer-events-none group-focus-within:text-blue-400 transition-colors"><div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />MODO_IA</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {settingsTab === 'security' && (
                    <div className="space-y-6 animate-in fade-in duration-400">
                      <button onClick={() => setSettingsTab('overview')} className="flex items-center gap-2 text-[#8e918f] hover:text-white text-[11px] font-black uppercase tracking-widest group transition-colors"><ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />VOLTAR</button>
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <div className="space-y-1 border-l border-white/10 pl-4"><h3 className="text-[13px] font-black text-white uppercase tracking-widest">Privacidade</h3><p className="text-[11px] text-[#8e918f] font-bold uppercase tracking-widest">Dados e sigilo</p></div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-1">
                            {[
                              { title: 'Offline-First', desc: 'Dados e logs confinados ao armazenamento local seguro do seu navegador.', icon: Shield, color: 'text-blue-400' },
                              { title: 'Criptografia', desc: 'Comunicação com os motores Gemini utiliza TLS 1.3 para blindagem total.', icon: Key, color: 'text-blue-400' },
                              { title: 'Zero Telemetria', desc: 'Sem rastreamento, sem telemetria e sem scripts de terceiros.', icon: Activity, color: 'text-blue-400' },
                              { title: 'Expurgo', desc: 'Ao resetar, ocorre uma aniquilação completa de todas as chaves e memórias.', icon: Trash2, color: 'text-blue-400' }
                            ].map((item, i) => (
                              <div key={i} className="space-y-2 group bg-white/[0.01] p-4 rounded-xl border border-white/5 hover:bg-white/[0.02] transition-colors"><div className="flex items-center gap-2"><div className={cn("w-7 h-7 flex items-center justify-center rounded bg-white/[0.03] border border-white/5 transition-transform", item.color)}><item.icon size={12} /></div><h4 className="text-[12px] font-black text-white uppercase tracking-widest leading-none">{item.title}</h4></div><p className="text-[11px] text-[#5f6368] leading-tight uppercase font-bold tracking-tight group-hover:text-[#8e918f] transition-colors">{item.desc}</p></div>
                            ))}
                          </div>
                        </div>
                        <div className="pt-6 border-t border-white/5">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-5 py-6 bg-red-500/[0.02] rounded-2xl border border-red-500/10 shadow-xl shadow-red-500/5">
                            <div className="space-y-1"><h4 className="text-[14px] font-black text-red-500 uppercase tracking-widest">Célula de Expurgo</h4><p className="text-[11px] text-[#5f6368] leading-tight uppercase font-bold max-w-sm">Elimina chaves, presets e histórico sem deixar rastros digitais locais.</p></div>
                            <button onClick={() => { if(confirm('Terminar permanentemente todas as configurações locais?')) { setChatHistory([]); resetChat(); setApiKey(''); setApiPresets([]); setActivePresetId(null); localStorage.clear(); window.location.reload(); } }} className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-all text-[11px] font-black uppercase tracking-widest px-8 py-2.5 rounded-lg border border-red-500/20 whitespace-nowrap">Resetar Nexus</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {hasSettingsChanges && (
                <div className="absolute bottom-20 inset-x-4 flex justify-center z-50 pointer-events-none">
                  <div className="bg-[#1a1b1e]/95 backdrop-blur-xl border border-blue-500/30 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 w-full max-w-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-auto">
                    <div className="flex items-center gap-2 text-[12px] text-[#8e918f]">
                      <Activity size={14} className="text-blue-400 animate-pulse" />
                      <span>Nexus Engine: Há modificações pendentes</span>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <Button variant="ghost" onClick={() => setActiveTab('chat')} className="flex-1 md:flex-none text-[#8e918f] hover:text-white">Cancelar</Button>
                      <Button onClick={saveSettings} className="flex-1 md:flex-none font-bold px-8 h-10 rounded-xl bg-[#c2e7ff] text-[#001d35] hover:bg-[#b5cffb]">Salvar Alterações</Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Subagent Editor Dialog */}
      <Dialog open={isAgentFormOpen} onOpenChange={setIsAgentFormOpen}>
        <DialogContent className="max-w-md bg-[#1a1b1e] border-[#333538] text-[#f1f3f4] p-6 rounded-2xl shadow-2xl z-[101]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingAgent ? <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400"><Edit2 size={18} /></div> : <div className="p-1.5 rounded-lg bg-green-500/10 text-green-400"><Plus size={18} /></div>}
              <span>{editingAgent ? 'Editar Subagente' : 'Novo Subagente'}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
             {/* Name */}
             <div className="space-y-2">
               <label className="text-[11px] font-bold text-[#c4c7c5] uppercase tracking-widest pl-1">Nome do Agente</label>
               <Input 
                 value={agentForm.name || ''}
                 onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })}
                 className="bg-transparent border-[#333538] focus-visible:border-[#a8c7fa]/50 text-[#f1f3f4] rounded-xl h-11"
                 placeholder="Ex: Especialista em Python"
               />
             </div>
             {/* Description */}
             <div className="space-y-2">
               <label className="text-[11px] font-bold text-[#c4c7c5] uppercase tracking-widest pl-1">Descrição Curta</label>
               <Input 
                 value={agentForm.shortDescription || ''}
                 onChange={(e) => setAgentForm({ ...agentForm, shortDescription: e.target.value })}
                 className="bg-transparent border-[#333538] focus-visible:border-[#a8c7fa]/50 text-[#f1f3f4] rounded-xl h-11"
                 placeholder="Ex: Ajuda com scripts e automação"
               />
             </div>
             {/* System Prompt */}
             <div className="space-y-2">
               <label className="text-[11px] font-bold text-[#c4c7c5] uppercase tracking-widest pl-1">Instruções de Sistema</label>
               <Textarea 
                 value={agentForm.systemPrompt || ''}
                 onChange={(e) => setAgentForm({ ...agentForm, systemPrompt: e.target.value })}
                 className="bg-[#131314] border-[#333538] focus-visible:border-[#a8c7fa]/50 text-[#f1f3f4] min-h-[140px] rounded-xl resize-none font-mono text-[13px] leading-relaxed p-4"
                 placeholder="Defina o comportamento e diretrizes deste agente..."
               />
             </div>

             {/* Icon and Color Selection */}
             <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-1 space-y-2">
                  <label className="text-[11px] font-bold text-[#c4c7c5] uppercase tracking-widest pl-1">Ícone</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                     {['Brain', 'Sparkles', 'Shield', 'Terminal', 'Activity', 'Users'].map(icon => (
                       <button 
                         key={icon}
                         type="button"
                         onClick={() => setAgentForm({ ...agentForm, iconName: icon })}
                         className={cn(
                           "p-2.5 rounded-xl border transition-all",
                           agentForm.iconName === icon ? "bg-[#a8c7fa]/20 border-[#a8c7fa] text-[#a8c7fa] scale-105" : "border-[#333538] text-[#8e918f] hover:bg-white/5"
                         )}
                       >
                         {icon === 'Brain' && <Brain size={18} />}
                         {icon === 'Sparkles' && <Sparkles size={18} />}
                         {icon === 'Shield' && <Shield size={18} />}
                         {icon === 'Terminal' && <Terminal size={18} />}
                         {icon === 'Activity' && <Activity size={18} />}
                         {icon === 'Users' && <Users size={18} />}
                       </button>
                     ))}
                  </div>
                </div>

                <div className="flex-1 space-y-2">
                  <label className="text-[11px] font-bold text-[#c4c7c5] uppercase tracking-widest pl-1">Cor Base</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                     {['bg-purple-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'].map(color => (
                       <button 
                         key={color}
                         type="button"
                         onClick={() => setAgentForm({ ...agentForm, color })}
                         className={cn(
                           "w-9 h-9 rounded-xl border-2 transition-all p-0",
                           color,
                           agentForm.color === color ? "border-white scale-110 shadow-lg" : "border-transparent opacity-60 hover:opacity-100"
                         )}
                       />
                     ))}
                  </div>
                </div>
             </div>

             <div className="flex justify-end gap-3 pt-6 border-t border-[#333538]">
                <Button 
                  type="button"
                  variant="ghost" 
                  onClick={() => setIsAgentFormOpen(false)} 
                  className="text-[#8e918f] hover:text-white hover:bg-white/5 h-11 px-6 rounded-xl font-medium"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={addOrUpdateAgent}
                  className="bg-[#a8c7fa] hover:brightness-110 text-[#001d35] font-bold h-11 px-8 rounded-xl shadow-lg shadow-blue-500/20"
                  disabled={!agentForm.name || !agentForm.systemPrompt}
                >
                  {editingAgent ? 'Salvar Alterações' : 'Criar Subagente'}
                </Button>
             </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Dynamic styles injected specifically for syntax highlight & markdown format */}
      <style>{`
        .markdown-prose p { margin-bottom: 0.75rem; color: #e3e3e3; }
        .markdown-prose p:last-child { margin-bottom: 0; }
        .markdown-prose code { 
          background: #282a2d; 
          padding: 0.15rem 0.35rem; 
          border-radius: 0.3rem; 
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.9em; 
          color: #f1f3f4;
          border: 1px solid #333538;
        }
        .markdown-prose blockquote {
          border-left: 3px solid #a8c7fa/40;
          padding-left: 1rem;
          font-style: italic;
          color: #8e918f;
          margin: 1rem 0;
        }
        .markdown-prose h1, .markdown-prose h2, .markdown-prose h3 { font-weight: 500; margin-top: 1.25rem; margin-bottom: 0.75rem; color: #f1f3f4; }
        .markdown-prose h1 { font-size: 1.25em; }
        .markdown-prose h2 { font-size: 1.15em; border-bottom: 1px solid #333538; padding-bottom: 0.35em; }
        .markdown-prose h3 { font-size: 1.05em; }
        .markdown-prose ul { list-style-type: none; padding-left: 1rem; margin-bottom: 0.75rem; }
        .markdown-prose ul li { position: relative; margin-bottom: 0.25rem; }
        .markdown-prose ul li::before {
          content: "";
          position: absolute;
          left: -0.75rem;
          top: 0.55rem;
          height: 0.3rem;
          width: 0.3rem;
          border-radius: 50%;
          background-color: #a8c7fa;
        }
        .markdown-prose ol { list-style-type: decimal; padding-left: 1rem; margin-bottom: 0.75rem; color: #e3e3e3; }
        .markdown-prose ol li { margin-bottom: 0.25rem; }
        .markdown-prose a { color: #a8c7fa; text-decoration: none; transition: color 0.2s ease; }
        .markdown-prose a:hover { text-decoration: underline; color: #d3e3fd; }
        
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333538; border-radius: 4px; border: 2px solid #131314; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #5f6368; }
        .custom-scrollbar::-webkit-scrollbar-corner { background: transparent; }
      `}</style>
    </div>
  );
}