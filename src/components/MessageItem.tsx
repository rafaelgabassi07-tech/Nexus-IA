import React from 'react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { 
  Check, ChevronDown, FileCode, Edit2, Copy, Brain, Layout, Activity, RotateCcw
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
  handleRegenerate?: () => void;
  measureElement?: (el: HTMLElement | null) => void;
}

export const MessageItem = React.memo(({
  message,
  activeAgent,
  generatedFiles,
  activeFileIndex,
  setActiveFileIndex,
  setActiveTab,
  isLoading,
  isLastMessage,
  handleSendMessage,
  handleRegenerate,
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
          <div className="bg-[#1e1e20] text-[#f1f3f4] px-5 py-3.5 rounded-2xl rounded-tr-md max-w-[85%] text-[14px] font-medium leading-relaxed whitespace-pre-wrap border border-white/5 shadow-sm">
            {message.content}
          </div>
        ) : (
          <div className="flex flex-row gap-3 w-full max-w-none items-start group">
            <Avatar className={cn(
              "w-7 h-7 rounded-lg shrink-0 mt-0.5 shadow-md flex items-center justify-center border border-white/5",
              activeAgent.color || "bg-gradient-to-tr from-[#00d2ff] to-[#3a7bd5]"
            )}>
               <AvatarFallback className="bg-transparent text-white">
                 <AgentIcon iconName={activeAgent.iconName} size={18} />
               </AvatarFallback>
            </Avatar>
                        <div className="flex-1 text-[14px] leading-[1.6] text-foreground pr-2 overflow-hidden">
              {message.steps && message.steps.length > 0 && (
                <div className="mb-3 w-full max-w-[90%] md:max-w-xl">
                  <details className="group/accordion border border-white/5 bg-white/[0.01] rounded-lg overflow-hidden" open={message.steps.some((s: any) => s.status === 'running')}>
                    <summary className="flex items-center gap-3 px-3 py-2 cursor-pointer list-none select-none hover:bg-white/[0.02] transition-colors">
                      <div className="relative shrink-0 flex items-center justify-center">
                        {message.steps.some((s: any) => s.status === 'running') ? (
                          <div className="relative">
                            <motion.div 
                               animate={{ rotate: 360 }}
                               transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                               className="w-3 h-3 rounded-full border-b-2 border-blue-400"
                            />
                          </div>
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full bg-blue-400/10 flex items-center justify-center">
                            <Check size={8} className="text-blue-400" strokeWidth={3} />
                          </div>
                        )}
                      </div>
                      <span className="flex-1 tracking-tight text-foreground/70 uppercase text-[9px] font-bold tracking-wider">
                        {message.steps.some((s: any) => s.status === 'running') ? 'Processando...' : 'Fluxo de Ações'}
                      </span>
                      <ChevronDown size={12} className="text-muted-foreground/40 transition-transform group-open/accordion:rotate-180 shrink-0" />
                    </summary>
                    
                    <div className="px-3 pb-2 pt-1 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-200 relative">
                      <div className="absolute left-[17px] top-1 bottom-4 w-px bg-white/5 z-0" />
                      
                      {message.steps.map((step: any, i: number) => (
                        <div key={i} className="flex items-center gap-2.5 py-0.5 group/step relative z-10">
                          <div className={cn(
                            "shrink-0 w-4 h-4 flex items-center justify-center rounded-full border transition-all duration-300",
                            step.status === 'running' 
                              ? "bg-blue-500/10 border-blue-500/30 text-blue-400" 
                              : step.status === 'success' 
                                ? "bg-white/[0.03] border-white/10 text-muted-foreground" 
                                : "bg-transparent border-white/5 text-muted-foreground/30"
                          )}>
                            <step.icon size={8} strokeWidth={2.5} />
                          </div>
                          <span className={cn(
                            "text-[10px] sm:text-[11px] font-medium transition-colors truncate",
                            step.status === 'running' ? "text-foreground" : step.status === 'success' ? "text-muted-foreground" : "text-muted-foreground/40"
                          )}>
                            {step.label}
                          </span>
                        </div>
                      ))}
                      
                      {hasFiles && isLastMessage && generatedFiles.length > 0 && (
                        <div className="pt-2 mt-2 border-t border-white/5">
                          <div className="flex items-center gap-2 px-1 mb-1.5">
                            <div className="w-4 h-4 flex items-center justify-center rounded bg-emerald-500/10 border border-emerald-500/20">
                              <Edit2 size={8} className="text-emerald-400" strokeWidth={2} />
                            </div>
                            <span className="text-[9px] font-bold text-foreground tracking-wider uppercase">
                              Workdir <span className="ml-1 text-muted-foreground font-medium">({generatedFiles.length})</span>
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {generatedFiles.map((f: any, idx: number) => (
                              <button 
                                key={f.name}
                                onClick={() => {
                                   setActiveFileIndex(idx);
                                   setActiveTab('code');
                                }}
                                className={cn(
                                  "flex items-center gap-2 p-1.5 rounded-md border text-left transition-all hover:bg-white/[0.04]",
                                  activeFileIndex === idx 
                                    ? "bg-white/[0.06] border-white/10" 
                                    : "bg-white/[0.01] border-white/5"
                                )}
                              >
                                <FileCode size={12} className={activeFileIndex === idx ? "text-emerald-400" : "text-muted-foreground/70"} />
                                <span className={cn(
                                  "text-[10px] font-medium truncate flex-1",
                                  activeFileIndex === idx ? "text-white" : "text-muted-foreground/70"
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
                                <div className="my-4 p-4 rounded-2xl border border-border bg-white/[0.03] flex items-center justify-between group/code-summary hover:bg-white/[0.06] transition-all cursor-pointer shadow-sm"
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
                                      <div className="text-[11px] font-black uppercase tracking-widest text-foreground mb-0.5">Módulo Gerado</div>
                                      <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Explorar no Workspace • {match[1]}</div>
                                    </div>
                                  </div>
                                  <Layout size={16} className="text-muted-foreground opacity-40" />
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
                            <code className={cn("bg-muted px-1.5 py-0.5 rounded-md text-blue-300 font-mono text-[13px] border border-border", className)} {...props}>
                              {children}
                            </code>
                          );
                        },
                        p: ({ children }) => <p className="mb-4 last:mb-0 text-foreground leading-relaxed">{children}</p>,
                        blockquote({ children }: any) {
                          let text = '';
                          try {
                            if (Array.isArray(children)) {
                              text = children.map((c: any) => c?.props?.children?.[0] || '').join(' ');
                            } else {
                              text = String(children?.props?.children?.[0] || '');
                            }
                          } catch (e) {}
                          const isThought = text.includes('💭') || text.toLowerCase().includes('pensamento estratégico');
                          
                          if (isThought) {
                            return (
                              <details className="group/thought my-5 border border-purple-500/20 rounded-2xl overflow-hidden bg-purple-500/[0.02]">
                                <summary className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer list-none select-none text-[12px] font-black uppercase tracking-widest text-purple-300 hover:bg-purple-500/5 transition-colors">
                                  <div className="flex items-center gap-2">
                                    <Brain size={16} className="text-purple-400" />
                                    <span>Pensamento Estratégico</span>
                                  </div>
                                  <ChevronDown size={18} className="opacity-50 transition-transform group-open/thought:rotate-180" />
                                </summary>
                                <div className="px-5 pb-5 pt-1 text-muted-foreground/80 text-[13px] leading-relaxed italic border-t border-purple-500/10">
                                  {children}
                                </div>
                              </details>
                            );
                          }
                          return <blockquote className="border-l-4 border-border pl-5 py-1 italic mb-4 text-muted-foreground bg-white/[0.01] rounded-r-2xl">{children}</blockquote>;
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
                    <div className="flex items-center gap-3">
                      <button
                         onClick={() => handleSendMessage(undefined, "Reforce ou explique melhor o ponto anterior.")}
                         className="text-[10px] uppercase font-black tracking-widest text-[#8e918f] hover:text-white transition-colors"
                      >
                        Explicar Melhor
                      </button>
                      {handleRegenerate && (
                         <button
                            onClick={handleRegenerate}
                            disabled={isLoading}
                            className="text-[10px] uppercase font-black tracking-widest text-[#8e918f] hover:text-white transition-colors flex items-center gap-1"
                         >
                           <RotateCcw size={10} />
                           Regenerar
                         </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {message.isError && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleRegenerate?.()} 
                  className="mt-6 border-red-500/30 bg-red-500/5 text-red-400 hover:bg-red-500/10 hover:text-red-300 gap-2 h-10 rounded-xl text-[12px] font-black uppercase tracking-widest px-6"
                >
                   <Activity size={16} />
                   Tentar Novamente
                </Button>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}, (prev, next) => {
  const stepsSame = (prev.message.steps?.length === next.message.steps?.length) && 
                    (!prev.message.steps || prev.message.steps.every((s, i) => s.status === next.message.steps![i].status && s.label === next.message.steps![i].label));
                    
  return prev.message.content === next.message.content &&
         prev.isLoading === next.isLoading &&
         prev.isLastMessage === next.isLastMessage &&
         prev.activeFileIndex === next.activeFileIndex &&
         prev.message.isError === next.message.isError &&
         stepsSame;
});
