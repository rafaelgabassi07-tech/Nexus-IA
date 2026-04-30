import React from 'react';
import { 
  Key, Brain, Shield, Trash2, Edit2, Plus, 
  ExternalLink, Check, Columns, Zap
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { AgentIcon } from '../chat/AgentIcon';
import { cn } from '../../lib/utils';
import { APIPreset, AgentDefinition } from '../../types';
import { NEXUS_MODELS } from '../../lib/models';
import { useSettingsStore } from '../../store/appStore';

interface SettingsPanelProps {
  settingsTab: 'general' | 'agent' | 'security' | 'intelligence';
  setSettingsTab: (tab: any) => void;
  draftApiKey: string;
  setDraftApiKey: (key: string) => void;
  draftSelectedModel: string;
  setDraftSelectedModel: (model: string) => void;
  draftTemperature: number;
  setDraftTemperature: (temp: number) => void;
  draftSystemPrompt: string;
  setDraftSystemPrompt: (prompt: string) => void;
  draftAutoRefine: boolean;
  setDraftAutoRefine: (active: boolean) => void;
  draftShowDiff: boolean;
  setDraftShowDiff: (active: boolean) => void;
  draftActiveAgentId: string;
  setDraftActiveAgentId: (id: string) => void;
  apiPresets: APIPreset[];
  customAgents: AgentDefinition[];
  hasSettingsChanges: boolean;
  saveSettings: () => void;
  setIsPresetFormOpen: (open: boolean) => void;
  setEditingPreset: (preset: APIPreset | null) => void;
  deletePreset: (id: string, e: React.MouseEvent) => void;
  setPresetForm: (form: any) => void;
  setIsAgentFormOpen: (open: boolean) => void;
  setEditingAgent: (agent: AgentDefinition | null) => void;
  deleteAgent: (id: string) => void;
  setAgentForm: (form: any) => void;
  allAgents: AgentDefinition[];
  isSystemPromptExpanded: boolean;
  setIsSystemPromptExpanded: (expanded: boolean) => void;
  setActiveTab: (tab: any) => void;
}

export const SettingsPanel = ({
  settingsTab, setSettingsTab,
  draftApiKey, setDraftApiKey,
  draftSelectedModel, setDraftSelectedModel,
  draftTemperature, setDraftTemperature,
  draftSystemPrompt, setDraftSystemPrompt,
  draftAutoRefine, setDraftAutoRefine,
  draftShowDiff, setDraftShowDiff,
  draftActiveAgentId, setDraftActiveAgentId,
  apiPresets,
  hasSettingsChanges, saveSettings,
  setIsPresetFormOpen, setEditingPreset, deletePreset, setPresetForm,
  setIsAgentFormOpen, setEditingAgent, setAgentForm,
  allAgents,
  isSystemPromptExpanded, setIsSystemPromptExpanded
}: SettingsPanelProps) => {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background animate-in fade-in duration-500 overflow-hidden">
        {/* Settings Secondary Navigation */}
        <div className="h-12 border-b border-border flex items-center px-6 gap-6 overflow-x-auto no-scrollbar shrink-0 bg-muted">
          <button 
            onClick={() => setSettingsTab('general')}
            className={cn("text-[11px] font-medium transition-all whitespace-nowrap py-1 border-b-2", settingsTab === 'general' ? "text-primary border-primary" : "text-muted-foreground border-transparent hover:text-muted-foreground")}
          >
            Integrações
          </button>
          <button 
            onClick={() => setSettingsTab('agent')}
            className={cn("text-[11px] font-medium transition-all whitespace-nowrap py-1 border-b-2", settingsTab === 'agent' ? "text-primary border-primary" : "text-muted-foreground border-transparent hover:text-muted-foreground")}
          >
            Personalidade
          </button>
          <button 
            onClick={() => setSettingsTab('security')}
            className={cn("text-[11px] font-medium transition-all whitespace-nowrap py-1 border-b-2", settingsTab === 'security' ? "text-primary border-primary" : "text-muted-foreground border-transparent hover:text-muted-foreground")}
          >
            Segurança
          </button>
          <button 
            onClick={() => setSettingsTab('intelligence')}
            className={cn("text-[11px] font-medium transition-all whitespace-nowrap py-1 border-b-2", settingsTab === 'intelligence' ? "text-primary border-primary" : "text-muted-foreground border-transparent hover:text-muted-foreground")}
          >
            Intelligence
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
          <div className="max-w-3xl mx-auto space-y-8">
            
            {settingsTab === 'general' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="space-y-3">
                  <div>
                    <h3 className="text-[14px] font-bold text-foreground tracking-tight">Motor de Inteligência</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5 tracking-wider font-medium uppercase tracking-widest">Selecione a rede neural ativa para processamento.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2 px-0.5">
                    {NEXUS_MODELS.map(model => (
                      <div 
                        key={model.id}
                        onClick={() => setDraftSelectedModel(model.id)}
                        className={cn(
                          "p-3 rounded-xl border transition-all cursor-pointer group relative overflow-hidden",
                          draftSelectedModel === model.id 
                            ? "bg-primary text-primary-foreground border-primary" 
                            : "bg-muted border-border hover:bg-muted/80"
                        )}
                      >
                        <div className="flex items-center gap-4 relative z-10">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center border transition-all",
                            draftSelectedModel === model.id ? "bg-background border-none text-primary" : "bg-card border-border text-muted-foreground"
                          )}>
                             <Shield size={14} className={cn(draftSelectedModel === model.id && "animate-pulse")} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-[14px] font-medium leading-none", draftSelectedModel === model.id ? "text-primary-foreground" : "text-foreground")}>{model.name}</p>
                            <p className={cn("text-[12px] font-mono mt-1 tracking-tight leading-none", draftSelectedModel === model.id ? "text-primary-foreground/70" : "text-muted-foreground")}>{model.rateLimit || 'Protocolo Nexus V3.1'}</p>
                          </div>
                          {draftSelectedModel === model.id && (
                            <div className="w-4 h-4 rounded-full bg-background flex items-center justify-center">
                              <Check size={9} className="text-primary" strokeWidth={5} />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-[16px] font-bold text-foreground tracking-tight">Presets de API</h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Configure múltiplos ambientes de chaves.</p>
                    </div>
                    <Button 
                      onClick={() => {
                        setEditingPreset(null);
                        setPresetForm({});
                        setIsPresetFormOpen(true);
                      }}
                      className="bg-primary hover:bg-primary/80 text-primary-foreground border border-primary rounded-lg text-[10px] font-bold uppercase tracking-wider h-8 px-4"
                    >
                      <Plus size={14} className="mr-2" /> Novo
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {apiPresets.map(preset => (
                      <div 
                        key={preset.id}
                        onClick={() => setDraftApiKey(preset.apiKey)}
                        className={cn(
                          "p-4 rounded-2xl border transition-all cursor-pointer group relative",
                          draftApiKey === preset.apiKey 
                            ? "bg-primary text-primary-foreground border-primary" 
                            : "bg-muted border-border hover:bg-muted/80"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border", draftApiKey === preset.apiKey ? "bg-background border-none text-primary" : "bg-card border-border text-muted-foreground")}>
                             <Key size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-[13px] font-bold truncate", draftApiKey === preset.apiKey ? "text-primary-foreground" : "text-foreground")}>{preset.name}</p>
                            <p className={cn("text-[10px] font-mono truncate", draftApiKey === preset.apiKey ? "text-primary-foreground/70" : "text-muted-foreground")}>••••••••{preset.apiKey.slice(-4)}</p>
                          </div>
                        </div>
                        <div className="absolute top-3 right-3 flex items-center gap-1 opacity-100">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingPreset(preset);
                              setPresetForm(preset);
                              setIsPresetFormOpen(true);
                            }}
                            className={cn("p-1.5 rounded-md transition-colors", draftApiKey === preset.apiKey ? "hover:bg-background/20 text-primary-foreground" : "hover:bg-background text-muted-foreground hover:text-foreground")}
                          ><Edit2 size={12} /></button>
                          <button onClick={(e) => deletePreset(preset.id, e)} className={cn("p-1.5 rounded-md transition-colors", draftApiKey === preset.apiKey ? "hover:bg-red-500/50 text-primary-foreground" : "hover:bg-red-500 text-white")}><Trash2 size={12} /></button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 pt-8 border-t border-border">
                    <Label className="text-[13px] font-bold text-foreground block mb-4">Chave Ativa (Manual)</Label>
                    <div className="relative">
                      <Input 
                        type="password"
                        value={draftApiKey}
                        onChange={(e) => setDraftApiKey(e.target.value)}
                        placeholder="Insira sua GEMINI_API_KEY..."
                        className="bg-muted border-border focus-visible:ring-1 focus-visible:ring-primary/30 h-12 text-[13px] rounded-xl pl-4 pr-12 shadow-none"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                         <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="p-2 text-muted-foreground hover:text-primary transition-colors" title="Obter Chave"><ExternalLink size={16} /></a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {settingsTab === 'agent' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                       <h3 className="text-[14px] font-bold text-foreground tracking-tight">Personalidade do Agente</h3>
                       <Button 
                        onClick={() => {
                          setEditingAgent(null);
                          setAgentForm({});
                          setIsAgentFormOpen(true);
                        }}
                        className="bg-primary hover:bg-primary/80 text-primary-foreground border border-primary rounded-md text-[10px] font-bold uppercase tracking-wider h-7 px-3"
                      >
                        Customizado
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {allAgents.map(agent => (
                        <div 
                          key={agent.id}
                          onClick={() => {
                            setDraftActiveAgentId(agent.id);
                            setDraftSystemPrompt(agent.systemPrompt);
                          }}
                          className={cn(
                            "p-2.5 rounded-xl border transition-all cursor-pointer group relative",
                            draftActiveAgentId === agent.id 
                             ? "bg-primary text-primary-foreground border-primary" 
                             : "bg-muted border-border hover:bg-muted/80"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border transition-all", agent.color)}>
                              <AgentIcon iconName={agent.iconName} size={16} className="text-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn("text-[12px] font-bold truncate", draftActiveAgentId === agent.id ? "text-primary-foreground" : "text-foreground")}>{agent.name}</p>
                              <p className={cn("text-[9px] line-clamp-1 uppercase tracking-widest font-black", draftActiveAgentId === agent.id ? "text-primary-foreground/70" : "text-muted-foreground")}>{agent.shortDescription}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between p-3 bg-muted border border-border rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                        <Brain size={14} />
                      </div>
                      <div>
                        <h4 className="text-[12px] font-bold text-foreground tracking-tight">Auto-Refinement (Nexus)</h4>
                        <p className="text-[9px] text-emerald-500 uppercase font-black tracking-widest">Recurso Principal Essencial</p>
                      </div>
                    </div>
                    <Switch 
                      checked={draftAutoRefine} 
                      onCheckedChange={setDraftAutoRefine}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted border border-border rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                        <Columns size={14} />
                      </div>
                      <div>
                        <h4 className="text-[12px] font-bold text-foreground tracking-tight">Show Visual Diff</h4>
                        <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Exibir Comparação de Código</p>
                      </div>
                    </div>
                    <Switch 
                      checked={draftShowDiff} 
                      onCheckedChange={setDraftShowDiff}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[13px] font-bold text-foreground uppercase tracking-wider">Temperatura</h4>
                    <div className="text-[12px] font-black text-primary">{(draftTemperature * 100).toFixed(0)}%</div>
                  </div>
                  <Slider 
                    value={[draftTemperature * 100]} 
                    onValueChange={(val) => {
                      const v = Array.isArray(val) ? val[0] : val;
                      setDraftTemperature(v / 100);
                    }} 
                    max={100} 
                    step={1}
                  />
                </div>

                <div className="space-y-3 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[12px] font-bold text-foreground uppercase tracking-wider">Diretrizes Base</h4>
                    <button onClick={() => setIsSystemPromptExpanded(!isSystemPromptExpanded)} className="text-[10px] font-black text-primary uppercase tracking-widest">{isSystemPromptExpanded ? 'Recolher' : 'Expandir'}</button>
                  </div>
                  <Textarea 
                    value={draftSystemPrompt}
                    onChange={(e) => setDraftSystemPrompt(e.target.value)}
                    className={cn(
                      "bg-muted border-border text-[11px] font-mono leading-relaxed transition-all duration-300 custom-scrollbar focus-visible:ring-1 focus-visible:ring-primary/20",
                      isSystemPromptExpanded ? "h-[300px]" : "h-[100px]"
                    )}
                  />
                </div>
              </div>
            )}

            {settingsTab === 'intelligence' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="bg-muted border border-primary p-6 rounded-2xl relative overflow-hidden">
                   <div className="relative z-10 space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg">
                           <Brain size={24} />
                        </div>
                        <div>
                           <h2 className="text-[18px] font-bold tracking-tight text-foreground">Nexus Collective Intelligence</h2>
                           <p className="text-[11px] text-muted-foreground uppercase font-black tracking-widest">Memória Global Híbrida v1.0</p>
                        </div>
                      </div>
                      <p className="text-[12px] text-foreground leading-relaxed max-w-xl">
                        O Nexus aprende com cada interação, refinamento e correção. Este volume de conhecimento é persistido globalmente para orientar futuras gerações e evitar a repetição de padrões ineficientes.
                      </p>
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                      <h3 className="text-[14px] font-bold text-foreground tracking-tight uppercase tracking-widest flex items-center gap-2">
                        <Zap size={14} className="text-primary" />
                        Lições Aprendidas
                      </h3>
                      <div className="text-[10px] font-black text-muted-foreground">{useSettingsStore.getState().collectiveIntelligence.lessonsLearned.length} PROTOCOLOS</div>
                   </div>
                   
                   <div className="grid grid-cols-1 gap-2">
                      {useSettingsStore.getState().collectiveIntelligence.lessonsLearned.map((lesson, i) => (
                        <div key={i} className="group p-3 bg-muted border border-border rounded-xl hover:border-primary transition-all flex items-start gap-3">
                           <div className="w-5 h-5 rounded bg-primary flex items-center justify-center text-primary-foreground text-[9px] font-black shrink-0 mt-0.5">{(i + 1).toString().padStart(2, '0')}</div>
                           <p className="text-[11px] text-foreground font-medium leading-relaxed flex-1">{lesson}</p>
                           <button 
                             onClick={() => useSettingsStore.getState().removeLessonLearned(i)}
                             className="opacity-100 p-1 rounded hover:bg-red-500 text-muted-foreground hover:text-white transition-all"
                           >
                              <Trash2 size={12} />
                           </button>
                        </div>
                      ))}
                      {useSettingsStore.getState().collectiveIntelligence.lessonsLearned.length === 0 && (
                        <div className="py-12 border border-dashed border-border rounded-2xl text-center">
                           <p className="text-[11px] text-muted-foreground uppercase font-black italic">Nenhum protocolo asimilado ainda.</p>
                        </div>
                      )}
                   </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-border">
                   <div className="flex items-center justify-between">
                      <h3 className="text-[14px] font-bold text-foreground tracking-tight uppercase tracking-widest flex items-center gap-2">
                         <Shield size={14} className="text-primary" />
                         Arquiteturas de Sucesso
                      </h3>
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {useSettingsStore.getState().collectiveIntelligence.successfulPatterns.length > 0 ? (
                        useSettingsStore.getState().collectiveIntelligence.successfulPatterns.map((pattern, i) => (
                           <div key={i} className="p-4 bg-muted border border-border rounded-xl hover:border-primary transition-all cursor-default">
                              <h4 className="text-[12px] font-bold text-foreground mb-1">{pattern.description}</h4>
                              <div className="text-[9px] font-mono text-muted-foreground line-clamp-3 bg-card p-2 rounded border border-border mt-2">
                                 {pattern.code}
                              </div>
                           </div>
                        ))
                      ) : (
                        <div className="col-span-full py-8 text-center bg-muted border border-dashed border-border rounded-xl">
                           <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-40">Módulo de Padrões Vazio</p>
                        </div>
                      )}
                   </div>
                </div>
              </div>
            )}
            
            {settingsTab === 'security' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="bg-muted border border-border p-6 rounded-2xl space-y-4">
                  <div className="flex items-center gap-3">
                    <Shield size={20} className="text-primary" />
                    <h3 className="text-[16px] font-bold text-foreground tracking-tight">Security Protocol</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-card border border-border rounded-xl">
                      <span className="text-[12px] font-bold text-foreground">Scanner Heurístico</span>
                      <Switch defaultChecked className="data-[state=checked]:bg-primary" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                      <h3 className="text-[14px] font-bold text-foreground tracking-tight uppercase tracking-widest">Logs de Diagnóstico</h3>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => useSettingsStore.getState().clearErrorLogs()}
                        className="text-[10px] font-black text-muted-foreground hover:text-red-400 uppercase"
                      >
                        Limpar Log
                      </Button>
                   </div>
                   <div className="bg-muted border border-border rounded-xl overflow-hidden min-h-[100px] max-h-[300px] overflow-y-auto custom-scrollbar">
                      {useSettingsStore.getState().errorLogs.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground text-[10px] uppercase font-bold italic">
                          Nenhum erro persistido no buffer.
                        </div>
                      ) : (
                        <div className="flex flex-col divide-y divide-border">
                          {useSettingsStore.getState().errorLogs.map((log, i) => (
                            <div key={i} className="p-3 hover:bg-card transition-colors flex gap-3">
                               <div className={cn("w-1.5 h-1.5 rounded-full shrink-0 mt-1", log.type === 'runtime' ? "bg-red-500" : "bg-amber-500")} />
                               <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest leading-none">{log.type} // {new Date(log.timestamp).toLocaleTimeString()}</span>
                                  </div>
                                  <p className="text-[10px] font-mono text-foreground break-all leading-relaxed">{log.message}</p>
                               </div>
                            </div>
                          ))}
                        </div>
                      )}
                   </div>
                </div>

                <div className="space-y-3 pt-4">
                  {[
                    'Prevenção XSS',
                    'Bloqueio Shell',
                    'Ocultação de Chaves'
                  ].map((rule, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-muted border border-border rounded-xl">
                      <span className="text-[11px] font-medium text-muted-foreground">{rule}</span>
                      <span className="text-[8px] font-black uppercase text-primary">Ativa</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
          </div>
        </div>

        {/* Footer Save Area */}
        {hasSettingsChanges && (
          <div className="p-4 border-t border-border bg-card flex flex-col md:flex-row items-center justify-between gap-4 shrink-0 z-50">
             <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Sincronização</span>
                  <span className="text-[11px] font-bold tracking-tight text-amber-500">
                    Alterações pendentes
                  </span>
                </div>
             </div>
             
             <div className="flex items-center gap-3 w-full md:w-auto">
                <Button 
                  variant="ghost" 
                  onClick={() => {
                     const store = useSettingsStore.getState();
                     setDraftApiKey(store.apiKey);
                     setDraftSelectedModel(store.selectedModel);
                     setDraftTemperature(store.temperature);
                     setDraftSystemPrompt(
                       allAgents.find(a => a.id === store.activeAgentId)?.systemPrompt || store.customAgents.find((a: any) => a.id === store.activeAgentId)?.systemPrompt || ''
                     );
                     setDraftActiveAgentId(store.activeAgentId);
                  }}
                  className="flex-1 md:flex-none h-10 px-4 rounded-lg border border-border text-muted-foreground hover:text-foreground text-[10px] font-bold uppercase tracking-wider"
                >
                  Descartar
                </Button>
                <Button 
                  onClick={saveSettings}
                  className="flex-1 md:flex-none h-10 px-8 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Salvar Matriz
                </Button>
             </div>
          </div>
        )}
      </div>
  );
};

export const SettingsDialogs = ({
  isPresetFormOpen, setIsPresetFormOpen, editingPreset, presetForm, setPresetForm, addOrUpdatePreset,
  isAgentFormOpen, setIsAgentFormOpen, editingAgent, agentForm, setAgentForm, addOrUpdateAgent
}: any) => {
  return (
    <>
      <Dialog open={isPresetFormOpen} onOpenChange={setIsPresetFormOpen}>
        <DialogContent className="max-w-[400px] bg-background border-border text-foreground p-5 rounded-2xl shadow-2xl">
          <DialogHeader><DialogTitle className="text-[16px] font-bold tracking-tight">{editingPreset ? 'Editar Configuração' : 'Novo Preset de API'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Nome de Identificação</Label>
              <Input 
                value={presetForm.name || ''} 
                onChange={e => setPresetForm({...presetForm, name: e.target.value})}
                placeholder="Ex: Produção, Beta..." 
                className="bg-muted border-border h-10 rounded-lg focus:ring-1 focus:ring-primary/30 text-[13px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Chave de API do Google</Label>
              <Input 
                type="password"
                value={presetForm.apiKey || ''} 
                onChange={e => setPresetForm({...presetForm, apiKey: e.target.value})}
                placeholder="Insira sua chave..." 
                className="bg-muted border-border h-10 rounded-lg focus:ring-1 focus:ring-primary/30 text-[13px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={addOrUpdatePreset} className="w-full h-10 bg-primary hover:bg-primary rounded-lg font-bold uppercase tracking-wider text-[10px]">{editingPreset ? 'Aplicar Mudanças' : 'Registrar Preset'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAgentFormOpen} onOpenChange={setIsAgentFormOpen}>
        <DialogContent className="max-w-[480px] bg-background border-border text-foreground p-5 rounded-2xl shadow-2xl overflow-y-auto max-h-[85vh] custom-scrollbar">
          <DialogHeader><DialogTitle className="text-[16px] font-bold tracking-tight">{editingAgent ? 'Personalizar Agente' : 'Manifestar Novo Agente'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Nome de Exibição</Label>
                <Input value={agentForm.name || ''} onChange={e => setAgentForm({...agentForm, name: e.target.value})} className="bg-muted border-border h-10 rounded-lg text-[13px]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Cor (bg-class)</Label>
                <Input value={agentForm.color || ''} onChange={e => setAgentForm({...agentForm, color: e.target.value})} className="bg-muted border-border h-10 rounded-lg text-[13px]" placeholder="bg-primary" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Descrição Breve</Label>
              <Input value={agentForm.shortDescription || ''} onChange={e => setAgentForm({...agentForm, shortDescription: e.target.value})} className="bg-muted border-border h-10 rounded-lg text-[13px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Prompt de Sistema</Label>
              <Textarea value={agentForm.systemPrompt || ''} onChange={e => setAgentForm({...agentForm, systemPrompt: e.target.value})} className="bg-muted border-border h-32 rounded-xl resize-none custom-scrollbar text-[12px] font-mono" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={addOrUpdateAgent} className="w-full h-10 bg-purple-600 hover:bg-purple-500 rounded-lg font-bold uppercase tracking-wider text-[10px]">{editingAgent ? 'Salvar Matriz' : 'Criar Entidade'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
