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
      "flex-1 flex flex-col bg-[#0b0c0f] relative min-h-0",
      (activeTab === 'chat' || activeTab === 'settings') && "hidden md:flex",
      (activeTab === 'settings') && "md:hidden"
    )}>
      {/* Mobile Top Bar */}
      <div className="flex md:hidden h-12 border-b border-white/20 bg-[#141517] items-center px-4 justify-between gap-4 flex-shrink-0 z-[60] shadow-sm w-full">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveTab('chat')} 
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-white/90 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex flex-col">
            <span className="text-[10px] font-medium text-white/80 leading-none mb-1">Visualizando</span>
            <span className="text-[13px] font-semibold text-white leading-none">
              {rightPaneTab === 'preview' ? 'Preview' : rightPaneTab === 'code' ? 'Código' : 'Arquivos'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button 
             onClick={() => setPreviewKey(k => k + 1)} 
             className={cn(
               "w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 transition-all text-white/90 hover:text-white hover:bg-white/10",
               isLoading && "text-blue-400 animate-spin"
             )}
           >
             <RotateCcw size={16} />
           </button>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex h-10 border-b border-white/20 bg-[#141517] items-center px-3 justify-between gap-4 flex-shrink-0 z-[60] w-full">
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setActiveTab('preview')} 
            className={cn(
              "px-3 h-[28px] rounded-md text-[12px] font-medium transition-all", 
              rightPaneTab === 'preview' ? "bg-white/10 text-white" : "text-white/90 hover:text-white/90 hover:bg-white/5"
            )}
          >
            Visualizar
          </button>
          <button 
            onClick={() => setActiveTab('code')} 
            className={cn(
              "px-3 h-[28px] rounded-md text-[12px] font-medium transition-all", 
              rightPaneTab === 'code' ? "bg-white/10 text-white" : "text-white/90 hover:text-white/90 hover:bg-white/5"
            )}
          >
            Código
          </button>
          <button 
            onClick={() => setActiveTab('files')} 
            className={cn(
              "px-3 h-[28px] rounded-md text-[12px] font-medium transition-all", 
              rightPaneTab === 'files' ? "bg-white/10 text-white" : "text-white/90 hover:text-white/90 hover:bg-white/5"
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
              <SelectTrigger className="h-[28px] w-24 text-[11px] font-medium bg-white/5 border-none text-white/70 focus:ring-0 shadow-none rounded-md hover:bg-white/10 transition-colors"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#141517] border-white/30 text-white rounded-md shadow-2xl">
                {fileHistory.map((_, i) => <SelectItem key={i} value={i.toString()} className="text-[11px]">Versão {i+1}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          <div className="flex items-center h-[28px] px-3 bg-white/[0.03] border border-white/20 rounded-md gap-3">
             <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-medium text-white/90">{generatedFiles.length} arquivos</span>
             </div>
          </div>
          
          <button 
            id="nexus-export-trigger"
            onClick={handleDownload}
            className="w-7 h-7 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/5 rounded-md transition-all"
            title="Exportar Pacote"
          >
            <Download size={14} />
          </button>
          <button 
            onClick={() => setPreviewKey(k => k + 1)} 
            className={cn("w-7 h-7 flex items-center justify-center rounded-md transition-all", isLoading ? "text-blue-400 animate-spin" : "text-white/80 hover:text-white hover:bg-white/5")}
            title="Atualizar"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative flex flex-col md:flex-row bg-[#0b0c0f]">
        {!hasFiles && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-[#0b0c0f]">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/20 flex items-center justify-center mb-6 relative group overflow-hidden">
               {rightPaneTab === 'files' ? <FolderOpen size={24} className="text-white/90" /> : 
                rightPaneTab === 'code' ? <Terminal size={24} className="text-white/90" /> : 
                <Layout size={24} className="text-white/90" />}
            </div>
            <h3 className="text-[14px] font-medium text-white/70">Nenhum arquivo gerado</h3>
            <p className="text-[12px] mt-2 text-white/80 text-center max-w-[240px]">
              Faça um prompt para gerar a aplicação
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
              className="w-full md:w-[220px] flex-shrink-0 border-r border-white/20 h-full z-40 bg-black/20"
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

        <div className="flex-1 min-w-0 flex flex-col h-full bg-[#0b0c0f]">
          <AnimatePresence mode="wait">
            {rightPaneTab === 'preview' ? (
              <motion.div 
                key="preview-pane"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col h-full relative"
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
                  <div className="h-8 border-b border-white/20 bg-[#0d0d0e] flex items-center px-3 justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="text-[8px] font-black uppercase text-white/80 tracking-widest shrink-0 italic">Caminho Ativo //</span>
                      <span className="text-[10px] font-mono text-white/90 truncate uppercase tracking-tighter italic">
                        {generatedFiles[activeFileIndex].name}
                      </span>
                    </div>
                    <button 
                      onClick={() => {
                        const code = generatedFiles[activeFileIndex].code;
                        if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
                           navigator.clipboard.writeText(code).then(() => {
                             toast.success("Binário Armazenado");
                           }).catch(err => {
                             console.error("Clipboard Error:", err);
                             toast.error("Erro ao copiar arquivo");
                           });
                        }
                      }}
                      className="text-[8px] font-black uppercase tracking-widest text-white/80 hover:text-white/80 transition-colors"
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
