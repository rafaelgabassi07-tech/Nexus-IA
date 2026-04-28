import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId() {
  try {
    return crypto.randomUUID();
  } catch (e) {
    return Math.random().toString(36).substring(2, 15);
  }
}

/**
 * Utilitário para salvar no localStorage com segurança contra QuotaExceededError.
 */
export function safeLocalStorageSet(key: string, value: any) {
  try {
    const valueToStore = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, valueToStore);
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError' && key === 'nexus_chat_history') {
      const history = JSON.parse(localStorage.getItem('nexus_chat_history') || '[]');
      if (history.length > 2) {
        // Remove metade dos chats mais antigos
        const pruned = history.slice(0, Math.ceil(history.length / 2));
        localStorage.setItem('nexus_chat_history', JSON.stringify(pruned));
        // Tenta salvar o novo item novamente
        const valueToStore = typeof value === 'string' ? value : JSON.stringify(value);
        localStorage.setItem(key, valueToStore);
      }
    } else {
      console.error('LocalStorage storage failed:', e);
    }
  }
}

export function safeStorageString(key: string, defaultValue: string): string {
  if (typeof window === 'undefined') return defaultValue;
  const saved = localStorage.getItem(key);
  if (saved === null) return defaultValue;
  if (saved.startsWith('"') && saved.endsWith('"')) {
    try {
      return JSON.parse(saved);
    } catch {
      return saved;
    }
  }
  return saved;
}

export function safeStorageNumber(key: string, defaultValue: number): number {
  if (typeof window === 'undefined') return defaultValue;
  const saved = localStorage.getItem(key);
  if (saved === null) return defaultValue;
  try {
    const parsed = JSON.parse(saved);
    const num = parseFloat(parsed);
    return Number.isNaN(num) ? defaultValue : num;
  } catch {
    const num = parseFloat(saved);
    return Number.isNaN(num) ? defaultValue : num;
  }
}


export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function deriveChatTitle(content: string): string {
  if (!content) return "Novo Protocolo";
  // Remove code blocks
  const cleanContent = content.replace(/```[\s\S]*?```/g, "").trim();
  if (!cleanContent) return "Código de Matriz";
  const title = cleanContent.split('\n')[0].slice(0, 40).trim();
  return title + (cleanContent.length > title.length ? "..." : "");
}

export function estimateTokens(text: string): number {
  if (!text) return 0;
  // Basic heuristic: ~4 chars per token
  return Math.ceil(text.length / 4);
}

export function formatTokenCount(count: number): string {
  if (count < 1000) return count.toString();
  return (count / 1000).toFixed(1) + 'k';
}

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
