import React from 'react';
import { 
  ArrowDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageItem } from './MessageItem';
import { AgentIcon } from './AgentIcon';
import { AgentDefinition } from '../../agents';
import { Message, GeneratedFile } from '../../types';

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
  handleSendMessage: (e?: any, content?: string, messagesToUse?: Message[]) => void;
  handleRegenerate: () => void;
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
  handleSendMessage,
  handleRegenerate
}: ChatLogProps) => {
  return (
    <div className="flex-1 overflow-hidden relative group/chat-log">
      <div 
        ref={scrollRef}
        className="h-full overflow-y-auto px-4 md:px-8 py-6 custom-scrollbar scroll-smooth"
      >
        <div className="max-w-3xl mx-auto space-y-6">
          <AnimatePresence initial={false}>
            {messages.length === 0 && (
              <motion.div 
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center pt-24"
              >
                <div className="w-16 h-16 rounded-xl bg-white/[0.01] border border-white/20 flex items-center justify-center mb-8 relative group overflow-hidden">
                  <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full opacity-80" />
                  <AgentIcon iconName={activeAgent.iconName} size={28} className="text-white/90 group-hover:text-white transition-all" />
                </div>
                <h1 className="text-[14px] font-black text-white/90 uppercase tracking-[.6em] mb-4 italic leading-none">Protocolo Nexus</h1>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-12 w-full max-w-lg px-4">
                  {[
                    "Construir landing page futurista",
                    "Arquitetar visualizador de dados",
                    "Inicializar microserviço de autenticação",
                    "Orquestrar biblioteca de componentes"
                  ].map((p) => (
                    <button
                      key={p}
                      onClick={() => handleSendMessage(undefined, p)}
                      className="px-4 py-2 bg-white/[0.02] border border-white/30 rounded-lg text-[9px] font-black uppercase tracking-widest text-white/90 hover:text-white hover:bg-white/[0.04] hover:border-[#00d2ff]/30 transition-all text-left truncate italic"
                    >
                      {`> ${p}`}
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
                activeFileIndex={activeFileIndex}
                setActiveFileIndex={setActiveFileIndex}
                setActiveTab={setActiveTab}
                isLoading={isLoading}
                isLastMessage={i === messages.length - 1}
                handleSendMessage={handleSendMessage}
                handleRegenerate={handleRegenerate}
              />
            ))}
          </AnimatePresence>
          
          <div className="h-20" />
        </div>
      </div>

      {showScrollButton && (
        <button
          onClick={() => scrollToBottom()}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-blue-600 text-white p-3 rounded-full shadow-2xl shadow-blue-600/40 hover:bg-blue-500 transition-all animate-bounce z-[60] border border-blue-400/20"
        >
          <ArrowDown size={20} strokeWidth={3} />
        </button>
      )}
    </div>
  );
};
