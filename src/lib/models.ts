
export interface NexusModel {
  id: string;
  name: string;
  contextWindow: number;
  group: 'Google Gemini';
  tier?: 'pro' | 'standard' | 'lite';
  recommended?: boolean;
  rateLimit?: string;
}

export const NEXUS_MODELS: NexusModel[] = [
  {
    id: 'gemini-3.1-flash-lite-preview',
    name: 'Gemini 3.1 Flash Lite',
    contextWindow: 1048576,
    group: 'Google Gemini',
    tier: 'lite',
    rateLimit: '500 rpd • 15 rpm',
    recommended: false
  },
  {
    id: 'gemini-3-flash-preview',
    name: 'Gemini 3 Flash',
    contextWindow: 1048576,
    group: 'Google Gemini',
    tier: 'standard',
    rateLimit: '20 rpd • 5 rpm',
    recommended: true
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    contextWindow: 1048576,
    group: 'Google Gemini',
    tier: 'standard',
    rateLimit: '20 rpd • 5 rpm'
  },
  {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash Lite',
    contextWindow: 1048576,
    group: 'Google Gemini',
    tier: 'lite',
    rateLimit: '20 rpd • 10 rpm'
  }
];

export const DEFAULT_MODEL = 'gemini-3-flash-preview';

export const getModelById = (id: string) => 
  NEXUS_MODELS.find(m => m.id === id) || NEXUS_MODELS.find(m => m.id === DEFAULT_MODEL)!;

export const GROUPED_MODELS = NEXUS_MODELS.reduce((acc, model) => {
  if (!acc[model.group]) acc[model.group] = [];
  acc[model.group].push(model);
  return acc;
}, {} as Record<string, NexusModel[]>);
