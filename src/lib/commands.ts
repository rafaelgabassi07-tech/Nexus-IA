export interface SlashCommand {
  name: string;
  description: string;
  icon: string;
  color: string;
  category: 'code' | 'review' | 'workflow' | 'docs';
  buildPrompt: (args: string, context: CommandContext) => string;
}

export interface CommandContext {
  activeFile: string | null;
  activeFileContent: string;
  allFiles: string[];
}

export const SLASH_COMMANDS: Record<string, SlashCommand> = {
  review: {
    name: 'review',
    description: 'Review the current file for bugs, quality, and best practices',
    icon: 'Search',
    color: 'text-amber-500',
    category: 'review',
    buildPrompt: (args, ctx) => {
      const target = args.trim() || ctx.activeFile || 'o projeto';
      return `Você agora é um **Revisor de Código de Elite**.
## Alvo da Revisão
${ctx.activeFile ? `Arquivo: \`${ctx.activeFile}\`\n\`\`\`\n${ctx.activeFileContent}\n\`\`\`` : `Projeto: ${target}`}
## Protocolo
Encontre bugs reais, problemas de segurança, qualidade, etc. E reporte apenas se tiver confiança ≥ 70.
${args ? `Foco extra: ${args}` : ''}`;
    },
  },
  explain: {
    name: 'explain',
    description: 'Explain how the current code works in detail',
    icon: 'BookOpen',
    color: 'text-blue-500',
    category: 'code',
    buildPrompt: (_args, ctx) => `Explique como o código funciona detalhadamente.\nArquivo ativo: ${ctx.activeFile}\n\n${ctx.activeFileContent}`,
  },
  refactor: {
    name: 'refactor',
    description: 'Refactor the current file for better quality',
    icon: 'Wrench',
    color: 'text-purple-500',
    category: 'code',
    buildPrompt: (_args, ctx) => `Refatore o arquivo para melhoria de qualidade sem quebrar funcionalidade.\nArquivo ativo: ${ctx.activeFile}\n\n${ctx.activeFileContent}`,
  },
  fix: {
    name: 'fix',
    description: 'Find and fix bugs in the current file',
    icon: 'Bug',
    color: 'text-red-500',
    category: 'code',
    buildPrompt: (_args, ctx) => `Encontre e corrija os bugs deste arquivo: ${ctx.activeFile}.\n\n${ctx.activeFileContent}`,
  },
  optimize: {
    name: 'optimize',
    description: 'Optimize the current file for performance',
    icon: 'Zap',
    color: 'text-yellow-500',
    category: 'code',
    buildPrompt: (_args, ctx) => `Otimize o código atual para performance.\nArquivo ativo: ${ctx.activeFile}\n\n${ctx.activeFileContent}`,
  },
  test: {
    name: 'test',
    description: 'Generate tests for the current file',
    icon: 'FlaskConical',
    color: 'text-green-500',
    category: 'code',
    buildPrompt: (_args, ctx) => `Gere testes abrangentes para o arquivo ativo: ${ctx.activeFile}\n\n${ctx.activeFileContent}`,
  },
  análise: {
    name: 'análise',
    description: 'Executa uma auditoria profunda com 7 sub-agentes especializados',
    icon: 'ShieldCheck',
    color: 'text-sky-500',
    category: 'review',
    buildPrompt: (args, ctx) => {
      const target = args.trim() || ctx.activeFile || 'o projeto';
      return `Audite profundamente o ${target} usando o pipeline de sub-agentes de elite.`;
    },
  },
  docs: {
    name: 'docs',
    description: 'Generate documentation for the current file or project',
    icon: 'FileText',
    color: 'text-cyan-500',
    category: 'docs',
    buildPrompt: (_args, ctx) => `Gere documentação completa para o arquivo ou projeto ativo: ${ctx.activeFile}\n\n${ctx.activeFileContent}`,
  },
  build: {
    name: 'build',
    description: 'Full 7-phase feature development workflow',
    icon: 'Hammer',
    color: 'text-orange-500',
    category: 'workflow',
    buildPrompt: (_args, ctx) => `Fluxo de desenvolvimento em 7 fases rigorosas. Responda guiando o usuário passo a passo. Arquivo atual: ${ctx.activeFile}`,
  },
  explore: {
    name: 'explore',
    description: 'Deep-dive analysis of how something works',
    icon: 'Compass',
    color: 'text-indigo-500',
    category: 'review',
    buildPrompt: (_args, _ctx) => `Analise profundamente a funcionalidade especificada.`,
  },
  architect: {
    name: 'architect',
    description: 'Design architecture for a new feature',
    icon: 'LayoutGrid',
    color: 'text-teal-500',
    category: 'workflow',
    buildPrompt: (args, _ctx) => `Design de arquitetura da feature: ${args}`,
  },
  hookify: {
    name: 'hookify',
    description: 'Create custom code quality rules and validation hooks',
    icon: 'ShieldAlert',
    color: 'text-rose-500',
    category: 'workflow',
    buildPrompt: (_args, ctx) => `Crie regras de validação personalizadas para este código. Arquivo ativo: ${ctx.activeFile}`,
  },
};

export interface ParsedCommand {
  isCommand: boolean;
  commandName?: string;
  command?: SlashCommand;
  args?: string;
  rawText: string;
}

export function parseSlashCommand(input: string): ParsedCommand {
  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) {
    return { isCommand: false, rawText: input };
  }
  const spaceIndex = trimmed.indexOf(' ');
  const commandName = spaceIndex === -1 ? trimmed.slice(1).toLowerCase() : trimmed.slice(1, spaceIndex).toLowerCase();
  const args = spaceIndex === -1 ? '' : trimmed.slice(spaceIndex + 1).trim();
  const command = SLASH_COMMANDS[commandName];
  if (!command) {
    return { isCommand: false, rawText: input };
  }
  return { isCommand: true, commandName, command, args, rawText: input };
}

export function getCommandSuggestions(input: string): SlashCommand[] {
  if (!input.startsWith('/')) return [];
  const query = input.slice(1).toLowerCase();
  if (!query) return Object.values(SLASH_COMMANDS);
  return Object.values(SLASH_COMMANDS).filter(
    (cmd) => cmd.name.startsWith(query) || cmd.description.toLowerCase().includes(query)
  );
}
