import { History } from 'lucide-react';
import { AgentDefinition, Message } from '../types';
import { AgentIcon } from './AgentIcon';
import { cn } from '../lib/utils';
import { useUIStore } from '../store/appStore';

interface HeaderProps {
  activeAgent: AgentDefinition;
  messages: Message[];
  currentChatTitle?: string;
}

export const Header = ({ 
  activeAgent, 
  currentChatTitle,
}: HeaderProps) => {
  const { isSidebarOpen, setIsSidebarOpen } = useUIStore();

  return (
    <header className="h-[64px] min-h-[64px] py-1 flex items-center justify-between px-4 md:px-6 bg-background/80 backdrop-blur-md flex-shrink-0 border-b border-border relative z-[60]">
      <div className="flex items-center gap-4 group cursor-pointer" onClick={() => window.location.reload()}>
        <div className={cn(
          "flex items-center justify-center w-[38px] h-[38px] rounded-xl text-white shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:rotate-3 overflow-hidden border border-white/10",
          activeAgent.color || "bg-gradient-to-tr from-blue-600 to-indigo-600"
        )}>
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <AgentIcon iconName={activeAgent.iconName} size={18} />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <h1 className="text-[13px] font-black text-white uppercase tracking-[0.2em] leading-none">
              {activeAgent.name}
            </h1>
            <div className={cn(
              "w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"
            )} />
          </div>
          <p className="text-[8px] text-muted-foreground font-black uppercase tracking-[0.3em] leading-none mt-1.5">
            Software Intelligence Matrix
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {currentChatTitle && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/5">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400/40" />
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest truncate max-w-[200px]">
              {currentChatTitle}
            </span>
          </div>
        )}

        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300",
            isSidebarOpen 
              ? "bg-[#a8c7fa]/10 text-[#a8c7fa] border border-[#a8c7fa]/20" 
              : "bg-white/[0.02] text-[#8e918f] border border-white/5 hover:bg-white/[0.05] hover:text-[#e3e3e3]"
          )}
          title="Histórico de Projetos"
        >
          <History size={20} strokeWidth={2} className={cn("transition-transform duration-300", isSidebarOpen ? "-rotate-12" : "hover:-rotate-12")} />
        </button>
      </div>
    </header>
  );
};
