export type APIPreset = {
  id: string;
  name: string;
  apiKey: string;
};

export type SecurityCondition = {
  field: 'code' | 'filename' | 'lang';
  operator: 'contains' | 'not_contains' | 'matches' | 'starts_with';
  pattern: string;
};

export type SecurityRule = {
  id: string;
  name: string;
  enabled: boolean;
  pattern?: string;
  conditions?: SecurityCondition[];
  action: 'warn' | 'block' | 'suggest';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  suggestion?: string;
};
