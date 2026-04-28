

import { 
  Download, Share2, Database
} from 'lucide-react';
import { 
  useSettingsStore, 
  useUIStore 
} from '../store/appStore';
import { NEXUS_MODELS } from '../lib/models';
import { exportService, ExportFormat } from '../services/exportService';
import { AgentDefinition, Message, GeneratedFile } from '../types';
import { AgentIcon } from './AgentIcon';
import { cn } from '../lib/utils';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from './ui/select';

interface HeaderProps {
  activeAgent: AgentDefinition;
  messages: Message[];
  generatedFiles: GeneratedFile[];
  currentChatTitle?: string;
  historyEntry?: { timestamp: number, files: GeneratedFile[] }[];
}

export const Header = ({ 
  activeAgent, 
  messages,
  generatedFiles,
  currentChatTitle,
  historyEntry
}: HeaderProps) => {
  const { selectedModel, setSelectedModel } = useSettingsStore();
  const { isSaving } = useUIStore();

  const handleExport = (format: ExportFormat) => {
    exportService.export(format, {
      session: { 
        id: 'current', 
        title: currentChatTitle || 'Novo Protocolo', 
        timestamp: Date.now(), 
        updatedAt: Date.now(),
        lastMessage: '',
        messages,
        fileHistory: historyEntry || []
      },
      agent: activeAgent,
      files: generatedFiles
    });
  };

  return (
    <header className="h-[64px] min-h-[64px] py-1 flex items-center justify-between px-4 md:px-6 bg-[#131314]/80 backdrop-blur-md flex-shrink-0 border-b border-white/5 relative z-[60]">
      <div className="flex items-center gap-4 group cursor-pointer" onClick={() => window.location.reload()}>
        <div className={cn(
          "flex items-center justify-center w-[38px] h-[38px] rounded-xl text-white shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:rotate-3 overflow-hidden border border-white/10",
          activeAgent.color || "bg-gradient-to-tr from-blue-600 to-indigo-600"
        )}>
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <AgentIcon iconName={activeAgent.iconName} size={18} />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <h1 className="text-[13px] font-black text-white uppercase tracking-[0.2em] leading-none">
              {activeAgent.name}
            </h1>
            <div className={cn(
              "flex items-center gap-1 px-1.5 py-0.5 rounded-full transition-all duration-500",
              isSaving 
                ? "bg-blue-500/10 text-blue-400" 
                : "bg-emerald-500/10 text-emerald-400"
            )}>
              <div className={cn(
                "w-1 h-1 rounded-full",
                isSaving ? "bg-blue-400 animate-spin" : "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"
              )} />
              <span className="text-[6px] font-black uppercase tracking-widest leading-none">
                {isSaving ? "Gravando" : "Sincronizado"}
              </span>
            </div>
          </div>
          <p className="text-[7px] text-[#5f6368] font-black uppercase tracking-[0.3em] leading-none mt-1">Status: Online</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 mr-2 px-1 py-1 rounded-lg bg-white/[0.02] border border-white/5">
          <button 
            onClick={() => handleExport('markdown')}
            className="p-1.5 text-[#8e918f] hover:text-white rounded-md hover:bg-white/5 transition-colors"
            title="Exportar Markdown"
          >
            <Download size={16} />
          </button>
          <button 
            onClick={() => handleExport('nexus-archive')}
            className="p-1.5 text-[#8e918f] hover:text-white rounded-md hover:bg-white/5 transition-colors"
            title="Nexus Archive (.nxs)"
          >
            <Database size={16} />
          </button>
          <button 
            onClick={() => handleExport('html-bundle')}
            className="p-1.5 text-[#8e918f] hover:text-white rounded-md hover:bg-white/5 transition-colors"
            title="HTML Bundle (Preview Offline)"
          >
            <Share2 size={16} />
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-4 px-4 py-1.5 rounded-full bg-white/[0.02] border border-white/5">
           <div className="flex flex-col items-end">
             <span className="text-[8px] font-black text-white/40 uppercase tracking-widest leading-none">Status</span>
             <span className={cn(
               "text-[9px] font-bold uppercase tracking-tighter mt-1 transition-colors duration-300",
               isSaving ? "text-blue-400 animate-pulse" : "text-emerald-400"
             )}>
               {isSaving ? 'Gravando...' : 'Sincronizado'}
             </span>
           </div>
           <div className="w-px h-4 bg-white/10" />
           <div className="flex flex-col items-end">
             <span className="text-[8px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">Motor</span>
             <Select value={selectedModel} onValueChange={(val) => val && setSelectedModel(val)}>
               <SelectTrigger className="h-4 p-0 text-[9px] font-bold text-zinc-400 hover:text-white uppercase tracking-tighter bg-transparent border-0 focus:ring-0 gap-1 min-w-0">
                 <SelectValue />
               </SelectTrigger>
               <SelectContent className="bg-[#1a1b1e] border-white/10 text-[#f1f3f4] rounded-lg shadow-2xl min-w-[150px]">
                 {NEXUS_MODELS.map(m => (
                   <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
        </div>
      </div>
    </header>
  );
};
