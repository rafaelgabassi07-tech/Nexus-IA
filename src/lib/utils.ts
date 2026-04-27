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

export const extractFilesFromMarkdown = (content: string) => {
  const files: { name: string, lang: string, code: string }[] = [];
  const lineRegex = /```(\w+)?([^\n]*)\n([\s\S]*?)(?:```|$)/g;
  let match;
  while ((match = lineRegex.exec(content)) !== null) {
    const lang = match[1] || 'text';
    const meta = (match[2] || '').trim();
    let name = '';
    
    if (meta) {
      const fileMatch = meta.match(/(?:file:\s*)?([\w.-/:\\\\]+\.\w+)/i);
      if (fileMatch) {
        name = fileMatch[1];
      } else {
        const fallbackMatch = meta.match(/([\w.-/:\\\\]+)/);
        if (fallbackMatch) name = fallbackMatch[1];
      }
    }
    
    if (!name) {
      name = `file_${files.length + 1}.${lang === 'typescript' ? 'ts' : lang === 'javascript' ? 'js' : lang}`;
    }
    
    files.push({
      lang: lang,
      name: name,
      code: match[3]
    });
  }
  return files;
};
