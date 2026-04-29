import { 
  Plus, History, Terminal, 
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
    <header className="h-[48px] border-b border-white/20 bg-[#141517] flex items-center justify-between px-4 shrink-0 z-[100] relative">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 group cursor-pointer" onClick={handleNewChat}>
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm transition-all relative overflow-hidden">
             <Terminal size={14} className="relative z-10" />
          </div>
          <div className="flex flex-col">
            <span className="text-[14px] font-bold text-white leading-none flex items-center gap-1">
              Nexus IA
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 text-white/80">
          <ChevronRight size={14} />
          <div className="flex items-center gap-2 px-2 py-1 bg-white/[0.03] border border-white/20 rounded-lg transition-all hover:bg-white/[0.05]">
            <div className={cn("w-4 h-4 rounded-md flex items-center justify-center shadow-sm", activeAgent.color)}>
              <AgentIcon iconName={activeAgent.iconName} size={10} className="text-white" />
            </div>
            <span className="text-[12px] font-medium text-white/70 max-w-[150px] truncate">{currentChatTitle || activeAgent.name}</span>
            {isSaving && (
              <div className="flex items-center gap-1 ml-1">
                <div className="w-1 h-1 rounded-full bg-blue-400 animate-pulse" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center mr-1 px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded-full gap-1.5 flex-shrink-0">
             <Sparkles size={10} className="text-purple-400" />
             <span className="text-[8px] font-black text-purple-400 uppercase tracking-widest leading-none">Premium</span>
        </div>
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleNewChat}
          className="text-[#8e918f] hover:text-white rounded-lg hover:bg-white/5 w-8 h-8 transition-all"
        >
          <Plus size={16} />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsSidebarOpen(true)}
          className="text-[#8e918f] hover:text-white rounded-lg hover:bg-white/5 w-8 h-8 transition-all relative"
        >
          <History size={16} />
          {messages.length > 0 && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-blue-500" />
          )}
        </Button>
      </div>
    </header>
  );
};
