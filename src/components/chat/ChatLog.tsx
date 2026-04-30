import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { 
  ArrowDown,
  Globe,
  BarChart,
  Shield,
  Layout
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { MessageItem } from './MessageItem';
import { AgentIcon } from './AgentIcon';
import { AgentDefinition } from '../../types';
import { Message, GeneratedFile } from '../../types';
import { useSettingsStore } from '../../store/appStore';

interface ChatLogProps {
  messages: Message[];
  isLoading: boolean;
  activeAgent: AgentDefinition;
  generatedFiles: GeneratedFile[];
  activeFilePath: string | null;
  setActiveFilePath: (path: string | null) => void;
  setActiveTab: (tab: any) => void;
  handleSendMessage: (e?: any, content?: string, messagesToUse?: Message[]) => void;
  handleRegenerate: () => void;
}

export const ChatLog = memo(({
  messages,
  isLoading,
  activeAgent,
  generatedFiles,
  activeFilePath,
  setActiveFilePath,
  setActiveTab,
  handleSendMessage,
  handleRegenerate
}: ChatLogProps) => {
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (scrollRef.current) {
      const el = scrollRef.current;
      el.scrollTo({
        top: el.scrollHeight,
        behavior
      });
    }
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      const isBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
      setIsAtBottom(isBottom);
      setShowScrollButton(!isBottom);
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  // Use a ResizeObserver on the content to keep it scrolled if we are at bottom
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contentRef.current) return;
    
    let lastHeight = contentRef.current.scrollHeight;
    
    const observer = new ResizeObserver(() => {
      if (!contentRef.current) return;
      const currentHeight = contentRef.current.scrollHeight;
      
      if (currentHeight !== lastHeight) {
        lastHeight = currentHeight;
        if (isAtBottom) {
          scrollToBottom('auto');
        }
      }
    });

    observer.observe(contentRef.current);
    
    // Also observe the scroll logic
    return () => observer.disconnect();
  }, [isAtBottom, scrollToBottom]);

  // Handle messages length change
  useEffect(() => {
    if (isAtBottom) {
      setTimeout(() => scrollToBottom('smooth'), 100);
    }
  }, [messages.length]);

  return (
    <div className={cn("flex-1 overflow-hidden relative group/chat-log", messages.length === 0 && "h-full")}>
      <div 
        ref={scrollRef}
        className={cn(
          "h-full px-4 md:px-8 py-6 custom-scrollbar scroll-smooth flex flex-col",
          messages.length > 0 ? "overflow-y-auto" : "overflow-hidden items-center justify-center"
        )}
      >
        <div ref={contentRef} className={cn(
          "max-w-3xl mx-auto space-y-6 w-full",
          messages.length === 0 ? "h-full flex flex-col items-center justify-center" : ""
        )}>
          {/* Intelligence Badge */}
          {messages.length > 0 && useSettingsStore.getState().collectiveIntelligence.lessonsLearned.length > 0 && (
             <div className="flex justify-center mb-4 mt-2">
                <div className="px-3 py-1.5 bg-black border border-emerald-500 rounded-full flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-700 shadow-lg shadow-emerald-500/20">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500 italic">Collective Intelligence Active ({useSettingsStore.getState().collectiveIntelligence.lessonsLearned.length} Protocolos)</span>
                </div>
             </div>
          )}
          <AnimatePresence initial={false}>
            {messages.length === 0 && (
              <motion.div 
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center w-full"
              >
                <div className="w-14 h-14 rounded-xl bg-muted border border-border flex items-center justify-center mb-4 relative group">
                  <AgentIcon iconName={activeAgent.iconName} size={24} className="text-muted-foreground group-hover:text-foreground transition-all" />
                </div>
                <h1 className="text-[10px] md:text-[12px] font-black text-muted-foreground uppercase tracking-[.6em] mb-4 italic box-border">Protocolo Nexus</h1>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 w-full max-w-lg px-4">
                  {[
                    { text: "Construir landing page futurista", icon: <Globe size={10} /> },
                    { text: "Arquitetar visualizador de dados", icon: <BarChart size={10} /> },
                    { text: "Inicializar microserviço de autenticação", icon: <Shield size={10} /> },
                    { text: "Orquestrar biblioteca de componentes", icon: <Layout size={10} /> }
                  ].map((p) => (
                    <button
                      key={p.text}
                      onClick={() => handleSendMessage(undefined, p.text)}
                      className="px-3 py-2 bg-muted border border-border rounded-lg text-[8px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted/80 hover:border-primary transition-all text-left truncate italic flex items-center gap-2 group"
                    >
                      <span className="text-primary/40 group-hover:text-primary transition-colors">{p.icon}</span>
                      {p.text}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {messages.map((m, i) => (
              <MessageItem 
                key={m.id} 
                message={m} 
                index={i}
                activeAgent={activeAgent}
                generatedFiles={generatedFiles}
                activeFilePath={activeFilePath}
                setActiveFilePath={setActiveFilePath}
                setActiveTab={setActiveTab}
                isLoading={isLoading}
                isLastMessage={i === messages.length - 1}
                handleSendMessage={handleSendMessage}
                handleRegenerate={handleRegenerate}
              />
            ))}
          </AnimatePresence>
          
          {messages.length > 0 && <div className="h-20" />}
        </div>
      </div>

      {showScrollButton && (
        <button
          onClick={() => scrollToBottom()}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground p-3 rounded-full shadow-2xl shadow-primary hover:bg-primary transition-all animate-bounce z-[60] border border-primary"
        >
          <ArrowDown size={20} strokeWidth={3} />
        </button>
      )}
    </div>
  );
});
