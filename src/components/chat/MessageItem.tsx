import React from 'react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { toast } from 'sonner';
import { 
  Check, ChevronDown, FileCode, Edit2, Copy, Brain, Layout, Activity, RotateCcw,
  Terminal, Lightbulb, Code, Sparkles, Shield, Users, Hexagon
} from 'lucide-react';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { AgentIcon } from './AgentIcon';
import { CodeBlock } from '../workbench/CodeBlock';
import { Message, GeneratedFile } from '../../types';
import { AgentDefinition } from '../../agents';
import { cn } from '../../lib/utils';

// Skeleton para quando a mensagem está carregando
export const MessageSkeleton = () => (
  <div className="space-y-4 w-full max-w-2xl mt-2 px-1">
    <div className="flex gap-3">
      <div className="animate-pulse bg-white/5 rounded-lg h-7 w-7 shrink-0" />
      <div className="space-y-2 flex-1">
        <div className="animate-pulse bg-white/5 rounded-md h-4 w-[90%]" />
        <div className="animate-pulse bg-white/5 rounded-md h-4 w-[85%]" />
        <div className="animate-pulse bg-white/5 rounded-md h-4 w-[60%]" />
      </div>
    </div>
    <div className="flex gap-3 pl-10 pt-2 flex-wrap">
      <div className="animate-pulse bg-white/[0.03] rounded-2xl h-16 w-full sm:flex-1" />
      <div className="animate-pulse bg-white/[0.03] rounded-2xl h-16 w-full sm:flex-1" />
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
  handleSendMessage: (e?: any, content?: string) => Promise<void> | any;
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
          <div className="bg-white/[0.03] text-[#f1f3f4]/90 px-3 py-1.5 rounded-lg rounded-tr-none max-w-[85%] text-[12px] font-medium leading-relaxed whitespace-pre-wrap border border-white/20 shadow-sm">
            {message.content}
          </div>
        ) : (
          <div className="flex flex-row gap-2.5 w-full max-w-none items-start group">
            <Avatar className={cn(
              "w-6 h-6 rounded-lg shrink-0 mt-0.5 shadow-xl flex items-center justify-center border border-white/30 nexus-glow",
              activeAgent.color || "bg-gradient-to-tr from-[#00d2ff] to-[#3a7bd5]"
            )}>
               <AvatarFallback className="bg-transparent text-white">
                 <AgentIcon iconName={activeAgent.iconName} size={12} />
               </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-[12px] leading-relaxed text-foreground pr-2 overflow-hidden">
              <div className="flex items-center gap-2 mb-1">
                <div className={cn("text-[7px] font-black uppercase tracking-[.3em] text-white/80 leading-none italic", isLoading && isLastMessage && "animate-pulse text-blue-400")}>
                  {activeAgent.name} // Núcleo de Inteligência
                </div>
                {isLoading && isLastMessage && (
                   <div className="flex gap-0.5">
                      {[1,2,3].map(i => (
                        <motion.div 
                          key={i}
                          animate={{ opacity: [0.2, 1, 0.2] }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                          className="w-0.5 h-0.5 rounded-full bg-blue-500"
                        />
                      ))}
                   </div>
                )}
              </div>
              {message.steps && message.steps.length > 0 && (
                <div className="mb-2 w-full max-w-[95%] md:max-w-lg">
                  <details className="group/accordion border border-white/20 bg-white/[0.01] rounded border-white/20 overflow-hidden" open={message.steps.some((s: any) => s.status === 'running')}>
                    <summary className="flex items-center gap-2 px-2 py-1.5 cursor-pointer list-none select-none hover:bg-white/[0.02] transition-colors">
                      <div className="relative shrink-0 flex items-center justify-center">
                        {message.steps.some((s: any) => s.status === 'running') ? (
                          <div className="relative">
                            <motion.div 
                               animate={{ rotate: 360 }}
                               transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                               className="w-2.5 h-2.5 rounded-full border-b border-blue-400"
                            />
                          </div>
                        ) : (
                          <div className="w-3 h-3 rounded-full bg-blue-400/10 flex items-center justify-center">
                            <Check size={8} className="text-blue-400" strokeWidth={3} />
                          </div>
                        )}
                      </div>
                      <span className="flex-1 tracking-tight text-white/90 uppercase text-[8px] font-black tracking-widest">
                        {message.steps.some((s: any) => s.status === 'running') ? 'Sincronizando...' : 'Sequência de Tarefas'}
                      </span>
                      <ChevronDown size={10} className="text-white/80 transition-transform group-open/accordion:rotate-180 shrink-0" />
                    </summary>
                    
                    <div className="px-2 pb-2 pt-0.5 space-y-0 relative">
                      <div className="absolute left-[13px] top-1 bottom-4 w-px bg-white/5 z-0" />
                      
                      {message.steps.map((step: any, i: number) => {
                        // Icon mapping for serialized steps
                        const icons: Record<string, any> = {
                          Terminal, Lightbulb, FileCode, Edit2, Code, 
                          Brain, Layout, Activity, Sparkles, Shield, Users, Hexagon
                        };

                        let StepIcon = step.icon;
                        if (typeof StepIcon === 'string' && icons[StepIcon]) {
                          StepIcon = icons[StepIcon];
                        }
                        
                        if (!StepIcon || typeof StepIcon !== 'function') {
                          StepIcon = Terminal;
                        }

                        return (
                          <div key={i} className="flex items-center gap-2 py-0.5 group/step relative z-10 pl-1">
                            <div className={cn(
                              "shrink-0 w-3.5 h-3.5 flex items-center justify-center rounded-full border transition-all duration-300",
                              step.status === 'running' 
                                ? "bg-blue-500/10 border-blue-500/30 text-blue-400" 
                                : step.status === 'success' 
                                  ? "bg-white/[0.02] border-white/30 text-white/80" 
                                  : "bg-transparent border-white/20 text-white/80"
                            )}>
                              <StepIcon size={8} strokeWidth={2.5} />
                            </div>
                            <span className={cn(
                              "text-[10px] font-bold transition-colors truncate tracking-tight uppercase italic",
                              step.status === 'running' ? "text-blue-400" : step.status === 'success' ? "text-white/90" : "text-white/90"
                            )}>
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                      
                      {hasFiles && isLastMessage && generatedFiles.length > 0 && (
                        <div className="pt-1.5 mt-1 border-t border-white/20">
                          <div className="flex items-center gap-1.5 px-1 mb-1">
                            <div className="w-3.5 h-3.5 flex items-center justify-center rounded bg-emerald-500/10 border border-emerald-500/20">
                              <Edit2 size={8} className="text-emerald-400" strokeWidth={2} />
                            </div>
                            <span className="text-[8px] font-black text-white/90 tracking-widest uppercase">
                              Manifesto <span className="ml-1 text-white/80">[{generatedFiles.length}]</span>
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 px-1">
                            {generatedFiles.map((f: any, idx: number) => (
                              <button 
                                key={f.name}
                                onClick={() => {
                                   setActiveFileIndex(idx);
                                   setActiveTab('code');
                                }}
                                className={cn(
                                  "flex items-center gap-1.5 p-1 rounded border text-left transition-all hover:bg-white/[0.04]",
                                  activeFileIndex === idx 
                                    ? "bg-white/[0.04] border-white/30" 
                                    : "bg-white/[0.01] border-white/20"
                                )}
                              >
                                <FileCode size={10} className={activeFileIndex === idx ? "text-emerald-400" : "text-white/80"} />
                                <span className={cn(
                                  "text-[9px] font-bold truncate flex-1 tracking-tight",
                                  activeFileIndex === idx ? "text-white/90" : "text-white/80"
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
                                <div className="my-3 p-3 rounded-xl border border-white/20 bg-white/[0.02] flex items-center justify-between group/code-summary hover:bg-white/[0.04] transition-all cursor-pointer shadow-sm"
                                  onClick={() => {
                                    setActiveTab('code');
                                    const fileIndex = generatedFiles.findIndex(f => f.code.includes(codeVal.slice(0, 50)));
                                    if (fileIndex !== -1) setActiveFileIndex(fileIndex);
                                  }}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover/code-summary:scale-105 transition-transform border border-blue-400/20">
                                      <FileCode size={16} />
                                    </div>
                                    <div>
                                      <div className="text-[10px] font-black uppercase tracking-widest text-white/90 mb-0.5">Ativo Manifestado</div>
                                      <div className="text-[9px] text-white/80 font-bold uppercase tracking-tighter">Explorar no Editor • {match[1]}</div>
                                    </div>
                                  </div>
                                  <Layout size={14} className="text-white/90" />
                                </div>
                              );
                            }

                            return (
                              <CodeBlock
                                value={codeVal}
                                language={match[1]}
                                {...props}
                              />
                            );
                          }
                          
                          return (
                            <code className={cn("bg-white/5 px-1 rounded text-blue-300 font-mono text-[12px] border border-white/20", className)} {...props}>
                              {children}
                            </code>
                          );
                        },
                        p: ({ children }) => <p className="mb-3 last:mb-0 text-white/85 leading-relaxed font-medium">{children}</p>,
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
                              <details className="group/thought my-4 border border-purple-500/10 rounded overflow-hidden bg-purple-500/[0.01]">
                                <summary className="flex items-center justify-between gap-2 px-3 py-2 cursor-pointer list-none select-none text-[10px] font-black uppercase tracking-[.2em] text-purple-300/60 hover:bg-purple-500/5 transition-colors">
                                  <div className="flex items-center gap-2">
                                    <Brain size={12} className="text-purple-400/60" />
                                    <span>Lógica Estratégica</span>
                                  </div>
                                  <ChevronDown size={12} className="opacity-60 transition-transform group-open/thought:rotate-180" />
                                </summary>
                                <div className="px-4 pb-4 pt-1 text-white/90 text-[11px] leading-relaxed italic border-t border-purple-500/10 font-medium">
                                  {children}
                                </div>
                              </details>
                            );
                          }
                          return <blockquote className="border-l-2 border-white/30 pl-4 py-1 italic mb-3 text-white/80 font-medium bg-white/[0.01] rounded-r-lg">{children}</blockquote>;
                        }
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>

              {message.content && (
                <div className="flex items-center gap-2 mt-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-200">
                  <button
                    onClick={() => {
                      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(message.content).catch(e => console.error("Clipboard API failed", e));
                        toast.success('Copiado');
                      }
                    }}
                    className="p-1 px-1.5 rounded bg-white/10 text-white/80 hover:text-white transition-colors border border-white/30"
                  >
                    <Copy size={11} />
                  </button>
                  {isLastMessage && message.role === 'model' && (
                    <div className="flex items-center gap-3">
                          <button
                             onClick={() => handleSendMessage(undefined, "Reforce ou explique melhor o ponto anterior.")?.catch((err: any) => console.error("Failed to explain better:", err))}
                             className="text-[9px] uppercase font-black tracking-widest text-white/90 hover:text-white transition-colors"
                          >
                            Explicar
                          </button>
                      {handleRegenerate && (
                         <button
                            onClick={handleRegenerate}
                            disabled={isLoading}
                            className="text-[9px] uppercase font-black tracking-widest text-white/90 hover:text-white transition-colors flex items-center gap-1"
                         >
                           <RotateCcw size={9} />
                           Processar
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
