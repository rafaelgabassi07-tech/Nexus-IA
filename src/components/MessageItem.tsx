import React from 'react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { 
  Sparkles, Check, ChevronDown, FileCode, Edit2, Copy, Brain, Layout, Activity
} from 'lucide-react';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import { AgentIcon } from './AgentIcon';
import { CodeBlock } from './CodeBlock';
import { Message, GeneratedFile } from '../types';
import { AgentDefinition } from '../agents';
import { cn } from '../lib/utils';

// Skeleton para quando a mensagem está carregando
export const MessageSkeleton = () => (
  <div className="space-y-3 w-full max-w-2xl mt-2 px-1">
    <div className="animate-pulse bg-white/[0.05] rounded-md h-4 w-[90%]" />
    <div className="animate-pulse bg-white/[0.05] rounded-md h-4 w-[85%]" />
    <div className="animate-pulse bg-white/[0.05] rounded-md h-4 w-[60%]" />
    <div className="flex gap-3 pt-3">
      <div className="animate-pulse bg-white/[0.05] rounded-2xl h-24 flex-1" />
      <div className="animate-pulse bg-white/[0.05] rounded-2xl h-24 flex-1" />
    </div>
  </div>
);

interface MessageItemProps {
  message: Message;
  index: number;
  activeAgent: AgentDefinition;
  generatedFiles: GeneratedFile[];
  activeFileIndex: number;
  setActiveFileIndex: (index: number) => void;
  setActiveTab: (tab: any) => void;
  isLoading: boolean;
  isLastMessage: boolean;
  handleSendMessage: (e?: any, content?: string) => void;
  measureElement?: (el: HTMLElement | null) => void;
}

