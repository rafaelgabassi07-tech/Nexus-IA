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
    { id: 'chat', icon: MessageSquare, label: 'Omni' },
    { id: 'preview', icon: Layout, label: 'Stream' },
    { id: 'code', icon: Code, label: 'Binary', dot: hasFiles },
    { id: 'settings', icon: Settings, label: 'Kernel' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[64px] pb-[env(safe-area-inset-bottom)] bg-black/80 backdrop-blur-3xl border-t border-white/5 flex items-center justify-center sm:px-4 z-[150] md:bottom-6 md:left-1/2 md:-translate-x-1/2 md:w-auto md:min-w-[400px] md:h-[52px] md:rounded-xl md:border md:border-white/10 select-none shadow-2xl">
      <div className="flex w-full md:w-auto items-center justify-around md:gap-0.5 px-2 md:px-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              if (isSidebarOpen) setIsSidebarOpen(false);
            }}
            className={cn(
              "flex flex-col md:flex-row items-center gap-1 md:gap-2.5 px-3 py-1.5 md:px-4 md:py-2 rounded-lg transition-all duration-300 relative group",
              activeTab === tab.id 
                ? "text-[#00d2ff] bg-white/5 shadow-[inset_0_0_12px_rgba(0,210,255,0.05)]" 
                : "text-white/40 hover:text-white/80 hover:bg-white/[0.05]"
            )}
          >
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-1 md:gap-2">
              <div className="relative">
                <tab.icon size={activeTab === tab.id ? 16 : 15} className={cn("transition-all duration-300", activeTab === tab.id ? "scale-110 drop-shadow-[0_0_8px_rgba(0,210,255,0.4)]" : "opacity-70 group-hover:opacity-100 group-hover:scale-110")} />
                {tab.dot && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-blue-400 border border-black shadow-sm" />
                )}
              </div>
              <span className={cn(
                "text-[7px] md:text-[9px] font-black uppercase tracking-[.25em] transition-all italic",
                activeTab === tab.id ? "opacity-100" : "opacity-50 group-hover:opacity-80"
              )}>
                {tab.label}
              </span>
            </div>
          </button>
        ))}

        <div className="hidden md:flex w-px h-4 bg-white/10 mx-2" />
        
        <button
          onClick={() => setActiveTab('files')}
          className={cn(
            "hidden md:flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 text-white/40 hover:text-white group",
            activeTab === 'files' && "text-[#00d2ff] bg-white/5"
          )}
        >
          <FolderOpen size={14} className="opacity-60 group-hover:opacity-100 transition-opacity" />
          <span className="text-[9px] font-black uppercase tracking-widest opacity-50 group-hover:opacity-80 italic">Fs</span>
        </button>

        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={cn(
            "hidden md:flex items-center justify-center w-8 h-8 rounded-lg border transition-all duration-300 ml-1.5",
            isSidebarOpen 
              ? "bg-[#00d2ff]/10 border-[#00d2ff]/30 text-[#00d2ff]" 
              : "border-white/10 bg-white/5 text-white/40 hover:text-white/80"
          )}
        >
          {isSidebarOpen ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>
    </div>
  );
};
