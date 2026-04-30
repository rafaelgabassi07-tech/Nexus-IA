import { 
  Layout, ChevronLeft, Download, Terminal, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useEffect, useCallback, memo } from 'react';
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

export const Workbench = memo(({
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
  const rightPaneTab = ['preview', 'code'].includes(activeTab) ? activeTab : 'preview';

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
        setActiveTab(activeTab === 'code' ? 'preview' : 'code');
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
      "flex-1 flex flex-col bg-background relative min-h-0",
      (activeTab === 'chat' || activeTab === 'settings') && "hidden md:flex",
      (activeTab === 'settings') && "md:hidden"
    )}>
      {/* Mobile Top Bar */}
      <div className="flex md:hidden h-12 border-b border-border bg-card items-center px-4 justify-between gap-4 flex-shrink-0 z-[60] shadow-sm w-full">
        <button 
          onClick={() => setActiveTab('chat')} 
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-muted text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex bg-muted p-1 rounded-lg">
          <button 
             onClick={() => setActiveTab('preview')} 
             className={cn("px-4 h-[28px] rounded-md text-[11px] font-bold uppercase transition-all", rightPaneTab === 'preview' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}
          >Preview</button>
          <button 
             onClick={() => setActiveTab('code')} 
             className={cn("px-4 h-[28px] rounded-md text-[11px] font-bold uppercase transition-all", rightPaneTab === 'code' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}
          >Código</button>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex h-12 border-b border-border bg-background items-center px-4 justify-between gap-4 flex-shrink-0 z-[60] w-full">
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => setActiveTab('preview')} 
            className={cn(
              "px-4 h-[32px] rounded-lg text-[12px] font-bold uppercase tracking-wider transition-all", 
              rightPaneTab === 'preview' ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            Preview
          </button>
          <button 
            onClick={() => setActiveTab('code')} 
            className={cn(
              "px-4 h-[32px] rounded-lg text-[12px] font-bold uppercase tracking-wider transition-all", 
              rightPaneTab === 'code' ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            Código e Estrutura
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
              <SelectTrigger className="h-[28px] w-24 text-[11px] font-medium bg-muted border-none text-muted-foreground focus:ring-0 shadow-none rounded-md hover:bg-white/10 transition-colors"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-card border-border text-foreground rounded-md shadow-2xl">
                {fileHistory.map((_, i) => <SelectItem key={i} value={i.toString()} className="text-[11px]">Versão {i+1}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          <div className="flex items-center h-[32px] px-3 bg-muted border border-border rounded-lg gap-3">
             <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{generatedFiles.length} arquivos</span>
             </div>
          </div>
          
          <button 
            id="nexus-export-trigger"
            onClick={handleDownload}
            className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-all"
            title="Exportar Pacote"
          >
            <Download size={14} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative flex flex-col md:flex-row bg-background">
        {!hasFiles && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-background">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-border flex items-center justify-center mb-6 relative group overflow-hidden">
               {rightPaneTab === 'code' ? <Terminal size={24} className="text-muted-foreground" /> : 
                <Layout size={24} className="text-muted-foreground" />}
            </div>
            <h3 className="text-[14px] font-medium text-muted-foreground">Nenhum arquivo gerado</h3>
            <p className="text-[12px] mt-2 text-muted-foreground text-center max-w-[240px]">
              Faça um prompt para gerar a aplicação
            </p>
          </div>
        )}

        {rightPaneTab === 'code' && hasFiles && (
          <div className="w-full h-[250px] md:h-full md:w-[220px] flex-shrink-0 border-b md:border-b-0 md:border-r border-border z-40 bg-black/20 overflow-y-auto">
            <FileTree 
              files={generatedFiles} 
              activeFileIndex={activeFileIndex} 
              onSelect={(idx) => {
                setActiveFileIndex(idx);
              }} 
            />
          </div>
        )}

        <div className="flex-1 min-w-0 flex flex-col h-full bg-background overflow-hidden relative">
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
                  onReload={() => setPreviewKey((k: number) => k + 1)}
                  isLoading={isLoading}
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
                  <div className="h-11 border-b border-border bg-background/50 backdrop-blur-sm flex items-center px-4 justify-between shrink-0">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="flex items-center gap-2 px-2 py-0.5 bg-primary/5 border border-primary/10 rounded text-[9px] font-bold text-primary uppercase tracking-tight">
                        {generatedFiles[activeFileIndex].name.split('.').pop()}
                      </div>
                      <span className="text-[11px] font-bold text-muted-foreground truncate tracking-tight">
                        {generatedFiles[activeFileIndex].name}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => {
                          const code = generatedFiles[activeFileIndex].code;
                          if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
                             navigator.clipboard.writeText(code).then(() => {
                               toast.success("Fonte Capturada");
                             }).catch(err => {
                               console.error("Clipboard Error:", err);
                               toast.error("Erro na Captura");
                             });
                          }
                        }}
                        className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground/60 hover:text-primary transition-all flex items-center gap-1.5"
                      >
                        <Shield size={10} />
                        Copiar
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex-1 min-h-0">
                  <CodeBlock 
                    value={generatedFiles[activeFileIndex]?.code || "// Nenhum ativo selecionado"}
                    language={generatedFiles[activeFileIndex]?.name.split('.').pop() || 'typescript'}
                    noMargin={true}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
});
