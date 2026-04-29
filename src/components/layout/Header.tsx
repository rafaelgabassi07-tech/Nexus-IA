import { 
  Plus, History, Terminal, Share2, 
  ChevronRight, Sparkles
} from 'lucide-react';
import { Button } from '../ui/button';
import { useUIStore } from '../../store/appStore';
import { AgentDefinition } from '../../agents';
import { Message } from '../../types';
import { AgentIcon } from '../chat/AgentIcon';
import { cn } from '../../lib/utils';

interface HeaderProps {
  activeAgent: AgentDefinition;
  messages: Message[];
  currentChatTitle: string;
}

export const Header = ({ activeAgent, messages, currentChatTitle }: HeaderProps) => {
  const { setIsSidebarOpen, isSaving } = useUIStore();

  const handleNewChat = () => {
    window.dispatchEvent(new CustomEvent('newChat'));
  };

  return (
    <header className="h-[48px] border-b border-white/5 bg-black/40 backdrop-blur-3xl flex items-center justify-between px-4 shrink-0 z-[100] relative">
      <div className="flex items-center gap-3 md:gap-6">
        <div className="flex items-center gap-2.5 group cursor-pointer" onClick={handleNewChat}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#00d2ff] to-[#3a7bd5] flex items-center justify-center text-white shadow-xl group-hover:scale-105 transition-all duration-500 relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-shimmer" />
             <Terminal size={18} className="relative z-10" />
          </div>
          <div className="flex flex-col">
            <span className="text-[14px] font-black tracking-tighter text-white uppercase italic leading-none flex items-center gap-1">
              Nexus <span className="text-[#00d2ff]">IA</span>
            </span>
            <div className="flex items-center gap-1 mt-0.5 opacity-50">
               <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
               <span className="text-[7px] font-black text-emerald-400 uppercase tracking-widest">Active</span>
            </div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 text-white/10">
          <ChevronRight size={14} />
          <div className="flex items-center gap-2 px-3 py-1 bg-white/[0.02] border border-white/5 rounded-xl transition-all hover:bg-white/[0.04]">
            <div className={cn("w-5 h-5 rounded-md flex items-center justify-center border border-white/5 shadow-sm", activeAgent.color)}>
              <AgentIcon iconName={activeAgent.iconName} size={12} className="text-white" />
            </div>
            <span className="text-[11px] font-bold text-[#f1f3f4]/80 tracking-tight truncate max-w-[150px]">{currentChatTitle || activeAgent.name}</span>
            {isSaving && (
              <div className="flex items-center gap-1.5 ml-2">
                <div className="w-1 h-1 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-[7px] font-black text-blue-400 uppercase tracking-widest hidden lg:inline">Saving</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <div className="hidden sm:flex items-center mr-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full gap-2">
            <Sparkles size={12} className="text-purple-400" />
            <span className="text-[9px] font-black uppercase tracking-widest text-purple-400">Pro Edition</span>
        </div>

        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleNewChat}
          className="text-[#8e918f] hover:text-white rounded-xl hover:bg-white/5 w-10 h-10 border border-transparent hover:border-white/5 transition-all"
        >
          <Plus size={20} />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-[#8e918f] hover:text-white rounded-xl hover:bg-white/5 w-10 h-10 border border-transparent hover:border-white/5 transition-all"
        >
          <Share2 size={18} />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsSidebarOpen(true)}
          className="text-[#8e918f] hover:text-white rounded-xl hover:bg-white/5 w-10 h-10 border border-transparent hover:border-white/5 transition-all relative"
        >
          <History size={20} />
          {messages.length > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-500 border border-[#0d0d0e] shadow-sm" />
          )}
        </Button>
      </div>
    </header>
  );
};
