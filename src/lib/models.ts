
export interface NexusModel {
  id: string;
  name: string;
  contextWindow: number;
  group: 'Google Gemini';
  tier?: 'pro' | 'standard' | 'lite';
  recommended?: boolean;
}

export const NEXUS_MODELS: NexusModel[] = [
  // === TIER PRO — Para apps complexos e raciocínio profundo ===
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro ⭐ Recomendado',
    contextWindow: 1048576,
    group: 'Google Gemini',
    tier: 'pro',
    recommended: true
  },
  {
    id: 'gemini-2.5-pro-preview-06-05',
    name: 'Gemini 2.5 Pro Preview',
    contextWindow: 1048576,
    group: 'Google Gemini',
    tier: 'pro'
  },
  // === TIER STANDARD — Bom custo/benefício ===
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    contextWindow: 1048576,
    group: 'Google Gemini',
    tier: 'standard'
  },
  {
    id: 'gemini-3-flash-preview',
    name: 'Gemini 3 Flash Preview',
    contextWindow: 1048576,
    group: 'Google Gemini',
    tier: 'standard'
  },
  {
    id: 'gemini-3-flash',
    name: 'Gemini 3 Flash',
    contextWindow: 1048576,
    group: 'Google Gemini',
    tier: 'standard'
  },
  // === TIER LITE — Apenas para tarefas simples ===
  {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash Lite (Rápido)',
    contextWindow: 1048576,
    group: 'Google Gemini',
    tier: 'lite'
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    contextWindow: 1048576,
    group: 'Google Gemini',
    tier: 'lite'
  },
  {
    id: 'gemini-3.1-flash-lite-preview',
    name: 'Gemini 3.1 Flash Lite Preview',
    contextWindow: 1048576,
    group: 'Google Gemini',
    tier: 'lite'
  },
];

export const DEFAULT_MODEL = 'gemini-2.5-pro';

export const getModelById = (id: string) => 
  NEXUS_MODELS.find(m => m.id === id) || NEXUS_MODELS.find(m => m.id === DEFAULT_MODEL)!;

export const GROUPED_MODELS = NEXUS_MODELS.reduce((acc, model) => {
  if (!acc[model.group]) acc[model.group] = [];
  acc[model.group].push(model);
  return acc;
}, {} as Record<string, NexusModel[]>);
