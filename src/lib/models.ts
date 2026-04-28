
export interface NexusModel {
  id: string;
  name: string;
  contextWindow: number;
  group: 'Flash' | 'Pro' | 'Experimental' | 'Other';
  version: string;
  features: {
    vision: boolean;
    grounding: boolean;
    thinking?: boolean;
  };
}

export const NEXUS_MODELS: NexusModel[] = [
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    contextWindow: 1048576,
    group: 'Flash',
    version: '2.0',
    features: { vision: true, grounding: true }
  },
  {
    id: 'gemini-2.0-flash-lite',
    name: 'Gemini 2.0 Flash Lite',
    contextWindow: 1048576,
    group: 'Flash',
    version: '2.0',
    features: { vision: true, grounding: true }
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    contextWindow: 1048576,
    group: 'Flash',
    version: '1.5',
    features: { vision: true, grounding: true }
  },
  {
    id: 'gemini-1.5-flash-8b',
    name: 'Gemini 1.5 Flash 8B',
    contextWindow: 1048576,
    group: 'Flash',
    version: '1.5',
    features: { vision: true, grounding: true }
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    contextWindow: 2097152,
    group: 'Pro',
    version: '1.5',
    features: { vision: true, grounding: true }
  },
  {
    id: 'gemini-2.0-pro-exp-02-05',
    name: 'Gemini 2.0 Pro Exp',
    contextWindow: 2097152,
    group: 'Pro',
    version: '2.0',
    features: { vision: true, grounding: true }
  },
  {
    id: 'gemini-2.0-flash-thinking-exp-01-21',
    name: 'Gemini 2.0 Thinking',
    contextWindow: 1048576,
    group: 'Experimental',
    version: '2.0',
    features: { vision: true, grounding: true, thinking: true }
  }
];

export const DEFAULT_MODEL = 'gemini-2.0-flash';

export const getModelById = (id: string) => 
  NEXUS_MODELS.find(m => m.id === id) || NEXUS_MODELS.find(m => m.id === DEFAULT_MODEL)!;
