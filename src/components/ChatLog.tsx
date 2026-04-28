import React from 'react';
import { 
  Brain, Layout, Code, Terminal, Activity, ArrowDown
} from 'lucide-react';
import { Button } from './ui/button';
import { Message, GeneratedFile } from '../types';
import { AgentDefinition } from '../agents';
import { cn } from '../lib/utils';
import { MessageItem } from './MessageItem';

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
  handleSendMessage: (e?: any, content?: string) => void;
  handleRegenerate?: () => void;
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
    <div 
      ref={scrollRef}
      className={cn(
        "flex-1 overflow-y-auto px-4 py-4 custom-scrollbar relative",
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
                onClick={() => handleSendMessage(undefined, s.prompt)}
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

      <div className="w-full flex flex-col pt-2 pb-4 space-y-6">
        {messages.map((msg, index) => (
          <MessageItem 
            key={msg.id || index}
            message={msg}
            index={index}
            activeAgent={activeAgent}
            generatedFiles={generatedFiles}
            activeFileIndex={activeFileIndex}
            setActiveFileIndex={setActiveFileIndex}
            setActiveTab={setActiveTab}
            isLoading={isLoading}
            isLastMessage={index === messages.length - 1}
            handleSendMessage={handleSendMessage}
            handleRegenerate={handleRegenerate}
          />
        ))}
      </div>

      {showScrollButton && (
        <div className="sticky bottom-4 left-0 right-0 flex justify-center z-50 pointer-events-none">
          <Button
            onClick={() => scrollToBottom()}
            className="pointer-events-auto bg-blue-600 hover:bg-blue-500 text-white rounded-full px-4 py-2 shadow-2xl flex items-center gap-2 text-xs font-bold animate-in bounce-in duration-300 border border-white/20"
          >
            Resposta em andamento... <ArrowDown size={14} />
          </Button>
        </div>
      )}
    </div>
  );
};
