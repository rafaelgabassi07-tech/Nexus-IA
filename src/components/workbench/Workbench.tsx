import React from 'react';
import { 
  RotateCcw, Layout, FolderOpen, ChevronLeft, Download, Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { 
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem
} from '../ui/select';
import { PreviewPane } from './PreviewPane';
import { FileTree } from './FileTree';
import { CodeBlock } from './CodeBlock';
import { GeneratedFile } from '../../types';

interface WorkbenchProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  generatedFiles: GeneratedFile[];
  activeFileIndex: number;
  setActiveFileIndex: (index: number) => void;
  fileHistory: any[];
  setFileHistory: (history: any[]) => void;
  setGeneratedFiles: (files: any) => void;
  isLoading: boolean;
  handleSendMessage: (e?: React.FormEvent, overridePrompt?: string, messagesToUse?: any[]) => Promise<void> | any;
  previewKey: number;
  setPreviewKey: React.Dispatch<React.SetStateAction<number>>;
}

export const Workbench = ({
  activeTab,
  setActiveTab,
  generatedFiles,
  activeFileIndex,
  setActiveFileIndex,
  fileHistory,
  setFileHistory,
  setGeneratedFiles,
  isLoading,
  handleSendMessage,
  previewKey,
  setPreviewKey
}: WorkbenchProps) => {
  const hasFiles = generatedFiles.length > 0;
  const rightPaneTab = ['preview', 'code', 'files'].includes(activeTab) ? activeTab : 'preview';

  const handleDownload = () => toast.success("Projeto preparado para exportação Nexus.");

  return (
    <div className={cn(
      "flex-1 flex flex-col bg-[#020203] relative min-h-0",
      (activeTab === 'chat' || activeTab === 'settings') && "hidden md:flex",
      (activeTab === 'settings') && "md:hidden"
    )}>
      {/* Mobile Top Bar */}
      <div className="flex md:hidden h-14 border-b border-white/5 bg-black/40 backdrop-blur-md items-center px-4 justify-between gap-4 flex-shrink-0 z-[60] shadow-sm w-full">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              if (rightPaneTab === 'code' && window.innerWidth < 768) setActiveTab('files');
              else if (rightPaneTab === 'files') setActiveTab('chat');
              else setActiveTab('chat');
            }} 
            className="p-2 -ml-2 text-white/40 hover:text-white"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-blue-400">Workbench</span>
            <span className="text-[12px] font-bold text-white/90">
              {rightPaneTab === 'preview' ? 'Visualizado' : rightPaneTab === 'code' ? 'Código-Fonte' : 'Arquivos'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
           <button onClick={() => setPreviewKey(k => k + 1)} className="p-2 text-white/30 hover:text-white transition-colors">
             <RotateCcw size={18} />
           </button>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex h-[56px] border-b border-white/5 bg-white/[0.01] items-center px-4 justify-between gap-4 flex-shrink-0 z-[60] shadow-lg w-full">
        <div className="bg-white/5 p-1 rounded-xl flex items-center shadow-inner-white">
          <button 
            onClick={() => setActiveTab('preview')} 
            className={cn(
              "px-5 py-1.5 rounded-lg text-[12px] font-black uppercase tracking-widest transition-all duration-300", 
              rightPaneTab === 'preview' ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-white/40 hover:text-white/60"
            )}
          >
            Preview
          </button>
          <button 
            onClick={() => setActiveTab('code')} 
            className={cn(
              "px-5 py-1.5 rounded-lg text-[12px] font-black uppercase tracking-widest transition-all duration-300", 
              rightPaneTab === 'code' ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"
            )}
          >
            Editor
          </button>
          <button 
            onClick={() => setActiveTab('files')} 
            className={cn(
              "px-5 py-1.5 rounded-lg text-[12px] font-black uppercase tracking-widest transition-all duration-300", 
              rightPaneTab === 'files' ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"
            )}
          >
            Arquivos
          </button>
        </div>

        <div className="flex items-center gap-2">
          {fileHistory.length > 1 && (
            <Select value={(fileHistory.length - 1).toString()} onValueChange={(val) => {
              const idx = parseInt(val || '0', 10);
              const updatedHistory = fileHistory.slice(0, idx + 1);
              setFileHistory(updatedHistory);
              setGeneratedFiles(updatedHistory[updatedHistory.length - 1].files);
              setActiveFileIndex(0);
            }}>
              <SelectTrigger className="h-8 w-[140px] text-[10px] uppercase font-black tracking-widest bg-white/5 border-white/5 text-white/60 focus:ring-0 shadow-none rounded-lg"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#0d0d0e] border-white/5 text-white rounded-xl shadow-2xl">
                {fileHistory.map((_, i) => <SelectItem key={i} value={i.toString()} className="text-[11px] font-bold">Versão {i+1}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          <div className="flex items-center px-3 py-1.5 bg-white/5 rounded-full border border-white/5 mx-2">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-2" />
             <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Nexus Ativo</span>
          </div>
          
          <button 
            onClick={handleDownload}
            className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-all"
            title="Download ZIP"
          >
            <Download size={18} />
          </button>
          <div className="w-px h-4 bg-white/10 mx-1" />
          <button 
            onClick={() => setPreviewKey(k => k + 1)} 
            className={cn("p-2 rounded-lg transition-all", isLoading ? "text-blue-400 animate-spin" : "text-white/40 hover:text-blue-400 hover:bg-blue-400/10")}
            title="Refresh Preview"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative flex flex-col md:flex-row bg-[#020203]">
        {!hasFiles && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-[#020203]">
            <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-tr from-white/[0.02] to-white/[0.08] border border-white/5 shadow-2xl flex items-center justify-center mb-8 relative group overflow-hidden">
              <div className="absolute inset-0 bg-blue-500/5 blur-3xl rounded-full" />
              {rightPaneTab === 'files' ? <FolderOpen size={40} className="text-blue-400/80 transition-transform group-hover:scale-110" /> : 
               rightPaneTab === 'code' ? <Terminal size={40} className="text-emerald-400/80 transition-transform group-hover:scale-110" /> : 
               <Layout size={40} className="text-blue-400/80 transition-transform group-hover:scale-110" />}
            </div>
            <h3 className="text-[20px] font-black text-white uppercase tracking-tighter italic">Infraestrutura Nexus</h3>
            <p className="text-[12px] mt-2 text-[#8e918f] uppercase font-bold tracking-[0.3em] opacity-40 text-center max-w-[320px]">
              Aguando orquestração de arquivos via Nexus Chat.
            </p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {rightPaneTab === 'files' && hasFiles && (
            <motion.div 
              key="filetree"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full md:w-[260px] flex-shrink-0 border-r border-white/5 h-full z-40 bg-black/20"
            >
              <FileTree 
                files={generatedFiles} 
                activeFileIndex={activeFileIndex} 
                onSelect={(idx) => {
                  setActiveFileIndex(idx);
                  if (window.innerWidth < 768) setActiveTab('code');
                }} 
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 min-w-0 flex flex-col h-full bg-[#020203]">
          <AnimatePresence mode="wait">
            {rightPaneTab === 'preview' ? (
              <motion.div 
                key="preview-pane"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 h-full"
              >
                <PreviewPane 
                  generatedFiles={generatedFiles}
                  previewKey={previewKey} 
                  activeTab={activeTab} 
                  isLoading={isLoading}
                  handleSendMessage={handleSendMessage}
                />
              </motion.div>
            ) : (
              <motion.div 
                key="editor-pane"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 h-full flex flex-col min-h-0 overflow-hidden"
              >
                {generatedFiles[activeFileIndex] && (
                  <div className="h-10 border-b border-white/5 bg-white/[0.02] flex items-center px-4 justify-between transition-colors hover:bg-white/[0.04]">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="text-[10px] font-black uppercase text-white/10 tracking-[0.2em] shrink-0 italic">Active Path</span>
                      <span className="text-[11px] font-mono text-white/40 truncate">
                        {generatedFiles[activeFileIndex].name}
                      </span>
                    </div>
                    <button 
                      onClick={() => {
                        const code = generatedFiles[activeFileIndex].code;
                        navigator.clipboard.writeText(code);
                        toast.success("Código Nexus copiado!");
                      }}
                      className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8e918f] hover:text-white transition-colors"
                    >
                      Copy Source
                    </button>
                  </div>
                )}
                <div className="flex-1 overflow-hidden">
                  <CodeBlock 
                    value={generatedFiles[activeFileIndex]?.code || "// Nenhum ativo selecionado"}
                    language={generatedFiles[activeFileIndex]?.name.split('.').pop() || 'typescript'}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
