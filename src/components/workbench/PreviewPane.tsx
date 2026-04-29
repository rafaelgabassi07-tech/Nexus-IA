import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Monitor, Smartphone, Tablet, ExternalLink, Layout, Maximize2, Trash2, Terminal as TerminalIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { GeneratedFile } from '../../types';

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

  // Use a blob URL for the preview to avoid recursion and allow multi-file support
  useEffect(() => {
    if (!iframeRef.current || generatedFiles.length === 0) return;

    const generatePreviewUrl = () => {
      const indexFile = generatedFiles.find(f => f.name === 'index.html' || f.name.endsWith('/index.html'));
      const scriptFiles = generatedFiles.filter(f => /\.(tsx|ts|js|jsx)$/.test(f.name));
      
      let htmlContent = indexFile?.code || '';

      const consoleCaptureScript = `
        <script>
          (function() {
            const originalLog = console.log;
            const originalError = console.error;
            const originalWarn = console.warn;
            
            const sendLog = (type, args) => {
              window.parent.postMessage({ type: 'PREVIEW_LOG', logType: type, content: Array.from(args).map(a => {
                try {
                  return typeof a === 'object' ? JSON.stringify(a) : String(a);
                } catch(e) { return "[Object]"; }
              })}, '*');
            };

            console.log = (...args) => { originalLog(...args); sendLog('log', args); };
            console.error = (...args) => { originalError(...args); sendLog('error', args); };
            console.warn = (...args) => { originalWarn(...args); sendLog('warn', args); };
            
            window.onerror = (msg, url, line, col, error) => {
              sendLog('error', [msg + ' (line ' + line + ')']);
            };
          })();
        </script>
      `;

      // Virtual Bundler: Concatenate and clean scripts for Babel-Standalone
      const bundledScripts = scriptFiles.map(f => {
        let code = f.code;
        // Comment out imports/exports that break in single-file Babel context
        code = code.replace(/^import\s+.*\s+from\s+['"].*['"];?/gm, '// $&');
        code = code.replace(/^export\s+(default\s+)?/gm, '');
        return `// File: ${f.name}\n${code}`;
      }).join('\n\n');

      const cdns = `
        <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
        <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
        <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://unpkg.com/lucide@latest"></script>
        <script src="https://unpkg.com/motion@11.11.13/dist/motion.js"></script>
      `;

      const setupScript = `
        <script type="text/babel" data-presets="react,typescript">
          // Globalize React for Babel components
          window.React = React;
          window.ReactDOM = ReactDOM;
          
          try {
            ${bundledScripts}
            
            // Auto-mount if there's an App component and a root div
            if (typeof App !== 'undefined' && document.getElementById('root')) {
              const root = ReactDOM.createRoot(document.getElementById('root'));
              root.render(<App />);
            }
          } catch (err) {
            console.error("Nexus Bundle Error:", err.message);
          }
        </script>
      `;

      if (!htmlContent) {
        // Full auto-generated environment for React-only snippets
        htmlContent = `
          <!DOCTYPE html>
          <html lang="pt-BR">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            ${consoleCaptureScript}
            ${cdns}
            <style>
              body { background-color: #0d0d0e; color: white; margin: 0; font-family: sans-serif; }
              #root { height: 100vh; }
              .nexus-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; opacity: 0.5; }
            </style>
          </head>
          <body>
            <div id="root">
              <div class="nexus-loading">
                <h1 style="font-size: 14px; font-weight: 900; letter-spacing: 0.3em; text-transform: uppercase;">Síntese de Núcleo Nexus</h1>
                <p style="font-size: 10px; opacity: 0.5;">Compilando matriz de renderização...</p>
              </div>
            </div>
            ${setupScript}
          </body>
          </html>
        `;
      } else {
        // Inject dependencies into user-provided HTML
        if (htmlContent.includes('</head>')) {
          htmlContent = htmlContent.replace('</head>', `${consoleCaptureScript}${cdns}</head>`);
        } else {
          htmlContent = consoleCaptureScript + cdns + htmlContent;
        }
        
        if (htmlContent.includes('</body>')) {
          htmlContent = htmlContent.replace('</body>', `${setupScript}</body>`);
        } else {
          htmlContent += setupScript;
        }
        
        // Fix relative paths
        htmlContent = htmlContent.replace(/src="\//g, 'src="');
        htmlContent = htmlContent.replace(/href="\//g, 'href="');
      }

      const blob = new Blob([htmlContent], { type: 'text/html' });
      return URL.createObjectURL(blob);
    };

    setLogs([]); // Reset logs on reload
    const url = generatePreviewUrl();
    if (iframeRef.current) {
      iframeRef.current.src = url;
    }

    return () => {
      if (url) URL.revokeObjectURL(url);
    };
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
    <div className="flex-1 flex flex-col bg-[#121316] relative overflow-hidden">
      {/* Top Controls */}
      <div className="h-10 md:h-8 border-b border-white/5 bg-black/40 backdrop-blur-3xl flex items-center justify-between px-3 shrink-0 z-20">
        <div className="flex items-center gap-1 bg-white/[0.03] p-0.5 rounded-lg border border-white/5">
          <button 
            onClick={() => setViewport('desktop')}
            className={cn("p-1.5 md:p-1 rounded-md transition-all", viewport === 'desktop' ? "bg-[#00d2ff] text-black shadow-[0_0_10px_rgba(0,210,255,0.4)]" : "text-white/40 hover:text-white")}
          >
            <Monitor size={12} strokeWidth={2.5} />
          </button>
          <button 
            onClick={() => setViewport('tablet')}
            className={cn("p-1.5 md:p-1 rounded-md transition-all", viewport === 'tablet' ? "bg-[#00d2ff] text-black shadow-[0_0_10px_rgba(0,210,255,0.4)]" : "text-white/40 hover:text-white")}
          >
            <Tablet size={12} strokeWidth={2.5} />
          </button>
          <button 
            onClick={() => setViewport('mobile')}
            className={cn("p-1.5 md:p-1 rounded-md transition-all", viewport === 'mobile' ? "bg-[#00d2ff] text-black shadow-[0_0_10px_rgba(0,210,255,0.4)]" : "text-white/40 hover:text-white")}
          >
            <Smartphone size={12} strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex items-center gap-2">
           <button 
             onClick={() => setShowConsole(!showConsole)}
             className={cn(
               "px-3 h-7 md:h-5 rounded-full flex items-center gap-2 transition-all border text-[9px] font-black uppercase tracking-widest",
               showConsole ? "bg-white/10 text-white border-white/10" : "bg-white/[0.03] text-white/40 border-white/5 hover:text-white"
             )}
           >
             <div className={cn("w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor]", logs.some(l => l.type === 'error') ? "bg-red-500 text-red-500 animate-pulse" : logs.length > 0 ? "bg-blue-500 text-blue-500" : "bg-white/20 text-white/20")} />
             Terminal
           </button>

           <button 
             onClick={() => {
              const url = iframeRef.current?.src;
              if (url) window.open(url, '_blank');
             }}
             className="w-8 h-8 md:w-6 md:h-6 flex items-center justify-center rounded-lg bg-white/[0.03] border border-white/5 text-white/40 hover:text-white hover:border-white/20 transition-all"
           >
            <ExternalLink size={12} />
           </button>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 relative bg-[#09090b] overflow-hidden flex justify-center items-center p-4">
        <motion.div 
          layout
          initial={false}
          animate={{
            width: viewport === 'desktop' ? '100%' : viewport === 'tablet' ? 768 : 375,
            height: viewport === 'desktop' ? '100%' : viewport === 'tablet' ? 1024 : 667,
            scale: scale,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={cn(
            "bg-white shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden transition-shadow relative",
            viewport === 'desktop' ? "w-full h-full" : "rounded-[2.5rem] border-[12px] border-[#1a1b1e] ring-1 ring-white/10"
          )}
        >
          {/* Device Hardware Decorations */}
          {viewport !== 'desktop' && (
            <>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-[#1a1b1e] rounded-b-3xl z-30 flex items-center justify-center gap-2">
                 <div className="w-8 h-1 bg-white/5 rounded-full" />
                 <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
              </div>
              <div className="absolute top-1/2 -left-[12px] w-[3px] h-10 bg-white/5 rounded-r-lg" />
              <div className="absolute top-[45%] -right-[12px] w-[3px] h-16 bg-white/5 rounded-l-lg" />
            </>
          )}

          {generatedFiles.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-[#8e918f] font-medium bg-[#0b0c0e]">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4 border border-white/5">
                <Layout size={20} className="opacity-20" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.3em] font-black opacity-30">Nexus Pronto</span>
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

        {/* Console Overlay */}
        <AnimatePresence>
          {showConsole && (
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute bottom-0 left-0 right-0 h-64 bg-[#0d0d0e]/95 backdrop-blur-3xl border-t border-white/10 z-[40] flex flex-col font-mono shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
            >
              <div className="h-9 border-b border-white/5 flex items-center justify-between px-4 shrink-0 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <TerminalIcon size={12} className="text-blue-400" />
                  <span className="text-[9px] font-black uppercase text-white/40 tracking-[.3em]">Terminal de Saída Cortex</span>
                </div>
                <div className="flex items-center gap-2">
                   <button 
                    onClick={() => setLogs([])} 
                    className="flex items-center gap-1 text-[8px] font-black uppercase text-white/30 hover:text-white transition-colors bg-white/5 px-2 py-1 rounded"
                   >
                     <Trash2 size={10} /> Limpar
                   </button>
                   <button 
                    onClick={() => setShowConsole(false)}
                    className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/5 transition-colors"
                   >
                     <Maximize2 size={10} className="text-white/20" />
                   </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar bg-black/20">
                {logs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-20">
                    <div className="w-10 h-10 rounded-full border border-dashed border-white/20 mb-3 animate-[spin_10s_linear_infinite]" />
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
                        "text-white/70 border-blue-500/20 hover:bg-white/[0.02]"
                      )}
                    >
                      <span className="text-white/10 font-bold shrink-0 select-none group-hover:text-blue-400/40 transition-colors">
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
          <div className="bg-[#0d0d0e]/80 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-[#8e918f]">Resolução</span>
              <span className="text-[12px] font-bold text-white tracking-tighter">{viewportWidths[viewport]} &times; Default</span>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-[#8e918f]">Estado</span>
              <span className="text-[12px] font-bold text-emerald-400 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Sincronizado
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
