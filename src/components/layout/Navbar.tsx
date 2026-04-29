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
    <div className="fixed bottom-0 left-0 right-0 h-[64px] pb-[env(safe-area-inset-bottom)] bg-[#141517] border-t border-white/20 flex items-center justify-center sm:px-4 z-[150] md:bottom-6 md:left-1/2 md:-translate-x-1/2 md:w-auto md:min-w-[360px] md:h-[50px] md:rounded-xl md:border md:border-white/30 select-none shadow-2xl">
      <div className="flex w-full md:w-auto items-center justify-around md:gap-1 px-2 md:px-2">
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
                ? "text-blue-400 bg-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]" 
                : "text-white/80 hover:text-white hover:bg-white/[0.05]"
            )}
          >
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-1 md:gap-2">
              <div className="relative">
                <tab.icon size={activeTab === tab.id ? 16 : 14} className="transition-all duration-300" />
                {tab.dot && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-blue-500 border border-[#141517] shadow-sm" />
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
            "hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-300 text-white/80 hover:text-white group",
            activeTab === 'files' && "text-blue-400 bg-white/5"
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
              ? "bg-blue-500/10 border-blue-500/30 text-blue-400" 
              : "border-white/30 bg-black/40 text-white/80 hover:text-white hover:border-white/20"
          )}
        >
          {isSidebarOpen ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>
    </div>
  );
};
