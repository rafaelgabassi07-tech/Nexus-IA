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
  // This new implementation creates a modular registry
  const modules = scriptFiles.map(f => {
    let code = f.code;
    const fileName = f.name.replace(/^\.\//, '').replace(/^\//, '');
    
    // Remove CSS imports
    code = code.replace(/^import\s+['"].*\.(css|scss|less)['"];?\s*$/gm, '');
    
    // Normalize imports to a standard format for easier replacement
    code = code.replace(/import\s+\{([^}]+)\}\s+from\s+(['"][^'"]+['"])/g, 
      (_, imports, pkg) => `import { ${imports.replace(/\s+/g, ' ').trim()} } from ${pkg}`
    );
    
    // Replace lib imports with globals and local imports with registry lookups
    code = code.replace(
      /import\s+([\s\S]*?)\s+from\s+['"]([^'"]+)['"];?/gm,
      (_match, importsStr, pkg) => {
        const globalObj = libraryGlobals[pkg];
        
        // Handle Local Imports (VFS)
        if (!globalObj && (pkg.startsWith('.') || pkg.startsWith('@/'))) {
          // Calculate absolute-ish path for the required module
          let targetPath = pkg.replace(/^@\//, '');
          if (pkg.startsWith('.')) {
             const currentDir = fileName.split('/').slice(0, -1).join('/');
             // Basic relative path resolver (doesn't handle ../.. yet but usually enough)
             targetPath = pkg.replace(/^\.\//, currentDir ? currentDir + '/' : '');
          }
          
          // Clean extension
          targetPath = targetPath.replace(/\.(tsx|ts|jsx|js)$/, '');
          
          let out: string[] = [];
          if (importsStr.includes('* as')) {
            const asName = importsStr.split('as ')[1].trim();
            out.push(`const ${asName} = window.__require("${targetPath}");`);
          } else {
            const hasDefault = !importsStr.trim().startsWith('{');
            const braceMatch = importsStr.match(/\{([^}]+)\}/);
            
            if (hasDefault) {
              const defaultName = importsStr.split(/[,{]/)[0].trim();
              if (defaultName) out.push(`const ${defaultName} = window.__require("${targetPath}").default;`);
            }
            if (braceMatch) {
              const named = braceMatch[1].trim();
              if (named.includes(' as ')) {
                const parts = named.split(',').map((s: string) => s.trim());
                const destruct = parts.map((p: string) => {
                   if (p.includes(' as ')) {
                     const [orig, alias] = p.split(' as ');
                     return `${orig}: ${alias}`;
                   }
                   return p;
                }).join(', ');
                out.push(`const { ${destruct} } = window.__require("${targetPath}");`);
              } else {
                out.push(`const { ${named} } = window.__require("${targetPath}");`);
              }
            }
          }
          return out.join('\n');
        }

        // Handle Library Imports
        if (!globalObj) return `/* external: ${pkg} */`;
        
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

    // Replace Exports with Registry population
    const moduleName = fileName.replace(/\.(tsx|ts|jsx|js)$/, '');
    
    // Clean code of top-level export keywords
    code = code.replace(/^export default /gm, '_exports.default = ');
    code = code.replace(/^export (const|let|var|function|class) (\w+)/gm, (_m, type, name) => {
      return `${type} ${name} = _exports.${name} = `;
    });
    // Handle named exports: export { a, b }
    code = code.replace(/^export \{([^}]+)\}/gm, (_, exports) => {
       return exports.split(',').map((e: string) => {
         const name = e.trim();
         return `_exports.${name} = ${name};`;
       }).join('\n');
    });

    return `
window.__define("${moduleName}", (_exports) => {
  ${code}
});`;
  }).join('\n\n');

  return `
window.__modules = {};
window.__define = (name, fn) => {
  window.__modules[name] = { fn, exports: {}, initialized: false };
};
window.__require = (name) => {
  const m = window.__modules[name] || 
            window.__modules[name + "/index"] || 
            window.__modules[Object.keys(window.__modules).find(k => k.endsWith("/" + name))];
            
  if (!m) {
    console.warn("Module not found in VFS:", name);
    return {};
  }
  if (!m.initialized) {
    m.initialized = true;
    m.fn(m.exports);
  }
  return m.exports;
};

${modules}
`;
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
  
  const mainModuleName = mainComponent 
    ? mainComponent.name.replace(/^\.\//, '').replace(/^\//, '').replace(/\.(tsx|ts|jsx|js)$/, '')
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
const React = window.React || { useState: () => [null, () => {}], useEffect: () => {}, useRef: () => ({}), useCallback: (f) => f, useMemo: (f) => f() };
const { useState, useEffect, useRef, useCallback, useMemo } = React;
const ReactDOM = window.ReactDOM || { createRoot: () => ({ render: () => {} }) };

// Safe mock
window.lucideFallback = new Proxy({}, { 
  get: (_, prop) => () => React.createElement('span', { className: 'lucide-fallback', style: { border: '1px dashed #666', padding: '2px', fontSize: '10px' } }, prop) 
});

${bundledCode}

try {
  const mainModule = window.__require("${mainModuleName}");
  const Component = mainModule.default || mainModule.App || Object.values(mainModule).find(v => typeof v === 'function') || (() => <div>Componente App não encontrado</div>);
  
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(React.createElement(Component));
} catch(e) {
  console.error("Boot Error:", e);
  document.getElementById('root').innerHTML = 
    '<div style="color:red;padding:20px;font-family:monospace">' + 
    '<b>Erro de inicialização (VFS):</b><br>' + e.message + '</div>';
}
</script>
</body>
</html>`;
}
