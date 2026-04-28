import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, X, Trash2, FolderOpen, Layers
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { cn } from '../lib/utils';
import { ChatSession, Message, GeneratedFile } from '../types';
import { extractFilesFromMarkdown } from '../lib/utils';

interface SidebarHistoryProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  historySearch: string;
  setHistorySearch: (search: string) => void;
  sessions: ChatSession[];
  currentChatId: string | null;
  setCurrentChatId: (id: string | null) => void;
  setMessages: (messages: Message[]) => void;
  setFileHistory: (history: any) => void;
  setGeneratedFiles: (files: GeneratedFile[]) => void;
  setActiveFileIndex: (index: number) => void;
  removeSession: (id: string) => void;
  resetChat: () => void;
  setIsClearHistoryModalOpen: (open: boolean) => void;
  deriveChatTitle: (content: string) => string;
}

export const SidebarHistory = ({
  isSidebarOpen,
  setIsSidebarOpen,
  historySearch,
  setHistorySearch,
  sessions,
  currentChatId,
  setCurrentChatId,
  setMessages,
  setFileHistory,
  setGeneratedFiles,
  setActiveFileIndex,
  removeSession,
  resetChat,
  setIsClearHistoryModalOpen
}: SidebarHistoryProps) => {
  return (
    <AnimatePresence>
      {isSidebarOpen && (
        <div className="fixed inset-0 z-[100] flex">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-[#000000]/80 backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200, duration: 0.3 }}
            className="relative w-full max-w-[320px] bg-[#1e1f20] h-full shadow-2xl flex flex-col border-r border-white/5"
          >
            <div className="p-4 flex items-center justify-between border-b border-white/5 bg-[#131314]/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                  <FolderOpen size={16} />
                </div>
                <h2 className="text-[14px] font-black uppercase text-white tracking-widest">Workspace</h2>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsSidebarOpen(false)}
                className="text-[#8e918f] hover:text-white rounded-xl hover:bg-white/5"
              >
                <X size={18} />
              </Button>
            </div>

            <div className="p-4">
              <div className="relative group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8e918f] group-focus-within:text-blue-400 transition-colors" size={14} />
                <Input 
                  placeholder="Pesquisar projetos..." 
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="pl-10 bg-[#131314] border-white/5 focus-visible:ring-1 focus-visible:ring-blue-400/50 h-10 text-[13px] rounded-xl placeholder:text-[#8e918f]/50"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-2 flex flex-col gap-1.5 custom-scrollbar pb-24">
              {sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center pt-24 px-6 text-center space-y-4 opacity-40">
                  <Layers size={48} className="text-[#8e918f]" strokeWidth={1} />
                  <p className="text-[14px] font-medium text-[#f1f3f4]">Nenhum projeto</p>
                  <p className="text-[12px] max-w-[180px]">Seus projetos anteriores aparecerão aqui.</p>
                </div>
              ) : (
                sessions
                  .filter(c => c.title.toLowerCase().includes(historySearch.toLowerCase()))
                  .sort((a, b) => (b.timestamp || b.updatedAt || 0) - (a.timestamp || a.updatedAt || 0))
                  .map(chat => (
                  <div 
                    key={chat.id}
                    className={cn(
                      "group relative flex flex-col gap-1 p-3.5 rounded-xl border border-transparent cursor-pointer transition-all duration-200",
                      currentChatId === chat.id 
                        ? "bg-[#333538] border-[#4a4d51] text-white shadow-lg" 
                        : "text-[#b2b5b4] hover:bg-[#333538]/40 hover:text-white"
                    )}
                    onClick={() => {
                      setCurrentChatId(chat.id);
                      setMessages(chat.messages);
                      if (chat.fileHistory) {
                        setFileHistory(chat.fileHistory);
                        const latestFiles = chat.fileHistory.length > 0 ? chat.fileHistory[chat.fileHistory.length - 1].files : [];
                        setGeneratedFiles(latestFiles);
                      } else {
                        const fullContent = chat.messages.filter(m => m.role === 'model').map(m => m.content).join('\n');
                        const files = extractFilesFromMarkdown(fullContent);
                        setFileHistory(files.length > 0 ? [{ timestamp: Date.now(), files }] : []);
                        setGeneratedFiles(files);
                      }
                      setActiveFileIndex(0);
                      setIsSidebarOpen(false);
                    }}
                  >
                    <div className="flex items-center gap-2 pr-8">
                      <FolderOpen size={14} className={cn("shrink-0", currentChatId === chat.id ? "text-[#a8c7fa]" : "text-[#8e918f]")} />
                      <span className="text-[14px] font-medium truncate">{chat.title}</span>
                    </div>
                    <span className="text-[11px] opacity-50 pl-6">
                      {new Date(chat.timestamp || chat.updatedAt || Date.now()).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSession(chat.id);
                        if (currentChatId === chat.id) resetChat();
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 text-[#8e918f] hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all z-20"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {sessions.length > 0 && (
              <div className="p-4 border-t border-white/5 bg-[#131314]/50">
                <button 
                  onClick={() => {
                    setIsClearHistoryModalOpen(true);
                    setIsSidebarOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-[12px] text-red-400/70 hover:text-red-400 hover:bg-red-400/5 rounded-lg transition-all font-medium"
                >
                  <Trash2 size={14} />
                  Limpar tudo
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
