import { 
  Plus, History, Terminal, 
  ChevronRight, Sparkles
} from 'lucide-react';
import { Button } from '../ui/button';
import { useUIStore } from '../../store/appStore';
import { AgentDefinition, Message } from '../../types';
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
    <header className="h-[56px] border-b border-border bg-card flex items-center justify-between px-4 shrink-0 z-[100] relative">
      <div className="flex-1 flex justify-start z-10">
      </div>

      <div className="flex-1 flex items-center justify-center z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={handleNewChat}>
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-sm transition-all relative overflow-hidden">
               <Terminal size={14} className="relative z-10" />
            </div>
            <span className="text-[14px] font-bold text-foreground leading-none">
              Nexus IA
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2 text-muted-foreground">
            <ChevronRight size={14} />
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 border border-border rounded-lg transition-all hover:bg-muted">
              <div className={cn("w-4 h-4 rounded-md flex items-center justify-center shadow-sm", activeAgent.color)}>
                <AgentIcon iconName={activeAgent.iconName} size={10} className="text-foreground" />
              </div>
              <span className="text-[12px] font-medium text-muted-foreground max-w-[150px] truncate leading-none">{currentChatTitle || activeAgent.name}</span>
              {isSaving && (
                <div className="flex items-center gap-1 ml-1">
                  <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-end gap-2 z-10">
        <div className="hidden sm:flex items-center mr-1 px-2 py-1 bg-primary/10 border border-primary/20 rounded-full gap-1.5 flex-shrink-0">
             <Sparkles size={10} className="text-primary" />
             <span className="text-[8px] font-black text-primary uppercase tracking-widest leading-none">Premium</span>
        </div>
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleNewChat}
          className="text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted w-8 h-8 transition-all"
        >
          <Plus size={16} />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsSidebarOpen(true)}
          className="text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted w-8 h-8 transition-all relative"
        >
          <History size={16} />
          {messages.length > 0 && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
          )}
        </Button>
      </div>
    </header>
  );
};
