import React from 'react';
import { 
  ArrowLeft, Shield, Key, Terminal, Trash2, Plus, 
  Activity, Lock, EyeOff, CheckCircle2, ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { AgentIcon } from './AgentIcon';
import { cn } from '../lib/utils';
import { APIPreset, AgentDefinition } from '../types';

interface SettingsPanelProps {
  settingsTab: 'overview' | 'general' | 'agent' | 'security';
  setSettingsTab: (tab: 'overview' | 'general' | 'agent' | 'security') => void;
  draftApiKey: string;
  setDraftApiKey: (val: string) => void;
  draftSelectedModel: string;
  setDraftSelectedModel: (val: string) => void;
  draftTemperature: number;
  setDraftTemperature: (val: number) => void;
  draftSystemPrompt: string;
  setDraftSystemPrompt: (val: string) => void;
  draftActiveAgentId: string;
  setDraftActiveAgentId: (val: string) => void;
  apiPresets: APIPreset[];
  setEditingPreset: (p: APIPreset | null) => void;
  setPresetForm: (f: any) => void;
  setIsPresetFormOpen: (open: boolean) => void;
  deletePreset: (id: string, e: any) => void;
  allAgents: any[];
  customAgents: AgentDefinition[];
  setEditingAgent: (a: AgentDefinition | null) => void;
  setAgentForm: (f: any) => void;
  setIsAgentFormOpen: (open: boolean) => void;
  deleteAgent: (id: string) => void;
  isSystemPromptExpanded: boolean;
  setIsSystemPromptExpanded: (val: boolean) => void;
  setActiveTab: (tab: 'chat' | 'preview' | 'code' | 'settings') => void;
  saveSettings: () => void;
  hasSettingsChanges: boolean;
}

export const SettingsPanel = React.memo(({
  settingsTab, setSettingsTab,
  draftApiKey, setDraftApiKey,
  draftSelectedModel, setDraftSelectedModel,
  draftTemperature, setDraftTemperature,
  draftSystemPrompt, setDraftSystemPrompt,
  draftActiveAgentId, setDraftActiveAgentId,
  apiPresets, setEditingPreset, setPresetForm, setIsPresetFormOpen, deletePreset,
  allAgents, customAgents, setEditingAgent, setAgentForm, setIsAgentFormOpen, deleteAgent,
  isSystemPromptExpanded, setIsSystemPromptExpanded,
  setActiveTab, saveSettings, hasSettingsChanges
}: SettingsPanelProps) => {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-12">
        {settingsTab === 'overview' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10">
            <header className="space-y-2">
              <h2 className="text-[28px] font-black text-white uppercase tracking-tighter">Central Nexus</h2>
              <p className="text-[#8e918f] text-[14px] uppercase font-bold tracking-[0.2em]">Orquestração de Inteligência e Protocolos</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button onClick={() => setSettingsTab('general')} className="group flex flex-col items-center justify-center p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-blue-400/5 hover:border-blue-400/20 transition-all duration-300 gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform"><Activity size={24} /></div>
                <div className="text-center">
                  <span className="block text-[13px] font-black text-white uppercase tracking-widest">Geral</span>
                  <span className="text-[10px] text-[#8e918f] uppercase font-bold tracking-tighter">Modelos & API</span>
                </div>
              </button>

              <button onClick={() => setSettingsTab('agent')} className="group flex flex-col items-center justify-center p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-purple-400/5 hover:border-purple-400/20 transition-all duration-300 gap-4">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform"><Terminal size={24} /></div>
                <div className="text-center">
                  <span className="block text-[13px] font-black text-white uppercase tracking-widest">Identidade</span>
                  <span className="text-[10px] text-[#8e918f] uppercase font-bold tracking-tighter">Personas & Core</span>
                </div>
              </button>

              <button onClick={() => setSettingsTab('security')} className="group flex flex-col items-center justify-center p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-emerald-400/5 hover:border-emerald-400/20 transition-all duration-300 gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform"><Shield size={24} /></div>
                <div className="text-center">
                  <span className="block text-[13px] font-black text-white uppercase tracking-widest">Segurança</span>
                  <span className="text-[10px] text-[#8e918f] uppercase font-bold tracking-tighter">Protocolos & Logs</span>
                </div>
              </button>
            </div>
            
            <div className="bg-gradient-to-r from-blue-500/10 to-transparent p-1 rounded-2xl">
              <div className="bg-[#131314] rounded-[14px] p-6 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
                <div className="space-y-1 relative z-10">
                  <h3 className="font-black text-white uppercase tracking-widest text-[14px]">Sincronização Necessária?</h3>
                  <p className="text-[12px] text-[#8e918f] uppercase font-bold tracking-tighter">Você possui alterações pendentes no núcleo do sistema.</p>
                </div>
                <Button 
                  disabled={!hasSettingsChanges} 
                  onClick={() => { saveSettings(); setActiveTab('chat'); }}
                  className={cn(
                    "relative z-10 px-8 h-12 bg-blue-400 text-[#001d35] font-black uppercase tracking-widest text-[12px] rounded-xl shadow-xl transition-all",
                    !hasSettingsChanges && "opacity-20 grayscale"
                  )}
                >
                  Sincronizar Agora
                </Button>
                <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-blue-400/5 pointer-events-none skew-x-12 translate-x-10" />
              </div>
            </div>
          </div>
        )}
        
        {settingsTab === 'general' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setSettingsTab('overview')} 
                className="text-[#8e918f] hover:text-white text-[11px] font-black uppercase tracking-widest flex items-center gap-2 group transition-colors"
              >
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> 
                VOLTAR
              </button>
              <h3 className="text-[14px] font-black text-white uppercase tracking-widest">Parâmetros de Sistema</h3>
            </div>

            <div className="space-y-8">
              <div className="space-y-6">
                <div className="space-y-4">
                  <label className="text-[11px] font-black text-white/60 uppercase tracking-widest flex justify-between">
                    <span>API KEY Principal</span>
                    <span className="text-[10px] text-blue-400 font-bold lowercase italic opacity-60 px-2 py-0.5 rounded-full bg-blue-400/5 border border-blue-400/10">vínculo local</span>
                  </label>
                  <div className="relative group">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8e918f] group-focus-within:text-blue-400 transition-colors" size={16} />
                    <Input 
                      type="password" 
                      value={draftApiKey} 
                      onChange={(e) => setDraftApiKey(e.target.value)} 
                      className="bg-black/40 border-white/10 focus:border-blue-500/50 rounded-xl pl-11 pr-4 text-[13px] h-11 transition-all" 
                      placeholder="Insira sua chave Gemini..." 
                    />
                  </div>
                </div>

                <div className="p-5 bg-gradient-to-br from-blue-500/5 to-transparent border border-white/5 rounded-2xl space-y-4 shadow-inner">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest italic flex items-center gap-2">
                        <Plus size={10} /> 
                        Multiversal Keys (Presets)
                      </label>
                      <span className="text-[8px] text-[#8e918f] uppercase font-bold tracking-widest opacity-60">Gerenciamento: {apiPresets.length}/5 Chaves Ativas</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      disabled={apiPresets.length >= 5}
                      onClick={() => { setEditingPreset(null); setPresetForm({}); setIsPresetFormOpen(true); }}
                      className="h-8 text-[9px] px-3 uppercase tracking-widest font-black text-blue-400 border border-blue-400/10 hover:text-blue-300 hover:bg-blue-400/5 disabled:opacity-20"
                    >
                      Forjar Nova
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {apiPresets.map(preset => (
                      <div 
                        key={preset.id} 
                        onClick={() => setDraftApiKey(preset.apiKey)}
                        className={cn(
                          "group relative flex items-center gap-2 pl-3 pr-10 py-2.5 rounded-xl border transition-all cursor-pointer text-[12px] font-bold overflow-hidden",
                          draftApiKey === preset.apiKey 
                            ? "bg-blue-400/15 border-blue-400/30 text-blue-100 ring-1 ring-blue-400/20" 
                            : "bg-white/[0.02] border-white/5 text-[#8e918f] hover:bg-white/[0.04] hover:border-white/10"
                        )}
                      >
                        <Key size={12} className={cn("shrink-0", draftApiKey === preset.apiKey ? "text-blue-400" : "text-[#8e918f]")} />
                        <span className="truncate max-w-[90px]">{preset.name}</span>
                        <div className="absolute right-0 top-0 bottom-0 flex items-center pr-1 translate-x-full group-hover:translate-x-0 transition-transform bg-gradient-to-l from-[#1a1b1e] via-[#1a1b1e] to-transparent pl-4">
                          <button 
                            onClick={(e) => { e.stopPropagation(); deletePreset(preset.id, e); }}
                            className="p-1.5 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {apiPresets.length === 0 && (
                      <div className="w-full flex items-center justify-center py-4 border border-dashed border-white/5 rounded-xl bg-white/[0.01]">
                        <p className="text-[10px] text-[#8e918f] italic uppercase tracking-[0.2em] opacity-40">Nenhum preset configurado</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-4">
                  <label className="text-[11px] font-black text-white/60 uppercase tracking-widest">Motor de Inferência</label>
                  <Select value={draftSelectedModel} onValueChange={(val) => val && setDraftSelectedModel(val)}>
                    <SelectTrigger className="bg-black/20 border-white/10 text-white rounded-xl h-11 focus:ring-1 focus:ring-blue-500/30"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#1a1b1e] border-white/10">
                      <SelectItem value="gemini-2.0-pro-exp-02-05">Gemini 2.0 Pro (Experimental)</SelectItem>
                      <SelectItem value="gemini-2.0-flash-thinking-exp-01-21">Gemini 2.0 Flash Thinking</SelectItem>
                      <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
                      <SelectItem value="gemini-2.0-flash-lite-preview-02-05">Gemini 2.0 Flash Lite</SelectItem>
                      <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                      <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-black text-white/60 uppercase tracking-widest">Nível de Caos (Temp)</label>
                    <span className="text-[11px] font-black text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-lg border border-blue-400/20">{draftTemperature.toFixed(2)}</span>
                  </div>
                  <div className="pt-2">
                    <input type="range" min="0" max="1" step="0.01" value={draftTemperature} onChange={e => setDraftTemperature(parseFloat(e.target.value))} className="w-full accent-blue-400 h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer" />
                    <div className="flex justify-between text-[8px] font-black text-[#8e918f] uppercase tracking-widest mt-2 px-1">
                      <span>Determinístico</span>
                      <span>Criativo</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <button 
                  onClick={() => setIsSystemPromptExpanded(!isSystemPromptExpanded)}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group overflow-hidden"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Terminal size={14} />
                    </div>
                    <div className="text-left">
                      <label className="text-[11px] font-black text-white/60 uppercase tracking-widest cursor-pointer group-hover:text-blue-400 transition-colors block">Prompt de Sistema (Matriz)</label>
                      {!isSystemPromptExpanded && <span className="text-[9px] text-[#8e918f] uppercase font-bold tracking-tighter opacity-40 line-clamp-1">Vincular instruções permanentes ao núcleo</span>}
                    </div>
                  </div>
                  <ChevronDown size={14} className={cn("text-[#8e918f] transition-transform duration-500", isSystemPromptExpanded && "rotate-180")} />
                </button>
                
                <AnimatePresence>
                  {isSystemPromptExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-1">
                        <Textarea 
                          value={draftSystemPrompt} 
                          onChange={(e) => setDraftSystemPrompt(e.target.value)} 
                          className="bg-black/30 border-white/10 rounded-xl px-4 py-4 text-[12px] h-[100px] custom-scrollbar focus:ring-1 focus:ring-blue-500/30 resize-none font-mono leading-relaxed" 
                          placeholder="Inject custom matrix instructions..."
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}

        {settingsTab === 'agent' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10">
            <div className="flex items-center justify-between">
              <button onClick={() => setSettingsTab('overview')} className="text-[#8e918f] hover:text-white text-[11px] font-black uppercase tracking-widest flex items-center gap-2 group"><ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> VOLTAR</button>
              <h3 className="text-[14px] font-black text-white uppercase tracking-widest text-right">Biosfera de Identidades</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allAgents.map(agent => (
                <div 
                  key={agent.id} 
                  onClick={() => { setDraftActiveAgentId(agent.id); setDraftSystemPrompt(agent.systemPrompt); }} 
                  className={cn(
                    "group relative p-6 rounded-3xl border cursor-pointer transition-all duration-500 overflow-hidden", 
                    draftActiveAgentId === agent.id 
                      ? "bg-gradient-to-br from-purple-500/20 to-blue-500/5 border-purple-500/40 shadow-2xl shadow-purple-500/10" 
                      : "bg-white/[0.02] border-white/5 text-[#8e918f] hover:bg-white/[0.04] hover:border-white/10"
                  )}
                >
                  <div className="flex items-center gap-5">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg", 
                      agent.color,
                      draftActiveAgentId === agent.id ? "scale-105 ring-4 ring-white/10 shadow-purple-500/20" : "opacity-60 scale-95"
                    )}>
                      <AgentIcon iconName={agent.iconName} size={28} className={cn(draftActiveAgentId === agent.id ? "text-white" : "text-white/60")} />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-[14px] font-black uppercase tracking-widest truncate transition-colors", draftActiveAgentId === agent.id ? "text-white" : "text-[#8e918f]")}>{agent.name}</span>
                        {draftActiveAgentId === agent.id && <CheckCircle2 size={12} className="text-purple-400 animate-pulse" />}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-40 mt-0.5">{agent.shortDescription || 'Matriz Especializada'}</span>
                    </div>
                  </div>
                  
                  <div className="mt-5 pt-4 border-t border-white/5 relative">
                    <p className={cn("text-[11px] line-clamp-2 leading-relaxed italic transition-colors", draftActiveAgentId === agent.id ? "text-white/60" : "text-white/20")}>
                      {agent.systemPrompt}
                    </p>
                    <div className="absolute bottom-0 right-0 w-8 h-8 bg-gradient-to-tl from-[#131314] to-transparent" />
                  </div>
                  
                  <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                    {customAgents.some(a => a.id === agent.id) && (
                      <>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setEditingAgent(agent); setAgentForm(agent); setIsAgentFormOpen(true); }}
                          className="p-2 hover:bg-white/10 rounded-xl text-[#8e918f] hover:text-white transition-colors"
                        >
                          <Terminal size={14} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteAgent(agent.id); }}
                          className="p-2 hover:bg-red-400/10 rounded-xl text-[#8e918f] hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                  
                  {draftActiveAgentId === agent.id && (
                    <motion.div 
                      layoutId="active-agent-glow"
                      className="absolute inset-0 border-2 border-purple-500/30 rounded-3xl pointer-events-none"
                    />
                  )}
                </div>
              ))}
              
              <button 
                onClick={() => { setEditingAgent(null); setAgentForm({}); setIsAgentFormOpen(true); }}
                className="p-6 rounded-3xl border-2 border-dashed border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-blue-400/30 transition-all flex flex-col items-center justify-center gap-5 group min-h-[160px]"
              >
                <div className="w-14 h-14 rounded-2xl bg-white/[0.05] border border-white/5 flex items-center justify-center group-hover:bg-blue-400/10 transition-all group-hover:scale-110 shadow-lg group-hover:shadow-blue-400/10">
                  <Plus size={24} className="text-[#8e918f] group-hover:text-blue-400 transition-colors" />
                </div>
                <div className="text-center">
                  <span className="block text-[11px] font-black text-[#8e918f] group-hover:text-blue-400 uppercase tracking-[0.3em] transition-colors">Manifestar Nova Persona</span>
                  <span className="text-[8px] font-bold text-[#8e918f]/40 uppercase tracking-widest mt-1">Configurar Matriz de Comportamento</span>
                </div>
              </button>
            </div>
          </div>
        )}
        
        {settingsTab === 'security' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10">
            <div className="flex items-center justify-between">
              <button onClick={() => setSettingsTab('overview')} className="text-[#8e918f] hover:text-white text-[11px] font-black uppercase tracking-widest flex items-center gap-2"><ArrowLeft size={14} /> VOLTAR</button>
              <h3 className="text-[14px] font-black text-white uppercase tracking-widest">Protocolos de Segurança</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <ShieldCheck size={20} />
                </div>
                <h4 className="text-[13px] font-black text-white uppercase tracking-wider">Storage Local Isolado</h4>
                <p className="text-[12px] text-[#8e918f] leading-relaxed">Suas chaves de API e histórico de conversas são armazenados exclusivamente na memória local do seu navegador (LocalStorage). Nenhum dado é enviado para nossos servidores.</p>
              </div>

              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <Lock size={20} />
                </div>
                <h4 className="text-[13px] font-black text-white uppercase tracking-wider">Criptografia em Trânsito</h4>
                <p className="text-[12px] text-[#8e918f] leading-relaxed">As comunicações com o modelo Gemini utilizam túneis HTTPS protegidos por TLS 1.3, garantindo que o conteúdo dos prompts seja inacessível por terceiros.</p>
              </div>

              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <EyeOff size={20} />
                </div>
                <h4 className="text-[13px] font-black text-white uppercase tracking-wider">Modo Privado Permanente</h4>
                <p className="text-[12px] text-[#8e918f] leading-relaxed">Não utilizamos seus dados para treinamento de modelos de terceiros. Sua privacidade é o pilar central da arquitetura Nexus.</p>
              </div>

              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Activity size={20} />
                </div>
                <h4 className="text-[13px] font-black text-white uppercase tracking-wider">Auditoria de Chamadas</h4>
                <p className="text-[12px] text-[#8e918f] leading-relaxed">Você tem controle total sobre as chamadas de API, podendo monitorar o consumo e alternar entre diferentes chaves instantaneamente.</p>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5 flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-emerald-400/60">
              <CheckCircle2 size={14} />
              SISTEMA STATUS: PROTEGIDO
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export const SettingsDialogs = ({
  isPresetFormOpen, setIsPresetFormOpen, editingPreset, presetForm, setPresetForm, addOrUpdatePreset,
  isAgentFormOpen, setIsAgentFormOpen, editingAgent, agentForm, setAgentForm, addOrUpdateAgent
}: any) => {
  return (
    <>
      <Dialog open={isPresetFormOpen} onOpenChange={setIsPresetFormOpen}>
        <DialogContent className="max-w-md bg-[#1a1b1e] border-[#333538] text-[#f1f3f4] p-6 rounded-2xl shadow-2xl">
          <DialogHeader><DialogTitle className="text-[14px] font-black uppercase tracking-widest">{editingPreset ? 'Ajustar Preset API' : 'Gerar Novo Preset'}</DialogTitle></DialogHeader>
          <div className="space-y-5 pt-4">
             <div className="space-y-2">
               <label className="text-[10px] uppercase font-black tracking-widest text-[#8e918f]">Identificação do Vínculo</label>
               <Input value={presetForm.name || ''} onChange={(e) => setPresetForm({ ...presetForm, name: e.target.value })} placeholder="Ex: Matriz de Produção..." className="bg-black/20 border-[#333538] h-11" />
             </div>
             <div className="space-y-2">
               <label className="text-[10px] uppercase font-black tracking-widest text-[#8e918f]">Gemini API Key</label>
               <Input type="password" value={presetForm.apiKey || ''} onChange={(e) => setPresetForm({ ...presetForm, apiKey: e.target.value })} placeholder="Cole a chave aqui..." className="bg-black/20 border-[#333538] h-11" />
             </div>
             <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <Button variant="ghost" onClick={() => setIsPresetFormOpen(false)} className="text-[#8e918f] hover:text-white uppercase font-black tracking-widest text-[10px]">Abortar</Button>
                <Button onClick={addOrUpdatePreset} className="bg-blue-400 text-[#001d35] font-black uppercase tracking-widest text-[10px] px-6 h-10 shadow-lg shadow-blue-500/20">Confirmar</Button>
             </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAgentFormOpen} onOpenChange={setIsAgentFormOpen}>
        <DialogContent className="max-w-md bg-[#1a1b1e] border-[#333538] text-[#f1f3f4] p-6 rounded-2xl shadow-2xl">
          <DialogHeader><DialogTitle className="uppercase tracking-widest font-black text-[14px]">{editingAgent ? 'Ajustar Core de Identidade' : 'Manifestar Nova Identidade'}</DialogTitle></DialogHeader>
          <div className="space-y-6 pt-6">
             <div className="space-y-2">
               <label className="text-[10px] uppercase font-black tracking-widest text-[#8e918f]">Nomenclatura (ID)</label>
               <Input value={agentForm.name || ''} onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })} placeholder="Ex: Engenheiro de Matriz..." className="bg-black/20 border-[#333538] h-11" />
             </div>
             
             <div className="space-y-2">
               <label className="text-[10px] uppercase font-black tracking-widest text-[#8e918f]">Especialização (Tag)</label>
               <Input value={agentForm.shortDescription || ''} onChange={(e) => setAgentForm({ ...agentForm, shortDescription: e.target.value })} placeholder="Ex: Otimização de Performance..." className="bg-black/20 border-[#333538] h-11" />
             </div>

             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <label className="text-[10px] uppercase font-black tracking-widest text-[#8e918f]">Simbolismo (Ícone)</label>
                 <Select value={agentForm.iconName || 'Brain'} onValueChange={(val: string | null) => val && setAgentForm({ ...agentForm, iconName: val })}>
                   <SelectTrigger className="bg-black/20 border-[#333538] h-11"><SelectValue /></SelectTrigger>
                   <SelectContent className="bg-[#1a1b1e] border-white/10">
                     <SelectItem value="Brain">Brain</SelectItem>
                     <SelectItem value="Code">Code</SelectItem>
                     <SelectItem value="Terminal">Terminal</SelectItem>
                     <SelectItem value="Layout">Layout</SelectItem>
                     <SelectItem value="Shield">Shield</SelectItem>
                     <SelectItem value="Zap">Zap</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] uppercase font-black tracking-widest text-[#8e918f]">Frequência Visual</label>
                 <Select value={agentForm.color || 'bg-purple-500'} onValueChange={(val: string | null) => val && setAgentForm({ ...agentForm, color: val })}>
                   <SelectTrigger className="bg-black/20 border-[#333538] h-11"><SelectValue /></SelectTrigger>
                   <SelectContent className="bg-[#1a1b1e] border-white/10">
                     <SelectItem value="bg-purple-500">Púrpura</SelectItem>
                     <SelectItem value="bg-blue-500">Azul</SelectItem>
                     <SelectItem value="bg-emerald-500">Esmeralda</SelectItem>
                     <SelectItem value="bg-amber-500">Âmbar</SelectItem>
                     <SelectItem value="bg-rose-500">Rosa</SelectItem>
                     <SelectItem value="bg-zinc-500">Zinco</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
             </div>

             <div className="space-y-2">
               <label className="text-[10px] uppercase font-black tracking-widest text-[#8e918f]">Matriz Comportamental</label>
               <Textarea value={agentForm.systemPrompt || ''} onChange={(e) => setAgentForm({ ...agentForm, systemPrompt: e.target.value })} placeholder="Defina as diretrizes fundamentais desta persona..." className="bg-[#0d0d0e] border-[#333538] min-h-[150px] custom-scrollbar focus:ring-1 focus:ring-purple-500/30 text-[12px] leading-relaxed" />
             </div>

             <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <Button variant="ghost" onClick={() => setIsAgentFormOpen(false)} className="text-[#8e918f] hover:text-white uppercase font-black tracking-widest text-[10px]">Abortar</Button>
                <Button onClick={addOrUpdateAgent} className="bg-purple-500 text-white font-black uppercase tracking-widest text-[10px] px-8 h-10 shadow-lg shadow-purple-500/20">Sincronizar</Button>
             </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
