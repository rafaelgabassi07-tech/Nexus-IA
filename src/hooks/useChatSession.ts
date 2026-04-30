import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { 
  Message, TechnicalStep, GeneratedFile, AgentDefinition 
} from '../types';
import { generateId, extractFilesFromMarkdown } from '../lib/utils';
import { useSettingsStore } from '../store/appStore';
import { toast } from 'sonner';
import { parseSlashCommand } from '../lib/commands';
import { runReviewSubAgents, isSubAgentCommand } from '../lib/subagents';
import { VFS } from '../lib/vfs';

interface UseChatSessionProps {
  activeAgent: AgentDefinition;
  apiKey: string;
  selectedModel: string;
  systemPrompt: string;
  temperature: number;
  searchGrounding?: boolean;
}

export function useChatSession({
  activeAgent,
  apiKey,
  selectedModel,
  systemPrompt,
  temperature,
  searchGrounding = false
}: UseChatSessionProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);
  const [fileHistory, setFileHistory] = useState<{ timestamp: number; files: GeneratedFile[] }[]>([]);
  
  const generatedFilesRef = useRef<GeneratedFile[]>([]);
  useEffect(() => {
    generatedFilesRef.current = generatedFiles;
  }, [generatedFiles]);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const resetChat = useCallback((welcomeMessage?: string) => {
    setMessages(welcomeMessage ? [{
      id: generateId(),
      role: 'model',
      content: welcomeMessage
    }] : []);
    setGeneratedFiles([]);
    setFileHistory([]);
    setActiveFilePath(null);
    setIsLoading(false);
    abortControllerRef.current?.abort();
  }, []);


  const sendMessage = useCallback(async (content: string, attachedFiles: File[] = [], messagesToUse?: Message[]) => {
    if (isLoading) return;

    let finalMessage = content;
    const parsed = parseSlashCommand(content);
    const activeFileIndex = generatedFilesRef.current.findIndex(f => f.name === activeFilePath);
    const activeCode = generatedFilesRef.current.length > 0 ? (activeFileIndex !== -1 ? generatedFilesRef.current[activeFileIndex]?.code : null) : null;
    const activeFileName = generatedFilesRef.current.length > 0 ? (activeFileIndex !== -1 ? generatedFilesRef.current[activeFileIndex]?.name : null) : null;

    if (parsed.isCommand && parsed.command) {
      finalMessage = parsed.command.buildPrompt(parsed.args || '', {
         activeFile: activeFileName,
         activeFileContent: activeCode || '',
         allFiles: generatedFilesRef.current.map(f => f.name)
      });
    }

    const imageAttachments: { mimeType: string; data: string }[] = [];

    // Filter out error messages
    setMessages(prev => prev.filter(m => !m.isError));

    // Handle files
    if (attachedFiles.length > 0) {
      for (const file of attachedFiles) {
        if (file.type.startsWith('image/')) {
          try {
            const base64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve((reader.result as string).split(',')[1]);
              reader.onerror = () => reject(new Error('Falha ao ler arquivo de imagem'));
              reader.readAsDataURL(file);
            });
            imageAttachments.push({ mimeType: file.type, data: base64 });
          } catch (e) {
            console.error('Failed to read image', file.name);
          }
        } else if (file.type.startsWith('text/') || /\.(js|jsx|ts|tsx|json|md|py|css|html|yaml|yml|sh|sql|env|env\.example|toml|rs|go)$/i.test(file.name)) {
          try {
            const text = await file.text();
            finalMessage += `\n\n\`\`\`${file.name}\n${text}\n\`\`\``;
          } catch (e) {
            console.error('Failed to read file', file.name);
          }
        } else {
          finalMessage += `\n\n[Arquivo anexo: ${file.name}]`;
        }
      }
    }

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: finalMessage || 'Veja os arquivos anexos.',
      ...(imageAttachments.length > 0 ? { images: imageAttachments } as any : {})
    };

    const updatedMessages = messagesToUse || [...messages, userMessage];
    if (!messagesToUse) {
      setMessages(updatedMessages);
    }

    // ARCHITECTURE FIX: Inject current files context for the LLM
    // This allows the model to perform "edits" instead of just adding new code.
    const currentFiles = generatedFilesRef.current;
    
    // ERROR PERSISTENCE: Get recent errors and inject them into the context
    const { errorLogs, collectiveIntelligence } = useSettingsStore.getState();
    
    const recentErrorsContext = errorLogs.length > 0
      ? `\n\n<recent_errors_log>\n${errorLogs.slice(0, 5).map(l => `- [${l.type}] ${l.message}`).join('\n')}\n</recent_errors_log>\n* Use these recent failures to inform more stable code generation.`
      : '';

    const intelligenceContext = collectiveIntelligence.lessonsLearned.length > 0
      ? `\n\n<nexus_knowledge_base>\n${collectiveIntelligence.lessonsLearned.slice(0, 10).map(l => `- ${l}`).join('\n')}\n</nexus_knowledge_base>\n* Strictly adhere to these established patterns for compatibility.`
      : '';

    const filesContext = currentFiles.length > 0 
      ? `\n\n<nexus_project_vfs>\n${currentFiles.map(f => `<file name="${f.name}">\n${f.code}\n</file>`).join('\n')}\n</nexus_project_vfs>${recentErrorsContext}${intelligenceContext}`
      : `${recentErrorsContext}${intelligenceContext}`;

    // ADAPTIVE TEMPERATURE
    let finalTemperature = temperature;
    const lowerPrompt = content.toLowerCase();
    const isTechnical = /refactor|fix|bug|error|architect|typescript|interface|strict|logic/.test(lowerPrompt);
    const isCreative = /style|design|beautify|animate|concept|idea|color/.test(lowerPrompt);

    if (isTechnical) finalTemperature = Math.max(0.2, temperature - 0.2);
    else if (isCreative) finalTemperature = Math.min(1.0, temperature + 0.15);

    setIsLoading(true);

    abortControllerRef.current = new AbortController();
    const messageId = generateId();
    
    const initialSteps: TechnicalStep[] = [
      { id: generateId(), label: 'Conectando...', status: 'running', icon: 'Terminal' as any }
    ];

    setMessages(prev => [...prev, {
      id: messageId,
      role: 'model',
      content: '',
      steps: initialSteps
    }]);

    let steps = [...initialSteps];
    const updateSteps = (newSteps: TechnicalStep[]) => {
      steps = [...newSteps];
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, steps: [...newSteps] } : m));
    };

    const startTime = Date.now();
    let hasStartedThinking = false;
    let hasStartedCoding = false;
    let thoughtStepId = '';
    let lastContentLength = 0;
    let lastThoughtUpdate = 0;
    let turnGeneratedFilesCount = 0;
    
    try {
      let globalFullResponse = "";

      const performChatFetch = async (currentPrompt: string, prefixText: string = "", fetchTemp?: number) => {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: abortControllerRef.current?.signal,
          body: JSON.stringify({
            messages: updatedMessages.map((m, idx) => ({
              role: m.role,
              content: (idx === updatedMessages.length - 1 && m.role === 'user') 
                ? currentPrompt + filesContext 
                : m.content,
              images: (m as any).images 
            })),
            systemPrompt,
            temperature: fetchTemp ?? finalTemperature,
            agentId: activeAgent.id,
            apiKey,
            model: selectedModel,
            searchGrounding
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Server returned ${res.status}`);
        }

        const reader = res.body?.getReader();
        const decoder = new TextDecoder("utf-8");
        let localFullResponse = prefixText;
        globalFullResponse += prefixText;

        if (reader) {
          let buffer = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            if (!hasStartedThinking && buffer.length > 0) {
              hasStartedThinking = true;
              thoughtStepId = generateId();
              updateSteps([
                { ...steps[0], status: 'success' },
                { id: thoughtStepId, label: 'Pensando...', status: 'running', icon: 'Lightbulb' as any }
              ]);
            }

            const parts = buffer.split('\n\n');
            buffer = parts.pop() || "";

            for (const part of parts) {
              if (part.startsWith('data: ')) {
                const data = part.slice(6);
                if (data === '[DONE]') break;
                
                let parsed;
                try { parsed = JSON.parse(data); } catch (e) { continue; }
                
                if (parsed.error) throw new Error(parsed.error);
                if (parsed.text) {
                  localFullResponse += parsed.text;
                  globalFullResponse += parsed.text;
                  
                  if (hasStartedThinking && !hasStartedCoding && Date.now() - lastThoughtUpdate > 1000) {
                    lastThoughtUpdate = Date.now();
                    const elapsed = Math.round((Date.now() - startTime) / 1000);
                    updateSteps(steps.map(s => s.id === thoughtStepId ? { ...s, label: `Pensando... (${elapsed}s)` } : s));
                  }

                  const newContent = globalFullResponse.slice(lastContentLength);
                  if (newContent.length > 2) {
                    const currentFiles = extractFilesFromMarkdown(globalFullResponse, messageId.slice(0, 5));
                    if (currentFiles.length > turnGeneratedFilesCount) {
                      turnGeneratedFilesCount = currentFiles.length;
                      const newFile = currentFiles[currentFiles.length - 1];
                      const currentSteps = [...steps];
                      if (currentSteps[currentSteps.length - 1].status === 'running') {
                        currentSteps[currentSteps.length - 1].status = 'success';
                      }
                      currentSteps.push({ 
                        id: generateId(), 
                        label: `Criando: ${newFile.name.split('/').pop()}`, 
                        status: 'success', 
                        icon: 'FileCode' as any
                      });
                      updateSteps(currentSteps);
                      
                      setGeneratedFiles(prevFiles => {
                        const merged = [...prevFiles];
                        currentFiles.forEach(cf => {
                          const existingIdx = merged.findIndex(f => f.name === cf.name);
                          if (existingIdx >= 0) merged[existingIdx] = cf;
                          else merged.push(cf);
                        });
                        setActiveFilePath(newFile.name);
                        return merged;
                      });
                    } else if (currentFiles.length === turnGeneratedFilesCount && currentFiles.length > 0) {
                       setGeneratedFiles(prevFiles => {
                         const merged = [...prevFiles];
                         currentFiles.forEach(cf => {
                            const existingIdx = merged.findIndex(f => f.name === cf.name);
                            if (existingIdx >= 0) merged[existingIdx] = cf;
                            else merged.push(cf);
                         });
                         return merged;
                       });
                    }

                    const openBlockMatch = globalFullResponse.match(/```[ \t]*(?:(\w+)[ \t]+)?(?:file:[ \t]*)?([\w.\/\-\_]+\.\w+)[ \t]*\n([^`]*)$/i) || globalFullResponse.match(/```([\w.\/\-\_]+\.\w+)[ \t]*\n([^`]*)$/i) || globalFullResponse.match(/```(\w+)[ \t]*\n([^`]*)$/i);
                    if (openBlockMatch) {
                      const matchedName = openBlockMatch[2] || openBlockMatch[1] || `script`;
                      const isFileName = matchedName.includes('.');
                      const fileName = isFileName ? matchedName : `script`;
                      const writingLabel = `Codificando: ${fileName.split('/').pop()}...`;
                      if (steps.length > 0 && steps[steps.length - 1].label !== writingLabel) {
                        const currentSteps = [...steps];
                        const last = currentSteps[currentSteps.length - 1];
                        if (last.status === 'running') {
                          last.label = writingLabel;
                          last.icon = 'Edit2' as any;
                        } else {
                          currentSteps.push({ id: generateId(), label: writingLabel, status: 'running', icon: 'Edit2' as any });
                        }
                        updateSteps(currentSteps);
                      }
                    }
                  }

                  if (!hasStartedCoding && globalFullResponse.includes('```')) {
                    hasStartedCoding = true;
                    const thoughtDuration = Math.round((Date.now() - startTime) / 1000);
                    const updatedSteps = steps.map(s => 
                      s.id === thoughtStepId ? { ...s, label: `Pensou por ${thoughtDuration}s`, status: 'success' as const } : s
                    );
                    updateSteps([...updatedSteps, { id: generateId(), label: 'Gerando ativos de código...', status: 'running', icon: 'Code' as any }]);
                  }

                  setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content: globalFullResponse } : m));
                  lastContentLength = globalFullResponse.length;
                }
              }
            }
          }
        }
        return localFullResponse;
      };

      if (parsed.isCommand && parsed.commandName && isSubAgentCommand(parsed.commandName)) {
        await runReviewSubAgents({
          files: generatedFilesRef.current,
          activeFile: activeFileName,
          target: parsed.args,
          updateSteps,
          appendMessage: (text) => {
             globalFullResponse += text;
             setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content: globalFullResponse } : m));
          },
          sendMessageToAI: async (prompt, prefix) => {
             return await performChatFetch(prompt, prefix, 0.1);
          }
        });
      } else {
        await performChatFetch(finalMessage, "");
      }

      // Finalize
      let finalFiles = extractFilesFromMarkdown(globalFullResponse, messageId.slice(0, 5));
      
      // AUTO-REFINEMENT CHAIN
      const { autoRefine: isAutoRefineEnabled } = useSettingsStore.getState();
      const isNormalMessage = !parsed.isCommand || !isSubAgentCommand(parsed.commandName || '');
      
      if (isAutoRefineEnabled && isNormalMessage && finalFiles.length > 0) {
         // Identify what files were just updated (the "active" files of this turn)
         // For simplicity, let's just review the first updated file or the most relevant one
         const mainFile = finalFiles[0]; 
         const codeBefore = mainFile.code;
         
         await runReviewSubAgents({
          files: finalFiles,
          activeFile: mainFile.name,
          autoFix: true, // We are in auto-refine mode
          updateSteps,
          appendMessage: (text) => {
             globalFullResponse += text;
             setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content: globalFullResponse } : m));
          },
          sendMessageToAI: async (prompt, prefix) => {
             return await performChatFetch(prompt, prefix, 0.1);
          }
        });

        // RE-EXTRACT files after refinement to capture corrections
        finalFiles = extractFilesFromMarkdown(globalFullResponse, messageId.slice(0, 5));
        
        // SHOW VISUAL DIFF (Metadata tag for UI)
        const { showDiff: isShowDiffEnabled } = useSettingsStore.getState();
        if (isShowDiffEnabled && finalFiles.length > 0) {
          const mainFileAfter = finalFiles.find(f => f.name === mainFile.name) || finalFiles[0];
          if (mainFileAfter.code !== codeBefore) {
             const diffTag = `\n\n:::visual-diff\n{ "file": "${mainFileAfter.name}", "before": ${JSON.stringify(codeBefore)}, "after": ${JSON.stringify(mainFileAfter.code)} }\n:::\n`;
             globalFullResponse += diffTag;
             setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content: globalFullResponse } : m));
          }
        }
      }

      if (finalFiles.length > 0) {
        setGeneratedFiles(prev => {
          const merged = [...prev];
          finalFiles.forEach(newFile => {
            const existingIdx = merged.findIndex(f => f.name === newFile.name);
            if (existingIdx >= 0) merged[existingIdx] = newFile;
            else merged.push(newFile);
          });
          setFileHistory(history => {
            const newHistory = [...history, { timestamp: Date.now(), files: JSON.parse(JSON.stringify(merged)) }];
            return newHistory.slice(-10); // Keep only last 10 versions to save memory
          });
          
          const { securityRules } = useSettingsStore.getState();
          const activeRules = securityRules.filter(r => r.enabled);
          if (activeRules.length > 0) {
            merged.forEach(file => {
              activeRules.forEach(rule => {
                let ruleViolated = false;
                if (rule.pattern) {
                  try {
                    const regex = new RegExp(rule.pattern, 'i');
                    if (regex.test(file.code)) ruleViolated = true;
                  } catch (e) {}
                } else if (rule.conditions && rule.conditions.length > 0) {
                  ruleViolated = rule.conditions.every(condition => {
                    const target = condition.field === 'code' ? file.code : 
                                   condition.field === 'filename' ? file.name : 
                                   (file.name.split('.').pop() || '');
                    try {
                      if (condition.operator === 'matches') return new RegExp(condition.pattern, 'i').test(target);
                      if (condition.operator === 'contains') return target.includes(condition.pattern);
                      if (condition.operator === 'not_contains') return !target.includes(condition.pattern);
                      if (condition.operator === 'starts_with') return target.startsWith(condition.pattern);
                    } catch(e) { return false; }
                    return false;
                  });
                }
                if (ruleViolated) {
                  if (rule.action === 'warn' || rule.action === 'suggest') {
                    toast.warning(`Alerta de Segurança em ${file.name}`, { description: rule.message || `Regra violada: ${rule.name}` });
                  } else if (rule.action === 'block') {
                    toast.error(`Bloqueio de Segurança em ${file.name}`, { description: rule.message || `O código violou a regra: ${rule.name}` });
                    file.code = `// O código gerado foi bloqueado pelo scanner de segurança.\\n// Regra violada: ${rule.name}\\n// Detalhe: ${rule.message}\\n// Sugestão: ${rule.suggestion || ''}`;
                  }
                }
              });
            });
          }
          return merged;
        });
      }
      
      updateSteps(steps.map(s => ({ ...s, status: s.status === 'running' ? 'success' : s.status })));
      
      // EXTRACT LESSONS FOR COLLECTIVE INTELLIGENCE
      const lessonMatch = globalFullResponse.match(/:::nexus-lesson\n([\s\S]*?)\n:::/);
      if (lessonMatch) {
        const lesson = lessonMatch[1].trim();
        useSettingsStore.getState().addLessonLearned(lesson);
        toast.success("Nova Lição Aprendida", { description: "O Nexus Collective Intelligence foi atualizado com novos conhecimentos." });
      }

    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error("Chat Error:", err);
      const displayError = err instanceof Error ? err.message : (typeof err === 'string' ? err : JSON.stringify(err));
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content: m.content + `\n\n**Erro:** ${displayError || 'Falha desconhecida no sistema.'}`, isError: true } : m));
      updateSteps(steps.map(s => s.status === 'running' ? { ...s, status: 'error' } : s));
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [messages, isLoading, activeAgent, apiKey, selectedModel, systemPrompt, temperature, searchGrounding]);

  const vfs = useMemo(() => {
    const virtualFS: VFS = {};
    generatedFiles.forEach(file => {
      virtualFS[file.name] = {
        type: 'file',
        content: file.code
      };
    });
    return virtualFS;
  }, [generatedFiles]);

  return {
    messages,
    setMessages,
    isLoading,
    generatedFiles,
    setGeneratedFiles,
    activeFilePath,
    setActiveFilePath,
    fileHistory,
    setFileHistory,
    resetChat,
    sendMessage,
    vfs,
    abortRequest: () => abortControllerRef.current?.abort()
  };
}
