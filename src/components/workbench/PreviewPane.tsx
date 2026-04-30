import { useState, useEffect, useRef } from 'react';
import { 
  ExternalLink, Layout, Maximize2, Trash2, Terminal as TerminalIcon, Copy, Smartphone, RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { GeneratedFile } from '../../types';
import { generatePreviewHTML } from './preview/virtualBundler';

export interface PreviewPaneProps {
  generatedFiles: GeneratedFile[];
  previewKey: number;
  onReload?: () => void;
  isLoading?: boolean;
}

export const PreviewPane = ({ 
  generatedFiles, 
  previewKey, 
  onReload,
  isLoading
}: PreviewPaneProps) => {
  const [logs, setLogs] = useState<{ type: string; args: any[] }[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Use srcdoc for the preview to work in restricted iframes
  useEffect(() => {
    if (!iframeRef.current || generatedFiles.length === 0) return;

    const generatePreviewContent = () => {
      return generatePreviewHTML(generatedFiles);
    };

    setLogs([]); // Reset logs on reload
    const content = generatePreviewContent();
    if (iframeRef.current) {
      iframeRef.current.srcdoc = content;
    }
  }, [generatedFiles, previewKey]);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'PREVIEW_LOG') {
        setLogs(prev => [...prev, { type: e.data.logType, args: e.data.content }].slice(-50));
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const [showConsole, setShowConsole] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showConsole && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, showConsole]);

  return (
    <div className="flex-1 flex flex-col bg-background relative overflow-hidden min-h-0 h-full w-full">
      {/* Top Controls */}
      <div className="h-11 border-b border-border bg-background/50 backdrop-blur-sm flex items-center justify-between px-4 shrink-0 z-20">
        <div className="flex items-center gap-2 text-muted-foreground/80">
          <Smartphone size={14} />
          <span className="text-[10px] font-black uppercase tracking-widest mt-0.5">Mobile Preview</span>
        </div>

        <div className="flex items-center gap-2">
           {onReload && (
             <button 
               onClick={onReload} 
               className={cn("w-7 h-7 flex items-center justify-center rounded-lg bg-muted transition-all text-muted-foreground hover:text-foreground shadow-sm", isLoading ? "text-primary animate-spin" : "hover:text-primary")}
               title="Atualizar"
             >
               <RotateCcw size={12} />
             </button>
           )}
           <button 
             onClick={() => setShowConsole(!showConsole)}
             className={cn(
               "px-3 h-7 rounded-lg flex items-center gap-2 transition-all text-[10px] font-black uppercase tracking-widest",
               showConsole ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-muted text-muted-foreground hover:text-foreground"
             )}
           >
             <div className={cn("w-1.5 h-1.5 rounded-full", logs.some(l => l.type === 'error') ? "bg-red-500 animate-pulse" : logs.length > 0 ? "bg-emerald-500" : "bg-white/10")} />
             Logs
           </button>

           <button 
             onClick={() => {
              const docContent = iframeRef.current?.srcdoc;
              if (docContent) {
                const blob = new Blob([docContent], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
              }
             }}
             className="w-7 h-7 flex items-center justify-center rounded-lg bg-muted border border-border text-muted-foreground hover:text-primary transition-all shadow-sm"
           >
            <ExternalLink size={12} />
           </button>
        </div>
      </div>

      <div className="flex-1 relative bg-[#0d0d0e] overflow-hidden flex items-center justify-center p-0 md:p-4">
        <div className="relative flex items-center justify-center w-full h-full max-w-[400px] pointer-events-none">
          <div 
            className="w-full h-full bg-white md:rounded-md shadow-[0_50px_150px_rgba(0,0,0,0.9)] overflow-hidden relative flex-shrink-0 pointer-events-auto border-x border-border md:border"
          >
            {generatedFiles.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground font-medium bg-card">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4 border border-border">
                  <Layout size={20} className="opacity-80" />
                </div>
                <span className="text-[12px] font-medium">Nexus Engine // Aguardando</span>
              </div>
            ) : (
              <iframe 
                ref={iframeRef}
                key={previewKey}
                className="w-full h-full border-none bg-white"
                sandbox="allow-scripts allow-forms allow-modals allow-popups allow-presentation allow-same-origin"
                title="Preview"
              />
            )}
          </div>
        </div>

        {/* Console Overlay */}
        <AnimatePresence>
          {showConsole && (
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute bottom-0 left-0 right-0 h-64 bg-background/95 backdrop-blur-3xl border-t border-border z-[40] flex flex-col font-mono shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
            >
              <div className="h-9 border-b border-border flex items-center justify-between px-4 shrink-0 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <TerminalIcon size={12} className="text-primary" />
                  <span className="text-[9px] font-black uppercase text-muted-foreground tracking-[.3em]">Terminal de Saída Cortex</span>
                </div>
                <div className="flex items-center gap-2">
                   <button 
                    onClick={() => {
                      const logsText = logs.map(l => l.args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ')).join('\n');
                      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(logsText).then(() => {
                           toast.success("Logs Copiados");
                        }).catch(err => {
                           console.error("Clipboard Error:", err);
                           toast.error("Erro ao copiar logs");
                        });
                      }
                    }}
                    className="flex items-center gap-1 text-[8px] font-black uppercase text-muted-foreground hover:text-foreground transition-colors bg-muted px-2 py-1 rounded"
                   >
                     <Copy size={10} /> Copiar
                   </button>
                   <button 
                    onClick={() => setLogs([])} 
                    className="flex items-center gap-1 text-[8px] font-black uppercase text-muted-foreground hover:text-foreground transition-colors bg-muted px-2 py-1 rounded"
                   >
                     <Trash2 size={10} /> Limpar
                   </button>
                   <button 
                    onClick={() => setShowConsole(false)}
                    className="w-5 h-5 flex items-center justify-center rounded hover:bg-muted transition-colors"
                   >
                     <Maximize2 size={10} className="text-muted-foreground" />
                   </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar bg-black/20">
                {logs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-60">
                    <div className="w-10 h-10 rounded-full border border-dashed border-border mb-3 animate-[spin_10s_linear_infinite]" />
                    <span className="text-[10px] uppercase font-bold tracking-[0.5em] italic">Nenhum Sinal Detectado</span>
                  </div>
                ) : (
                  logs.map((log, i) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={i} 
                      className={cn(
                        "text-[11px] flex gap-3 border-l-2 pl-3 py-1 items-start transition-colors group",
                        log.type === 'error' ? "text-red-400 border-red-500/80 bg-red-500/5" :
                        log.type === 'warn' ? "text-amber-400 border-amber-500/80 bg-amber-500/5" :
                        "text-muted-foreground border-primary/20 hover:bg-white/[0.02]"
                      )}
                    >
                      <span className="text-muted-foreground font-bold shrink-0 select-none group-hover:text-primary/40 transition-colors">
                        {new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      <span className="break-all font-medium leading-relaxed">
                        {log.args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg)).join(' ')}
                      </span>
                    </motion.div>
                  ))
                )}
                <div ref={logsEndRef} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
