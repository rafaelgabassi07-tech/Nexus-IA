import React from 'react';
import { motion } from 'motion/react';
import { 
  Key, Brain, Shield, Trash2, Edit2, Plus, 
  ExternalLink, ChevronRight, Check
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
  settingsTab: 'overview' | 'general' | 'agent' | 'security';
  setSettingsTab: (tab: any) => void;
  draftApiKey: string;
  setDraftApiKey: (key: string) => void;
  draftSelectedModel: string;
  setDraftSelectedModel: (model: string) => void;
  draftTemperature: number;
  setDraftTemperature: (temp: number) => void;
  draftSystemPrompt: string;
  setDraftSystemPrompt: (prompt: string) => void;
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
        <div className="h-12 border-b border-border flex items-center px-6 gap-6 overflow-x-auto no-scrollbar shrink-0 bg-muted/20">
          <button 
            onClick={() => setSettingsTab('overview')}
            className={cn("text-[11px] font-medium transition-all whitespace-nowrap py-1 border-b-2", settingsTab === 'overview' ? "text-primary border-primary" : "text-muted-foreground border-transparent hover:text-muted-foreground")}
          >
            Visão Geral
          </button>
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
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
          <div className="max-w-3xl mx-auto space-y-8">
            
            {settingsTab === 'overview' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="bg-muted/30 border border-border p-1.5 rounded-lg flex items-center gap-2 group">
                    <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0 transition-transform"><Key size={12} /></div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[11px] font-bold text-foreground leading-none">API Keys</h3>
                    </div>
                    <button onClick={() => setSettingsTab('general')} className="h-6 w-6 flex items-center justify-center text-primary opacity-40 hover:opacity-100"><ChevronRight size={12} /></button>
                  </div>
                  <div className="bg-muted/30 border border-border p-1.5 rounded-lg flex items-center gap-2 group">
                    <div className="w-6 h-6 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0 transition-transform"><Brain size={12} /></div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[11px] font-bold text-foreground leading-none">Agent Nexus</h3>
                    </div>
                    <button onClick={() => setSettingsTab('agent')} className="h-6 w-6 flex items-center justify-center text-emerald-400 opacity-40 hover:opacity-100"><ChevronRight size={12} /></button>
                  </div>
                </div>

                <div className="bg-primary/5 border border-primary/10 p-4 rounded-xl flex flex-col md:flex-row items-center gap-6">
                  <div className="flex-1 space-y-1 text-center md:text-left">
                    <h4 className="text-[13px] font-bold text-foreground tracking-tight">Nexus Core</h4>
                    <p className="text-[10px] text-muted-foreground">Sistema operando via armazenamento local.</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="px-3 py-1 bg-primary/10 border border-primary/20 text-primary rounded text-[9px] font-bold uppercase tracking-wider">v3.1</div>
                  </div>
                </div>
              </div>
            )}

            {settingsTab === 'general' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="space-y-3">
                  <div>
                    <h3 className="text-[14px] font-bold text-foreground tracking-tight">Motor de Inteligência</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5 tracking-wider font-medium opacity-50 uppercase tracking-widest">Selecione a rede neural ativa para processamento.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2 px-0.5">
                    {NEXUS_MODELS.map(model => (
                      <div 
                        key={model.id}
                        onClick={() => setDraftSelectedModel(model.id)}
                        className={cn(
                          "p-3 rounded-xl border transition-all cursor-pointer group relative overflow-hidden",
                          draftSelectedModel === model.id 
                            ? "bg-primary/20 border-primary/40 ring-1 ring-primary/10" 
                            : "bg-[#151515] border-border hover:bg-[#1a1a1a]"
                        )}
                      >
                        <div className="flex items-center gap-4 relative z-10">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center border transition-all",
                            draftSelectedModel === model.id ? "bg-primary/20 border-primary/30 text-primary" : "bg-[#222] border-border text-muted-foreground"
                          )}>
                             <Shield size={14} className={cn(draftSelectedModel === model.id && "animate-pulse")} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-bold text-foreground uppercase tracking-tight leading-none">{model.name}</p>
                            <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest mt-1 opacity-40 leading-none">Protocolo Nexus V3.1</p>
                          </div>
                          {draftSelectedModel === model.id && (
                            <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                              <Check size={9} className="text-black" strokeWidth={5} />
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
                      className="bg-muted hover:bg-white/10 text-foreground border border-border rounded-lg text-[10px] font-bold uppercase tracking-wider h-8 px-4"
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
                            ? "bg-primary/10 border-primary/30 ring-1 ring-primary/20" 
                            : "bg-white/[0.02] border-border hover:bg-white/[0.04]"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border", draftApiKey === preset.apiKey ? "bg-primary/20 border-primary/30 text-primary" : "bg-muted border-border text-muted-foreground")}>
                             <Key size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-bold text-foreground truncate">{preset.name}</p>
                            <p className="text-[10px] text-muted-foreground font-mono truncate">••••••••{preset.apiKey.slice(-4)}</p>
                          </div>
                        </div>
                        <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingPreset(preset);
                              setPresetForm(preset);
                              setIsPresetFormOpen(true);
                            }}
                            className="p-1.5 hover:bg-white/10 rounded-md text-muted-foreground hover:text-foreground"
                          ><Edit2 size={12} /></button>
                          <button onClick={(e) => deletePreset(preset.id, e)} className="p-1.5 hover:bg-red-500/10 rounded-md text-muted-foreground hover:text-red-400"><Trash2 size={12} /></button>
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
                        className="bg-white/[0.02] border-border focus-visible:ring-1 focus-visible:ring-primary/30 h-12 text-[13px] rounded-xl pl-4 pr-12 shadow-inner"
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
                      <h3 className="text-[14px] font-bold text-foreground tracking-tight">Persona do Agente</h3>
                      <Button 
                        onClick={() => {
                          setEditingAgent(null);
                          setAgentForm({});
                          setIsAgentFormOpen(true);
                        }}
                        className="bg-muted hover:bg-white/10 text-foreground border border-border rounded-md text-[10px] font-bold uppercase tracking-wider h-7 px-3"
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
                            ? "bg-primary/10 border-primary/30" 
                            : "bg-muted/30 border-border hover:bg-muted/50"
                         )}
                       >
                         <div className="flex items-center gap-3">
                           <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border transition-all", agent.color, draftActiveAgentId === agent.id ? "" : "opacity-60")}>
                             <AgentIcon iconName={agent.iconName} size={16} className="text-foreground" />
                           </div>
                           <div className="flex-1 min-w-0">
                             <p className="text-[12px] font-bold text-foreground truncate">{agent.name}</p>
                             <p className="text-[9px] text-muted-foreground line-clamp-1 opacity-60 uppercase">{agent.shortDescription}</p>
                           </div>
                         </div>
                       </div>
                     ))}
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

                <div className="space-y-3 pt-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[12px] font-bold text-foreground uppercase tracking-wider">Diretrizes Base</h4>
                    <button onClick={() => setIsSystemPromptExpanded(!isSystemPromptExpanded)} className="text-[10px] font-black text-primary uppercase tracking-widest">{isSystemPromptExpanded ? 'Recolher' : 'Expandir'}</button>
                  </div>
                  <Textarea 
                    value={draftSystemPrompt}
                    onChange={(e) => setDraftSystemPrompt(e.target.value)}
                    className={cn(
                      "bg-muted/30 border-border text-[11px] font-mono leading-relaxed transition-all duration-300 custom-scrollbar focus-visible:ring-1 focus-visible:ring-primary/20",
                      isSystemPromptExpanded ? "h-[300px]" : "h-[100px]"
                    )}
                  />
                </div>
              </div>
            )}

            {settingsTab === 'security' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="bg-primary/5 border border-primary/10 p-6 rounded-2xl space-y-4">
                  <div className="flex items-center gap-3">
                    <Shield size={20} className="text-primary" />
                    <h3 className="text-[16px] font-bold text-foreground tracking-tight">Security Protocol</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-muted border border-border rounded-xl">
                      <span className="text-[12px] font-bold text-foreground">Scanner Heurístico</span>
                      <Switch defaultChecked className="data-[state=checked]:bg-primary" />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    'Prevenção XSS',
                    'Bloqueio Shell',
                    'Ocultação de Chaves'
                  ].map((rule, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-muted/50 border border-border rounded-xl">
                      <span className="text-[11px] font-medium text-muted-foreground">{rule}</span>
                      <span className="text-[8px] font-black uppercase text-primary/60">Ativa</span>
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
