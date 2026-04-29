import { GeneratedFile } from '../../../types';
import { libraryGlobals, cdns } from '../../../constants/cdnLibraries';

export const consoleCaptureScript = `
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
    console.warn = (...args) => { 
      const msg = args.join(' ');
      if (msg.includes('cdn.tailwindcss.com should not be used in production') || msg.includes('in-browser Babel transformer')) {
         return; // Ignore dev environment warnings
      }
      originalWarn(...args); 
      sendLog('warn', args); 
    };
    
    window.onerror = (msg, url, line, col, error) => {
      sendLog('error', [msg + ' (line ' + line + ')']);
    };
  })();
</script>
`;

export const getBundledScripts = (scriptFiles: GeneratedFile[]) => {
  return scriptFiles.map(f => {
    let code = f.code;
    // Remove CSS imports
    code = code.replace(/^import\s+['"].*\.(css|scss|less)['"];?\s*$/gm, '');
    
    // Normaliza imports multiline para uma linha antes de processar
    code = code.replace(/import\s+\{([^}]+)\}\s+from\s+(['"][^'"]+['"])/g, 
      (_, imports, pkg) => `import { ${imports.replace(/\s+/g, ' ').trim()} } from ${pkg}`
    );
    
    // Substitui imports por globals
    code = code.replace(
      /import\s+([\s\S]*?)\s+from\s+['"]([^'"]+)['"];?/gm,
      (_match, importsStr, pkg) => {
        const globalObj = libraryGlobals[pkg];
        if (!globalObj) {
          if (pkg.startsWith('.') || pkg.startsWith('@/')) return `/* local: ${pkg} */`;
          return `/* lib não mapeada: ${pkg} */`;
        }
        
        let out: string[] = [];
        
        if (importsStr.includes('* as')) {
          const asName = importsStr.split('as ')[1].trim();
          out.push(`const ${asName} = ${globalObj};`);
        } else {
          const hasDefault = !importsStr.trim().startsWith('{');
          const braceMatch = importsStr.match(/\{([^}]+)\}/);
          
          if (hasDefault) {
            const defaultName = importsStr.split(/[,{]/)[0].trim();
            if (defaultName) out.push(`const ${defaultName} = ${globalObj};`);
          }
          if (braceMatch) {
            const named = braceMatch[1].replace(/\s+as\s+\w+/g, '').trim();
            out.push(`const { ${named} } = ${globalObj};`);
          }
        }
        
        return out.join('\n');
      }
    );

    // Remove export default 
    code = code.replace(/^export default /gm, 'const _DefaultExport = ');
    code = code.replace(/^export \{ /gm, '// export { ');
    code = code.replace(/^export const /gm, 'const ');
    code = code.replace(/^export function /gm, 'function ');
    
    return code;
  }).join('\n\n');
};

export const generatePreviewHTML = (generatedFiles: GeneratedFile[]) => {
  const indexFile = generatedFiles.find(
    f => f.name === 'index.html' || f.name.endsWith('/index.html')
  );

  // Se já tem um index.html gerado pela IA, use-o diretamente
  if (indexFile?.code) {
    const withConsole = indexFile.code.replace(
      '</head>',
      `${consoleCaptureScript}</head>`
    );
    return withConsole;
  }

  // Fallback: construir preview a partir de arquivos .tsx/.ts/.js
  const scriptFiles = generatedFiles.filter(f => /\.(tsx|ts|js|jsx)$/.test(f.name));
  
  if (scriptFiles.length === 0) {
    return `<html><body style="background:#111;color:#888;display:flex;align-items:center;
      justify-content:center;height:100vh;font-family:sans-serif;">
      <p>Nenhum arquivo de preview encontrado.</p></body></html>`;
  }

  const bundledCode = getBundledScripts(scriptFiles);

  const mainComponent = scriptFiles.find(
    f => f.name.includes('App') || f.name.includes('app') || f.name.includes('main')
  );
  const componentName = mainComponent
    ? (mainComponent.code.match(/(?:function|const|class)\s+(\w+)/)?.[1] || 'App')
    : 'App';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Nexus Preview</title>
${cdns}
${consoleCaptureScript}
</head>
<body>
<div id="root"></div>
<script type="text/babel">
const React = window.React;
const { useState, useEffect, useRef, useCallback, useMemo } = React;
const ReactDOM = window.ReactDOM;

// Safe mock
window.lucideFallback = new Proxy({}, { 
  get: (_, prop) => () => React.createElement('span', { className: 'lucide-fallback', style: { border: '1px dashed #666', padding: '2px', fontSize: '10px' } }, prop) 
});

${bundledCode}

try {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(React.createElement(${componentName}));
} catch(e) {
  document.getElementById('root').innerHTML = 
    '<div style="color:red;padding:20px;font-family:monospace">' + 
    '<b>Erro de renderização:</b><br>' + e.message + '</div>';
}
</script>
</body>
</html>`;
}
