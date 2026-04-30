import { 
  Layout, Download, Terminal, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useEffect, useCallback, memo, useMemo } from 'react';
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
  vfs?: any;
}

import JSZip from 'jszip';

export const Workbench = memo(({
  activeTab,
  setActiveTab,
  generatedFiles,
  activeFilePath,
  setActiveFilePath,
  fileHistory,
  setFileHistory,
  setGeneratedFiles,
  isLoading,
  previewKey,
  setPreviewKey,
  vfs
}: any) => {
  const hasFiles = generatedFiles.length > 0;
  const rightPaneTab = ['preview', 'code', 'files'].includes(activeTab) ? activeTab : 'preview';

  // Memoize current file to prevent re-renders of Monaco editor
  const activeFileIndex = useMemo(() => {
    if (!activeFilePath) return 0;
    const idx = generatedFiles.findIndex((f: GeneratedFile) => f.name === activeFilePath);
    return idx === -1 ? 0 : idx;
  }, [generatedFiles, activeFilePath]);

  const currentFile = useMemo(() => generatedFiles[activeFileIndex], [generatedFiles, activeFileIndex]);

  const handleDownload = useCallback(async () => {
    if (!hasFiles) {
      toast.error("Não há arquivos para exportar.");
      return;
    }
    
    try {
      toast.info("Iniciando compressão quàntica...");
      const zip = new JSZip();
      
      generatedFiles.forEach((file: GeneratedFile) => {
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
        setPreviewKey((k: number) => k + 1);
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
      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative flex flex-col md:flex-row bg-background">
        {!hasFiles && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-background">
            <div className="w-16 h-16 rounded-2xl bg-muted border border-border flex items-center justify-center mb-6 relative group">
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
          <div className="w-full h-[250px] md:h-full md:w-[220px] flex-shrink-0 border-b md:border-b-0 md:border-r border-border z-40 bg-muted overflow-y-auto">
            <FileTree 
              files={generatedFiles} 
              activeFilePath={activeFilePath} 
              onSelect={setActiveFilePath} 
            />
          </div>
        )}

        <div className="flex-1 min-w-0 flex flex-col h-full bg-background overflow-hidden relative">
          {/* BREADCRUMBS PROTOCOL */}
          {hasFiles && (
            <div className="h-10 border-b border-border bg-muted flex items-center px-4 gap-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground shrink-0 z-20">
               <div className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-default">
                  <Shield size={10} className="text-primary" />
                  <span>VFS-ROOT</span>
               </div>
               <span className="text-muted-foreground text-[14px] font-light">/</span>
               
               <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
                 {currentFile && currentFile.name.split('/').filter(Boolean).map((part: string, i: number, arr: string[]) => (
                   <div key={i} className="flex items-center gap-2">
                      <span className={cn(i === arr.length - 1 ? "text-primary font-black" : "hover:text-foreground transition-colors cursor-default")}>
                        {part}
                      </span>
                      {i < arr.length - 1 && <span className="text-muted-foreground text-[14px] font-light">/</span>}
                   </div>
                 ))}
               </div>

               {/* Integrated Tools */}
               <div className="ml-auto flex items-center gap-3 pl-4">
                  {fileHistory.length > 1 && (
                    <Select value={(fileHistory.length - 1).toString()} onValueChange={(val) => {
                      const idx = parseInt(val || '0', 10);
                      const updatedHistory = fileHistory.slice(0, idx + 1);
                      setFileHistory(updatedHistory);
                      setGeneratedFiles(updatedHistory[updatedHistory.length - 1].files);
                      setActiveFilePath(null);
                    }}>
                      <SelectTrigger className="h-[22px] w-20 text-[8px] font-black uppercase bg-background border-border text-muted-foreground focus:ring-0 shadow-none rounded hover:bg-muted transition-colors"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-card border-border text-foreground rounded-md shadow-2xl">
                        {fileHistory.map((_: any, i: number) => <SelectItem key={i} value={i.toString()} className="text-[9px]">V-{i+1}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                  
                  <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 bg-background border border-border rounded text-[8px] font-black opacity-60">
                    {generatedFiles.length} FIL
                  </div>

                  <button 
                    onClick={handleDownload}
                    className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-background rounded transition-all"
                    title="Exportar"
                  >
                    <Download size={12} />
                  </button>

                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <span className="hidden lg:inline text-[8px] text-emerald-500 italic">Core Active</span>
                  </div>
               </div>
            </div>
          )}

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
                  vfs={vfs}
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
                {currentFile && (
                  <div className="h-11 border-b border-border bg-background flex items-center px-4 justify-between shrink-0">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="flex items-center gap-2 px-2 py-0.5 bg-primary border border-primary rounded text-[9px] font-bold text-primary-foreground uppercase tracking-tight">
                        {currentFile.name.split('.').pop()}
                      </div>
                      <span className="text-[11px] font-bold text-muted-foreground truncate tracking-tight">
                        {currentFile.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => {
                          const code = currentFile.code;
                          if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
                             navigator.clipboard.writeText(code).then(() => {
                                toast.success("Fonte Capturada");
                             }).catch(err => {
                               console.error("Clipboard Error:", err);
                               toast.error("Erro na Captura");
                             });
                          }
                        }}
                        className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground hover:text-primary transition-all flex items-center gap-1.5"
                      >
                        <Shield size={10} />
                        Copiar
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex-1 min-h-0">
                  <CodeBlock 
                    value={currentFile?.code || "// Nenhum ativo selecionado"}
                    language={currentFile?.name.split('.').pop() || 'typescript'}
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
