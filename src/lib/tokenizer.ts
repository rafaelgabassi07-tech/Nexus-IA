export function estimateTokens(text: string): number {
  if (!text) return 0;
  // Basic heuristic: ~4 chars per token
  return Math.ceil(text.length / 4);
}

export function formatTokenCount(count: number): string {
  if (count < 1000) return count.toString();
  return (count / 1000).toFixed(1) + 'k';
}
