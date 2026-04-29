import { 
  MessageSquare, Layout, Code, Settings, 
  ChevronLeft, ChevronRight, FolderOpen
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface NavbarProps {
  activeTab: 'chat' | 'preview' | 'code' | 'settings' | 'files';
  setActiveTab: (tab: any) => void;
  hasFiles: boolean;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

export const Navbar = ({ 
  activeTab, 
  setActiveTab, 
  hasFiles,
  isSidebarOpen,
  setIsSidebarOpen
}: NavbarProps) => {
  const tabs = [
    { id: 'chat', icon: MessageSquare, label: 'Chat' },
    { id: 'preview', icon: Layout, label: 'Preview' },
    { id: 'code', icon: Code, label: 'Código', dot: hasFiles },
    { id: 'settings', icon: Settings, label: 'Config' },
  ];

  return (
    <div className="bg-card border-t border-border flex items-center justify-center pb-[env(safe-area-inset-bottom)] z-[150] md:fixed md:bottom-6 md:left-1/2 md:-translate-x-1/2 md:w-auto md:min-w-[360px] md:h-[50px] md:rounded-xl md:border md:shadow-2xl select-none">
      <div className="flex w-full md:w-auto items-center justify-around h-14 md:h-full md:gap-1 px-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              if (isSidebarOpen) setIsSidebarOpen(false);
            }}
            className={cn(
              "flex flex-col md:flex-row items-center gap-1 md:gap-2 px-3 py-1.5 md:px-3 md:py-1.5 rounded-lg transition-all duration-300 relative group",
              activeTab === tab.id 
                ? "text-primary bg-muted shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]" 
                : "text-muted-foreground hover:text-foreground hover:bg-white/[0.05]"
            )}
          >
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-1 md:gap-2">
              <div className="relative">
                <tab.icon size={activeTab === tab.id ? 16 : 14} className="transition-all duration-300" />
                {tab.dot && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-primary border border-background shadow-sm" />
                )}
              </div>
              <span className={cn(
                "text-[10px] md:text-[11px] font-medium transition-all",
                activeTab === tab.id ? "opacity-100" : "opacity-70 group-hover:opacity-100"
              )}>
                {tab.label}
              </span>
            </div>
          </button>
        ))}

        <div className="hidden md:flex w-px h-3 bg-white/10 mx-1.5" />
        
        <button
          onClick={() => setActiveTab('files')}
          className={cn(
            "hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-300 text-muted-foreground hover:text-foreground group",
            activeTab === 'files' && "text-primary bg-muted"
          )}
        >
          <FolderOpen size={14} className="opacity-60 group-hover:opacity-100 transition-opacity" />
          <span className="text-[11px] font-medium opacity-80">Arquivos</span>
        </button>

        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={cn(
            "hidden md:flex items-center justify-center w-8 h-8 rounded-lg border transition-all duration-300 ml-1.5",
            isSidebarOpen 
              ? "bg-primary/10 border-primary/30 text-primary" 
              : "border-border bg-black/40 text-muted-foreground hover:text-foreground hover:border-border"
          )}
        >
          {isSidebarOpen ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>
    </div>
  );
};
