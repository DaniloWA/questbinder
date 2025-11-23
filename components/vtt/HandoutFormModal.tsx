
import React, { useState, useEffect, useRef } from 'react';
import { Handout, HandoutType, HandoutTheme } from '../../types';
import { Button } from '../ui/Button';
import { SheetInput, SheetLabel, SheetTextArea, SheetSelect } from '../ui/SheetPrimitives';
import { FileText, Image, Youtube, Eye, EyeOff, LayoutTemplate, Sparkles, ScrollText, Terminal, Ghost, Monitor, UploadCloud, Loader2 } from 'lucide-react';
import { MarkdownToolbar } from '../ui/MarkdownToolbar';
import { HANDOUT_TEMPLATES } from '../../data/handoutTemplates';
import { fileService } from '../../services/fileService';
import { useNotification } from '../../context/NotificationContext';

interface HandoutFormModalProps {
  handout?: Handout | null;
  onSave: (data: Omit<Handout, 'id' | 'createdAt' | 'campaignId' | 'sharedWith'>) => void;
  onClose: () => void;
}

// Simple markdown parser for preview
const markdownToHtml = (text: string) => {
  if (!text) return '';
  return text
    .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold font-fantasy mb-2">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold font-fantasy mb-3">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold font-fantasy mb-4 border-b border-current pb-2">$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/~~(.*?)~~/gim, '<del>$1</del>')
    .replace(/`(.*?)`/gim, '<code class="bg-black/20 px-1 rounded text-sm">$1</code>')
    .replace(/^\> (.*$)/gim, '<blockquote class="border-l-4 border-current pl-4 italic my-2 opacity-80">$1</blockquote>')
    .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer" class="underline">$1</a>')
    .replace(/^\s*[\-\*] (.*)/gm, '<ul class="list-disc list-inside my-1 pl-2"><li>$1</li></ul>')
    .replace(/^\s*\d+\. (.*)/gm, '<ol class="list-decimal list-inside my-1 pl-2"><li>$1</li></ol>')
    .replace(/\n/gim, '<br />');
};

const THEME_STYLES: Record<HandoutTheme, string> = {
    standard: 'bg-zinc-900 text-zinc-200 font-sans border-zinc-800',
    parchment: 'bg-[#f4e4bc] text-[#4a3b22] font-serif border-[#d4c49c] shadow-[inset_0_0_40px_rgba(0,0,0,0.1)]',
    terminal: 'bg-black text-green-500 font-mono border-green-900',
    arcane: 'bg-[#1a0b2e] text-purple-200 font-fantasy border-purple-900 shadow-[0_0_15px_rgba(168,85,247,0.2)]',
};

