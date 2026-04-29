export function safeLocalStorageSet(key: string, value: any) {
  try {
    const valueToStore = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, valueToStore);
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError' && key === 'nexus_chat_history') {
      const history = JSON.parse(localStorage.getItem('nexus_chat_history') || '[]');
      if (history.length > 2) {
        const pruned = history.slice(0, Math.ceil(history.length / 2));
        localStorage.setItem('nexus_chat_history', JSON.stringify(pruned));
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
