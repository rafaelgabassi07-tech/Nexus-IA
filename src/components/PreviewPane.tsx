import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Layout, Activity, AlertCircle, RefreshCcw } from 'lucide-react';
import { Button } from './ui/button';
import { GeneratedFile } from '../types';
import { cn } from '../lib/utils';

interface PreviewPaneProps {
  generatedFiles: GeneratedFile[];
  previewKey: number;
  activeTab: string;
  isLoading: boolean;
  handleSendMessage: (e?: any, content?: string) => void;
}

export const PreviewPane = ({
  generatedFiles,
  previewKey,
  activeTab,
  isLoading,
  handleSendMessage
}: PreviewPaneProps) => {
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    const buildPreviewHtml = () => {
      const htmlFile = generatedFiles.find(f => f.lang === 'html');
      if (htmlFile) return htmlFile.code;

      if (generatedFiles.length > 0) {
        const filesJson = JSON.stringify(generatedFiles.map(f => ({ name: f.name, code: f.code })));

        return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Nexus Preview</title>
    <!-- Use Babel Standalone -->
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- We load basic React and dependencies from ESM.sh to global variables so require() can return them -->
    <script type="module">
      import React from 'https://esm.sh/react@18.3.1';
      import * as ReactDOMClient from 'https://esm.sh/react-dom@18.3.1/client';
      import * as LucideReact from 'https://esm.sh/lucide-react@0.418.0';
      import * as Recharts from 'https://esm.sh/recharts@2.12.7';
      import * as FramerMotion from 'https://esm.sh/framer-motion@11.11.13';
      import clsx from 'https://esm.sh/clsx@2.1.1';
      import { twMerge } from 'https://esm.sh/tailwind-merge@2.4.0';
      import * as DateFns from 'https://esm.sh/date-fns@3.6.0';
      
      window.React = React;
      window.ReactDOMClient = ReactDOMClient;
      window.LucideReact = LucideReact;
      window.Recharts = Recharts;
      window.FramerMotion = FramerMotion;
      window.clsx = clsx;
      window.twMerge = twMerge;
      window.DateFns = DateFns;
      
      // Signal dependencies are ready
      window.dispatchEvent(new Event('deps-loaded'));
    </script>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
      body { margin: 0; font-family: 'Inter', sans-serif; background: #0d0d0e; color: #f1f3f4; overflow-x: hidden; }
      #root { min-height: 100vh; display: flex; flex-direction: column; }
      ::-webkit-scrollbar { width: 6px; height: 6px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
      ::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
    </style>
</head>
<body>
    <div id="root">
      <div style="display: flex; align-items: center; justify-content: center; height: 100vh; opacity: 0.5; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em;">
        Compilando Virtual Canvas...
      </div>
    </div>
    
    <script>
      window.VirtualFiles = ${filesJson};
      
      const requireCache = {};

      function resolvePath(basePath, relativePath) {
        if (!relativePath.startsWith('.')) return relativePath; // node module
        
        const baseParts = basePath.split('/');
        baseParts.pop(); // remove file name
        
        const relativeParts = relativePath.split('/');
        
        for (const part of relativeParts) {
          if (part === '.') continue;
          if (part === '..') {
            baseParts.pop();
          } else {
            baseParts.push(part);
          }
        }
        return baseParts.join('/');
      }
      
      window.require = function(moduleName, importerPath = '') {
         if (moduleName === 'react') return window.React;
         if (moduleName === 'react-dom/client') return window.ReactDOMClient;
         if (moduleName === 'lucide-react') return window.LucideReact;
         if (moduleName === 'recharts') return window.Recharts;
         if (moduleName === 'framer-motion' || moduleName === 'motion/react') return window.FramerMotion;
         if (moduleName === 'clsx') return window.clsx;
         if (moduleName === 'tailwind-merge') return { twMerge: window.twMerge };
         if (moduleName === 'date-fns') return window.DateFns;
         
         let fileName = resolvePath(importerPath, moduleName);
         
         const fileOverride = window.VirtualFiles.find(f => f.name === moduleName);
         if (fileOverride) fileName = moduleName;
         
         if (!fileName.includes('.')) {
           const possible = [fileName + '.tsx', fileName + '.ts', fileName + '.jsx', fileName + '.js', fileName + '/index.tsx', fileName + '/index.ts'];
           for (const p of possible) {
             if (window.VirtualFiles.find(f => f.name === p)) {
                fileName = p;
                break;
             }
           }
         }
         
         if (requireCache[fileName]) return requireCache[fileName].exports;
         
         const fileCtx = window.VirtualFiles.find(f => f.name === fileName);
         if (!fileCtx) {
           console.warn("Module not found in virtual filesystem:", moduleName, "->", fileName);
           return {};
         }
         
         const module = { exports: {} };
         requireCache[fileName] = module;
         
         try {
           const compiled = Babel.transform(fileCtx.code, {
             presets: ['env', 'react', 'typescript']
           }).code;
           
           const customRequire = function(mod) { return window.require(mod, fileName); };
           const fn = new Function('require', 'module', 'exports', 'React', compiled);
           fn(customRequire, module, module.exports, window.React);
         } catch(e) {
           console.error("Error evaluating", fileName, e);
           const rootLayout = document.getElementById('root');
           rootLayout.innerHTML = '<div style="color:red;padding:20px;font-family:monospace;background:#330000;height:100vh;"><b>Error compiling ' + fileName + '</b><br/><br/>' + e.message + '</div>';
           throw e;
         }
         
         return module.exports;
      };

      function mountApp() {
        try {
          const entryFile = window.VirtualFiles.find(f => {
            const name = f.name.toLowerCase().split('/').pop();
            return name === 'app.tsx' || 
                   name === 'main.tsx' || 
                   name === 'index.tsx' ||
                   name === 'app.ts' || 
                   name === 'main.ts' || 
                   name === 'index.ts';
          }) || window.VirtualFiles[0];

          if (!entryFile) throw new Error("No files to mount.");

          const exports = window.require(entryFile.name);
          
          let ComponentToRender = exports.default || exports.App || exports.Main || Object.values(exports)[0];

          if (!ComponentToRender) {
             throw new Error("Não foi possível encontrar um componente para renderizar. Certifique-se de exportar o componente principal usando 'export default'.");
          }

          const rootLayout = document.getElementById('root');
          rootLayout.innerHTML = '';
          const root = window.ReactDOMClient.createRoot(rootLayout);
          root.render(window.React.createElement(ComponentToRender));
        } catch (err) {
          console.error("Preview Runtime Error:", err);
          window.parent.postMessage({ type: 'NEXUS_RUNTIME_ERROR', error: err.stack || err.message }, '*');
        }
      }

      window.addEventListener('deps-loaded', () => {
         mountApp();
      });
    </script>
</body>
</html>`;
      }
      return '';
    };

    if (!isLoading && generatedFiles.length > 0) {
      setPreviewHtml(buildPreviewHtml());
      setPreviewError(null);
    }
  }, [generatedFiles, isLoading]);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'NEXUS_RUNTIME_ERROR' && e.data?.error) {
        setPreviewError(e.data.error);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  if (!previewHtml && !isLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center space-y-4 opacity-40">
        <Layout size={48} strokeWidth={1} />
        <p className="text-sm font-medium uppercase tracking-widest">Aguardando geração do código...</p>
      </div>
    );
  }

  return (
    <div className={cn("w-full h-full relative overflow-hidden bg-[#0d0d0e]", activeTab !== 'preview' && "hidden")}>
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center"
          >
            <div className="bg-[#1e1f20] border border-white/5 rounded-2xl p-4 flex items-center gap-3 shadow-2xl">
              <RefreshCcw size={16} className="text-blue-400 animate-spin" />
              <span className="text-[11px] font-black uppercase tracking-widest text-white">Atualizando Preview...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <iframe 
        key={previewKey} 
        srcDoc={previewHtml} 
        className="w-full h-full border-none relative z-20" 
        sandbox="allow-scripts allow-forms allow-popups allow-modals" 
      />
      
      {previewError && (
        <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
          <div className="max-w-2xl w-full bg-[#1a0505] border border-red-500/30 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-500/10 rounded-full blur-3xl" />
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
                <AlertCircle size={32} className="text-red-500" strokeWidth={2.5} />
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight mb-3">Erro na Compilação</h3>
              <p className="text-[#8e918f] text-[13px] leading-relaxed mb-6 font-medium max-w-lg italic">
                O Virtual Canvas encontrou um erro ao interpretar o código gerado.
              </p>
              
              <div className="w-full bg-black/40 rounded-2xl p-4 mb-8 text-left border border-white/5 overflow-auto max-h-[200px] custom-scrollbar">
                <pre className="text-[11px] font-mono text-red-300/80 leading-relaxed whitespace-pre-wrap uppercase tracking-tighter">
                  {previewError}
                </pre>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <Button 
                  onClick={() => handleSendMessage(undefined, `Corrija o seguinte erro de compilação: ${previewError}`)}
                  className="flex-1 bg-red-500 hover:bg-red-400 text-white border-none h-12 rounded-xl text-[12px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20 gap-2 transition-all hover:scale-[1.02]"
                >
                  <Activity size={16} />
                  Corrigir com o Agente
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setPreviewError(null)}
                  className="flex-1 border-white/10 hover:bg-white/5 text-[#8e918f] h-12 rounded-xl text-[12px] font-black uppercase tracking-widest gap-2"
                >
                  Continuar Editando
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
