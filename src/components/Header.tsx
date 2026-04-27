import { 
  Download, FileText
} from 'lucide-react';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from './ui/select';
import { AgentIcon } from './AgentIcon';
import { AgentDefinition } from '../agents';
import { cn, safeLocalStorageSet } from '../lib/utils';
import { exportChatToPDF, exportChatToMarkdown } from '../services/exportService';
import { Message } from '../types';

interface HeaderProps {
  activeAgent: AgentDefinition;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  setDraftSelectedModel: (model: string) => void;
  isSaving?: boolean;
  messages: Message[];
}

export const Header = ({ 
  activeAgent, 
  selectedModel, 
  setSelectedModel, 
  setDraftSelectedModel,
  isSaving,
  messages
}: HeaderProps) => {
  const handleExportPDF = async () => {
    try {
      await exportChatToPDF('chat-log-container', `chat-nexus-${Date.now()}.pdf`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportMD = () => {
    exportChatToMarkdown(messages, activeAgent.name);
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
            <div className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" title="Sincronizado" />
          </div>
          <p className="text-[7px] text-[#5f6368] font-black uppercase tracking-[0.3em] leading-none mt-1">Status: Online</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 mr-2 px-1 py-1 rounded-lg bg-white/[0.02] border border-white/5">
          <button 
            onClick={handleExportPDF}
            className="p-1.5 text-[#8e918f] hover:text-white rounded-md hover:bg-white/5 transition-colors"
            title="Exportar como PDF"
          >
            <FileText size={16} />
          </button>
          <button 
            onClick={handleExportMD}
            className="p-1.5 text-[#8e918f] hover:text-white rounded-md hover:bg-white/5 transition-colors"
            title="Exportar como Markdown"
          >
            <Download size={16} />
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
             <Select value={selectedModel} onValueChange={(val) => {
               if (val) {
                 setSelectedModel(val);
                 setDraftSelectedModel(val);
                 safeLocalStorageSet('nexus_selected_model', val);
               }
             }}>
               <SelectTrigger className="h-4 p-0 text-[9px] font-bold text-zinc-400 hover:text-white uppercase tracking-tighter bg-transparent border-0 focus:ring-0 gap-1 min-w-0">
                 <SelectValue />
               </SelectTrigger>
               <SelectContent className="bg-[#1a1b1e] border-white/10 text-[#f1f3f4] rounded-lg shadow-2xl min-w-[150px]">
                 <SelectItem value="gemini-2.0-pro-exp-02-05">Gemini 2.0 Pro (Exp)</SelectItem>
                 <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
                 <SelectItem value="gemini-2.0-flash-lite-preview-02-05">Gemini 2.0 Flash Lite</SelectItem>
                 <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                 <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash</SelectItem>
                 <SelectItem value="gemini-1.5-flash-8b">Gemini 1.5 Flash 8B</SelectItem>
               </SelectContent>
             </Select>
           </div>
        </div>
      </div>
    </header>
  );
};
