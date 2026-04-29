import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Monitor, Smartphone, Tablet, ExternalLink, Layout, Maximize2, Trash2, Terminal as TerminalIcon, Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { GeneratedFile } from '../../types';
import { generatePreviewHTML } from './preview/virtualBundler';

interface PreviewPaneProps {
  generatedFiles: GeneratedFile[];
  previewKey: number;
}

export const PreviewPane = ({ 
  generatedFiles, 
  previewKey, 
}: PreviewPaneProps) => {
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [logs, setLogs] = useState<{ type: string; args: any[] }[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const viewportWidths = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px'
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const calculateScale = useCallback(() => {
    if (!containerRef.current || viewport === 'desktop') {
      setScale(1);
      return;
    }

    const containerWidth = containerRef.current.clientWidth - 40;
    const containerHeight = containerRef.current.clientHeight - 40;
    
    const targetWidth = viewport === 'tablet' ? 768 : 375;
    const targetHeight = viewport === 'tablet' ? 1024 : 667;

    const scaleX = containerWidth / targetWidth;
    const scaleY = containerHeight / targetHeight;
    const finalScale = Math.min(scaleX, scaleY, 1);
    
    setScale(finalScale);
  }, [viewport]);

  useEffect(() => {
    calculateScale();
    const observer = new ResizeObserver(calculateScale);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [calculateScale]);

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
        <div className="flex items-center gap-1.5 p-1 bg-muted/40 rounded-xl border border-border/50">
          <button 
            onClick={() => setViewport('desktop')}
            className={cn("p-1.5 rounded-lg transition-all", viewport === 'desktop' ? "bg-primary/20 text-primary" : "text-muted-foreground/60 hover:text-foreground")}
          >
            <Monitor size={13} />
          </button>
          <button 
            onClick={() => setViewport('tablet')}
            className={cn("p-1.5 rounded-lg transition-all", viewport === 'tablet' ? "bg-primary/20 text-primary" : "text-muted-foreground/60 hover:text-foreground")}
          >
            <Tablet size={13} />
          </button>
          <button 
            onClick={() => setViewport('mobile')}
            className={cn("p-1.5 rounded-lg transition-all", viewport === 'mobile' ? "bg-primary/20 text-primary" : "text-muted-foreground/60 hover:text-foreground")}
          >
            <Smartphone size={13} />
          </button>
        </div>

        <div className="flex items-center gap-2">
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

      <div ref={containerRef} className="flex-1 relative bg-[#0d0d0e] overflow-hidden flex items-center justify-center p-4 md:p-12">
        <div className="relative flex items-center justify-center w-full h-full pointer-events-none">
          <motion.div 
            layout
            initial={false}
            animate={{
              width: viewport === 'desktop' ? '100%' : viewport === 'tablet' ? 768 : 375,
              height: viewport === 'desktop' ? '100%' : viewport === 'tablet' ? 1024 : 667,
              scale: scale,
            }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            style={{ originX: 0.5, originY: 0.5 }}
            className={cn(
              "bg-white shadow-[0_50px_150px_rgba(0,0,0,0.9)] overflow-hidden relative flex-shrink-0 pointer-events-auto",
              viewport === 'desktop' ? "w-full h-full rounded-md" : "rounded-[3.5rem] border-[14px] border-[#18181b] ring-1 ring-white/10"
            )}
          >
            {/* Device Hardware Decorations */}
            {viewport !== 'desktop' && (
              <>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#18181b] rounded-b-2xl z-30 flex items-center justify-center gap-1.5">
                   <div className="w-10 h-1 bg-white/5 rounded-full" />
                   <div className="w-1 h-1 rounded-full bg-white/5" />
                </div>
                {/* Volume buttons */}
                <div className="absolute top-24 -left-[14px] w-[3px] h-10 bg-muted rounded-r-lg" />
                <div className="absolute top-36 -left-[14px] w-[3px] h-10 bg-muted rounded-r-lg" />
                {/* Power button */}
                <div className="absolute top-28 -right-[14px] w-[3px] h-14 bg-muted rounded-l-lg" />
              </>
            )}

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
          </motion.div>
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

      {/* Viewport Info Overlay - Hidden when console is open to avoid clutter */}
      {!showConsole && (
        <div className="absolute bottom-6 right-6 z-30 hidden sm:flex pointer-events-none">
          <div className="bg-background/80 backdrop-blur-xl border border-border px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Resolução</span>
              <span className="text-[12px] font-bold text-foreground tracking-tighter">{viewportWidths[viewport]} &times; Default</span>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Estado</span>
              <span className="text-[12px] font-bold text-primary flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Sincronizado
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
