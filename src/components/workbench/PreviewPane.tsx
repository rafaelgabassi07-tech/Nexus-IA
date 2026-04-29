import React, { useState, useEffect, useRef } from 'react';
import { 
  Loader2, 
  Monitor, Smartphone, Tablet, ExternalLink,
  ShieldCheck, RefreshCw
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { GeneratedFile } from '../../types';

interface PreviewPaneProps {
  generatedFiles: GeneratedFile[];
  previewKey: number;
  activeTab: string;
  isLoading: boolean;
  handleSendMessage: (e?: React.FormEvent, overridePrompt?: string, messagesToUse?: any[]) => Promise<void> | any;
}

export const PreviewPane = ({ 
  generatedFiles, 
  previewKey, 
  activeTab, 
  isLoading,
  handleSendMessage 
}: PreviewPaneProps) => {
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Auto-reload on scale changes or new files
  useEffect(() => {
    setIframeLoaded(false);
  }, [previewKey, generatedFiles.length]);

  const viewportWidths = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px'
  };

  const hasFiles = generatedFiles.length > 0;
  const isPreview = activeTab === 'preview';

  if (!isPreview) return null;

  return (
    <div className="flex-1 flex flex-col bg-[#121316] relative overflow-hidden">
      {/* Top Controls */}
      <div className="h-10 border-b border-white/5 bg-black/20 backdrop-blur-2xl flex items-center justify-between px-3 shrink-0 z-20">
        <div className="flex items-center gap-1 bg-white/[0.02] p-0.5 rounded-lg border border-white/5">
          <button 
            onClick={() => setViewport('desktop')}
            className={cn("p-1 rounded-md transition-all", viewport === 'desktop' ? "bg-blue-600 text-white shadow-lg" : "text-[#8e918f] hover:text-white")}
            title="Desktop"
          >
            <Monitor size={12} />
          </button>
          <button 
            onClick={() => setViewport('tablet')}
            className={cn("p-1 rounded-md transition-all", viewport === 'tablet' ? "bg-blue-600 text-white shadow-lg" : "text-[#8e918f] hover:text-white")}
            title="Tablet"
          >
            <Tablet size={12} />
          </button>
          <button 
            onClick={() => setViewport('mobile')}
            className={cn("p-1 rounded-md transition-all", viewport === 'mobile' ? "bg-blue-600 text-white shadow-lg" : "text-[#8e918f] hover:text-white")}
            title="Mobile"
          >
            <Smartphone size={12} />
          </button>
        </div>

        <div className="flex items-center gap-2">
           <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 border border-emerald-500/10 rounded-full text-[8px] font-black uppercase tracking-widest text-emerald-400">
            <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden xs:inline">Live Sync</span>
           </div>
           <button 
             onClick={() => window.open(window.location.origin, '_blank')}
             className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 text-[#8e918f] hover:text-white transition-all"
           >
            <ExternalLink size={14} />
           </button>
        </div>
      </div>

      {/* Main Preview Containter */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-hidden bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/[0.02] to-transparent">
        <div 
          className="bg-white shadow-2xl rounded-2xl overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] relative border border-white/10"
          style={{ width: viewportWidths[viewport], height: '100%', maxHeight: '100%' }}
        >
          {isLoading && !iframeLoaded && (
             <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md">
               <div className="relative">
                 <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                 <div className="absolute inset-0 blur-xl bg-blue-500/20 animate-pulse" />
               </div>
               <p className="mt-4 text-[12px] font-black uppercase tracking-[0.3em] text-[#8e918f]">Orquestrando preview...</p>
             </div>
          )}

          {!hasFiles ? (
            <div className="h-full flex flex-col items-center justify-center bg-[#0d0d0e] p-8 text-center space-y-8">
              <div className="relative">
                <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-tr from-blue-500/20 to-purple-500/20 border border-white/5 flex items-center justify-center shadow-2xl relative z-10 group overflow-hidden">
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <Monitor size={40} className="text-blue-400 transition-transform duration-500 group-hover:scale-110" />
                </div>
                <div className="absolute -inset-4 bg-blue-500/5 blur-3xl rounded-full animate-pulse" />
              </div>
              <div className="space-y-4 max-w-sm">
                <h2 className="text-[24px] font-black text-white uppercase tracking-tighter leading-none italic">Sistema de Visualização</h2>
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-2xl text-left hover:bg-white/[0.04] transition-colors group">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0 group-hover:scale-110 transition-transform">
                      <ShieldCheck size={16} />
                    </div>
                    <div>
                      <p className="text-[12px] font-bold text-white/90">Sandbox Integrada</p>
                      <p className="text-[10px] text-[#8e918f] font-medium leading-relaxed mt-1">Ambiente isolado para testes seguros de componentes e layouts.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-2xl text-left hover:bg-white/[0.04] transition-colors group">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0 group-hover:scale-110 transition-transform">
                      <RefreshCw size={16} />
                    </div>
                    <div>
                      <p className="text-[12px] font-bold text-white/90">Hot Reload</p>
                      <p className="text-[10px] text-[#8e918f] font-medium leading-relaxed mt-1">Atualizações em tempo real assim que o código é manifestado.</p>
                    </div>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => handleSendMessage(undefined, "Crie um componente de exemplo incrível para testarmos o canvas.")?.catch((err: any) => console.error("Failed to start preview example:", err))}
                className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-blue-600/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
              >
                Ativar Matriz Visual
              </button>
            </div>
          ) : (
            <iframe 
              ref={iframeRef}
              key={previewKey}
              srcDoc={
                generatedFiles.find(f => f.name === 'index.html')?.code || 
                `<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script></head><body class="flex items-center justify-center h-screen bg-gray-50"><div class="text-center"><h1 class="text-2xl font-bold text-gray-800">Preview Nexus</h1><p class="text-gray-500">O código gerado aparecerá aqui.</p></div></body></html>`
              }
              className="w-full h-full border-none bg-white"
              onLoad={() => setIframeLoaded(true)}
              sandbox="allow-scripts allow-forms allow-modals allow-popups allow-presentation allow-same-origin"
              title="Preview"
            />
          )}
        </div>
      </div>

      {/* Viewport Info Overlay */}
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
    </div>
  );
};
