import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Loader2, ArrowUp, Settings, Key,
  Paperclip, Image as ImageIcon, Zap, Code, Terminal, Layout, Hexagon,
  Menu, Plus, MessageSquare, Trash2, X, ChevronDown, ChevronUp
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'motion/react';

import { AGENTS, defaultWelcomeMessage } from './agents';
import { cn } from './lib/utils';
import { Button } from './components/ui/button';
import { Textarea } from './components/ui/textarea';
import { Input } from './components/ui/input';
import { Avatar, AvatarFallback } from './components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './components/ui/dialog';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';

export type Message = {
  id: string;
  role: 'user' | 'model';
  content: string;
};

export type ChatSession = {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
};

export default function App() {
  const activeAgent = AGENTS[0];
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
  const [activeTab, setActiveTab] = useState<'chat' | 'preview' | 'code'>('chat');
  const [showSettings, setShowSettings] = useState(false);
  const [isSystemPromptOpen, setIsSystemPromptOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-1.5-flash');
  const [temperature, setTemperature] = useState<number>(0.7);
  const [systemPrompt, setSystemPrompt] = useState(activeAgent.systemPrompt);

  // Draft states for settings modal
  const [draftApiKey, setDraftApiKey] = useState(apiKey);
  const [draftSelectedModel, setDraftSelectedModel] = useState(selectedModel);
  const [draftTemperature, setDraftTemperature] = useState(temperature);
  const [draftSystemPrompt, setDraftSystemPrompt] = useState(systemPrompt);

  const hasSettingsChanges = useMemo(() => {
    return draftApiKey !== apiKey || 
           draftSelectedModel !== selectedModel || 
           draftTemperature !== temperature || 
           draftSystemPrompt !== systemPrompt;
  }, [apiKey, selectedModel, temperature, systemPrompt, draftApiKey, draftSelectedModel, draftTemperature, draftSystemPrompt]);

  // Sync draft states when opening modal
  useEffect(() => {
    if (showSettings) {
      setDraftApiKey(apiKey);
      setDraftSelectedModel(selectedModel);
      setDraftTemperature(temperature);
      setDraftSystemPrompt(systemPrompt);
    }
  }, [showSettings]);

  const saveSettings = () => {
    setApiKey(draftApiKey);
    setSelectedModel(draftSelectedModel);
    setTemperature(draftTemperature);
    setSystemPrompt(draftSystemPrompt);
    setShowSettings(false);
  };
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const resetChat = () => {
    setCurrentChatId(crypto.randomUUID());
    setMessages([
      {
        id: crypto.randomUUID(),
        role: 'model',
        content: defaultWelcomeMessage
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
      id: crypto.randomUUID(),
      role: 'user',
      content: finalMessage || 'Veja os arquivos anexos.'
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputMessage('');
    setAttachedFiles([]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          systemPrompt: systemPrompt,
          temperature: temperature,
          agentId: activeAgent.id,
          apiKey: apiKey,
          model: selectedModel
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned ${res.status}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      
      let fullResponse = "";
      const messageId = crypto.randomUUID();

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
                  chatHistory.sort((a, b) => b.updatedAt - a.updatedAt).map(chat => (
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header - AI Studio Style */}
      <header className="h-[64px] min-h-[64px] py-1 flex items-center justify-between px-4 md:px-6 bg-[#131314] flex-shrink-0 border-b border-[#333538] relative z-[60]">
        <div className="flex items-center gap-3 group">
          <div className="flex items-center justify-center w-[36px] h-[36px] rounded-xl bg-gradient-to-tr from-[#00d2ff] to-[#3a7bd5] text-white shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow overflow-hidden">
            <Hexagon size={18} strokeWidth={2.5} className="text-white relative z-10" />
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <h1 className="text-[20px] font-medium text-[#f1f3f4] tracking-tight flex items-center">
            Nexus <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00d2ff] to-[#3a7bd5] ml-1.5">IA</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Menu Button Moved to Right */}
          <button 
            className="p-2 text-zinc-400 hover:text-white hover:bg-[#333538]/50 rounded-lg transition-colors"
            onClick={() => setIsSidebarOpen(true)}
            title="Menu"
          >
            <Menu size={20} />
          </button>

          {/* Top Header Actions (Desktop) */}
          <div className="hidden md:flex">
            <button
               className="p-2 hover:bg-[#333538]/50 hover:text-white rounded-lg transition-colors text-zinc-400"
               onClick={() => setShowSettings(true)}
               title="Ajustes"
             >
               <Settings size={18} strokeWidth={2} />
             </button>
          </div>
        </div>
      </header>


      {/* Main Workspace */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative min-h-0">
        
        {/* Chat / Prompt Section */}
        <div className={cn(
          "flex flex-col flex-1 bg-[#131314] border-r border-[#333538] min-h-0",
          activeTab !== 'chat' && "hidden md:flex"
        )}>
          {/* Chat Log */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-5 py-4 space-y-5 scroll-smooth custom-scrollbar"
          >
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
                      <Avatar className="w-6 h-6 rounded-md bg-gradient-to-tr from-[#00d2ff] to-[#3a7bd5] shrink-0 mt-0.5">
                         <AvatarFallback className="bg-transparent text-white">
                           <Hexagon size={14} strokeWidth={2.5} className="text-white" />
                         </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-[14px] leading-[1.6] text-[#e3e3e3] pr-4">
                        <div className="markdown-prose">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
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
                 <Avatar className="w-6 h-6 rounded-md bg-gradient-to-tr from-[#00d2ff] to-[#3a7bd5] shrink-0 mt-0.5">
                   <AvatarFallback className="bg-transparent text-white">
                     <Hexagon size={14} strokeWidth={2.5} className="text-white" />
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
          activeTab === 'chat' && "hidden md:flex"
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
              backgroundColor: '#131314',
              backgroundImage: 'radial-gradient(#333538 1px, transparent 1px)', 
              backgroundSize: '24px 24px' 
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
                    <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full" />
                    <div className="w-20 h-20 rounded-3xl bg-[#1e1f20] border border-[#333538] shadow-2xl flex items-center justify-center relative shadow-[0_0_40px_rgba(40,40,40,0.5)]">
                      <Layout size={32} className="text-[#a8c7fa]" strokeWidth={1.5} />
                    </div>
                  </div>
                  <p className="text-[18px] font-semibold text-[#f1f3f4] tracking-tight">O Canvas está vazio</p>
                  <p className="text-[14px] mt-2 text-[#8e918f] max-w-[280px] text-center leading-relaxed">
                    Comece a desenvolver descrevendo o que deseja construir no chat.
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
              <div className="absolute inset-0 z-20 bg-[#131314] overflow-auto p-4 md:p-6 custom-scrollbar flex flex-col gap-6">
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
                      <span className="bg-[#333538] px-2 py-0.5 rounded-md text-[#a8c7fa] font-bold text-[10px] tracking-wider uppercase">{file.lang}</span>
                    </div>
                    <pre className="text-[#e3e3e3] text-[13px] font-mono whitespace-pre-wrap break-all p-6 leading-relaxed bg-[#1e1f20] selection:bg-[#a8c7fa]/30">
                      <code>{file.code}</code>
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </main>


      {/* Modern Global Mobile Bottom Navigation (Floating Pill) */}
      <div className="md:hidden fixed bottom-4 inset-x-0 px-4 flex justify-center z-40 pointer-events-none">
        <nav className="relative flex items-center justify-between bg-[#1e1e1f]/95 backdrop-blur-xl border border-[#333538] py-1.5 px-2 rounded-full shadow-2xl w-full max-w-[320px] pointer-events-auto ring-1 ring-black/20">
          {[
            { id: 'chat', icon: MessageSquare, label: 'Chat' },
            { id: 'preview', icon: Layout, label: 'Canvas' },
            { id: 'code', icon: Terminal, label: 'Código', dot: hasFiles }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={cn(
                "relative flex flex-col items-center justify-center p-2 min-w-[64px] gap-1 transition-colors z-10",
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
                <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} className={activeTab === item.id ? "text-[#a8c7fa]" : ""} />
                {item.dot && <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2 rounded-full bg-[#a8c7fa] border-2 border-[#1e1e1f]" />}
              </div>
              <span className="text-[10px] font-medium tracking-wide leading-none">{item.label}</span>
            </button>
          ))}

          <div className="w-[1px] h-6 bg-[#333538] mx-1 z-10"></div>

          <button 
            onClick={() => setShowSettings(true)}
            className="relative flex flex-col items-center justify-center p-2 min-w-[64px] gap-1 text-[#8e918f] hover:text-[#f1f3f4] transition-colors z-10 group"
          >
            <Settings size={20} className="group-hover:rotate-45 transition-transform duration-300" strokeWidth={2} />
            <span className="text-[10px] font-medium tracking-wide leading-none">Ajustes</span>
          </button>
        </nav>
      </div>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent showCloseButton={false} className="fixed inset-0 !max-w-none !w-full !h-[100dvh] !translate-x-0 !translate-y-0 !top-0 !left-0 m-0 !rounded-none bg-[#131314] border-0 text-[#f1f3f4] p-0 overflow-hidden shadow-none z-[100] flex flex-col">
          <DialogHeader className="bg-[#1a1b1e] px-4 md:px-8 py-5 border-b border-[#333538] flex-shrink-0 flex flex-row items-center justify-between">
            <DialogTitle className="flex items-center gap-3 text-xl font-medium text-[#f1f3f4] m-0">
              <Settings size={22} className="text-[#a8c7fa] animate-[spin_4s_linear_infinite]" />
              <span className="truncate">Configurações</span>
            </DialogTitle>
            <button 
              onClick={() => setShowSettings(false)}
              className="p-2 -mr-2 md:mr-0 hover:bg-[#333538] rounded-full text-[#8e918f] transition-colors shrink-0"
              aria-label="Fechar configurações"
            >
              <X size={20} />
            </button>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
            <div className="max-w-3xl mx-auto space-y-12 pb-12">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Connection Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-[#333538]">
                    <Key size={18} className="text-[#a8c7fa]" />
                    <h3 className="text-[15px] font-medium text-white uppercase tracking-[0.05em]">Conexão</h3>
                  </div>
                  <div className="space-y-4">
                    <p className="text-[13px] text-[#8e918f] leading-relaxed">
                      Sua chave de API é armazenada localmente no navegador.
                    </p>
                    <div className="space-y-2">
                       <label className="text-[11px] font-bold text-[#c4c7c5] uppercase tracking-widest pl-1">
                        API Key (Gemini)
                      </label>
                      <Input
                        type="password"
                        value={draftApiKey}
                        onChange={(e) => setDraftApiKey(e.target.value)}
                        placeholder="Insira sua chave..."
                        className="bg-transparent border-[#333538] focus-visible:border-[#a8c7fa]/50 focus-visible:ring-0 text-[#f1f3f4] h-10 rounded-lg px-3"
                      />
                    </div>
                  </div>
                </div>

                {/* Engine Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-[#333538]">
                    <Zap size={18} className="text-[#a8c7fa]" />
                    <h3 className="text-[15px] font-medium text-white uppercase tracking-[0.05em]">Motor IA</h3>
                  </div>
                  
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-[#c4c7c5] uppercase tracking-widest pl-1">
                        Modelo Ativo
                      </label>
                      <Select 
                        value={draftSelectedModel} 
                        onValueChange={(val) => {
                          if (val) {
                            console.log('Selecionando modelo:', val);
                            setDraftSelectedModel(val);
                          }
                        }}
                      >
                        <SelectTrigger className="w-full bg-transparent border-[#333538] focus-visible:border-[#a8c7fa]/50 focus-visible:ring-0 text-[#f1f3f4] h-10 rounded-lg">
                          <SelectValue placeholder="Modelo" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1b1e] border-[#333538] text-[#f1f3f4] rounded-lg shadow-2xl z-[300]">
                          <SelectGroup>
                            <SelectItem value="gemini-2.0-flash" className="focus:bg-[#282a2d] focus:text-white py-2 cursor-pointer">Gemini 2.0 Flash</SelectItem>
                            <SelectItem value="gemini-1.5-pro" className="focus:bg-[#282a2d] focus:text-white py-2 cursor-pointer">Gemini 1.5 Pro</SelectItem>
                            <SelectItem value="gemini-1.5-flash" className="focus:bg-[#282a2d] focus:text-white py-2 cursor-pointer">Gemini 1.5 Flash</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-[11px] font-bold text-[#c4c7c5] uppercase tracking-widest">
                          Temperatura
                        </label>
                        <span className="text-[12px] text-[#a8c7fa] font-mono font-medium">{draftTemperature.toFixed(1)}</span>
                      </div>
                      <div className="flex flex-col gap-4">
                        <div className="relative flex items-center gap-4 h-6">
                           <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-full" />
                          <input 
                            type="range" 
                            min="0" 
                            max="1" 
                            step="0.1" 
                            value={draftTemperature}
                            onChange={(e) => setDraftTemperature(parseFloat(e.target.value))}
                            className="relative w-full accent-[#a8c7fa] h-1 bg-transparent rounded-full appearance-none cursor-pointer z-10"
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-[#8e918f] font-medium uppercase tracking-wider px-0.5">
                          <button 
                            onClick={() => setDraftTemperature(0)}
                            className={cn("hover:text-[#a8c7fa] transition-colors", draftTemperature === 0 && "text-[#a8c7fa]")}
                          >
                            Preciso
                          </button>
                          <button 
                            onClick={() => setDraftTemperature(0.5)}
                            className={cn("hover:text-[#a8c7fa] transition-colors", draftTemperature === 0.5 && "text-[#a8c7fa]")}
                          >
                            Equilibrado
                          </button>
                          <button 
                            onClick={() => setDraftTemperature(1)}
                            className={cn("hover:text-[#a8c7fa] transition-colors", draftTemperature === 1 && "text-[#a8c7fa]")}
                          >
                            Criativo
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Advanced Section - Accordion */}
              <div className="border-t border-[#333538] pt-8">
                <button 
                  onClick={() => setIsSystemPromptOpen(!isSystemPromptOpen)}
                  className="w-full flex items-center justify-between group py-3 px-2 hover:bg-[#a8c7fa]/5 rounded-xl transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-lg bg-[#a8c7fa]/10 text-[#a8c7fa]">
                      <Terminal size={18} />
                    </div>
                    <div className="text-left">
                      <h3 className="text-[15px] font-medium text-white">Instruções de Sistema</h3>
                      <p className="text-[12px] text-[#8e918f]">Personalize as diretrizes base do assistente</p>
                    </div>
                  </div>
                  {isSystemPromptOpen ? <ChevronUp size={20} className="text-[#a8c7fa]" /> : <ChevronDown size={20} className="text-[#8e918f] group-hover:text-[#a8c7fa]" />}
                </button>
                
                <AnimatePresence>
                  {isSystemPromptOpen && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="pt-6 px-1">
                        <Textarea
                          value={draftSystemPrompt}
                          onChange={(e) => setDraftSystemPrompt(e.target.value)}
                          placeholder="Instruções para a IA..."
                          className="w-full bg-[#1a1b1e] border-[#333538] focus-visible:border-[#a8c7fa]/50 focus-visible:ring-0 text-[#f1f3f4] p-4 min-h-[140px] rounded-xl resize-y font-mono text-[13px] leading-relaxed custom-scrollbar shadow-inner"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Privacy/Maintenance Zone */}
              <div className="border-t border-[#333538] pt-10 pb-16 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex-1">
                  <h3 className="text-[14px] font-medium text-white mb-1.5 uppercase tracking-wide">Dados e Memória</h3>
                  <p className="text-[13px] text-[#8e918f] max-w-md">
                    Limpar o cache local remove permanentemente todas as suas conversas e arquivos indexados.
                  </p>
                </div>
                <Button 
                  onClick={() => {
                    if(confirm('Tem certeza que deseja limpar todo o histórico de conversas?')) {
                      setChatHistory([]);
                      resetChat();
                      setShowSettings(false);
                    }
                  }}
                  variant="outline"
                  className="w-full md:w-auto shrink-0 border-red-500/40 text-red-500 bg-red-500/5 hover:bg-red-500/10 hover:text-red-400 h-10 rounded-lg px-8 text-[13px] font-semibold transition-all"
                >
                  Redefinir Nexus
                </Button>
              </div>

            </div>
          </div>

          {/* Footer Fixed Action Bar - Only shows if changes detected */}
          <AnimatePresence>
            {hasSettingsChanges && (
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-xl bg-[#28292d]/95 backdrop-blur-xl border border-white/10 p-3 flex justify-between items-center rounded-2xl z-[150] shadow-[0_20px_40px_rgba(0,0,0,0.6)]"
              >
                <div className="pl-4 hidden sm:block">
                  <p className="text-[13px] font-semibold text-[#f1f3f4]">Edições Pendentes</p>
                  <p className="text-[11px] text-[#8e918f]">Salve para aplicar ao Nexus</p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button 
                    onClick={() => setShowSettings(false)}
                    variant="ghost"
                    className="flex-1 sm:flex-none text-[#e3e3e3] hover:text-white hover:bg-white/5 h-10 px-6 rounded-xl font-medium text-[13px] transition-all"
                  >
                    Descartar
                  </Button>
                  <Button 
                    onClick={saveSettings}
                    className="flex-1 sm:flex-none bg-gradient-to-r from-[#a8c7fa] to-[#d2e3fc] hover:brightness-110 text-[#001d35] h-10 px-4 sm:px-8 rounded-xl font-bold text-[13px] shadow-lg shadow-blue-500/20 transition-all active:scale-95 border-0"
                  >
                    Salvar<span className="hidden sm:inline ml-1">Alterações</span>
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
      
      {/* Dynamic styles injected specifically for syntax highlight & markdown format */}
      <style>{`
        .markdown-prose p { margin-bottom: 0.75rem; color: #e3e3e3; }
        .markdown-prose p:last-child { margin-bottom: 0; }
        .markdown-prose pre { 
          background: #1e1e1f; 
          padding: 1rem; 
          border-radius: 0.5rem; 
          overflow-x: auto; 
          margin: 0.75rem 0; 
          border: 1px solid #333538;
        }
        .markdown-prose code { 
          background: #1e1e1f; 
          padding: 0.15rem 0.3rem; 
          border-radius: 0.25rem; 
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.85em; 
          color: #f1f3f4;
          border: 1px solid #333538;
        }
        .markdown-prose pre code { background: transparent; padding: 0; border: none; font-size: 0.85em; }
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