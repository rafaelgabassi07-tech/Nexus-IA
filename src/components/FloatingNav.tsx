import { motion } from 'motion/react';
import { 
  MessageSquare, Layout, Terminal, Settings, History as HistoryIcon 
} from 'lucide-react';
import { cn } from '../lib/utils';

interface FloatingNavProps {
  activeTab: 'chat' | 'preview' | 'code' | 'settings';
  setActiveTab: (tab: any) => void;
  setSettingsTab: (tab: any) => void;
  setIsSidebarOpen: (open: boolean) => void;
  hasFiles: boolean;
}

export const FloatingNav = ({ 
  activeTab, 
  setActiveTab, 
  setSettingsTab, 
  setIsSidebarOpen, 
  hasFiles 
}: FloatingNavProps) => {
  const navItems = [
    { id: 'chat', icon: MessageSquare, label: 'Chat' },
    { id: 'preview', icon: Layout, label: 'Canvas' },
    { id: 'code', icon: Terminal, label: 'Código', dot: hasFiles },
  ];

  return (
    <div className="fixed bottom-4 inset-x-0 px-4 flex justify-center z-[100] pointer-events-none">
      <nav className="relative flex items-center justify-between bg-[#1e1e1f]/95 backdrop-blur-xl border border-[#333538] py-1.5 px-3 rounded-full shadow-2xl w-full max-w-[500px] pointer-events-auto ring-1 ring-black/20">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={cn(
              "relative flex flex-col items-center justify-center p-2 min-w-[56px] gap-1 transition-colors z-10",
              activeTab === item.id ? "text-white" : "text-[#8e918f] hover:text-[#f1f3f4]"
            )}
          >
            {activeTab === item.id && (
              <motion.div
                layoutId="bottom-nav-indicator"
                className="absolute inset-0 bg-[#a8c7fa]/20 rounded-full -z-10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <div className="relative">
              <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} className={cn(activeTab === item.id ? "text-[#a8c7fa]" : "")} />
              {item.id === 'code' && item.dot && <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2 rounded-full bg-red-500 border-2 border-[#1e1e1f]" />}
            </div>
            <span className="text-[10px] font-medium tracking-wide leading-none">{item.label}</span>
          </button>
        ))}

        <div className="w-[1px] h-6 bg-[#333538] mx-1 z-10"></div>

        <div className="flex items-center">
          <button
            onClick={() => {
              setActiveTab('settings');
              setSettingsTab('overview');
            }}
            className={cn(
              "relative flex flex-col items-center justify-center p-2 min-w-[56px] gap-1 transition-colors z-10",
              activeTab === 'settings' ? "text-white" : "text-[#8e918f] hover:text-[#f1f3f4]"
            )}
          >
            {activeTab === 'settings' && (
              <motion.div
                layoutId="bottom-nav-indicator"
                className="absolute inset-0 bg-[#a8c7fa]/20 rounded-full -z-10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <div className="relative">
              <Settings size={20} strokeWidth={activeTab === 'settings' ? 2.5 : 2} className={cn(activeTab === 'settings' ? "text-[#a8c7fa] rotate-45 transition-transform duration-500" : "")} />
            </div>
            <span className="text-[10px] font-medium tracking-wide leading-none">Ajustes</span>
          </button>

          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="relative flex flex-col items-center justify-center p-2 min-w-[64px] gap-1 text-[#8e918f] hover:text-[#f1f3f4] transition-colors z-10 group"
          >
            <HistoryIcon size={20} className="group-hover:-rotate-12 transition-transform duration-300" strokeWidth={2} />
            <span className="text-[10px] font-medium tracking-wide leading-none">Histórico</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
