import { 
  MessageSquare, Layout, Code, Settings, 
  ChevronLeft, ChevronRight, FolderOpen
} from 'lucide-react';
import { motion } from 'motion/react';
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
    { id: 'chat', icon: MessageSquare, label: 'Inteligência' },
    { id: 'preview', icon: Layout, label: 'Visualizador' },
    { id: 'code', icon: Code, label: 'Workdir', dot: hasFiles },
    { id: 'settings', icon: Settings, label: 'Nexus Core' },
  ];

  if (activeTab === 'files') {
    // files is a subtab of code on desktop but direct on mobile
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[76px] pb-[env(safe-area-inset-bottom)] bg-black/60 backdrop-blur-3xl border-t border-white/5 flex items-center justify-center sm:px-6 z-[150] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] md:bottom-8 md:left-1/2 md:-translate-x-1/2 md:w-auto md:min-w-[440px] md:h-[68px] md:rounded-[2.5rem] md:border md:border-white/10 select-none">
      <div className="flex w-full md:w-auto items-center justify-around md:gap-1 px-2 md:px-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              if (isSidebarOpen) setIsSidebarOpen(false);
            }}
            className={cn(
              "flex flex-col md:flex-row items-center gap-1 md:gap-3 px-3 py-2 md:px-5 md:py-2.5 rounded-2xl transition-all duration-500 relative group",
              activeTab === tab.id 
                ? "text-blue-400 bg-blue-500/10" 
                : "text-[#8e918f] hover:text-white hover:bg-white/5"
            )}
          >
            {activeTab === tab.id && (
              <motion.div 
                layoutId="nav-glow"
                className="absolute inset-0 bg-blue-400/5 rounded-2xl md:bg-blue-400/10 z-0"
                initial={false}
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-1 md:gap-3">
              <div className="relative">
                <tab.icon size={22} className={cn("transition-all duration-500", activeTab === tab.id ? "scale-110 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" : "group-hover:scale-110")} />
                {tab.dot && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-blue-400 border-2 border-black shadow-sm animate-pulse" />
                )}
              </div>
              <span className={cn(
                "text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                activeTab === tab.id ? "opacity-100" : "opacity-40 group-hover:opacity-100"
              )}>
                {tab.label}
              </span>
            </div>
            {activeTab === tab.id && (
              <motion.div 
                layoutId="nav-line"
                className="absolute inset-x-8 bottom-1 h-0.5 bg-blue-400 hidden md:block" 
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
          </button>
        ))}

        <div className="hidden md:flex w-px h-6 bg-white/5 mx-2" />
        
        <button
          onClick={() => setActiveTab('files')}
          className={cn(
            "hidden md:flex items-center gap-3 px-4 py-2 rounded-2xl transition-all duration-500 text-[#8e918f] hover:text-white hover:bg-white/5 group",
            activeTab === 'files' && "text-blue-400 bg-blue-500/10"
          )}
        >
          <FolderOpen size={18} />
          <span className="text-[11px] font-black uppercase tracking-[0.15em] opacity-60 group-hover:opacity-100">Files</span>
        </button>

        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={cn(
            "hidden md:flex items-center justify-center w-10 h-10 rounded-full border transition-all duration-500 ml-2",
            isSidebarOpen 
              ? "bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-600/20" 
              : "border-white/5 bg-white/5 text-[#8e918f] hover:text-white hover:bg-white/10"
          )}
        >
          {isSidebarOpen ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </div>
  );
};
