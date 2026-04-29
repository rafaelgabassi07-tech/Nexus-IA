import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, X, Trash2, Layers, Plus, Clock, ChevronRight, MessageSquare
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
            <div className="p-6 flex items-center justify-between bg-black/20 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-inner">
                  <Clock size={20} />
                </div>
                <div className="flex flex-col">
                  <h2 className="text-[14px] font-black uppercase text-white tracking-[0.2em] leading-none">Projetos</h2>
                  <span className="text-[10px] text-[#8e918f] font-bold uppercase tracking-widest mt-1.5 opacity-60">Histórico Recente</span>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsSidebarOpen(false)}
                className="text-[#8e918f] hover:text-white rounded-xl hover:bg-white/5 w-9 h-9"
              >
                <X size={18} />
              </Button>
            </div>

            {/* Search */}
            <div className="px-6 py-4">
              <div className="relative group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4a4d51] group-focus-within:text-blue-400 transition-colors" size={14} />
                <Input 
                  ref={searchInputRef}
                  placeholder="Pesquisar projetos..." 
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="pl-10 bg-[#161618] border-white/5 focus-visible:ring-1 focus-visible:ring-blue-500/30 h-11 text-[13px] rounded-xl placeholder:text-[#4a4d51] shadow-inner"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-1 custom-scrollbar pb-32">
              {safeSessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center pt-32 px-10 text-center space-y-6">
                  <div className="w-16 h-16 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-[#333538]">
                    <Layers size={32} strokeWidth={1} />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[15px] font-bold text-[#f1f3f4]">Nenhum projeto ainda</p>
                    <p className="text-[12px] text-[#8e918f] leading-relaxed">
                      Seus chats e códigos gerados serão salvos automaticamente aqui.
                    </p>
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
                      "group relative flex flex-col p-4 rounded-2xl border border-transparent cursor-pointer transition-all duration-300",
                      "hover:bg-white/[0.03] hover:border-white/5 active:scale-[0.98]"
                    )}
                    onClick={() => handleSelectSession(chat)}
                  >
                    <div className="flex items-start gap-4 pr-6">
                      <div className="w-10 h-10 rounded-xl bg-[#161618] border border-white/5 flex items-center justify-center text-[#8e918f] group-hover:text-blue-400 group-hover:border-blue-500/20 transition-all shadow-sm shrink-0">
                        <MessageSquare size={18} />
                      </div>
                      <div className="flex flex-col gap-1 min-w-0 flex-1">
                        <span className="text-[14px] font-bold text-[#e3e3e3] truncate group-hover:text-white transition-colors tracking-tight">
                          {chat.title || 'Sem título'}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-medium text-[#8e918f] uppercase tracking-wider">
                            {formatDate(chat.timestamp || chat.updatedAt)}
                          </span>
                          <span className="text-[10px] text-white/10">•</span>
                          <span className="text-[10px] font-medium text-[#8e918f] opacity-60">
                            {formatTime(chat.timestamp || chat.updatedAt)}
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-[#333538] group-hover:text-[#4a4d51] transition-colors self-center shrink-0" />
                    </div>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (chat.id) removeSession(chat.id);
                      }}
                      className="absolute right-3 top-3 p-2 opacity-0 group-hover:opacity-100 text-[#4a4d51] hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all z-20"
                      title="Excluir"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/5 bg-black/20">
              <button 
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('newChat'));
                  setIsSidebarOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all font-black uppercase text-[11px] tracking-[0.2em] shadow-lg shadow-blue-600/20 mb-3 active:scale-95"
              >
                <Plus size={16} strokeWidth={3} />
                Novo Projeto
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
