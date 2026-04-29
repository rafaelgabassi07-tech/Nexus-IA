export type APIPreset = {
  id: string;
  name: string;
  apiKey: string;
};

export type SecurityRule = {
  id: string;
  name: string;
  pattern: string;
  action: 'warn' | 'block';
  active: boolean;
};
