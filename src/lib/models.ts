
export interface NexusModel {
  id: string;
  name: string;
  contextWindow: number;
  group: 'Google Gemini';
}

export const NEXUS_MODELS: NexusModel[] = [
  {
    id: 'gemini-3-flash-preview',
    name: 'Gemini 3 Flash',
    contextWindow: 1048576,
    group: 'Google Gemini'
  },
  {
    id: 'gemini-3.1-flash-lite-preview',
    name: 'Gemini 3.1 Flash Lite',
    contextWindow: 1048576,
    group: 'Google Gemini'
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro',
    contextWindow: 1048576,
    group: 'Google Gemini'
  },
  {
    id: 'gemini-flash-latest',
    name: 'Gemini Flash Latest',
    contextWindow: 1048576,
    group: 'Google Gemini'
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
