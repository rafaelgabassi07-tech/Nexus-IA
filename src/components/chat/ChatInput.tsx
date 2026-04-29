import React, { useRef } from 'react';
import { 
  Mic, MicOff, Paperclip, Image as ImageIcon,
  Loader2, ArrowUp, User
} from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { 
  Popover, PopoverTrigger, PopoverContent
} from '../ui/popover';
import { cn } from '../../lib/utils';
import { GROUPED_MODELS } from '../../lib/models';
import { AgentDefinition } from '../../types';

interface ChatInputProps {
  inputMessage: string;
  setInputMessage: (val: string) => void;
  attachedFiles: File[];
  setAttachedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  isLoading: boolean;
  handleSendMessage: (e?: React.FormEvent) => Promise<void>;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  isListening: boolean;
  toggleListening: () => void;
  pushToInputHistory: (val: string) => void;
  selectedModel: string;
  setSelectedModel: (val: string) => void;
  allAgents: AgentDefinition[];
  activeAgentId: string;
  setActiveAgentId: (id: string) => void;
}

export const ChatInput = ({
  inputMessage,
  setInputMessage,
  attachedFiles,
  setAttachedFiles,
  isLoading,
  handleSendMessage,
  onKeyDown,
  isListening,
  toggleListening,
  pushToInputHistory,
  selectedModel,
  setSelectedModel,
  allAgents,
  activeAgentId,
  setActiveAgentId,
}: ChatInputProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const validFiles = Array.from(e.target.files).filter(f => f.size <= 10 * 1024 * 1024);
      setAttachedFiles(prev => [...prev, ...validFiles]);
    }
  };

  return (
    <div className="p-1.5 pb-14 md:px-3 md:pb-3 bg-[#020203] shrink-0 border-t border-white/20">
      <div className="max-w-4xl mx-auto flex flex-col">
        <div className="relative bg-white/[0.01] border border-white/30 focus-within:border-[#00d2ff]/40 focus-within:ring-2 focus-within:ring-[#00d2ff]/5 rounded-xl transition-all duration-300 shadow-xl flex flex-col group/input overflow-hidden">
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-1 px-3 pt-2 pb-0.5">
              {attachedFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-1 bg-white/5 text-[8px] font-bold text-white/90 px-1.5 py-0.5 rounded border border-white/20">
                  <span className="truncate max-w-[80px]">{f.name}</span>
                  <button onClick={() => setAttachedFiles(prev => prev.filter((_, idx) => idx !== i))} className="hover:text-white transition-colors">×</button>
                </div>
              ))}
            </div>
          )}
          
          <Textarea 
            value={inputMessage}
            onChange={(e) => {
              setInputMessage(e.target.value);
              pushToInputHistory(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
            onKeyDown={onKeyDown}
            placeholder="Comando Nexus..."
            className={cn("w-full bg-transparent border-none text-[12px] text-white px-3 py-2 min-h-[36px] max-h-[140px] resize-none outline-none leading-relaxed placeholder:text-white/80 focus-visible:ring-0 shadow-none overflow-y-auto custom-scrollbar", attachedFiles.length > 0 && "pt-0.5")}
            rows={1}
          />

          <div className="flex items-center justify-between px-2 pb-1.5 pt-0">
            <div className="flex items-center gap-1">
              <button
                onClick={toggleListening}
                className={cn(
                  "w-6 h-6 rounded-md transition-all flex items-center justify-center",
                  isListening ? "text-red-400 bg-red-400/10 shadow-lg" : "text-white/80 hover:text-[#00d2ff] hover:bg-white/10"
                )}
              >
                {isListening ? <MicOff size={14} /> : <Mic size={14} />}
              </button>

              <input 
                type="file" multiple className="hidden" id="file-upload" ref={fileInputRef}
                onChange={onFileChange}
              />
              <label htmlFor="file-upload" className="w-6 h-6 cursor-pointer text-white/80 hover:text-[#00d2ff] hover:bg-white/10 rounded-md transition-all flex items-center justify-center">
                <Paperclip size={14} />
              </label>

              <button onClick={() => imageInputRef.current?.click()} className="w-6 h-6 text-white/80 hover:text-[#00d2ff] hover:bg-white/10 rounded-md transition-all flex items-center justify-center">
                <ImageIcon size={14} />
              </button>
              <input 
                type="file" accept="image/*" multiple className="hidden" ref={imageInputRef}
                onChange={onFileChange}
              />
            </div>

            <div className="flex items-center gap-2">
              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger className="flex items-center h-7 bg-[#1a1b1e] rounded-md border border-white/30 px-2 hover:border-blue-500/40 transition-all shadow-sm text-[10px] font-medium text-white/70 hover:text-white gap-2">
                  <span className="truncate max-w-[100px]">{allAgents.find(a => a.id === activeAgentId)?.name || 'Persona'} / {Object.values(GROUPED_MODELS).flat().find(m => m.id === selectedModel)?.name || 'Modelo'}</span>
                </PopoverTrigger>
                <PopoverContent 
                  side="top" 
                  align="end" 
                  className="bg-[#141517] border-white/30 text-white rounded-lg shadow-2xl min-w-[220px] max-h-[400px] overflow-y-auto custom-scrollbar p-0"
                >
                  <div className="p-1">
                    {/* Agent/Persona Section */}
                    <div className="text-blue-400/60 text-[9px] uppercase font-bold tracking-wider pt-2 pb-1 px-3 mb-1">Persona (Isa)</div>
                    <div className="grid grid-cols-1 gap-0.5 px-1 mb-2">
                      {allAgents.map(agent => (
                        <button
                          key={agent.id}
                          onClick={() => {
                            setActiveAgentId(agent.id);
                            setIsPopoverOpen(false);
                          }}
                          className={cn(
                            "flex items-center gap-2 p-1.5 rounded-md transition-all text-left w-full",
                            activeAgentId === agent.id ? "bg-blue-500/10 text-white" : "text-white/80 hover:text-white hover:bg-white/5"
                          )}
                        >
                          <div className={cn("w-6 h-6 rounded flex items-center justify-center shrink-0", agent.color)}>
                            <User size={12} className="text-white" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[11px] font-bold truncate leading-none">{agent.name}</span>
                            <span className="text-[8px] opacity-60 truncate leading-tight">{agent.shortDescription}</span>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="h-px bg-white/5 my-1 mx-2" />

                    {/* Model Section */}
                    {Object.entries(GROUPED_MODELS).map(([groupName, models]) => (
                      <div key={groupName}>
                        <div className="text-white/80 text-[9px] uppercase font-black tracking-widest pt-2 pb-1 px-3 mb-1">{groupName}</div>
                        <div className="grid grid-cols-1 gap-0.5 px-1 mb-2">
                          {models.map(m => (
                            <button
                              key={m.id}
                              onClick={() => {
                                setSelectedModel(m.id);
                                setIsPopoverOpen(false);
                              }}
                              className={cn(
                                "flex flex-col p-1.5 rounded-md transition-all text-left w-full",
                                selectedModel === m.id ? "bg-white/10 text-white" : "text-white/80 hover:text-white hover:bg-white/5"
                              )}
                            >
                              <span className="font-medium text-[11px] leading-tight">{m.name}</span>
                              <span className="text-[8px] opacity-60 truncate">Nexus Intelligence Engine</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <Button
                onClick={() => handleSendMessage().catch(err => console.error("Chat Error:", err))}
                disabled={(!inputMessage.trim() && attachedFiles.length === 0) || isLoading}
                size="icon"
                className={cn(
                  "h-7 w-7 rounded-md transition-all flex flex-shrink-0 items-center justify-center",
                  (inputMessage.trim() || attachedFiles.length > 0) && !isLoading 
                    ? "bg-blue-600 hover:bg-blue-500 text-white shadow-sm hover:shadow" 
                    : "bg-white/5 text-white/90"
                )}
              >
                {isLoading ? <Loader2 size={14} className="animate-spin" /> : <ArrowUp size={14} strokeWidth={2.5} />}
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-center gap-4 mt-2">
           <span className="text-[10px] text-white/90">Nexus Web Client</span>
        </div>
      </div>
    </div>
  );
};