const PreviewPanel: React.FC<{ type: HandoutType; content: string; theme: HandoutTheme }> = ({ type, content, theme }) => {
    const themeClass = THEME_STYLES[theme] || THEME_STYLES.standard;
    let previewContent: React.ReactNode;

    switch (type) {
        case 'text':
            // Note: We remove prose-invert for parchment as it needs dark text
            const proseClass = theme === 'parchment' ? 'prose-zinc' : 'prose-invert';
            previewContent = <div className={`prose ${proseClass} prose-sm max-w-none leading-relaxed p-6`} dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }} />;
            break;
        case 'image':
            previewContent = content ? <img src={content} alt="Preview" className="max-w-full max-h-full object-contain rounded-md shadow-lg" onError={(e) => e.currentTarget.style.display = 'none'} /> : <div className="text-current opacity-50 italic">URL da imagem inválida ou vazia.</div>;
            break;
        case 'video_link':
            const videoId = content.split('v=')[1]?.split('&')[0] || content.split('youtu.be/')[1]?.split('?')[0];
            previewContent = videoId ? <div className="aspect-video w-full shadow-lg"><iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${videoId}`} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="rounded-lg bg-black"></iframe></div> : <div className="text-current opacity-50 italic">URL do YouTube inválida ou vazia.</div>;
            break;
        default:
            previewContent = null;
    }

    return (
        <div className={`h-full w-full rounded-lg border flex items-center justify-center overflow-auto custom-scrollbar relative ${themeClass}`}>
            <div className="absolute top-2 right-2 text-[10px] font-bold uppercase tracking-widest pointer-events-none opacity-30">Preview: {theme}</div>
            {previewContent}
        </div>
    );
};

export const HandoutFormModal: React.FC<HandoutFormModalProps> = ({ handout, onSave, onClose }) => {
  const { show } = useNotification();
  const [name, setName] = useState('');
  const [type, setType] = useState<HandoutType>('text');
  const [theme, setTheme] = useState<HandoutTheme>('standard');
  const [content, setContent] = useState('');
  const [showPreview, setShowPreview] = useState(true);
  const [step, setStep] = useState<'template' | 'edit'>(!handout ? 'template' : 'edit');
  const [isUploading, setIsUploading] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (handout) {
      setName(handout.name);
      setType(handout.type);
      setContent(handout.content);
      setTheme(handout.theme || 'standard');
      setStep('edit');
    }
  }, [handout]);

  const handleSave = () => {
    if (name.trim() && (type !== 'text' || content.trim())) {
      onSave({ name, type, content, theme });
    }
  };

  const applyTemplate = (tplId: string) => {
      const tpl = HANDOUT_TEMPLATES.find(t => t.id === tplId);
      if (tpl) {
          setName(tpl.label === 'Em Branco' ? '' : tpl.label);
          setType(tpl.type);
          setTheme(tpl.theme);
          setContent(tpl.content);
          setStep('edit');
      }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      const response = await fileService.upload(file);
      setIsUploading(false);

      if (response.success && response.data) {
          setContent(response.data);
      } else {
          show({ type: 'error', message: response.message || 'Erro no upload.' });
      }
  };

  if (step === 'template') {
      return (
          <div className="flex flex-col h-[70vh] max-h-[800px]">
              <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold font-fantasy text-white">Escolha um Modelo</h2>
                  <p className="text-zinc-400 text-sm">Comece com uma estrutura pronta ou uma página em branco.</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto p-2">
                  {HANDOUT_TEMPLATES.map(tpl => (
                      <button 
                        key={tpl.id}
                        onClick={() => applyTemplate(tpl.id)}
                        className="flex flex-col items-center text-center p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:bg-zinc-800 hover:border-primary/50 transition-all group"
                      >
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${tpl.theme === 'parchment' ? 'bg-[#f4e4bc] text-[#4a3b22]' : tpl.theme === 'terminal' ? 'bg-black text-green-500 border border-green-900' : tpl.theme === 'arcane' ? 'bg-purple-900 text-purple-200' : 'bg-zinc-800 text-white'}`}>
                              {tpl.type === 'image' ? <Image className="w-6 h-6"/> : tpl.theme === 'parchment' ? <ScrollText className="w-6 h-6"/> : tpl.theme === 'terminal' ? <Terminal className="w-6 h-6"/> : tpl.theme === 'arcane' ? <Sparkles className="w-6 h-6"/> : <FileText className="w-6 h-6"/>}
                          </div>
                          <h3 className="font-bold text-white text-sm mb-1 group-hover:text-primary">{tpl.label}</h3>
                          <p className="text-xs text-zinc-500">{tpl.description}</p>
                      </button>
                  ))}
              </div>
              <div className="mt-auto pt-4 border-t border-zinc-800 flex justify-center">
                  <Button variant="ghost" onClick={onClose}>Cancelar</Button>
              </div>
          </div>
      )
  }

  return (
    <div className="flex flex-col h-[85vh] max-h-[900px]">
        
        {/* Header: Configs */}
        <div className="flex flex-col gap-4 mb-4 shrink-0 bg-zinc-900/30 p-3 rounded-lg border border-zinc-800/50">
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <SheetInput
                        label="Título"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Carta do Rei..."
                        variant="box"
                        className="bg-zinc-950 border-zinc-700 font-bold text-lg"
                    />
                </div>
                <div className="w-full md:w-48">
                    <SheetLabel>Tema</SheetLabel>
                    <div className="relative">
                        <select 
                            value={theme} 
                            onChange={(e) => setTheme(e.target.value as HandoutTheme)}
                            className="w-full h-10 bg-zinc-950 border border-zinc-700 rounded-md px-3 text-sm text-white outline-none focus:border-primary appearance-none cursor-pointer"
                        >
                            <option value="standard">Padrão (Dark)</option>
                            <option value="parchment">Pergaminho</option>
                            <option value="terminal">Terminal</option>
                            <option value="arcane">Arcano</option>
                        </select>
                        <LayoutTemplate className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-700">
                    <button type="button" onClick={() => setType('text')} className={`px-3 py-1.5 text-xs font-bold rounded flex items-center gap-2 transition-all ${type === 'text' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}><FileText className="w-3.5 h-3.5" /> Texto</button>
                    <button type="button" onClick={() => setType('image')} className={`px-3 py-1.5 text-xs font-bold rounded flex items-center gap-2 transition-all ${type === 'image' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}><Image className="w-3.5 h-3.5" /> Imagem</button>
                    <button type="button" onClick={() => setType('video_link')} className={`px-3 py-1.5 text-xs font-bold rounded flex items-center gap-2 transition-all ${type === 'video_link' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}><Youtube className="w-3.5 h-3.5" /> Vídeo</button>
                </div>
                <div className="h-6 w-px bg-zinc-800 mx-2"></div>
                <button 
                    onClick={() => setShowPreview(!showPreview)} 
                    className={`text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors ${showPreview ? 'text-primary border-primary/30 bg-primary/10' : 'text-zinc-500 border-zinc-700 bg-zinc-950'}`}
                >
                    {showPreview ? <><Eye className="w-3.5 h-3.5"/> Preview</> : <><EyeOff className="w-3.5 h-3.5"/> Preview</>}
                </button>
            </div>
        </div>

        {/* Main Content: Split View */}
        <div className="flex-1 flex gap-4 min-h-0 relative">
            
            {/* Editor Area */}
            <div className={`flex flex-col transition-all duration-300 ease-in-out ${showPreview ? 'w-1/2' : 'w-full'}`}>
                <div className="flex-1 flex flex-col bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden shadow-inner focus-within:border-primary/50 transition-colors relative">
                    {type === 'text' ? (
                        <>
                            <MarkdownToolbar textareaRef={textareaRef} value={content} onChange={setContent} />
                            <SheetTextArea
                                ref={textareaRef}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Escreva aqui usando Markdown..."
                                className="flex-1 w-full h-full p-4 bg-transparent border-0 focus:ring-0 resize-none text-sm md:text-base font-mono leading-relaxed text-zinc-300 placeholder:text-zinc-700"
                            />
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-zinc-900/30">
                             <div className="w-full max-w-lg space-y-4">
                                <div className="text-center text-zinc-500 mb-4">
                                    {type === 'image' ? <Image className="w-12 h-12 mx-auto mb-2 opacity-20"/> : <Youtube className="w-12 h-12 mx-auto mb-2 opacity-20"/>}
                                    <p className="text-sm">Insira a URL ou faça upload.</p>
                                </div>
                                <div className="flex gap-2">
                                    <SheetInput
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        placeholder={type === 'image' ? "https://..." : "https://youtube.com/..."}
                                        variant="box"
                                        className="bg-zinc-950 border-zinc-700 h-12 text-lg flex-1"
                                        autoFocus
                                    />
                                    {type === 'image' && (
                                        <>
                                            <input 
                                                type="file" 
                                                ref={fileInputRef} 
                                                className="hidden" 
                                                accept="image/*" 
                                                onChange={handleFileUpload} 
                                            />
                                            <Button 
                                                onClick={() => fileInputRef.current?.click()} 
                                                variant="outline" 
                                                className="h-12 w-12"
                                                disabled={isUploading}
                                            >
                                                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
                                            </Button>
                                        </>
                                    )}
                                </div>
                             </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Preview Area (Conditional) */}
            {showPreview && (
                <div className="w-1/2 flex flex-col pl-2 transition-all duration-300">
                    <div className="flex-1 min-h-0 rounded-lg overflow-hidden shadow-2xl">
                        <PreviewPanel type={type} content={content} theme={theme} />
                    </div>
                </div>
            )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between gap-3 pt-4 border-t border-zinc-800 mt-4 shrink-0">
            <Button variant="ghost" onClick={() => setStep('template')}>
                <LayoutTemplate className="w-4 h-4 mr-2" /> Mudar Modelo
            </Button>
            <div className="flex gap-3">
                <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave} disabled={!name.trim() || isUploading} className="min-w-[120px]">
                    {handout ? 'Salvar Alterações' : 'Criar Recurso'}
                </Button>
            </div>
        </div>
    </div>
  );
};
