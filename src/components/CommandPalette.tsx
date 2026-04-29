import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, MessageSquare, Code, Layout, Settings, 
  Download, Trash2, Zap, Files, RotateCcw
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useUIStore, useChatHistoryStore } from '../store/appStore';
import { toast } from 'sonner';

export const CommandPalette = () => {
  const { isCommandPaletteOpen, setIsCommandPaletteOpen, setActiveTab } = useUIStore();
  const { clearHistory } = useChatHistoryStore();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const actions = [
    { id: 'chat', name: 'Abrir Protocolo de Chat', icon: <MessageSquare size={16} />, shortcut: '1', action: () => setActiveTab('chat') },
    { id: 'code', name: 'Visualizar Código-Fonte', icon: <Code size={16} />, shortcut: '2', action: () => setActiveTab('code') },
    { id: 'preview', name: 'Renderizar Visualização', icon: <Layout size={16} />, shortcut: '3', action: () => setActiveTab('preview') },
    { id: 'files', name: 'Explorar Arquivos', icon: <Files size={16} />, shortcut: '4', action: () => setActiveTab('files') },
    { id: 'settings', name: 'Configurações de Núcleo', icon: <Settings size={16} />, shortcut: '5', action: () => setActiveTab('settings') },
    { id: 'debug', name: 'Alternar Logs do Sistema', icon: <Zap size={16} />, shortcut: 'L', action: () => {
        const btn = document.querySelector('[title="Terminal"]') as HTMLButtonElement | null;
        if (btn) btn.click();
    }},
    { id: 'reset', name: 'Reiniciar Kernel Nexus', icon: <RotateCcw size={16} />, shortcut: 'R', action: () => {
        const btn = document.querySelector('[title="Reset Matrix"]') as HTMLButtonElement | null;
        if (btn) btn.click();
    }},
    { id: 'export', name: 'Exportar Pacote de Dados', icon: <Download size={16} />, shortcut: 'E', action: () => {
        const btn = document.getElementById('nexus-export-trigger');
        if (btn) btn.click();
        else toast.info("Função de exportação não disponível nesta vista.");
    }},
    { id: 'clear', name: 'Formatar Protocolos de Chat', icon: <Trash2 size={16} />, shortcut: 'D', action: () => {
        if (confirm("Deseja formatar todos os protocolos de chat? Isso é irreversível.")) {
            clearHistory();
            toast.success("Protocolos formatados com sucesso.");
        }
    }},
  ];

  const filteredActions = actions.filter(action => 
    action.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isCommandPaletteOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(!isCommandPaletteOpen);
      }
      
      if (!isCommandPaletteOpen) return;

      if (e.key === 'Escape') setIsCommandPaletteOpen(false);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredActions.length);
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredActions.length) % filteredActions.length);
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        filteredActions[selectedIndex]?.action();
        setIsCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setIsCommandPaletteOpen, filteredActions, selectedIndex]);

  return (
    <AnimatePresence>
      {isCommandPaletteOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCommandPaletteOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed left-1/2 top-[20%] -translate-x-1/2 w-full max-w-[500px] z-[9999] px-4"
          >
            <div className="bg-[#0d0d0e]/90 backdrop-blur-2xl border border-white/30 rounded-2xl shadow-2xl overflow-hidden shadow-blue-500/5">
              <div className="relative group">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 group-focus-within:text-blue-400 transition-colors" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="SINTETIZAR COMANDO NEXUS..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-14 bg-transparent border-b border-white/20 pl-12 pr-4 text-sm font-bold text-white placeholder:text-white/5 focus:outline-none uppercase tracking-widest italic"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-60">
                    <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded border border-white/30">ESC</span>
                </div>
              </div>
              
              <div className="max-h-[300px] overflow-y-auto p-2 custom-scrollbar">
                {filteredActions.length > 0 ? (
                  filteredActions.map((action, index) => (
                    <button
                      key={action.id}
                      onClick={() => {
                        action.action();
                        setIsCommandPaletteOpen(false);
                      }}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group text-left",
                        selectedIndex === index ? "bg-white/5 border border-white/30" : "border border-transparent"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg transition-colors",
                          selectedIndex === index ? "text-blue-400 bg-blue-500/10" : "text-white/80 bg-white/5"
                        )}>
                          {action.icon}
                        </div>
                        <span className={cn(
                           "text-[12px] font-bold tracking-tight uppercase",
                           selectedIndex === index ? "text-white" : "text-white/80"
                        )}>{action.name}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-60">
                         <span className="text-[9px] font-black uppercase">{action.shortcut}</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="py-10 flex flex-col items-center justify-center opacity-60 text-center">
                    <Zap size={24} className="mb-2" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Nenhum comando sintetizado</span>
                  </div>
                )}
              </div>
              
              <div className="h-8 bg-white/[0.02] border-t border-white/20 flex items-center justify-between px-4">
                 <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                       <span className="text-[8px] text-white/80 font-black uppercase">Navegar</span>
                       <div className="flex gap-1">
                          <span className="text-[8px] bg-white/10 px-1 rounded">↑</span>
                          <span className="text-[8px] bg-white/10 px-1 rounded">↓</span>
                       </div>
                    </div>
                    <div className="flex items-center gap-1">
                       <span className="text-[8px] text-white/80 font-black uppercase">Executar</span>
                       <span className="text-[8px] bg-white/10 px-1 rounded">↵</span>
                    </div>
                 </div>
                 <span className="text-[8px] font-black italic text-blue-500/40 uppercase tracking-tighter">Protocolo de Comando Nexus 1.0</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
