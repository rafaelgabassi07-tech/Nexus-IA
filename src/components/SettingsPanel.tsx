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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectLabel, SelectGroup } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { AgentIcon } from './AgentIcon';
import { cn } from '../lib/utils';
import { APIPreset, AgentDefinition } from '../types';
import { GROUPED_MODELS } from '../lib/models';

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
    <div className="flex-1 overflow-y-auto custom-scrollbar p-5 md:p-8">
      <div className="max-w-3xl mx-auto space-y-10">
        {settingsTab === 'overview' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            <header className="space-y-1">
              <h2 className="text-[24px] font-black text-white uppercase tracking-tighter">Central Nexus</h2>
              <p className="text-[#8e918f] text-[12px] uppercase font-bold tracking-[0.2em]">Orquestração de Inteligência e Protocolos</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button onClick={() => setSettingsTab('general')} className="group flex flex-col items-center justify-center p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-blue-400/5 hover:border-blue-400/20 transition-all duration-300 gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform"><Activity size={20} /></div>
                <div className="text-center">
                  <span className="block text-[12px] font-black text-white uppercase tracking-widest">Geral</span>
                  <span className="text-[9px] text-[#8e918f] uppercase font-bold tracking-tighter">Modelos & API</span>
                </div>
              </button>

              <button onClick={() => setSettingsTab('agent')} className="group flex flex-col items-center justify-center p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-purple-400/5 hover:border-purple-400/20 transition-all duration-300 gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform"><Terminal size={20} /></div>
                <div className="text-center">
                  <span className="block text-[12px] font-black text-white uppercase tracking-widest">Identidade</span>
                  <span className="text-[9px] text-[#8e918f] uppercase font-bold tracking-tighter">Personas & Core</span>
                </div>
              </button>

              <button onClick={() => setSettingsTab('security')} className="group flex flex-col items-center justify-center p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-emerald-400/5 hover:border-emerald-400/20 transition-all duration-300 gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform"><Shield size={20} /></div>
                <div className="text-center">
                  <span className="block text-[12px] font-black text-white uppercase tracking-widest">Segurança</span>
                  <span className="text-[9px] text-[#8e918f] uppercase font-bold tracking-tighter">Protocolos & Logs</span>
                </div>
              </button>
            </div>
            
            <div className="bg-gradient-to-r from-blue-500/10 to-transparent p-1 rounded-2xl">
              <div className="bg-background rounded-[14px] p-6 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
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
              <h3 className="text-[14px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Activity size={16} className="text-blue-400" />
                Matriz de Interface
              </h3>
            </div>

            <div className="space-y-8">
              {/* API KEY SECTION */}
              <div className="space-y-6 bg-white/[0.02] border border-white/5 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                  <Key size={80} />
                </div>
                
                <div className="space-y-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black text-white/80 uppercase tracking-widest flex items-center gap-2">
                      <Lock size={12} className="text-blue-400" />
                      Protocolo de Autenticação
                    </label>
                    <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-tighter bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">Encriptado (AES-256)</span>
                  </div>
                  
                  <div className="relative group">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8e918f] group-focus-within:text-blue-400 transition-all duration-300" size={16} />
                    <Input 
                      type="password" 
                      value={draftApiKey} 
                      onChange={(e) => setDraftApiKey(e.target.value)} 
                      className="bg-black/40 border-white/10 focus:border-blue-500/50 rounded-2xl pl-11 pr-4 text-[13px] h-12 transition-all font-mono" 
                      placeholder="Nexus Key (Gemini API)..." 
                    />
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black text-[#8e918f] uppercase tracking-widest">Cofre de Presets ({apiPresets.length}/5)</h4>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        disabled={apiPresets.length >= 5}
                        onClick={() => { setEditingPreset(null); setPresetForm({}); setIsPresetFormOpen(true); }}
                        className="h-7 text-[9px] px-3 uppercase tracking-widest font-black text-blue-400 hover:bg-blue-400/10 transition-all"
                      >
                        Vincular Nova ID
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {apiPresets.map(preset => (
                        <div 
                          key={preset.id} 
                          onClick={() => setDraftApiKey(preset.apiKey)}
                          className={cn(
                            "group relative flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all cursor-pointer overflow-hidden",
                            draftApiKey === preset.apiKey 
                              ? "bg-blue-400/10 border-blue-400/40 text-white shadow-lg shadow-blue-500/5" 
                              : "bg-white/[0.01] border-white/5 text-[#8e918f] hover:bg-white/[0.03] hover:border-white/10"
                          )}
                        >
                          <div className={cn(
                            "w-2 h-2 rounded-full transition-all shrink-0",
                            draftApiKey === preset.apiKey ? "bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" : "bg-white/10"
                          )} />
                          <span className="text-[12px] font-bold truncate flex-1">{preset.name}</span>
                          
                          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={(e) => { e.stopPropagation(); deletePreset(preset.id, e); }}
                              className="p-1.5 text-muted-foreground hover:text-red-400 transition-colors"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                      {apiPresets.length === 0 && (
                        <div className="col-span-full py-6 border border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center gap-2 bg-white/[0.01] opacity-40">
                          <EyeOff size={20} className="text-[#8e918f]" />
                          <p className="text-[10px] font-black uppercase tracking-widest">Nenhum preset detectado</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* MODEL & TEMP SECTION */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4">
                  <label className="text-[11px] font-black text-white/80 uppercase tracking-widest flex items-center gap-2">
                    <Terminal size={14} className="text-purple-400" />
                    Núcleo Cognitivo
                  </label>
                  <Select value={draftSelectedModel} onValueChange={(val) => val && setDraftSelectedModel(val)}>
                    <SelectTrigger className="bg-black/40 border-white/10 text-white rounded-2xl h-12 focus:ring-1 focus:ring-purple-500/30 transition-all">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border text-popover-foreground rounded-xl">
                      <SelectGroup>
                        <SelectLabel className="text-[#a8c7fa] text-[10px] uppercase font-black tracking-widest p-3 border-b border-white/5 mb-1">Google Gemini Engine</SelectLabel>
                        {GROUPED_MODELS['Google Gemini']?.map(m => (
                          <SelectItem key={m.id} value={m.id} className="py-2.5 rounded-lg focus:bg-blue-500/10">
                            <div className="flex flex-col">
                              <span className="font-bold">{m.name}</span>
                              <span className="text-[10px] opacity-40">1.048.576 tokens</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-black text-white/80 uppercase tracking-widest flex items-center gap-2">
                      <Activity size={14} className="text-emerald-400" />
                      Frequência de Saída
                    </label>
                    <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-lg border border-emerald-400/20">{draftTemperature.toFixed(2)}</span>
                  </div>
                  <div className="pt-4 px-2">
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.01" 
                      value={draftTemperature} 
                      onChange={e => setDraftTemperature(parseFloat(e.target.value))} 
                      className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-emerald-400" 
                    />
                    <div className="flex justify-between text-[8px] font-black text-[#8e918f] uppercase tracking-widest mt-4">
                      <span>Lógica Estrita</span>
                      <span>Explosão Criativa</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SYSTEM PROMPT CARD */}
              <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden transition-all">
                <button 
                  onClick={() => setIsSystemPromptExpanded(!isSystemPromptExpanded)}
                  className="w-full flex items-center justify-between p-6 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                      <ShieldCheck size={18} />
                    </div>
                    <div className="text-left">
                      <label className="text-[12px] font-black text-white uppercase tracking-widest block">Matriz Comportamental</label>
                      <span className="text-[10px] font-bold text-[#8e918f] uppercase opacity-60">Diretrizes permanentes do núcleo</span>
                    </div>
                  </div>
                  <ChevronDown size={18} className={cn("text-[#8e918f] transition-transform duration-500", isSystemPromptExpanded && "rotate-180")} />
                </button>
                
                <AnimatePresence>
                  {isSystemPromptExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                    >
                      <div className="p-6 pt-0">
                        <Textarea 
                          value={draftSystemPrompt} 
                          onChange={(e) => setDraftSystemPrompt(e.target.value)} 
                          className="bg-black/30 border-white/10 rounded-2xl px-5 py-5 text-[13px] h-[180px] custom-scrollbar focus:ring-1 focus:ring-blue-500/30 resize-none font-mono leading-relaxed text-blue-100/80" 
                          placeholder="Inject system level directives..."
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ACTION FOOTER */}
              <div className="pt-6 border-t border-white/5 flex justify-end">
                <Button 
                  onClick={() => { saveSettings(); setSettingsTab('overview'); }}
                  className="bg-blue-400 hover:bg-blue-500 text-[#001d35] font-black uppercase tracking-[0.2em] px-10 h-14 rounded-2xl shadow-2xl shadow-blue-400/20 transform transition-all active:scale-95"
                >
                  Sincronizar Protocolos
                </Button>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {allAgents.map(agent => (
                <div 
                  key={agent.id} 
                  onClick={() => { setDraftActiveAgentId(agent.id); setDraftSystemPrompt(agent.systemPrompt); }} 
                  className={cn(
                    "group relative p-4 rounded-2xl border cursor-pointer transition-all duration-500 overflow-hidden", 
                    draftActiveAgentId === agent.id 
                      ? "bg-gradient-to-br from-purple-500/20 to-blue-500/5 border-purple-500/40 shadow-xl shadow-purple-500/10" 
                      : "bg-white/[0.01] border-white/5 text-[#8e918f] hover:bg-white/[0.03] hover:border-white/10"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-500 shadow-lg", 
                      agent.color,
                      draftActiveAgentId === agent.id ? "scale-105 ring-2 ring-white/10" : "opacity-50 scale-95"
                    )}>
                      <AgentIcon iconName={agent.iconName} size={22} className={cn(draftActiveAgentId === agent.id ? "text-white" : "text-white/60")} />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-[12px] font-black uppercase tracking-widest truncate transition-colors", draftActiveAgentId === agent.id ? "text-white" : "text-[#8e918f]")}>{agent.name}</span>
                        {draftActiveAgentId === agent.id && <CheckCircle2 size={10} className="text-purple-400" />}
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest opacity-40">{agent.shortDescription || 'Persona Matrix'}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-white/5 relative">
                    <p className={cn("text-[10px] line-clamp-2 leading-relaxed italic transition-colors", draftActiveAgentId === agent.id ? "text-white/50" : "text-white/20")}>
                      {agent.systemPrompt}
                    </p>
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
        <DialogContent className="max-w-md bg-zinc-950 border-white/10 text-white p-0 rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-blue-500/10 p-6 border-b border-white/5">
            <DialogHeader>
              <DialogTitle className="text-[16px] font-black uppercase tracking-[0.2em] flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center">
                  <Key size={16} />
                </div>
                {editingPreset ? 'Calibrar Protocolo' : 'Manifestar Novo Preset'}
              </DialogTitle>
            </DialogHeader>
          </div>
          
          <div className="p-8 space-y-6">
             <div className="space-y-3">
               <label className="text-[10px] uppercase font-black tracking-[0.3em] text-[#8e918f] ml-1">Assinatura do Vínculo</label>
               <Input 
                 value={presetForm.name || ''} 
                 onChange={(e) => setPresetForm({ ...presetForm, name: e.target.value })} 
                 placeholder="Ex: Matriz de Emergência..." 
                 className="bg-white/[0.03] border-white/10 h-12 rounded-xl focus:border-blue-400/50 transition-all font-bold px-4" 
               />
             </div>
             
             <div className="space-y-3">
               <label className="text-[10px] uppercase font-black tracking-[0.3em] text-[#8e918f] ml-1">Nexus Core Key</label>
               <div className="relative">
                 <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                 <Input 
                   type="password" 
                   value={presetForm.apiKey || ''} 
                   onChange={(e) => setPresetForm({ ...presetForm, apiKey: e.target.value })} 
                   placeholder="Insira a chave Gemini..." 
                   className="bg-white/[0.03] border-white/10 h-12 rounded-xl pl-11 focus:border-blue-400/50 transition-all font-mono" 
                 />
               </div>
             </div>
             
             <div className="pt-4 flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  onClick={() => setIsPresetFormOpen(false)} 
                  className="flex-1 h-12 hover:bg-white/[0.05] text-[#8e918f] hover:text-white uppercase font-black tracking-[0.2em] text-[10px] rounded-xl"
                >
                  Abortar
                </Button>
                <Button 
                  onClick={addOrUpdatePreset} 
                  className="flex-[2] h-12 bg-blue-400 hover:bg-blue-500 text-[#001d35] font-black uppercase tracking-[0.2em] text-[10px] rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                >
                  {editingPreset ? 'Atualizar Core' : 'Protocolar Chave'}
                </Button>
             </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAgentFormOpen} onOpenChange={setIsAgentFormOpen}>
        <DialogContent className="max-w-md bg-popover border-border text-popover-foreground p-6 rounded-2xl shadow-2xl">
          <DialogHeader><DialogTitle className="uppercase tracking-widest font-black text-[14px]">{editingAgent ? 'Ajustar Core de Identidade' : 'Manifestar Nova Identidade'}</DialogTitle></DialogHeader>
          <div className="space-y-6 pt-6">
             <div className="space-y-2">
               <label className="text-[10px] uppercase font-black tracking-widest text-[#8e918f]">Nomenclatura (ID)</label>
               <Input value={agentForm.name || ''} onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })} placeholder="Ex: Engenheiro de Matriz..." className="bg-black/20 border-border h-11" />
             </div>
             
             <div className="space-y-2">
               <label className="text-[10px] uppercase font-black tracking-widest text-[#8e918f]">Especialização (Tag)</label>
               <Input value={agentForm.shortDescription || ''} onChange={(e) => setAgentForm({ ...agentForm, shortDescription: e.target.value })} placeholder="Ex: Otimização de Performance..." className="bg-black/20 border-border h-11" />
             </div>

             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <label className="text-[10px] uppercase font-black tracking-widest text-[#8e918f]">Simbolismo (Ícone)</label>
                 <Select value={agentForm.iconName || 'Brain'} onValueChange={(val: string | null) => val && setAgentForm({ ...agentForm, iconName: val })}>
                   <SelectTrigger className="bg-black/20 border-border h-11"><SelectValue /></SelectTrigger>
                   <SelectContent className="bg-popover border-border">
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
                   <SelectTrigger className="bg-black/20 border-border h-11"><SelectValue /></SelectTrigger>
                   <SelectContent className="bg-popover border-border">
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
               <Textarea value={agentForm.systemPrompt || ''} onChange={(e) => setAgentForm({ ...agentForm, systemPrompt: e.target.value })} placeholder="Defina as diretrizes fundamentais desta persona..." className="bg-muted/10 border-border min-h-[150px] custom-scrollbar focus:ring-1 focus:ring-purple-500/30 text-[12px] leading-relaxed" />
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
