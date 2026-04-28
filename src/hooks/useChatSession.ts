import { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Message, TechnicalStep, GeneratedFile 
} from '../types';
import { AgentDefinition } from '../agents';
import { generateId, extractFilesFromMarkdown } from '../lib/utils';
import { Terminal, Lightbulb, FileCode, Edit2, Code } from 'lucide-react';

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
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [fileHistory, setFileHistory] = useState<{ timestamp: number; files: GeneratedFile[] }[]>([]);
  
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
    setActiveFileIndex(0);
    setIsLoading(false);
    abortControllerRef.current?.abort();
  }, []);


  const sendMessage = useCallback(async (content: string, attachedFiles: File[] = [], messagesToUse?: Message[]) => {
    if (isLoading) return;

    let finalMessage = content;
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
              reader.onerror = reject;
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
    const filesContext = generatedFiles.length > 0 
      ? `\n\nESTADO ATUAL DO PROJETO:\n${generatedFiles.map(f => `Arquivo: ${f.name}\n\`\`\`${f.lang}\n${f.code}\n\`\`\``).join('\n\n')}`
      : '';

    setIsLoading(true);

    abortControllerRef.current = new AbortController();
    const messageId = generateId();
    
    const initialSteps: TechnicalStep[] = [
      { id: generateId(), label: 'Conectando...', status: 'running', icon: Terminal }
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
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          messages: updatedMessages.map((m, idx) => ({ 
            role: m.role, 
            // Only inject file context on the last user message to keep tokens low
            content: (idx === updatedMessages.length - 1 && m.role === 'user') 
              ? m.content + filesContext 
              : m.content,
            images: (m as any).images 
          })),
          systemPrompt,
          temperature,
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
      let fullResponse = "";

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
              { id: thoughtStepId, label: 'Pensando...', status: 'running', icon: Lightbulb }
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
                fullResponse += parsed.text;
                
                // Update thinking timer
                if (hasStartedThinking && !hasStartedCoding && Date.now() - lastThoughtUpdate > 1000) {
                  lastThoughtUpdate = Date.now();
                  const elapsed = Math.round((Date.now() - startTime) / 1000);
                  updateSteps(steps.map(s => s.id === thoughtStepId ? { ...s, label: `Pensando... (${elapsed}s)` } : s));
                }

                  // File detection
                  const newContent = fullResponse.slice(lastContentLength);
                  if (newContent.length > 2) {
                    const currentFiles = extractFilesFromMarkdown(fullResponse);
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
                        icon: FileCode 
                      });
                      updateSteps(currentSteps);
                      
                      // Use setGeneratedFiles callback form to avoid stale closures
                      setGeneratedFiles(prevFiles => {
                        const merged = [...prevFiles];
                        currentFiles.forEach(cf => {
                          const existingIdx = merged.findIndex(f => f.name === cf.name);
                          if (existingIdx >= 0) merged[existingIdx] = cf;
                          else merged.push(cf);
                        });
                        const focusedIdx = merged.findIndex(f => f.name === newFile.name);
                        setActiveFileIndex(Math.max(0, focusedIdx));
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

                  // Writing indicator
                  const openBlockMatch = fullResponse.match(/```[ \t]*(?:(\w+)[ \t]+)?(?:file:[ \t]*)?([\w.\/\-\_]+\.\w+)[ \t]*\n([^`]*)$/i) || fullResponse.match(/```([\w.\/\-\_]+\.\w+)[ \t]*\n([^`]*)$/i) || fullResponse.match(/```(\w+)[ \t]*\n([^`]*)$/i);
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
                        last.icon = Edit2;
                      } else {
                        currentSteps.push({ id: generateId(), label: writingLabel, status: 'running', icon: Edit2 });
                      }
                      updateSteps(currentSteps);
                    }
                  }
                }

                if (!hasStartedCoding && fullResponse.includes('```')) {
                  hasStartedCoding = true;
                  const thoughtDuration = Math.round((Date.now() - startTime) / 1000);
                  const updatedSteps = steps.map(s => 
                    s.id === thoughtStepId ? { ...s, label: `Pensou por ${thoughtDuration}s`, status: 'success' as const } : s
                  );
                  updateSteps([...updatedSteps, { id: generateId(), label: 'Gerando ativos de código...', status: 'running', icon: Code }]);
                }

                setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content: fullResponse } : m));
                lastContentLength = fullResponse.length;
              }
            }
          }
        }
      }

      // Finalize
      const finalFiles = extractFilesFromMarkdown(fullResponse);
      if (finalFiles.length > 0) {
        setGeneratedFiles(prev => {
          const merged = [...prev];
          finalFiles.forEach(newFile => {
            const existingIdx = merged.findIndex(f => f.name === newFile.name);
            if (existingIdx >= 0) {
              merged[existingIdx] = newFile;
            } else {
              merged.push(newFile);
            }
          });
          setFileHistory(history => [...history, { timestamp: Date.now(), files: merged }]);
          return merged;
        });
      }
      
      updateSteps(steps.map(s => ({ ...s, status: s.status === 'running' ? 'success' : s.status })));

    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error("Chat Error:", err);
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content: m.content + `\n\n**Erro:** ${err.message}`, isError: true } : m));
      updateSteps(steps.map(s => s.status === 'running' ? { ...s, status: 'error' } : s));
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [messages, isLoading, activeAgent, apiKey, selectedModel, systemPrompt, temperature, searchGrounding, generatedFiles.length]);

  return {
    messages,
    setMessages,
    isLoading,
    generatedFiles,
    setGeneratedFiles,
    activeFileIndex,
    setActiveFileIndex,
    fileHistory,
    setFileHistory,
    resetChat,
    sendMessage,
    abortRequest: () => abortControllerRef.current?.abort()
  };
}
