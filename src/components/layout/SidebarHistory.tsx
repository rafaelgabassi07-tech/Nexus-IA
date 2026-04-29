import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, X, Trash2, Layers, Plus, Clock, MessageSquare
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { cn } from '../../lib/utils';
import { useChatHistoryStore, useUIStore } from '../../store/appStore';

export const SidebarHistory = () => {
  const { 
    isSidebarOpen, 
    setIsSidebarOpen, 
  } = useUIStore();
  
  const { 
    sessions, 
    removeSession, 
  } = useChatHistoryStore();

  const [historySearch, setHistorySearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSidebarOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 300);
    }
  }, [isSidebarOpen]);

  // Handle session selection
  const handleSelectSession = (chat: any) => {
    window.dispatchEvent(new CustomEvent('loadSession', { detail: chat.id }));
    setIsSidebarOpen(false);
  };

  const safeSessions = Array.isArray(sessions) ? sessions.filter(c => c && typeof c === 'object' && c.id) : [];

  const formatDate = (val: any) => {
    if (!val) return '--/--';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return '--/--';
      return d.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' });
    } catch {
      return '--/--';
    }
  };

  const formatTime = (val: any) => {
    if (!val) return '--:--';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return '--:--';
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '--:--';
    }
  };

  return (
    <AnimatePresence>
      {isSidebarOpen && (
        <div className="fixed inset-0 z-[200] flex justify-end pointer-events-auto overflow-hidden">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-[320px] bg-[#0d0d0e] h-full shadow-[-20px_0_50px_rgba(0,0,0,0.3)] flex flex-col border-l border-white/5"
          >
            {/* Header */}
            <div className="p-4 flex items-center justify-between border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/10">
                  <Clock size={14} />
                </div>
                <div className="flex flex-col">
                  <h2 className="text-[11px] font-black uppercase text-white tracking-widest leading-none">Projects</h2>
                  <span className="text-[8px] text-[#8e918f] font-bold uppercase tracking-[0.2em] mt-1 opacity-40">System History</span>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsSidebarOpen(false)}
                className="text-[#8e918f] hover:text-white rounded-lg hover:bg-white/5 w-7 h-7"
              >
                <X size={14} />
              </Button>
            </div>

            {/* Search */}
            <div className="px-4 py-3">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a4d51] group-focus-within:text-blue-400 transition-colors" size={12} />
                <Input 
                  ref={searchInputRef}
                  placeholder="Filter context..." 
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="pl-9 bg-[#111113] border-white/5 focus-visible:ring-1 focus-visible:ring-blue-500/20 h-8 text-[11px] rounded-lg placeholder:text-[#333538] shadow-inner"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-2 flex flex-col gap-0.5 custom-scrollbar pb-32">
              {safeSessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center pt-20 px-8 text-center space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-white/[0.01] border border-white/5 flex items-center justify-center text-[#222325]">
                    <Layers size={24} strokeWidth={1} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[12px] font-bold text-[#f1f3f4]/40 uppercase tracking-widest">Void Detected</p>
                  </div>
                </div>
              ) : (
                safeSessions
                  .filter(c => (c.title || '').toLowerCase().includes(historySearch.toLowerCase()))
                  .sort((a, b) => {
                    const timeA = Number(a.timestamp || a.updatedAt || 0);
                    const timeB = Number(b.timestamp || b.updatedAt || 0);
                    return timeB - timeA;
                  })
                  .map(chat => (
                  <div 
                    key={chat.id}
                    className={cn(
                      "group relative flex flex-col px-3 py-2.5 rounded-lg border border-transparent cursor-pointer transition-all duration-200",
                      "hover:bg-white/[0.02] hover:border-white/5 active:scale-[0.99]"
                    )}
                    onClick={() => handleSelectSession(chat)}
                  >
                    <div className="flex items-start gap-3 pr-6">
                      <div className="w-8 h-8 rounded-lg bg-[#161618] border border-white/5 flex items-center justify-center text-[#8e918f] group-hover:text-blue-400 group-hover:border-blue-500/20 transition-all shadow-sm shrink-0">
                        <MessageSquare size={14} />
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                        <span className="text-[12px] font-bold text-[#e3e3e3]/80 truncate group-hover:text-white transition-colors tracking-tight">
                          {chat.title || 'Untitled Session'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-bold text-[#8e918f]/40 uppercase tracking-tighter italic">
                            {formatDate(chat.timestamp || chat.updatedAt)}
                          </span>
                          <span className="text-[9px] text-white/5">•</span>
                          <span className="text-[9px] font-bold text-[#8e918f]/40 uppercase tracking-tighter">
                            {formatTime(chat.timestamp || chat.updatedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (chat.id) removeSession(chat.id);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 opacity-0 group-hover:opacity-100 text-[#4a4d51] hover:text-red-400 hover:bg-red-400/10 rounded-md transition-all z-20"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/5 bg-black/20">
              <button 
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('newChat'));
                  setIsSidebarOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-600/10 mb-2 active:scale-95"
              >
                <Plus size={14} strokeWidth={3} />
                New Matrix
              </button>
              
              {sessions.length > 0 && (
                <button 
                  onClick={() => {
                    if (confirm('Deseja limpar todo o histórico?')) {
                      useChatHistoryStore.getState().clearHistory();
                      setIsSidebarOpen(false);
                    }
                  }}
                  className="w-full py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#4a4d51] hover:text-red-400/60 transition-colors"
                >
                  Limpar Histórico
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
