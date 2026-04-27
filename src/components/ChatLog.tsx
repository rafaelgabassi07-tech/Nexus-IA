import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Sparkles, Check, ChevronDown, FileCode, Edit2, Copy, Brain, Layout, Code, Terminal, Activity, ArrowDown
} from 'lucide-react';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import { AgentIcon } from './AgentIcon';
import { CodeBlock } from './CodeBlock';
import { Message, GeneratedFile } from '../types';
import { AgentDefinition } from '../agents';
import { cn } from '../lib/utils';

interface ChatLogProps {
  messages: Message[];
  isLoading: boolean;
  activeAgent: AgentDefinition;
  generatedFiles: GeneratedFile[];
  activeFileIndex: number;
  setActiveFileIndex: (index: number) => void;
  setActiveTab: (tab: any) => void;
  scrollRef: React.RefObject<HTMLDivElement>;
  showScrollButton: boolean;
  scrollToBottom: () => void;
  setInputMessage: (msg: string) => void;
  handleSendMessage: (e?: any, content?: string) => void;
}

export const ChatLog = ({
  messages,
  isLoading,
  activeAgent,
  generatedFiles,
  activeFileIndex,
  setActiveFileIndex,
  setActiveTab,
  scrollRef,
  showScrollButton,
  scrollToBottom,
  setInputMessage,
  handleSendMessage
}: ChatLogProps) => {
  const hasFiles = generatedFiles.length > 0;

  return (
    <div 
      ref={scrollRef}
      className={cn(
        "flex-1 overflow-y-auto px-3 py-4 custom-scrollbar relative",
        messages.length === 0 && "flex flex-col"
      )}
    >
      {messages.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center py-4 px-2 text-center animate-in fade-in duration-700 w-full min-h-0">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-3 border border-blue-500/20 shrink-0">
            <Brain size={20} className="text-blue-400" />
          </div>
          <h2 className="text-[13px] sm:text-[14px] font-black text-white uppercase tracking-widest mb-1.5 shrink-0">NEXUS IA</h2>
          <p className="text-[10px] sm:text-[11px] font-medium text-[#8e918f] max-w-sm mb-4 leading-relaxed uppercase tracking-widest text-center shrink-0">
            Descreva o seu app e o agente mais adequado será alocado.
          </p>
          <div className="grid grid-cols-1 gap-2 w-full max-w-lg shrink-0 pb-2">
            {[
              { label: "App de Clima Responsivo", prompt: "Crie um aplicativo de previsão do tempo responsivo com gráficos de temperatura dos últimos dias e visualização atual.", icon: Layout, color: "text-pink-400" },
              { label: "Dashboard Financeiro", prompt: "Construa um dashboard financeiro moderno contendo cards de resumo, gráfico de despesas e receitas.", icon: Code, color: "text-blue-400" },
              { label: "Jogo da Velha", prompt: "Desenvolva um jogo da velha avançado com modo escuro e placar de vitórias, usando lucide-react.", icon: Terminal, color: "text-emerald-400" },
              { label: "Design de Landing Page", prompt: "Gere uma landing page minimalista e futurista para uma IA, com animações e efeitos glassmorphism.", icon: Activity, color: "text-orange-400" }
            ].map((s, i) => (
              <button 
                key={i} 
                onClick={() => setInputMessage(s.prompt)}
                className="group flex items-center text-left py-2 px-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] hover:border-white/20 transition-all cursor-pointer w-full relative overflow-hidden gap-3"
              >
                <s.icon size={14} className={cn("shrink-0", s.color)} />
                <div className="flex flex-col min-w-0 flex-1">
                   <span className="text-[10px] sm:text-[11px] font-black text-white/90 uppercase tracking-widest truncate leading-none mb-1">{s.label}</span>
                   <span className="text-[9px] sm:text-[10px] text-[#8e918f] font-medium truncate opacity-70 group-hover:opacity-100 transition-opacity">"{s.prompt}"</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 w-full">
        <AnimatePresence initial={false}>
          {messages.map((msg, index) => (
            <motion.div 
              key={msg.id || index}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className={cn("flex w-full", msg.role === 'user' ? "justify-end pb-4" : "justify-start pb-4")}
            >
              {msg.role === 'user' ? (
                <div className="bg-[#282a2d] text-[#e3e3e3] px-4 py-2.5 rounded-2xl rounded-br-sm max-w-[85%] text-[14px] leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </div>
              ) : (
                <div className="flex flex-row gap-2 w-full max-w-none items-start group">
                  <Avatar className={cn(
                    "w-6 h-6 rounded-md shrink-0 mt-0.5 shadow-sm",
                    activeAgent.color || "bg-gradient-to-tr from-[#00d2ff] to-[#3a7bd5]"
                  )}>
                     <AvatarFallback className="bg-transparent text-white">
                       <AgentIcon iconName={activeAgent.iconName} size={12} />
                     </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-[14px] leading-[1.6] text-[#e3e3e3] pr-2">
                    {msg.role === 'model' && msg.steps && (
                      <div className="mb-4 w-full max-w-2xl px-1">
                        <details className="group/accordion border border-white/5 bg-white/[0.02] rounded-xl overflow-hidden shadow-sm" open={msg.steps.some(s => s.status === 'running')}>
                          <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer list-none select-none text-[13px] font-semibold text-[#e3e3e3] hover:bg-white/[0.04] transition-all bg-white/[0.01]">
                            <div className="relative shrink-0 flex items-center justify-center">
                              {msg.steps.some(s => s.status === 'running') ? (
                                <div className="relative">
                                  <motion.div 
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                    className="w-4 h-4 rounded-full border-b-2 border-blue-400"
                                  />
                                  <Sparkles size={8} className="absolute inset-0 m-auto text-blue-400 opacity-80 animate-pulse" />
                                </div>
                              ) : (
                                <div className="w-4 h-4 rounded-full bg-blue-400/10 flex items-center justify-center">
                                  <Check size={10} className="text-blue-400" strokeWidth={3} />
                                </div>
                              )}
                            </div>
                            <span className="flex-1 tracking-tight text-[#e3e3e3]/90">
                              {msg.steps.some(s => s.status === 'running') ? 'Executando Tarefas' : 'Etapas de Execução'}
                            </span>
                            <div className="flex items-center gap-2">
                              {msg.steps.some(s => s.status === 'running') && (
                                <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-blue-400/10 border border-blue-400/20">Working</span>
                              )}
                              <ChevronDown size={14} className="text-[#8e918f]/50 transition-transform group-open/accordion:rotate-180 shrink-0" />
                            </div>
                          </summary>
                          
                          <div className="px-5 pb-5 pt-3 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-300 relative">
                            <div className="absolute left-[27px] top-4 bottom-8 w-px bg-white/5 z-0" />
                            
                            {msg.steps.map((step, i) => (
                              <div key={i} className="flex items-center gap-4 py-2 group/step relative z-10">
                                <div className={cn(
                                  "shrink-0 w-6 h-6 flex items-center justify-center rounded-full border transition-all duration-500",
                                  step.status === 'running' 
                                    ? "bg-blue-500/10 border-blue-500/30 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.1)]" 
                                    : step.status === 'success' 
                                      ? "bg-white/[0.03] border-white/5 text-[#8e918f]" 
                                      : "bg-transparent border-white/5 text-[#5f6368]"
                                )}>
                                  <step.icon size={12} strokeWidth={2} />
                                </div>
                                <div className="flex-1 flex flex-col">
                                  <span className={cn(
                                    "text-[13px] font-medium transition-colors",
                                    step.status === 'running' ? "text-white" : step.status === 'success' ? "text-[#8e918f]" : "text-[#5f6368]"
                                  )}>
                                    {step.label}
                                  </span>
                                </div>
                                {step.status === 'running' && (
                                  <div className="flex gap-1">
                                    {[0, 1, 2].map(d => (
                                      <motion.div 
                                        key={d}
                                        animate={{ opacity: [0.3, 1, 0.3] }}
                                        transition={{ duration: 1, repeat: Infinity, delay: d * 0.2 }}
                                        className="w-1 h-1 rounded-full bg-blue-400"
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                            
                            {hasFiles && msg.id === messages[messages.length-1].id && generatedFiles.length > 0 && (
                              <div className="pt-4 mt-2 border-t border-white/5">
                                <div className="flex items-center gap-3 px-1 mb-4">
                                  <div className="w-6 h-6 flex items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                    <Edit2 size={12} className="text-emerald-400" strokeWidth={2} />
                                  </div>
                                  <span className="text-[13px] font-bold text-[#e3e3e3] tracking-tight">
                                    Arquivos Gerados <span className="ml-1 px-1.5 py-0.5 rounded-md bg-white/5 text-[10px] text-[#8e918f]">{generatedFiles.length}</span>
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {generatedFiles.map((f, idx) => (
                                    <motion.div 
                                      key={f.name}
                                      initial={{ opacity: 0, scale: 0.95 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      transition={{ delay: idx * 0.05 }}
                                      onClick={() => {
                                         setActiveFileIndex(idx);
                                         setActiveTab('code');
                                      }}
                                      className={cn(
                                        "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]",
                                        activeFileIndex === idx 
                                          ? "bg-white/[0.08] border-white/20 shadow-lg" 
                                          : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10"
                                      )}
                                    >
                                      <FileCode size={16} className={cn(
                                        activeFileIndex === idx ? "text-emerald-400" : "text-[#8e918f]"
                                      )} />
                                      <span className={cn(
                                        "text-[12px] font-medium truncate flex-1",
                                        activeFileIndex === idx ? "text-white" : "text-[#e3e3e3]/70"
                                      )}>{f.name}</span>
                                      {activeFileIndex === idx && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />}
                                    </motion.div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="pt-2">
                              <ReactMarkdown 
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  code({ inline, className, children, ...props }: any) {
                                    const match = /language-(\w+)/.exec(className || '');
                                    return !inline && match ? (
                                      <CodeBlock
                                        value={String(children).replace(/\n$/, '')}
                                        language={match[1]}
                                        fastMode={isLoading && index === messages.length - 1}
                                        {...props}
                                      />
                                    ) : (
                                      <code className={cn("bg-[#2d2e31] px-1.5 py-0.5 rounded-md text-blue-300 font-mono text-[13px]", className)} {...props}>
                                        {children}
                                      </code>
                                    );
                                  },
                                  p: ({ children }) => <p className="mb-4 last:mb-0 text-[#e3e3e3] leading-relaxed">{children}</p>,
                                  blockquote({ children }: any) {
                                    let text = '';
                                    try {
                                      if (Array.isArray(children)) {
                                        text = children.map((c: any) => c?.props?.children?.[0] || '').join(' ');
                                      } else {
                                        text = String(children?.props?.children?.[0] || '');
                                      }
                                    } catch (e) {}
                                    const isThought = text.includes('💭') || text.toLowerCase().includes('pensamento');
                                    
                                    if (isThought) {
                                      return (
                                        <details className="group/thought my-4">
                                          <summary className="inline-flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[#282a2d] border border-[#333538] hover:bg-[#333538] transition-colors cursor-pointer list-none select-none text-[12px] font-medium text-[#c4c7c5] w-fit">
                                            <div className="flex items-center gap-2 pr-4">
                                              <Brain size={14} className="text-purple-400" />
                                              <span>Processo de Pensamento Estratégico</span>
                                            </div>
                                            <ChevronDown size={14} className="opacity-50 transition-transform group-open/thought:rotate-180" />
                                          </summary>
                                          <div className="mt-2 pl-4 py-3 border-l-2 border-purple-500/30 bg-purple-500/5 text-[#b2b5b4] text-[13px] rounded-r-xl markdown-prose">
                                            {children}
                                          </div>
                                        </details>
                                      );
                                    }
                                    return <blockquote className="border-l-4 border-white/10 pl-4 py-1 italic mb-4 text-[#8e918f] bg-white/[0.02] rounded-r-lg">{children}</blockquote>;
                                  }
                                }}
                              >
                                {msg.content}
                              </ReactMarkdown>
                            </div>
                          </div>
                        </details>
                      </div>
                    )}
                    
                    <div className={cn(msg.steps ? "mt-4" : "")}>
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({ inline, className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || '');
                            return !inline && match ? (
                              <CodeBlock
                                value={String(children).replace(/\n$/, '')}
                                language={match[1]}
                                fastMode={isLoading && index === messages.length - 1}
                                {...props}
                              />
                            ) : (
                              <code className={cn("bg-[#2d2e31] px-1.5 py-0.5 rounded-md text-blue-300 font-mono text-[13px]", className)} {...props}>
                                {children}
                              </code>
                            );
                          },
                          p: ({ children }) => <p className="mb-4 last:mb-0 text-[#e3e3e3] leading-relaxed">{children}</p>,
                          blockquote({ children }: any) {
                            let text = '';
                            try {
                              if (Array.isArray(children)) {
                                text = children.map((c: any) => c?.props?.children?.[0] || '').join(' ');
                              } else {
                                text = String(children?.props?.children?.[0] || '');
                              }
                            } catch (e) {}
                            const isThought = text.includes('💭') || text.toLowerCase().includes('pensamento');
                            
                            if (isThought) {
                              return (
                                <details className="group/thought my-4">
                                  <summary className="inline-flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[#282a2d] border border-[#333538] hover:bg-[#333538] transition-colors cursor-pointer list-none select-none text-[12px] font-medium text-[#c4c7c5] w-fit">
                                    <div className="flex items-center gap-2 pr-4">
                                      <Brain size={14} className="text-purple-400" />
                                      <span>Processo de Pensamento Estratégico</span>
                                    </div>
                                    <ChevronDown size={14} className="opacity-50 transition-transform group-open/thought:rotate-180" />
                                  </summary>
                                  <div className="mt-2 pl-4 py-3 border-l-2 border-purple-500/30 bg-purple-500/5 text-[#b2b5b4] text-[13px] rounded-r-xl markdown-prose">
                                    {children}
                                  </div>
                                </details>
                              );
                            }
                            return <blockquote className="border-l-4 border-white/10 pl-4 py-1 italic mb-4 text-[#8e918f] bg-white/[0.02] rounded-r-lg">{children}</blockquote>;
                          }
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>

                    {msg.content && (
                      <button
                        onClick={() => {
                          if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
                            navigator.clipboard.writeText(msg.content).catch(e => console.error("Clipboard API failed", e));
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-[#8e918f] hover:text-white hover:bg-white/5 mt-1 self-start"
                        title="Copiar mensagem"
                      >
                        <Copy size={14} />
                      </button>
                    )}

                    {msg.isError && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
                          if (lastUserMsg) {
                            handleSendMessage(undefined, lastUserMsg.content);
                          }
                        }} 
                        className="mt-4 border-red-500/30 bg-red-500/5 text-red-400 hover:bg-red-500/10 hover:text-red-300 gap-2 h-8 rounded-lg text-[12px] font-bold uppercase tracking-widest"
                      >
                         <Activity size={14} />
                        Tentar Novamente
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {showScrollButton && (
          <div className="sticky bottom-4 left-0 right-0 flex justify-center z-50 pointer-events-none">
            <Button
              onClick={() => scrollToBottom()}
              className="pointer-events-auto bg-blue-600 hover:bg-blue-500 text-white rounded-full px-4 py-2 shadow-2xl flex items-center gap-2 text-xs font-bold animate-in bounce-in duration-300 border border-white/20"
            >
              Resumo em andamento... <ArrowDown size={14} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
