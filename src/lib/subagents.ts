import { GeneratedFile, TechnicalStep } from '../types';

export interface SubAgentContext {
  files: GeneratedFile[];
  activeFile: string | null;
  target?: string;
  updateSteps: (steps: TechnicalStep[]) => void;
  appendMessage: (content: string) => void;
  sendMessageToAI: (prompt: string, prefix?: string) => Promise<string>;
}

export const REVIEW_PIPELINE = [
  { id: 'reviewer', name: 'Analista de Qualidade e Boas Práticas', icon: 'Search' },
  { id: 'bug-hunter', name: 'Caçador de Bugs', icon: 'Bug' },
  { id: 'silent-failure', name: 'Detector de Falhas Silenciosas', icon: 'AlertTriangle' },
  { id: 'test-analyzer', name: 'Analista de Testabilidade', icon: 'FlaskConical' },
  { id: 'type-analyzer', name: 'Auditor de Tipagem (TypeScript)', icon: 'FileCode' },
  { id: 'security', name: 'Scanner de Segurança', icon: 'ShieldAlert' },
  { id: 'simplifier', name: 'Simplificador de Código (KISS/YAGNI)', icon: 'Wrench' }
];

export async function runReviewSubAgents(ctx: SubAgentContext): Promise<void> {
  const { files, activeFile, target, updateSteps, appendMessage, sendMessageToAI } = ctx;
  const initialSteps: TechnicalStep[] = REVIEW_PIPELINE.map(agent => ({
    id: agent.id,
    label: `${agent.name}`,
    status: 'pending',
    icon: agent.icon as any
  }));
  
  updateSteps([{ id: 'orchestrator', label: 'Invocando Pipeline de Sub-Agentes', status: 'running', icon: 'Layers' }, ...initialSteps]);

  const fileCode = files.find(f => f.name === activeFile)?.code || '';
  const targetDescription = activeFile 
    ? `Arquivo alvo: ${activeFile}\n\n${fileCode}`
    : 'Todo o projeto ativo.';

  appendMessage(`## Iniciando Revisão Rigorosa Pipeline (7 Sub-Agentes)\n` + (target ? `**Foco da revisão:** ${target}\n\n` : ''));

  const reports: string[] = [];

  for (const agent of REVIEW_PIPELINE) {
    updateSteps([{ id: 'orchestrator', label: 'Pipeline Ativo', status: 'success', icon: 'Layers' }, 
      ...initialSteps.map(s => s.id === agent.id ? { ...s, status: 'running' as any } : s)
    ]);

    const prompt = `
Você é o Sub-Agente: ${agent.name}.
Sua missão é estritamente avaliar o artefato abaixo e reportar APENAS problemas reais que violam os princípios do seu domínio.
Alvo de análise:
\`\`\`
${targetDescription}
\`\`\`

DIRETRIZES OBRIGATÓRIAS:
1. NÃO ELOGIE. NUNCA diga 'está bom' ou 'bem estruturado'. Se não achar problemas críticos, responda EXATAMENTE: [PASSOU_SEM_RESSALVAS_CRITICAS]
2. Seja direto e letal na sua análise.
3. Classifique severidade (ALTA/MÉDIA).
4. Indique a linha ou bloco com problema.`;

    try {
      const response = await sendMessageToAI(prompt, `### Relatório do ${agent.name}\n`);
      if (response && !response.includes('[PASSOU_SEM_RESSALVAS_CRITICAS]')) {
        reports.push(`### Relatório: ${agent.name}\n${response}`);
      } else {
         reports.push(`### Relatório: ${agent.name}\n✅ Passou sem ressalvas na auditoria automática.`);
      }
      initialSteps.find(s => s.id === agent.id)!.status = 'success';
      updateSteps([{ id: 'orchestrator', label: 'Pipeline Ativo', status: 'success', icon: 'Layers' }, ...initialSteps]);
    } catch (e) {
      initialSteps.find(s => s.id === agent.id)!.status = 'error';
      updateSteps([{ id: 'orchestrator', label: 'Pipeline Ativo', status: 'success', icon: 'Layers' }, ...initialSteps]);
      reports.push(`### ${agent.name}\n❌ Falha na conexão com o agente ao processar revisão.`);
    }
  }

  updateSteps([{ id: 'orchestrator', label: 'Consolidando Relatórios...', status: 'running', icon: 'Layers' }, ...initialSteps]);
  
  if (reports.length > 0) {
     const consolidatorPrompt = `
Os seguintes relatórios foram gerados pelos sub-agentes sobre o código:
${reports.join('\n\n')}

Agrupe, resuma e crie um plano de ação CLARO para consertar os problemas reais encontrados. Se só houve aprovações ('Passou sem ressalvas'), diga que a saúde do código está excelente.
Não seja genérico.`;

     await sendMessageToAI(consolidatorPrompt, `\n\n---\n\n## 📋 Síntese do Maestro de Qualidade\n`);
  }

  updateSteps([{ id: 'orchestrator', label: 'Revisão Concluída', status: 'success', icon: 'Layers' }, ...initialSteps]);
}

export function isSubAgentCommand(name: string): boolean {
  return ['review', 'test', 'explore', 'fix', 'refactor', 'optimize', 'docs', 'análise'].includes(name);
}
