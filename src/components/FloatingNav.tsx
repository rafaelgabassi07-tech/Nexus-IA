import { motion } from 'motion/react';
import { 
  MessageSquare, Layout, Terminal, Settings, FolderOpen
} from 'lucide-react';
import { cn } from '../lib/utils';

interface FloatingNavProps {
  activeTab: 'chat' | 'preview' | 'code' | 'settings' | 'files';
  setActiveTab: (tab: any) => void;
  setSettingsTab: (tab: any) => void;
  hasFiles: boolean;
}

export const FloatingNav = ({ 
  activeTab, 
  setActiveTab, 
  setSettingsTab, 
  hasFiles 
}: FloatingNavProps) => {
  const navItems = [
    { id: 'chat', icon: MessageSquare, label: 'Chat' },
    { id: 'preview', icon: Layout, label: 'Canvas' },
    { id: 'code', icon: Terminal, label: 'Código', dot: hasFiles },
    { id: 'files', icon: FolderOpen, label: 'Arquivos' },
  ];

  return (
    <div className="fixed bottom-6 inset-x-0 px-4 flex justify-center z-[100] pointer-events-none">
      <nav className="relative flex items-center justify-center gap-1 sm:gap-2 bg-[#1e1e20]/95 backdrop-blur-2xl border border-white/10 py-2 px-3 sm:px-4 rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.4)] pointer-events-auto mx-auto w-auto">
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-[2rem] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] pointer-events-none" />
        
        <div className="flex flex-nowrap items-center gap-1 sm:gap-1.5">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={cn(
                "relative flex flex-col items-center justify-center p-2 min-w-[56px] sm:min-w-[64px] gap-1.5 transition-colors z-10 rounded-xl",
                activeTab === item.id ? "text-white" : "text-[#8e918f] hover:text-[#f1f3f4] hover:bg-white/5"
              )}
            >
              {activeTab === item.id && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  className="absolute inset-0 bg-[#a8c7fa]/15 rounded-xl -z-10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
                  transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                />
              )}
              <div className="relative">
                <item.icon size={22} strokeWidth={activeTab === item.id ? 2.5 : 2} className={cn(activeTab === item.id ? "text-[#a8c7fa]" : "")} />
                {item.id === 'code' && item.dot && <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 rounded-full bg-blue-500 border-2 border-[#1e1e20] shadow-[0_0_8px_rgba(59,130,246,0.6)]" />}
              </div>
              <span className="text-[10px] sm:text-[11px] font-semibold tracking-wide leading-none">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="flex-shrink-0 w-[1px] h-8 bg-white/10 mx-1 sm:mx-2 z-10 rounded-full"></div>

        <div className="flex flex-nowrap items-center gap-1 sm:gap-1.5">
          <button
            onClick={() => {
              setActiveTab('settings');
              setSettingsTab('overview');
            }}
            className={cn(
              "relative flex flex-col items-center justify-center p-2 min-w-[56px] sm:min-w-[64px] gap-1.5 transition-colors z-10 rounded-xl",
              activeTab === 'settings' ? "text-white" : "text-[#8e918f] hover:text-[#f1f3f4] hover:bg-white/5"
            )}
          >
            {activeTab === 'settings' && (
              <motion.div
                layoutId="bottom-nav-indicator"
                className="absolute inset-0 bg-[#a8c7fa]/15 rounded-xl -z-10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
                transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
              />
            )}
            <div className="relative">
              <Settings size={22} strokeWidth={activeTab === 'settings' ? 2.5 : 2} className={cn(activeTab === 'settings' ? "text-[#a8c7fa] rotate-90 transition-transform duration-700" : "hover:rotate-45 transition-transform duration-500")} />
            </div>
            <span className="text-[10px] sm:text-[11px] font-semibold tracking-wide leading-none">Ajustes</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
