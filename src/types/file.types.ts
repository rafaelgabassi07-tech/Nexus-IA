export type GeneratedFile = {
  name: string;
  lang: string;
  code: string;
};

export type FileHistoryEntry = {
  timestamp: number;
  files: GeneratedFile[];
};
