import { 
  RotateCcw, Layout, FolderOpen, ChevronLeft, Download, Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useEffect, useCallback } from 'react';
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
  previewKey: number;
  setPreviewKey: React.Dispatch<React.SetStateAction<number>>;
}

import JSZip from 'jszip';

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
  previewKey,
  setPreviewKey
}: WorkbenchProps) => {
  const hasFiles = generatedFiles.length > 0;
  const rightPaneTab = ['preview', 'code', 'files'].includes(activeTab) ? activeTab : 'preview';

  const handleDownload = useCallback(async () => {
    if (!hasFiles) {
      toast.error("Não há arquivos para exportar.");
      return;
    }
    
    try {
      toast.info("Iniciando compressão quàntica...");
      const zip = new JSZip();
      
      generatedFiles.forEach(file => {
        let path = file.name;
        if (path.startsWith('/')) path = path.slice(1);
        zip.file(path, file.code);
      });
      
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `nexus_bundle_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("Matrix desmaterializada com sucesso.");
    } catch (e) {
      console.error(e);
      toast.error("Falha na desmaterialização do projeto.");
    }
  }, [hasFiles, generatedFiles]);

  useEffect(() => {
    const handleShortcuts = (e: KeyboardEvent) => {
      // Cmd/Ctrl + S = Download
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleDownload();
      }
      
      // Cmd/Ctrl + B = Toggle Sidebar/Files
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setActiveTab(activeTab === 'files' ? 'preview' : 'files');
      }

      // Alt + R = Reload Preview
      if (e.altKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        setPreviewKey(k => k + 1);
        toast.info("Matrix Reiniciada.");
      }
    };

    window.addEventListener('keydown', handleShortcuts);
    return () => window.removeEventListener('keydown', handleShortcuts);
  }, [handleDownload, setActiveTab, activeTab, setPreviewKey]);

  return (
    <div className={cn(
      "flex-1 flex flex-col bg-[#020203] relative min-h-0",
      (activeTab === 'chat' || activeTab === 'settings') && "hidden md:flex",
      (activeTab === 'settings') && "md:hidden"
    )}>
      {/* Mobile Top Bar */}
      <div className="flex md:hidden h-12 border-b border-white/5 bg-[#0d0d0e]/80 backdrop-blur-3xl items-center px-4 justify-between gap-4 flex-shrink-0 z-[60] shadow-sm w-full">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveTab('chat')} 
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-white/40 hover:text-white"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex flex-col">
            <span className="text-[7px] font-black uppercase tracking-[0.2em] text-blue-400 leading-none mb-0.5">Workbench</span>
            <span className="text-[11px] font-bold text-white/90 leading-none">
              {rightPaneTab === 'preview' ? 'Stream' : rightPaneTab === 'code' ? 'Código' : 'Arquivos'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button 
             onClick={() => setPreviewKey(k => k + 1)} 
             className={cn(
               "w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 transition-all",
               isLoading ? "text-blue-400 animate-spin" : "text-white/40 hover:text-white"
             )}
           >
             <RotateCcw size={14} />
           </button>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex h-[36px] border-b border-white/5 bg-[#0d0d0e] items-center px-2 justify-between gap-4 flex-shrink-0 z-[60] w-full">
        <div className="flex items-center gap-0.5">
          <button 
            onClick={() => setActiveTab('preview')} 
            className={cn(
              "px-3 h-[26px] rounded text-[9px] font-black uppercase tracking-widest transition-all", 
              rightPaneTab === 'preview' ? "bg-white/10 text-white" : "text-white/20 hover:text-white/40"
            )}
          >
            Visualizar
          </button>
          <button 
            onClick={() => setActiveTab('code')} 
            className={cn(
              "px-3 h-[26px] rounded text-[9px] font-black uppercase tracking-widest transition-all", 
              rightPaneTab === 'code' ? "bg-white/10 text-white" : "text-white/20 hover:text-white/40"
            )}
          >
            Código
          </button>
          <button 
            onClick={() => setActiveTab('files')} 
            className={cn(
              "px-3 h-[26px] rounded text-[9px] font-black uppercase tracking-widest transition-all", 
              rightPaneTab === 'files' ? "bg-white/10 text-white" : "text-white/20 hover:text-white/40"
            )}
          >
            Arquivos
          </button>
        </div>

        <div className="flex items-center gap-1">
          {fileHistory.length > 1 && (
            <Select value={(fileHistory.length - 1).toString()} onValueChange={(val) => {
              const idx = parseInt(val || '0', 10);
              const updatedHistory = fileHistory.slice(0, idx + 1);
              setFileHistory(updatedHistory);
              setGeneratedFiles(updatedHistory[updatedHistory.length - 1].files);
              setActiveFileIndex(0);
            }}>
              <SelectTrigger className="h-[26px] w-[80px] text-[8px] uppercase font-black bg-white/5 border-none text-white/30 focus:ring-0 shadow-none rounded"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#0d0d0e] border-white/5 text-white rounded shadow-2xl">
                {fileHistory.map((_, i) => <SelectItem key={i} value={i.toString()} className="text-[9px] font-bold">V{i+1}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          <div className="flex items-center h-[26px] px-2 bg-white/[0.02] border border-white/5 rounded-md gap-3 overflow-hidden">
             <div className="flex items-center gap-1.5 border-r border-white/5 pr-3 shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em] italic">Kernel Nexus</span>
             </div>
             
             <div className="flex items-center gap-4 shrink-0">
                <div className="flex flex-col">
                   <span className="text-[6px] font-bold text-white/10 uppercase tracking-widest leading-none">Módulos</span>
                   <span className="text-[9px] font-black text-white/30 leading-tight">{generatedFiles.length}</span>
                </div>
                <div className="flex flex-col">
                   <span className="text-[6px] font-bold text-white/10 uppercase tracking-widest leading-none">Integridade</span>
                   <span className="text-[9px] font-black text-blue-400/50 leading-tight">Verificada</span>
                </div>
                <div className="hidden lg:flex flex-col group/shortcut">
                   <span className="text-[6px] font-bold text-white/10 uppercase tracking-widest leading-none">Protocolo</span>
                   <span className="text-[9px] font-black text-white/20 leading-tight group-hover/shortcut:text-[#00d2ff] transition-colors uppercase tracking-tighter italic">⌘K Terminal</span>
                </div>
             </div>

             <div className="h-full w-px bg-white/5 hidden xl:block" />

             <div className="hidden xl:flex items-center gap-2">
                <div className="flex gap-0.5">
                   {[1,2,3,4,5].map(i => (
                     <div key={i} className={cn("w-1 h-3 rounded-full", i <= 4 ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "bg-white/5")} />
                   ))}
                </div>
                <div className="flex flex-col">
                   <span className="text-[6px] font-black text-white/20 uppercase tracking-widest leading-none">Potência</span>
                   <span className="text-[7px] font-black text-blue-400 uppercase tracking-tighter">Hyper-Engine</span>
                </div>
             </div>
          </div>
          
          <button 
            id="nexus-export-trigger"
            onClick={handleDownload}
            className="w-[26px] h-[26px] flex items-center justify-center text-white/10 hover:text-[#00d2ff] transition-colors group"
            title="Exportar Pacote Matrix"
          >
            <Download size={12} className="group-hover:scale-110 transition-transform" />
          </button>
          <button 
            onClick={() => setPreviewKey(k => k + 1)} 
            className={cn("w-[26px] h-[26px] flex items-center justify-center transition-all", isLoading ? "text-blue-400 animate-spin" : "text-white/10 hover:text-blue-400")}
            title="Reiniciar"
          >
            <RotateCcw size={12} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative flex flex-col md:flex-row bg-[#020203]">
        {!hasFiles && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-[#020203]">
            <div className="w-16 h-16 rounded-xl bg-white/[0.01] border border-white/5 flex items-center justify-center mb-6 relative group overflow-hidden">
               <div className="absolute inset-0 bg-blue-500/5 blur-2xl rounded-full" />
               {rightPaneTab === 'files' ? <FolderOpen size={24} className="text-white/10 group-hover:text-blue-400/40 transition-colors" /> : 
                rightPaneTab === 'code' ? <Terminal size={24} className="text-white/10 group-hover:text-emerald-400/40 transition-colors" /> : 
                <Layout size={24} className="text-white/10 group-hover:text-blue-400/40 transition-colors" />}
            </div>
            <h3 className="text-[12px] font-black text-white/20 uppercase tracking-[.4em] italic">Orquestração Nexus</h3>
            <p className="text-[9px] mt-2 text-white/5 uppercase font-bold tracking-[0.2em] text-center max-w-[240px]">
              Aguardando diretrizes via canal neural.
            </p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {rightPaneTab === 'files' && hasFiles && (
            <motion.div 
              key="filetree"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="w-full md:w-[220px] flex-shrink-0 border-r border-white/5 h-full z-40 bg-black/20"
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
                  <div className="h-8 border-b border-white/5 bg-[#0d0d0e] flex items-center px-3 justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="text-[8px] font-black uppercase text-white/10 tracking-widest shrink-0 italic">Caminho Ativo //</span>
                      <span className="text-[10px] font-mono text-white/30 truncate uppercase tracking-tighter italic">
                        {generatedFiles[activeFileIndex].name}
                      </span>
                    </div>
                    <button 
                      onClick={() => {
                        const code = generatedFiles[activeFileIndex].code;
                        navigator.clipboard.writeText(code);
                        toast.success("Binário Armazenado");
                      }}
                      className="text-[8px] font-black uppercase tracking-widest text-white/10 hover:text-white/40 transition-colors"
                    >
                      Copiar Fonte
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
