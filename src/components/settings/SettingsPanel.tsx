import React from 'react';
import { motion } from 'motion/react';
import { 
  Key, Brain, Shield, Trash2, Edit2, Plus, 
  ExternalLink, ChevronRight, Info, Save, Undo,
  AlertCircle, Check
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
  setIsAgentFormOpen, setEditingAgent, deleteAgent, setAgentForm,
  allAgents,
  isSystemPromptExpanded, setIsSystemPromptExpanded,
  setActiveTab
}: SettingsPanelProps) => {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0d0d0e]/50 backdrop-blur-3xl animate-in fade-in duration-500 overflow-hidden">
        {/* Settings Secondary Navigation */}
        <div className="h-12 border-b border-white/20 flex items-center px-6 gap-6 overflow-x-auto no-scrollbar shrink-0 bg-black/20">
          <button 
            onClick={() => setSettingsTab('overview')}
            className={cn("text-[11px] font-medium transition-all whitespace-nowrap py-1 border-b-2", settingsTab === 'overview' ? "text-blue-400 border-blue-400" : "text-[#4a4d51] border-transparent hover:text-[#8e918f]")}
          >
            Visão Geral
          </button>
          <button 
            onClick={() => setSettingsTab('general')}
            className={cn("text-[11px] font-medium transition-all whitespace-nowrap py-1 border-b-2", settingsTab === 'general' ? "text-blue-400 border-blue-400" : "text-[#4a4d51] border-transparent hover:text-[#8e918f]")}
          >
            Integrações
          </button>
          <button 
            onClick={() => setSettingsTab('agent')}
            className={cn("text-[11px] font-medium transition-all whitespace-nowrap py-1 border-b-2", settingsTab === 'agent' ? "text-blue-400 border-blue-400" : "text-[#4a4d51] border-transparent hover:text-[#8e918f]")}
          >
            Personalidade
          </button>
          <button 
            onClick={() => setSettingsTab('security')}
            className={cn("text-[11px] font-medium transition-all whitespace-nowrap py-1 border-b-2", settingsTab === 'security' ? "text-blue-400 border-blue-400" : "text-[#4a4d51] border-transparent hover:text-[#8e918f]")}
          >
            Segurança
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
          <div className="max-w-3xl mx-auto space-y-8">
            
            {settingsTab === 'overview' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/[0.02] border border-white/20 p-5 rounded-2xl space-y-3 hover:bg-white/[0.04] transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform"><Key size={20} /></div>
                    <h3 className="text-[15px] font-bold text-white tracking-tight">Chaves de API</h3>
                    <p className="text-[12px] text-white/80 leading-relaxed">Gerencie suas chaves do Google AI Studio para processamento de alto desempenho.</p>
                    <button onClick={() => setSettingsTab('general')} className="flex items-center gap-1.5 text-blue-400 text-[10px] font-bold uppercase tracking-wider pt-2 hover:gap-3 transition-all">Configurar <ChevronRight size={12} /></button>
                  </div>
                  <div className="bg-white/[0.02] border border-white/20 p-5 rounded-2xl space-y-3 hover:bg-white/[0.04] transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform"><Brain size={20} /></div>
                    <h3 className="text-[15px] font-bold text-white tracking-tight">Arquitetura de Agentes</h3>
                    <p className="text-[12px] text-white/80 leading-relaxed">Personalize a rede neural e os prompts de sistema para suas necessidades.</p>
                    <button onClick={() => setSettingsTab('agent')} className="flex items-center gap-1.5 text-purple-400 text-[10px] font-bold uppercase tracking-wider pt-2 hover:gap-3 transition-all">Ajustar <ChevronRight size={12} /></button>
                  </div>
                </div>

                <div className="bg-blue-500/5 border border-blue-500/10 p-5 rounded-2xl flex flex-col md:flex-row items-center gap-6">
                  <div className="flex-1 space-y-1 text-center md:text-left">
                    <h4 className="text-[14px] font-bold text-white tracking-tight">Status do Nexus Core</h4>
                    <p className="text-[11px] text-white/80">Sistemas operando via Armazenamento Local Localizado.</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg text-[9px] font-bold uppercase tracking-wider">Versão Pro 3.1</div>
                  </div>
                </div>
              </div>
            )}

            {settingsTab === 'general' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-[16px] font-bold text-white tracking-tight">Motor de Inteligência</h3>
                    <p className="text-[11px] text-[#8e918f] mt-0.5 tracking-wider font-medium opacity-60">Selecione a rede neural ativa para processamento.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {NEXUS_MODELS.map(model => (
                      <div 
                        key={model.id}
                        onClick={() => setDraftSelectedModel(model.id)}
                        className={cn(
                          "p-4 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden",
                          draftSelectedModel === model.id 
                            ? "bg-blue-600/10 border-blue-500/30 ring-1 ring-blue-500/20" 
                            : "bg-white/[0.02] border-white/20 hover:bg-white/[0.04]"
                        )}
                      >
                        <div className="flex items-center gap-3 relative z-10">
                          <div className={cn(
                            "w-9 h-9 rounded-xl flex items-center justify-center border transition-all",
                            draftSelectedModel === model.id ? "bg-blue-500/20 border-blue-400/30 text-blue-400" : "bg-white/5 border-white/20 text-[#4a4d51]"
                          )}>
                             <Shield size={16} className={cn(draftSelectedModel === model.id && "animate-pulse")} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-bold text-white uppercase tracking-tight">{model.name}</p>
                            <p className="text-[9px] text-[#4a4d51] font-bold uppercase tracking-wider mt-0.5 opacity-60">Nexus v3.1</p>
                          </div>
                          {draftSelectedModel === model.id && (
                            <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                              <Check size={10} className="text-black" strokeWidth={4} />
                            </div>
                          )}
                        </div>
                        {draftSelectedModel === model.id && (
                          <motion.div 
                            layoutId="activeModelBg"
                            className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/20">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-[16px] font-bold text-white tracking-tight">Presets de API</h3>
                      <p className="text-[11px] text-[#8e918f] mt-0.5">Configure múltiplos ambientes de chaves.</p>
                    </div>
                    <Button 
                      onClick={() => {
                        setEditingPreset(null);
                        setPresetForm({});
                        setIsPresetFormOpen(true);
                      }}
                      className="bg-white/5 hover:bg-white/10 text-white border border-white/20 rounded-lg text-[10px] font-bold uppercase tracking-wider h-8 px-4"
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
                            ? "bg-blue-600/10 border-blue-500/30 ring-1 ring-blue-500/20" 
                            : "bg-white/[0.02] border-white/20 hover:bg-white/[0.04]"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border", draftApiKey === preset.apiKey ? "bg-blue-500/20 border-blue-400/30 text-blue-400" : "bg-white/5 border-white/20 text-[#4a4d51]")}>
                             <Key size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-bold text-white truncate">{preset.name}</p>
                            <p className="text-[10px] text-[#4a4d51] font-mono truncate">••••••••{preset.apiKey.slice(-4)}</p>
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
                            className="p-1.5 hover:bg-white/10 rounded-md text-[#4a4d51] hover:text-white"
                          ><Edit2 size={12} /></button>
                          <button onClick={(e) => deletePreset(preset.id, e)} className="p-1.5 hover:bg-red-500/10 rounded-md text-[#4a4d51] hover:text-red-400"><Trash2 size={12} /></button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 pt-8 border-t border-white/20">
                    <Label className="text-[13px] font-bold text-white block mb-4">Chave Ativa (Manual)</Label>
                    <div className="relative">
                      <Input 
                        type="password"
                        value={draftApiKey}
                        onChange={(e) => setDraftApiKey(e.target.value)}
                        placeholder="Insira sua GEMINI_API_KEY..."
                        className="bg-white/[0.02] border-white/20 focus-visible:ring-1 focus-visible:ring-blue-500/30 h-12 text-[13px] rounded-xl pl-4 pr-12 shadow-inner"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                         <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="p-2 text-[#4a4d51] hover:text-blue-400 transition-colors" title="Obter Chave"><ExternalLink size={16} /></a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {settingsTab === 'agent' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                      <h3 className="text-[16px] font-bold text-white tracking-tight">Persona do Agente</h3>
                      <Button 
                        onClick={() => {
                          setEditingAgent(null);
                          setAgentForm({});
                          setIsAgentFormOpen(true);
                        }}
                        className="bg-white/5 hover:bg-white/10 text-white border border-white/20 rounded-md text-[10px] font-bold uppercase tracking-wider h-8 px-3"
                      >
                        <Plus size={12} className="mr-2" /> Customizado
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
                           "p-3 rounded-2xl border transition-all cursor-pointer group relative",
                           draftActiveAgentId === agent.id 
                            ? "bg-purple-600/10 border-purple-500/30 ring-1 ring-purple-500/20" 
                            : "bg-white/[0.02] border-white/20 hover:bg-white/[0.04]"
                         )}
                       >
                         <div className="flex items-center gap-3">
                           <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border transition-transform duration-500 group-hover:scale-105", agent.color, draftActiveAgentId === agent.id ? "shadow-lg shadow-purple-500/20" : "opacity-60")}>
                             <AgentIcon iconName={agent.iconName} size={20} className="text-white" />
                           </div>
                           <div className="flex-1 min-w-0">
                             <p className="text-[13px] font-bold text-white tracking-tight truncate">{agent.name}</p>
                             <p className="text-[10px] text-[#8e918f] font-medium leading-tight mt-0.5 line-clamp-1 opacity-60 uppercase tracking-wider">{agent.shortDescription}</p>
                           </div>
                         </div>
                         {agent.id.includes('-') && !agent.id.includes('general') && (
                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button onClick={(e) => { e.stopPropagation(); deleteAgent(agent.id); }} className="p-1.5 hover:bg-red-500/10 rounded-md text-[#4a4d51] hover:text-red-400"><Trash2 size={12} /></button>
                            </div>
                         )}
                       </div>
                     ))}
                   </div>
                </div>

                <div className="space-y-8 pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-[14px] font-bold text-white tracking-tight uppercase tracking-widest mb-1">Temperatura Reativa</h4>
                      <p className="text-[11px] text-[#4a4d51] font-medium uppercase">Ajusta o equilíbrio entre precisão normativa e criatividade estocástica.</p>
                    </div>
                    <div className="text-[13px] font-black text-blue-400 bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/20">{(draftTemperature * 100).toFixed(0)}%</div>
                  </div>
                  <Slider 
                    value={[draftTemperature * 100]} 
                    onValueChange={(val) => {
                      const v = Array.isArray(val) ? val[0] : val;
                      setDraftTemperature(v / 100);
                    }} 
                    max={100} 
                    step={1}
                    className="py-4"
                  />
                  <div className="flex justify-between px-1">
                    <span className="text-[9px] font-black uppercase text-[#4a4d51]">Determinístico</span>
                    <span className="text-[9px] font-black uppercase text-[#4a4d51]">Caótico</span>
                  </div>
                </div>

            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[13px] font-black text-white tracking-widest uppercase">Instruções de Sistema</h4>
                <button onClick={() => setIsSystemPromptExpanded(!isSystemPromptExpanded)} className="text-[10px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300 transition-colors">{isSystemPromptExpanded ? 'Recolher' : 'Expandir'}</button>
              </div>
                  <Textarea 
                    value={draftSystemPrompt}
                    onChange={(e) => setDraftSystemPrompt(e.target.value)}
                    className={cn(
                      "bg-white/[0.02] border-white/20 text-[12px] font-mono leading-relaxed transition-all duration-500 custom-scrollbar focus-visible:ring-1 focus-visible:ring-blue-500/30 rounded-2xl p-4",
                      isSystemPromptExpanded ? "h-[400px]" : "h-[120px]"
                    )}
                  />
                  <div className="flex flex-col gap-2 p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                     <div className="flex items-center gap-2 text-blue-400 mb-1">
                        <AlertCircle size={14} />
                        <span className="text-[11px] font-black uppercase tracking-widest">Aviso de Estrutura</span>
                     </div>
                     <p className="text-[11px] text-[#8e918f] font-medium leading-relaxed">
                        Alterar o prompt de sistema pode impactar severamente a capacidade do Nexus de gerar arquivos estruturados corretamente.
                     </p>
                  </div>
                </div>
              </div>
            )}

            {settingsTab === 'security' && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="bg-emerald-500/5 border border-emerald-500/10 p-6 md:p-8 rounded-3xl space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20"><Shield size={24} /></div>
                    <div>
                      <h3 className="text-[17px] md:text-[20px] font-bold text-white tracking-tighter italic uppercase">Segurança Blindada</h3>
                      <p className="text-[10px] md:text-[11px] text-emerald-400/60 font-black uppercase tracking-widest">Criptografia Local e Zero-Data Logging</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/20 rounded-2xl group hover:bg-white/[0.04] transition-all">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400"><Info size={16} /></div>
                         <div>
                            <p className="text-[13px] font-bold text-white">Scanner Heurístico</p>
                            <p className="text-[10px] text-white/90 font-medium uppercase tracking-tight">Análise em tempo real de vulnerabilidades no código.</p>
                         </div>
                      </div>
                      <Switch defaultChecked className="data-[state=checked]:bg-emerald-500" />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/20 rounded-2xl group hover:bg-white/[0.04] transition-all opacity-50">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400"><Check size={16} /></div>
                         <div>
                            <p className="text-[13px] font-bold text-white">Túnel OAuth (Em Breve)</p>
                            <p className="text-[10px] text-white/90 font-medium uppercase tracking-tight">Conexão segura para serviços e APIs externas.</p>
                         </div>
                      </div>
                      <Switch disabled className="data-[state=checked]:bg-blue-500" />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                   <h3 className="text-[14px] font-black uppercase text-[#4a4d51] tracking-[0.2em] border-l-2 border-emerald-500/40 pl-4">Regras de Validação</h3>
                   <div className="space-y-3">
                     {[
                       { name: 'Prevenção de Injeção XSS', active: true },
                       { name: 'Bloqueio de Shell Inverso', active: true },
                       { name: 'Ocultação de Chaves API Expostas', active: true }
                     ].map((rule, i) => (
                       <div key={i} className="flex items-center justify-between p-4 bg-white/[0.01] border border-white/20 rounded-2xl">
                          <span className="text-[12px] font-bold text-[#f1f3f4]">{rule.name}</span>
                          <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400/60 bg-emerald-400/10 px-2.5 py-1 rounded-md border border-emerald-400/20">Ativa</span>
                       </div>
                     ))}
                   </div>
                </div>
              </div>
            )}
            
          </div>
        </div>

        {/* Footer Save Area */}
        <div className="p-4 border-t border-white/20 bg-black/40 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-4 shrink-0 transition-all duration-500">
           <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-[#4a4d51] uppercase tracking-wider">Alterações Pendentes</span>
                <span className={cn("text-[11px] font-bold tracking-tight", hasSettingsChanges ? "text-amber-400" : "text-[#8e918f] opacity-50")}>
                  {hasSettingsChanges ? 'Sincronização necessária' : 'Matriz em equilíbrio'}
                </span>
              </div>
           </div>
           
           <div className="flex items-center gap-3 w-full md:w-auto">
             {hasSettingsChanges && (
                <Button 
                  variant="ghost" 
                  onClick={() => {
                     setActiveTab('chat');
                  }}
                  className="flex-1 md:flex-none h-10 px-4 rounded-lg border border-white/20 text-[#8e918f] hover:text-white text-[10px] font-bold uppercase tracking-wider"
                >
                  <Undo size={14} className="mr-2" /> Descartar
                </Button>
             )}
              <Button 
                onClick={saveSettings}
                disabled={!hasSettingsChanges}
                className={cn(
                  "flex-1 md:flex-none h-10 px-8 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300",
                  hasSettingsChanges ? "bg-blue-600 hover:bg-blue-500 text-white scale-105 shadow-lg shadow-blue-600/20" : "bg-white/5 text-[#4a4d51] cursor-not-allowed"
                )}
              >
                <Save size={14} className="mr-2" /> Salvar Matriz
              </Button>
           </div>
        </div>
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
        <DialogContent className="max-w-[400px] bg-[#0d0d0e] border-white/20 text-white p-5 rounded-2xl shadow-2xl">
          <DialogHeader><DialogTitle className="text-[16px] font-bold tracking-tight">{editingPreset ? 'Editar Configuração' : 'Novo Preset de API'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-white/80">Nome de Identificação</Label>
              <Input 
                value={presetForm.name || ''} 
                onChange={e => setPresetForm({...presetForm, name: e.target.value})}
                placeholder="Ex: Produção, Beta..." 
                className="bg-white/5 border-white/30 h-10 rounded-lg focus:ring-1 focus:ring-blue-500/30 text-[13px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-white/80">Chave de API do Google</Label>
              <Input 
                type="password"
                value={presetForm.apiKey || ''} 
                onChange={e => setPresetForm({...presetForm, apiKey: e.target.value})}
                placeholder="Insira sua chave..." 
                className="bg-white/5 border-white/30 h-10 rounded-lg focus:ring-1 focus:ring-blue-500/30 text-[13px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={addOrUpdatePreset} className="w-full h-10 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold uppercase tracking-wider text-[10px]">{editingPreset ? 'Aplicar Mudanças' : 'Registrar Preset'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAgentFormOpen} onOpenChange={setIsAgentFormOpen}>
        <DialogContent className="max-w-[480px] bg-[#0d0d0e] border-white/20 text-white p-5 rounded-2xl shadow-2xl overflow-y-auto max-h-[85vh] custom-scrollbar">
          <DialogHeader><DialogTitle className="text-[16px] font-bold tracking-tight">{editingAgent ? 'Personalizar Agente' : 'Manifestar Novo Agente'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-white/80">Nome de Exibição</Label>
                <Input value={agentForm.name || ''} onChange={e => setAgentForm({...agentForm, name: e.target.value})} className="bg-white/5 border-white/30 h-10 rounded-lg text-[13px]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-white/80">Cor (bg-class)</Label>
                <Input value={agentForm.color || ''} onChange={e => setAgentForm({...agentForm, color: e.target.value})} className="bg-white/5 border-white/30 h-10 rounded-lg text-[13px]" placeholder="bg-blue-500" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-white/80">Descrição Breve</Label>
              <Input value={agentForm.shortDescription || ''} onChange={e => setAgentForm({...agentForm, shortDescription: e.target.value})} className="bg-white/5 border-white/30 h-10 rounded-lg text-[13px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-white/80">Prompt de Sistema</Label>
              <Textarea value={agentForm.systemPrompt || ''} onChange={e => setAgentForm({...agentForm, systemPrompt: e.target.value})} className="bg-white/5 border-white/30 h-32 rounded-xl resize-none custom-scrollbar text-[12px] font-mono" />
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
