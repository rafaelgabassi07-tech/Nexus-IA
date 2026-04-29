import { GeneratedFile } from '../types';

export const extractFilesFromMarkdown = (content: string, uniquePrefix: string = '') => {
  const files: { name: string, lang: string, code: string }[] = [];
  const lines = content.split('\n');
  
  let currentFile: { name: string, lang: string, code: string[] } | null = null;
  let inFence = false;
  let fenceLength = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fenceMatch = line.match(/^(\s*)(`{3,})/);

    if (fenceMatch) {
      const currentFenceLength = fenceMatch[2].length;
      
      if (!inFence) {
        // Opening fence
        inFence = true;
        fenceLength = currentFenceLength;
        
        const afterFence = line.slice(fenceMatch[0].length).trim();
        const parts = afterFence.split(/\s+/);
        const lang = parts[0] || 'text';
        const meta = parts.slice(1).join(' ');
        
        let name = '';
        if (meta) {
          const fileMatch = meta.match(/(?:file:\s*)?([\w.-/:\\\\]+\.\w+)/i);
          if (fileMatch) name = fileMatch[1];
        }
        
        // Se o LLM omitiu a linguagem e colocou direto o nome do arquivo na primeira parte
        if (!name && /^[\w.-/:\\\\]+\.\w+$/.test(lang)) {
          name = lang;
        }

        if (!name) {
          name = `nexus_asset_${uniquePrefix ? uniquePrefix + '_' : ''}${files.length + 1}.${lang === 'typescript' ? 'ts' : lang === 'javascript' ? 'js' : lang === 'react' ? 'tsx' : lang}`;
        }
        
        currentFile = { name, lang, code: [] };
      } else if (currentFenceLength >= fenceLength) {
        // Closing fence
        if (currentFile) {
          // If name is still generic, check first 3 lines for a filename
          if (currentFile.name.startsWith('nexus_asset_')) {
            for (let j = 0; j < Math.min(3, currentFile.code.length); j++) {
              const fileLineMatch = currentFile.code[j].match(/(?:file|arquivo)?:\s*([a-zA-Z0-9.\-_/\\]+\.[a-zA-Z0-9]+)/i) || 
                                    currentFile.code[j].match(/^\s*(?:\/\/\/?|\#|\<!--)\s*([a-zA-Z0-9.\-_/\\]+\.[a-zA-Z0-9]+)\s*(?:-->)?\s*$/);
              if (fileLineMatch) {
                currentFile.name = fileLineMatch[1];
                // Remove the comment line if it's just the filename
                if (currentFile.code[j].trim().startsWith('//') || currentFile.code[j].trim().startsWith('#')) {
                  if (currentFile.code[j].length < fileLineMatch[1].length + 15) {
                    currentFile.code.splice(j, 1);
                  }
                }
                break;
              }
            }
          }

          files.push({
            name: currentFile.name,
            lang: currentFile.lang,
            code: currentFile.code.join('\n')
          });
        }
        currentFile = null;
        inFence = false;
        fenceLength = 0;
      } else if (currentFile) {
        // It's a nested fence shorter than the opening one
        currentFile.code.push(line);
      }
    } else if (inFence && currentFile) {
      currentFile.code.push(line);
    }
  }

  // Handle unclosed fences gracefully
  if (inFence && currentFile) {
    if (currentFile.name.startsWith('nexus_asset_')) {
      for (let j = 0; j < Math.min(3, currentFile.code.length); j++) {
        const fileLineMatch = currentFile.code[j].match(/(?:file|arquivo)?:\s*([a-zA-Z0-9.\-_/\\]+\.[a-zA-Z0-9]+)/i) || 
                              currentFile.code[j].match(/^\s*(?:\/\/\/?|\#|\<!--)\s*([a-zA-Z0-9.\-_/\\]+\.[a-zA-Z0-9]+)\s*(?:-->)?\s*$/);
        if (fileLineMatch) {
          currentFile.name = fileLineMatch[1];
          break;
        }
      }
    }
    files.push({
      name: currentFile.name,
      lang: currentFile.lang,
      code: currentFile.code.join('\n')
    });
  }

  return files;
};
