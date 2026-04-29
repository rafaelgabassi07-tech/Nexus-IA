import React, { useRef } from 'react';
import { 
  Mic, MicOff, Paperclip, Image as ImageIcon,
  Loader2, ArrowUp
} from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { 
  Select, SelectTrigger, SelectContent, SelectItem,
  SelectGroup, SelectLabel, SelectValue
} from '../ui/select';
import { cn } from '../../lib/utils';
import { GROUPED_MODELS } from '../../lib/models';

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
}: ChatInputProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const validFiles = Array.from(e.target.files).filter(f => f.size <= 10 * 1024 * 1024);
      setAttachedFiles(prev => [...prev, ...validFiles]);
    }
  };

  return (
    <div className="p-1.5 pb-14 md:px-3 md:pb-3 bg-[#020203] shrink-0 border-t border-white/5">
      <div className="max-w-4xl mx-auto flex flex-col">
        <div className="relative bg-white/[0.01] border border-white/10 focus-within:border-[#00d2ff]/40 focus-within:ring-2 focus-within:ring-[#00d2ff]/5 rounded-xl transition-all duration-300 shadow-xl flex flex-col group/input overflow-hidden">
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-1 px-3 pt-2 pb-0.5">
              {attachedFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-1 bg-white/5 text-[8px] font-bold text-white/30 px-1.5 py-0.5 rounded border border-white/5">
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
            className={cn("w-full bg-transparent border-none text-[12px] text-white px-3 py-2 min-h-[36px] max-h-[140px] resize-none outline-none leading-relaxed placeholder:text-white/40 focus-visible:ring-0 shadow-none overflow-y-auto custom-scrollbar", attachedFiles.length > 0 && "pt-0.5")}
            rows={1}
          />

          <div className="flex items-center justify-between px-2 pb-1.5 pt-0">
            <div className="flex items-center gap-1">
              <button
                onClick={toggleListening}
                className={cn(
                  "w-6 h-6 rounded-md transition-all flex items-center justify-center",
                  isListening ? "text-red-400 bg-red-400/10 shadow-lg" : "text-white/40 hover:text-[#00d2ff] hover:bg-white/10"
                )}
              >
                {isListening ? <MicOff size={14} /> : <Mic size={14} />}
              </button>

              <input 
                type="file" multiple className="hidden" id="file-upload" ref={fileInputRef}
                onChange={onFileChange}
              />
              <label htmlFor="file-upload" className="w-6 h-6 cursor-pointer text-white/40 hover:text-[#00d2ff] hover:bg-white/10 rounded-md transition-all flex items-center justify-center">
                <Paperclip size={14} />
              </label>

              <button onClick={() => imageInputRef.current?.click()} className="w-6 h-6 text-white/40 hover:text-[#00d2ff] hover:bg-white/10 rounded-md transition-all flex items-center justify-center">
                <ImageIcon size={14} />
              </button>
              <input 
                type="file" accept="image/*" multiple className="hidden" ref={imageInputRef}
                onChange={onFileChange}
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center h-6 bg-white/5 rounded border border-white/10 px-1.5 min-w-[100px] hover:border-white/20 transition-colors">
                <Select value={selectedModel} onValueChange={(val) => val && setSelectedModel(val)}>
                  <SelectTrigger className="border-none bg-transparent h-full text-[9px] font-black uppercase tracking-tight text-white/60 hover:text-[#00d2ff] focus:ring-0 px-2 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0b0c0e] border-white/10 text-white rounded-lg shadow-2xl">
                    {Object.entries(GROUPED_MODELS).map(([groupName, models]) => (
                      <SelectGroup key={groupName}>
                        <SelectLabel className="text-white/20 text-[8px] uppercase font-black tracking-widest pt-2 pb-0.5 px-2 italic">{groupName}</SelectLabel>
                        {models.map(m => (
                          <SelectItem key={m.id} value={m.id} className="rounded-md m-0.5 py-1">
                            <span className="font-bold text-[10px]">{m.name}</span>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={() => handleSendMessage().catch(err => console.error("Chat Error:", err))}
                disabled={(!inputMessage.trim() && attachedFiles.length === 0) || isLoading}
                size="icon"
                className={cn(
                  "h-7 w-7 rounded-lg transition-all flex flex-shrink-0 items-center justify-center",
                  (inputMessage.trim() || attachedFiles.length > 0) && !isLoading 
                    ? "bg-[#00d2ff] text-black shadow-[0_0_15px_rgba(0,210,255,0.3)]" 
                    : "bg-white/5 text-white/30"
                )}
              >
                {isLoading ? <Loader2 size={14} className="animate-spin" /> : <ArrowUp size={14} strokeWidth={3} />}
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-center gap-4 mt-1.5">
           <span className="text-[7px] font-bold text-white/20 uppercase tracking-[0.4em] italic">nexus link v3.1</span>
        </div>
      </div>
    </div>
  );
};
