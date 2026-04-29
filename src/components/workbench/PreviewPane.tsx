import { useState, useEffect, useRef } from 'react';
import { 
  Monitor, Smartphone, Tablet, ExternalLink, Layout
} from 'lucide-react';
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
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const viewportWidths = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px'
  };

  const [logs, setLogs] = useState<{ type: string, args: any[] }[]>([]);

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
                <h1 style="font-size: 14px; font-weight: 900; letter-spacing: 0.3em; text-transform: uppercase;">Nexus Core Synthesis</h1>
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

  return (
    <div className="flex-1 flex flex-col bg-[#121316] relative overflow-hidden">
      {/* Top Controls */}
      <div className="h-8 border-b border-white/5 bg-black/20 backdrop-blur-2xl flex items-center justify-between px-2 shrink-0 z-20">
        <div className="flex items-center gap-0.5 bg-white/[0.02] p-0.5 rounded border border-white/5">
          <button 
            onClick={() => setViewport('desktop')}
            className={cn("p-1 rounded transition-all", viewport === 'desktop' ? "bg-blue-600 text-white" : "text-[#8e918f] hover:text-white")}
          >
            <Monitor size={10} />
          </button>
          <button 
            onClick={() => setViewport('tablet')}
            className={cn("p-1 rounded transition-all", viewport === 'tablet' ? "bg-blue-600 text-white" : "text-[#8e918f] hover:text-white")}
          >
            <Tablet size={10} />
          </button>
          <button 
            onClick={() => setViewport('mobile')}
            className={cn("p-1 rounded transition-all", viewport === 'mobile' ? "bg-blue-600 text-white" : "text-[#8e918f] hover:text-white")}
          >
            <Smartphone size={10} />
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest">
           <button 
             onClick={() => setShowConsole(!showConsole)}
             className={cn(
               "px-2 h-5 rounded flex items-center gap-1.5 transition-all border",
               showConsole ? "bg-white/10 text-white border-white/10" : "text-white/20 border-transparent hover:text-white/40"
             )}
           >
             <div className={cn("w-1 h-1 rounded-full", logs.some(l => l.type === 'error') ? "bg-red-500 animate-pulse" : logs.length > 0 ? "bg-blue-500" : "bg-white/20")} />
             Terminal {logs.length > 0 && `(${logs.length})`}
           </button>

           <button 
             onClick={() => {
              const url = iframeRef.current?.src;
              if (url) window.open(url, '_blank');
             }}
             className="w-6 h-6 flex items-center justify-center rounded bg-white/5 text-[#8e918f] hover:text-white transition-all"
           >
            <ExternalLink size={12} />
           </button>
        </div>
      </div>

      <div className="flex-1 relative bg-white/5 overflow-hidden flex justify-center items-start scrollbar-hide">
        <div 
          className={cn(
            "bg-white shadow-2xl transition-all duration-500 ease-nexus ring-1 ring-black/5 origin-top",
            viewport === 'desktop' ? "w-full h-full" : 
            viewport === 'tablet' ? "w-[768px] h-[1024px] rounded-2xl my-4 scale-[0.6] md:scale-[0.8]" : 
            "w-[375px] h-[667px] rounded-2xl my-4 scale-[0.7] md:scale-[0.9]"
          )}
        >
          {generatedFiles.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-[#8e918f] font-medium bg-[#0b0c0e]">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4 border border-white/5">
                <Layout size={20} className="opacity-20" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.3em] font-black opacity-30">Nexus Canvas Ready</span>
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

        {/* Console Overlay */}
        {showConsole && (
          <div className="absolute bottom-0 left-0 right-0 h-48 bg-[#0d0d0e]/95 backdrop-blur-3xl border-t border-white/10 z-[40] flex flex-col font-mono animate-in slide-in-from-bottom duration-300">
            <div className="h-8 border-b border-white/5 flex items-center justify-between px-4 shrink-0 overflow-hidden">
              <span className="text-[8px] font-black uppercase text-white/20 tracking-[.25em]">Output Matrix Logs</span>
              <button onClick={() => setLogs([])} className="text-[8px] font-black uppercase text-white/10 hover:text-white/40">Clear</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
              {logs.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <span className="text-[10px] uppercase font-bold text-white/5 tracking-widest italic">Aguardando sinais...</span>
                </div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className={cn(
                    "text-[11px] flex gap-3 border-l-2 pl-3 py-0.5",
                    log.type === 'error' ? "text-red-400 border-red-500/50 bg-red-500/5" :
                    log.type === 'warn' ? "text-amber-400 border-amber-500/50 bg-amber-500/5" :
                    "text-white/60 border-white/5"
                  )}>
                    <span className="opacity-20 shrink-0 select-none">[{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                    <span className="break-all">{log.args.join(' ')}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Viewport Info Overlay - Hidden when console is open to avoid clutter */}
      {!showConsole && (
        <div className="absolute bottom-6 right-6 z-30 hidden sm:flex pointer-events-none">
          <div className="bg-[#0d0d0e]/80 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-[#8e918f]">Resolution</span>
              <span className="text-[12px] font-bold text-white tracking-tighter">{viewportWidths[viewport]} &times; Default</span>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-[#8e918f]">State</span>
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