export const MessageItem = React.memo(({
  message,
  index,
  activeAgent,
  generatedFiles,
  activeFileIndex,
  setActiveFileIndex,
  setActiveTab,
  isLoading,
  isLastMessage,
  handleSendMessage,
  measureElement
}: MessageItemProps) => {
  const hasFiles = generatedFiles.length > 0;

  return (
    <div 
      ref={measureElement}
      className={cn("flex w-full mb-4 px-2")}
    >
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn("flex w-full", message.role === 'user' ? "justify-end" : "justify-start")}
      >
        {message.role === 'user' ? (
          <div className="bg-[#282a2d] text-[#e3e3e3] px-4 py-2.5 rounded-2xl rounded-br-sm max-w-[85%] text-[14px] leading-relaxed whitespace-pre-wrap shadow-sm">
            {message.content}
          </div>
        ) : (
          <div className="flex flex-row gap-3 w-full max-w-none items-start group">
            <Avatar className={cn(
              "w-7 h-7 rounded-lg shrink-0 mt-0.5 shadow-md flex items-center justify-center border border-white/5",
              activeAgent.color || "bg-gradient-to-tr from-[#00d2ff] to-[#3a7bd5]"
            )}>
               <AvatarFallback className="bg-transparent text-white">
                 <AgentIcon iconName={activeAgent.iconName} size={14} />
               </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 text-[14px] leading-[1.6] text-[#e3e3e3] pr-2 overflow-hidden">
              {message.steps && (
                <div className="mb-4 w-full max-w-2xl">
                  <details className="group/accordion border border-white/5 bg-white/[0.02] rounded-2xl overflow-hidden shadow-sm" open={message.steps.some(s => s.status === 'running')}>
                    <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer list-none select-none text-[13px] font-bold text-[#e3e3e3] hover:bg-white/[0.04] transition-all bg-white/[0.01]">
                      <div className="relative shrink-0 flex items-center justify-center">
                        {message.steps.some(s => s.status === 'running') ? (
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
                      <span className="flex-1 tracking-tight text-[#e3e3e3]/90 uppercase text-[11px] font-black tracking-widest">
                        {message.steps.some(s => s.status === 'running') ? 'Processando...' : 'Fluxo de Execução'}
                      </span>
                      <ChevronDown size={14} className="text-[#8e918f]/50 transition-transform group-open/accordion:rotate-180 shrink-0" />
                    </summary>
                    
                    <div className="px-5 pb-5 pt-3 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-300 relative">
                      <div className="absolute left-[27px] top-4 bottom-8 w-px bg-white/5 z-0" />
                      
                      {message.steps.map((step, i) => (
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
                          <span className={cn(
                            "text-[13px] font-medium transition-colors truncate",
                            step.status === 'running' ? "text-white" : step.status === 'success' ? "text-[#8e918f]" : "text-[#5f6368]"
                          )}>
                            {step.label}
                          </span>
                        </div>
                      ))}
                      
                      {hasFiles && isLastMessage && generatedFiles.length > 0 && (
                        <div className="pt-4 mt-2 border-t border-white/5">
                          <div className="flex items-center gap-3 px-1 mb-4">
                            <div className="w-6 h-6 flex items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                              <Edit2 size={12} className="text-emerald-400" strokeWidth={2} />
                            </div>
                            <span className="text-[12px] font-black text-[#e3e3e3] tracking-widest uppercase">
                              Workdir <span className="ml-1 text-[#8e918f] font-medium">({generatedFiles.length})</span>
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {generatedFiles.map((f, idx) => (
                              <button 
                                key={f.name}
                                onClick={() => {
                                   setActiveFileIndex(idx);
                                   setActiveTab('code');
                                }}
                                className={cn(
                                  "flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all hover:bg-white/[0.06]",
                                  activeFileIndex === idx 
                                    ? "bg-white/[0.08] border-white/20" 
                                    : "bg-white/[0.02] border-white/5"
                                )}
                              >
                                <FileCode size={14} className={activeFileIndex === idx ? "text-emerald-400" : "text-[#8e918f]"} />
                                <span className={cn(
                                  "text-[12px] font-medium truncate flex-1",
                                  activeFileIndex === idx ? "text-white" : "text-[#e3e3e3]/70"
                                )}>{f.name.split('/').pop()}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </details>
                </div>
              )}
              
              <div className="relative">
                {!message.content && isLoading && isLastMessage ? (
                  <MessageSkeleton />
                ) : (
                  <div className="markdown-prose">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm, remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                      components={{
                        code({ inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || '');
                          const codeVal = String(children).replace(/\n$/, '');
                          
                          if (!inline && match) {
                            const isLongCode = codeVal.split('\n').length >= 1;
                            if (isLongCode && generatedFiles.length > 0) {
                              return (
                                <div className="my-4 p-4 rounded-2xl border border-white/10 bg-white/[0.03] flex items-center justify-between group/code-summary hover:bg-white/[0.06] transition-all cursor-pointer shadow-sm"
                                  onClick={() => {
                                    setActiveTab('code');
                                    const fileIndex = generatedFiles.findIndex(f => f.code.includes(codeVal.slice(0, 50)));
                                    if (fileIndex !== -1) setActiveFileIndex(fileIndex);
                                  }}
                                >
                                  <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover/code-summary:scale-105 transition-transform border border-blue-400/20">
                                      <FileCode size={20} />
                                    </div>
                                    <div>
                                      <div className="text-[11px] font-black uppercase tracking-widest text-[#e3e3e3] mb-0.5">Módulo Gerado</div>
                                      <div className="text-[10px] text-[#8e918f] font-medium uppercase tracking-tighter">Explorar no Workspace • {match[1]}</div>
                                    </div>
                                  </div>
                                  <Layout size={16} className="text-[#8e918f] opacity-40" />
                                </div>
                              );
                            }

                            return (
                              <CodeBlock
                                value={codeVal}
                                language={match[1]}
                                fastMode={isLoading && isLastMessage}
                                {...props}
                              />
                            );
                          }
                          
                          return (
                            <code className={cn("bg-[#2d2e31] px-1.5 py-0.5 rounded-md text-blue-300 font-mono text-[13px] border border-white/5", className)} {...props}>
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
                              <details className="group/thought my-5 border border-purple-500/20 rounded-2xl overflow-hidden bg-purple-500/[0.02]">
                                <summary className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer list-none select-none text-[12px] font-black uppercase tracking-widest text-purple-300 hover:bg-purple-500/5 transition-colors">
                                  <div className="flex items-center gap-2">
                                    <Brain size={16} className="text-purple-400" />
                                    <span>Pensamento Estratégico</span>
                                  </div>
                                  <ChevronDown size={14} className="opacity-50 transition-transform group-open/thought:rotate-180" />
                                </summary>
                                <div className="px-5 pb-5 pt-1 text-[#b2b5b4] text-[13px] leading-relaxed italic border-t border-purple-500/10">
                                  {children}
                                </div>
                              </details>
                            );
                          }
                          return <blockquote className="border-l-4 border-white/10 pl-5 py-1 italic mb-4 text-[#8e918f] bg-white/[0.01] rounded-r-2xl">{children}</blockquote>;
                        }
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>

              {message.content && (
                <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                  <button
                    onClick={() => {
                      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(message.content).catch(e => console.error("Clipboard API failed", e));
                      }
                    }}
                    className="p-1.5 rounded-lg text-[#8e918f] hover:text-white hover:bg-white/5 transition-colors"
                    title="Copiar mensagem"
                  >
                    <Copy size={13} />
                  </button>
                  {isLastMessage && message.role === 'model' && (
                     <button
                        onClick={() => handleSendMessage(undefined, "Reforce ou explique melhor o ponto anterior.")}
                        className="text-[10px] uppercase font-black tracking-widest text-[#8e918f] hover:text-white transition-colors"
                     >
                       Explicar Melhor
                     </button>
                  )}
                </div>
              )}

              {message.isError && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleSendMessage()} 
                  className="mt-6 border-red-500/30 bg-red-500/5 text-red-400 hover:bg-red-500/10 hover:text-red-300 gap-2 h-10 rounded-xl text-[12px] font-black uppercase tracking-widest px-6"
                >
                   <Activity size={16} />
                   Reprimir Erro e Tentar Novamente
                </Button>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}, (prev, next) => {
  return prev.message.content === next.message.content &&
         prev.isLoading === next.isLoading &&
         prev.isLastMessage === next.isLastMessage &&
         prev.activeFileIndex === next.activeFileIndex;
});
