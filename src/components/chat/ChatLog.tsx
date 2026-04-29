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
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center justify-center pt-20"
              >
                <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-tr from-blue-500/20 to-purple-500/20 border border-white/5 flex items-center justify-center shadow-2xl mb-8 relative group overflow-hidden">
                  <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
                  <AgentIcon iconName={activeAgent.iconName} size={40} className="text-white relative z-10" />
                </div>
                <h1 className="text-[28px] font-black text-white uppercase tracking-tighter mb-4 italic">Nexus IA</h1>
                <p className="text-[14px] text-[#8e918f] text-center max-w-[320px] font-medium leading-relaxed opacity-60 px-6">
                  Manifeste sua visão através do código. Como posso orquestrar seu próximo projeto hoje?
                </p>
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
