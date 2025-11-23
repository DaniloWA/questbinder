
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useGameSession } from '../../context/GameSessionContext';
import { useAuth } from '../../context/AuthContext';
import { ChatMessage, ChatLinkMetadata } from '../../types';
import { Send, Dices, MapPin, User, Sword, Zap, Backpack, ThumbsUp, ThumbsDown, ChevronDown, MessageSquare, ExternalLink, Maximize2, Minimize2, X, Move, GripHorizontal, ArrowRightToLine, MonitorPlay, EyeOff, Hash } from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';

// --- RICH LINK CARD COMPONENT (Unchanged logic, kept for completeness) ---
const RichLinkCard: React.FC<{ link: ChatLinkMetadata; onClick: () => void }> = ({ link, onClick }) => {
    // ... (RichLinkCard content unchanged)
    const [isExpanded, setIsExpanded] = useState(false);
    const { type, data, label } = link;
    
    if (!data) return null;

    const config = {
        attack: { color: 'border-red-500/30 bg-red-950/20', icon: <Sword className="w-3 h-3 text-red-400" />, accent: 'text-red-400', headerBg: 'bg-red-500/10' },
        spell: { color: 'border-purple-500/30 bg-purple-950/20', icon: <Zap className="w-3 h-3 text-purple-400" />, accent: 'text-purple-400', headerBg: 'bg-purple-500/10' },
        item: { color: 'border-amber-500/30 bg-amber-950/20', icon: <Backpack className="w-3 h-3 text-amber-400" />, accent: 'text-amber-400', headerBg: 'bg-amber-500/10' },
        feature: { color: 'border-emerald-500/30 bg-emerald-950/20', icon: <User className="w-3 h-3 text-emerald-400" />, accent: 'text-emerald-400', headerBg: 'bg-emerald-500/10' },
        token: { color: '', icon: null, accent: '', headerBg: '' },
        position: { color: '', icon: null, accent: '', headerBg: '' }
    }[type] || { color: 'border-zinc-700 bg-zinc-800', icon: null, accent: 'text-zinc-400', headerBg: '' };

    const renderDetails = () => {
        switch (type) {
            case 'attack':
                return (
                    <div className="flex gap-2 mb-2">
                        <div className="bg-black/30 rounded px-2 py-1 text-[10px] border border-white/5 shrink-0">
                            <span className="text-zinc-500 block text-[9px] uppercase">Acerto</span>
                            <span className={`font-bold ${config.accent}`}>{data.atkBonus}</span>
                        </div>
                        <div className="bg-black/30 rounded px-2 py-1 text-[10px] border border-white/5 shrink-0">
                            <span className="text-zinc-500 block text-[9px] uppercase">Dano</span>
                            <span className="font-bold text-zinc-200">{data.damage}</span>
                        </div>
                        <div className="bg-black/30 rounded px-2 py-1 text-[10px] border border-white/5 flex-1 min-w-0">
                            <span className="text-zinc-500 block text-[9px] uppercase">Tipo</span>
                            <span className="font-bold text-zinc-200 truncate block">{data.type}</span>
                        </div>
                    </div>
                );
            case 'spell': return <div className="flex gap-2 mb-2"><div className="bg-black/30 rounded px-2 py-1 text-[10px] border border-white/5 shrink-0"><span className="text-zinc-500 block text-[9px] uppercase">Nível</span><span className={`font-bold ${config.accent}`}>{data.level === 0 ? 'Truque' : data.level}</span></div><div className="bg-black/30 rounded px-2 py-1 text-[10px] border border-white/5 flex-1 min-w-0"><span className="text-zinc-500 block text-[9px] uppercase">Escola</span><span className="font-bold text-zinc-200 truncate block">{data.school}</span></div></div>;
            case 'item': return <div className="flex gap-2 mb-2"><div className="bg-black/30 rounded px-2 py-1 text-[10px] border border-white/5 shrink-0"><span className="text-zinc-500 block text-[9px] uppercase">Qtd</span><span className={`font-bold ${config.accent}`}>{data.qty}</span></div>{data.weight && (<div className="bg-black/30 rounded px-2 py-1 text-[10px] border border-white/5 shrink-0"><span className="text-zinc-500 block text-[9px] uppercase">Peso</span><span className="font-bold text-zinc-200">{data.weight}</span></div>)}</div>;
            case 'feature': return <div className="flex gap-2 mb-2"><div className="bg-black/30 rounded px-2 py-1 text-[10px] border border-white/5 flex-1 min-w-0"><span className="text-zinc-500 block text-[9px] uppercase">Origem</span><span className={`font-bold ${config.accent}`}>{data.source === 'class' ? 'Classe' : data.source === 'race' ? 'Raça' : 'Outro'}</span></div></div>;
            default: return null;
        }
    };

    return (
        <div className={`mt-2 rounded-lg border overflow-hidden text-left transition-all shadow-sm w-full max-w-full ${config.color}`}>
            <div className={`px-2 py-1.5 flex items-center justify-between cursor-pointer ${config.headerBg} border-b border-white/5`} onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex items-center gap-2 font-bold text-xs text-zinc-200 truncate">{config.icon}<span className="truncate">{label}</span></div>
                <div className={`text-zinc-500 transition-transform duration-200 shrink-0 ${isExpanded ? 'rotate-180' : ''}`}><ChevronDown className="w-3 h-3" /></div>
            </div>
            <div className="p-2">
                {renderDetails()}
                {data.description && (<div className={`text-[10px] text-zinc-400 leading-relaxed cursor-pointer break-words ${isExpanded ? '' : 'line-clamp-2 hover:text-zinc-300'}`} onClick={() => setIsExpanded(!isExpanded)}>{data.description}</div>)}
                <div className="mt-2 pt-2 border-t border-white/5 flex justify-end">
                     <button onClick={(e) => { e.stopPropagation(); onClick(); }} className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider hover:underline ${config.accent}`}>{type === 'attack' ? 'Rolar Ataque' : 'Ver Detalhes'} <ExternalLink className="w-2.5 h-2.5" /></button>
                </div>
            </div>
        </div>
    );
}

export type ChatViewMode = 'sidebar' | 'floating' | 'fullscreen';

interface ChatPanelProps {
    onModeChange?: (mode: ChatViewMode) => void; 
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ onModeChange }) => {
  const { chatMessages, sendChatMessage, toggleChatReaction, handleChatLinkClick, campaignCharacters, isGM } = useGameSession();
  const { user } = useAuth();
  
  const [inputText, setInputText] = useState('');
  const [speakingAs, setSpeakingAs] = useState<'player' | string>('player');
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);
  const [viewMode, setViewMode] = useState<ChatViewMode>('sidebar');
  
  // Floating Window State
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [size, setSize] = useState({ w: 400, h: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const resizeStartRef = useRef({ x: 0, y: 0, w: 0, h: 0 });

  const myCharacter = campaignCharacters.find(c => c.ownerId === user?.id);

  // Sync mode with parent
  useEffect(() => {
      if (onModeChange) onModeChange(viewMode);
  }, [viewMode, onModeChange]);

  // Initial Position for floating
  useEffect(() => {
      if (viewMode === 'floating' && position.x === 100) {
          // Center initially
          setPosition({ x: window.innerWidth / 2 - 200, y: window.innerHeight / 2 - 300 });
      }
  }, [viewMode]);

  // Auto-scroll logic
  useEffect(() => {
    if (isScrolledToBottom) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isScrolledToBottom, viewMode]);

  // --- DRAG & RESIZE LOGIC ---
  useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
          if (isDragging) {
              e.preventDefault();
              let newX = e.clientX - dragStartRef.current.x;
              let newY = e.clientY - dragStartRef.current.y;
              newX = Math.max(-100, Math.min(newX, window.innerWidth - 50));
              newY = Math.max(0, Math.min(newY, window.innerHeight - 50));
              setPosition({ x: newX, y: newY });
          }
          if (isResizing) {
              e.preventDefault();
              const dx = e.clientX - resizeStartRef.current.x;
              const dy = e.clientY - resizeStartRef.current.y;
              setSize({ w: Math.max(300, resizeStartRef.current.w + dx), h: Math.max(400, resizeStartRef.current.h + dy) });
          }
      };
      const handleMouseUp = () => { setIsDragging(false); setIsResizing(false); };
      if (isDragging || isResizing) { document.addEventListener('mousemove', handleMouseMove); document.addEventListener('mouseup', handleMouseUp); }
      return () => { document.removeEventListener('mousemove', handleMouseMove); document.removeEventListener('mouseup', handleMouseUp); };
  }, [isDragging, isResizing]);

  const startDrag = (e: React.MouseEvent) => { if (viewMode !== 'floating') return; if ((e.target as HTMLElement).closest('button')) return; setIsDragging(true); dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y }; };
  const startResize = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setIsResizing(true); resizeStartRef.current = { x: e.clientX, y: e.clientY, w: size.w, h: size.h }; };

  // --- HANDLERS ---
  const handleScroll = () => { if (!scrollRef.current) return; const { scrollTop, scrollHeight, clientHeight } = scrollRef.current; setIsScrolledToBottom(scrollHeight - scrollTop - clientHeight < 100); };
  const handleSend = (e?: React.FormEvent) => { e?.preventDefault(); if (!inputText.trim()) return; let type: 'message' | 'system' = 'message'; let content = inputText; let senderName = user?.name || 'Anon'; if (speakingAs !== 'player' && myCharacter && !content.startsWith('/')) { senderName = myCharacter.name; } sendChatMessage(content, type); setInputText(''); };
  const formatTime = (timestamp: number) => { return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); };

  const groupedMessages = chatMessages.reduce((acc, msg, index) => {
      const prevMsg = chatMessages[index - 1];
      const isSameSender = prevMsg && prevMsg.senderId === msg.senderId && prevMsg.senderName === msg.senderName && prevMsg.type === msg.type && (msg.timestamp - prevMsg.timestamp < 60000); 
      if (isSameSender) acc[acc.length - 1].push(msg); else acc.push([msg]);
      return acc;
  }, [] as ChatMessage[][]);

  const renderLink = (link: ChatLinkMetadata) => {
      if (['item', 'spell', 'attack', 'feature'].includes(link.type) && link.data) return <RichLinkCard link={link} onClick={() => handleChatLinkClick(link)} />;
      const iconMap: any = { token: <User className="w-3 h-3" />, position: <MapPin className="w-3 h-3" /> };
      const styles: any = { token: 'border-blue-500/30 bg-blue-500/5 text-blue-300 hover:bg-blue-500/10 hover:border-blue-500/50', position: 'border-amber-500/30 bg-amber-500/5 text-amber-300 hover:bg-amber-500/10 hover:border-amber-500/50' };
      return <button onClick={() => handleChatLinkClick(link)} className={`mt-2 flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all w-fit shadow-sm max-w-full truncate ${styles[link.type] || 'border-zinc-700 bg-zinc-800 text-zinc-300'}`}>{iconMap[link.type]} <span className="truncate">{link.type === 'position' ? `Ir para ${link.label}` : link.label}</span></button>;
  };

  const renderRoll = (msg: ChatMessage) => {
      if (!msg.rollDetails) return null;
      
      const { visibility = 'public' } = msg.rollDetails;
      const isMe = msg.senderId === user?.id;
      const canSee = visibility === 'public' || isGM || isMe;
      const isObfuscated = visibility === 'total';

      if (!canSee && !isObfuscated) {
          return (
              <div className="p-3 rounded-lg border bg-zinc-900/50 border-zinc-800 flex items-center gap-2 text-zinc-500 italic text-xs">
                  <EyeOff className="w-4 h-4" /> Rolagem Oculta (GM)
              </div>
          );
      }

      return (
        <div className={`relative p-3 rounded-lg border shadow-sm overflow-hidden w-full ${msg.rollDetails.isCritical ? 'bg-yellow-950/20 border-yellow-500/40 shadow-[0_0_10px_rgba(234,179,8,0.1)]' : msg.rollDetails.isFumble ? 'bg-red-950/20 border-red-500/40' : 'bg-zinc-800/50 border-zinc-700'}`}>
            <div className="flex items-center justify-between gap-2 mb-2 border-b border-white/5 pb-2">
                <span className="font-bold text-xs text-zinc-300 truncate">{msg.rollDetails.label || 'Rolagem'}</span>
                <div className="flex gap-1">
                    {visibility === 'gm' && <EyeOff className="w-3 h-3 text-purple-400" />}
                    {visibility === 'total' && <Hash className="w-3 h-3 text-amber-400" />}
                    <Dices className={`w-3 h-3 shrink-0 ${msg.rollDetails.isCritical ? 'text-yellow-400' : msg.rollDetails.isFumble ? 'text-red-400' : 'text-zinc-500'}`} />
                </div>
            </div>
            
            <div className="flex justify-between items-end gap-2">
                {isObfuscated && !isGM && !isMe ? (
                    <div className="text-[10px] text-zinc-600 font-mono italic flex-1">Detalhes ocultos...</div>
                ) : (
                    <div className="text-[10px] text-zinc-500 font-mono truncate opacity-70 flex-1" title={msg.rollDetails.breakdown}>{msg.rollDetails.formula}</div>
                )}
                
                <div className={`text-2xl font-black font-mono leading-none ${msg.rollDetails.isCritical ? 'text-yellow-400 animate-pulse' : msg.rollDetails.isFumble ? 'text-red-500' : 'text-white'}`}>
                    {msg.rollDetails.total}
                </div>
            </div>
            
            {isObfuscated && !isGM && !isMe && (
                <div className="absolute inset-0 bg-black/10 pointer-events-none"></div>
            )}
        </div>
      );
  };

  // --- CONTENT RENDERER ---
  const renderContent = () => (
    <div className={`flex flex-col h-full relative ${viewMode === 'floating' ? 'bg-zinc-950/95 backdrop-blur-md' : 'bg-zinc-950'}`}>
        
        {/* HEADER */}
        <div 
            className={`
                flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0 select-none
                ${viewMode === 'floating' ? 'cursor-grab active:cursor-grabbing bg-zinc-900/80' : 'bg-zinc-900/50'}
            `}
            onMouseDown={startDrag}
        >
            <div className="flex items-center gap-2 text-zinc-300">
                {viewMode === 'floating' && <Move className="w-4 h-4 opacity-50 mr-1" />}
                <MessageSquare className="w-4 h-4" />
                <span className="font-bold font-fantasy tracking-wider text-sm">Chat da Campanha</span>
            </div>
            
            <div className="flex items-center gap-1">
                {viewMode !== 'sidebar' && <Tooltip content="Acoplar na Barra"><button onClick={() => setViewMode('sidebar')} className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-white"><ArrowRightToLine className="w-4 h-4" /></button></Tooltip>}
                {viewMode === 'sidebar' && <Tooltip content="Janela Flutuante"><button onClick={() => setViewMode('floating')} className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-white"><ExternalLink className="w-4 h-4" /></button></Tooltip>}
                {viewMode !== 'fullscreen' ? <Tooltip content="Tela Cheia"><button onClick={() => setViewMode('fullscreen')} className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-white"><Maximize2 className="w-4 h-4" /></button></Tooltip> : <Tooltip content="Sair da Tela Cheia"><button onClick={() => setViewMode('sidebar')} className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-white"><Minimize2 className="w-4 h-4" /></button></Tooltip>}
            </div>
        </div>

        {/* MESSAGES */}
        <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-6 custom-scrollbar relative">
            {chatMessages.length === 0 && <div className="flex flex-col items-center justify-center h-full text-zinc-600 gap-3 opacity-50"><MessageSquare className="w-10 h-10" /><p className="text-xs italic">O silêncio precede a aventura...</p></div>}
            
            {groupedMessages.map((group, gIndex) => {
              const firstMsg = group[0];
              const isMe = firstMsg.senderId === user?.id;
              const isSystem = firstMsg.type === 'system';

              if (isSystem) return <div key={`g-${gIndex}`} className="flex flex-col items-center gap-1 my-4 opacity-70 w-full px-2">{group.map(msg => (<div key={msg.id} className="text-[10px] font-bold uppercase tracking-widest bg-zinc-900 px-3 py-1 rounded-full text-zinc-500 border border-zinc-800/50 text-center max-w-full break-words">{msg.content}</div>))}</div>;

              return (
                <div key={`g-${gIndex}`} className={`flex gap-3 group w-full ${isMe ? 'flex-row-reverse' : ''}`}>
                    <div className="shrink-0 flex flex-col items-center pt-1">
                        <div className={`w-9 h-9 rounded-lg border border-white/10 overflow-hidden shadow-md ${isMe ? 'ring-1 ring-primary/40' : ''}`}>
                            {(() => { const char = campaignCharacters.find(c => c.name === firstMsg.senderName); const avatar = char ? char.avatarUrl : `https://api.dicebear.com/7.x/avataaars/svg?seed=${firstMsg.senderName}`; return <img src={avatar} className="w-full h-full object-cover" alt="Avatar" />; })()}
                        </div>
                    </div>
                    <div className={`flex-1 min-w-0 flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className={`flex items-baseline gap-2 mb-0.5 px-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                            <span className={`text-xs font-bold truncate max-w-[150px] ${isMe ? 'text-primary' : 'text-zinc-300'}`}>{firstMsg.senderName}</span>
                            <span className="text-[9px] text-zinc-600 shrink-0">{formatTime(firstMsg.timestamp)}</span>
                        </div>
                        <div className={`flex flex-col gap-1 w-full ${isMe ? 'items-end' : 'items-start'}`}>
                            {group.map((msg) => {
                                const isRoll = msg.type === 'roll';
                                const hasReactions = msg.reactions && (msg.reactions.like?.count > 0 || msg.reactions.dislike?.count > 0);
                                
                                // Check visibility for entire message block if it's a roll
                                if (isRoll && msg.rollDetails?.visibility === 'gm' && !isGM && !isMe) {
                                    return null; // Hide completely if GM Only and not GM/Sender
                                }

                                return (
                                    <div key={msg.id} className={`max-w-[95%] lg:max-w-[85%] relative ${isRoll ? 'w-64' : ''}`}>
                                        {isRoll ? renderRoll(msg) : (
                                            <div className={`px-3 py-2 text-sm rounded-xl leading-relaxed shadow-sm break-words whitespace-pre-wrap w-full ${isMe ? 'bg-primary/10 text-zinc-100 rounded-tr-none border border-primary/10' : 'bg-zinc-800/80 text-zinc-300 rounded-tl-none border border-zinc-700/50'}`}>
                                                {msg.content} {msg.link && renderLink(msg.link)}
                                            </div>
                                        )}
                                        <div className={`absolute -right-14 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 border border-zinc-700 rounded p-0.5 z-10 shadow-lg`}><button onClick={() => toggleChatReaction(msg, 'like')} className="p-1 hover:bg-white/10 rounded text-zinc-500 hover:text-green-400"><ThumbsUp className="w-3 h-3"/></button><button onClick={() => toggleChatReaction(msg, 'dislike')} className="p-1 hover:bg-white/10 rounded text-zinc-500 hover:text-red-400"><ThumbsDown className="w-3 h-3"/></button></div>
                                        {hasReactions && (<div className={`flex gap-2 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>{msg.reactions?.like && msg.reactions.like.count > 0 && (<div className="flex items-center gap-1 text-[9px] bg-zinc-800 px-1.5 py-0.5 rounded-full text-green-400 border border-zinc-700"><ThumbsUp className="w-2 h-2" /> {msg.reactions.like.count}</div>)}{msg.reactions?.dislike && msg.reactions.dislike.count > 0 && (<div className="flex items-center gap-1 text-[9px] bg-zinc-800 px-1.5 py-0.5 rounded-full text-red-400 border border-zinc-700"><ThumbsDown className="w-2 h-2" /> {msg.reactions.dislike.count}</div>)}</div>)}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
              );
            })}
            <div ref={endRef} />
        </div>

        {/* INPUT */}
        <div className="p-3 bg-zinc-900/90 border-t border-white/10 space-y-2 shrink-0">
             {myCharacter && (
                  <div className="flex justify-start">
                      <button onClick={() => setSpeakingAs(speakingAs === 'player' ? myCharacter.id : 'player')} className={`flex items-center gap-2 px-2 py-1 rounded-t-md text-[10px] font-bold uppercase tracking-wider border-t border-x border-white/10 transition-all ${speakingAs !== 'player' ? 'bg-zinc-800 text-primary border-primary/30 -mb-px z-10 pb-2' : 'bg-transparent text-zinc-500 hover:text-zinc-300'}`}>
                          {speakingAs !== 'player' ? (<><img src={myCharacter.avatarUrl} className="w-3 h-3 rounded-full"/> {myCharacter.name}</>) : (<><User className="w-3 h-3"/> {user?.name} (OOC)</>)} <ChevronDown className="w-3 h-3 opacity-50" />
                      </button>
                  </div>
              )}
              <form onSubmit={handleSend} className="relative flex items-center gap-2">
                  <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder={speakingAs === 'player' ? "Mensagem fora do personagem..." : `Falando como ${myCharacter?.name}...`} className={`flex-1 bg-zinc-950 border rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none transition-all ${speakingAs !== 'player' ? 'border-primary/50 focus:ring-1 focus:ring-primary' : 'border-zinc-700 focus:border-zinc-500'}`} />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <Tooltip content="Rolar Dados (Atalho)"><div className="p-1.5 text-zinc-600 hover:text-white cursor-pointer transition-colors"><Dices className="w-4 h-4" /></div></Tooltip>
                      <button type="submit" disabled={!inputText.trim()} className={`p-2 rounded-lg transition-all shadow-lg ${inputText.trim() ? 'bg-primary text-white hover:bg-primary/90 scale-100' : 'bg-zinc-800 text-zinc-600 scale-90 cursor-not-allowed'}`}><Send className="w-4 h-4" /></button>
                  </div>
              </form>
        </div>

        {/* RESIZE HANDLE (Floating Only) */}
        {viewMode === 'floating' && (
            <div 
                className="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize flex items-end justify-end p-0.5 text-zinc-600 hover:text-white z-20"
                onMouseDown={startResize}
            >
                <GripHorizontal className="w-4 h-4 rotate-45" />
            </div>
        )}
    </div>
  );

  // --- RENDER BASED ON MODE ---

  if (viewMode === 'sidebar') { return <div className="h-full border-l border-white/10 shadow-2xl w-full">{renderContent()}</div>; }
  if (viewMode === 'fullscreen') { return createPortal(<div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm"><div className="w-full h-full flex flex-col">{renderContent()}</div></div>, document.body); }
  return createPortal(<div style={{ position: 'fixed', left: position.x, top: position.y, width: size.w, height: size.h, zIndex: 9990 }} className="rounded-xl overflow-hidden shadow-2xl border border-zinc-700 ring-1 ring-black/50">{renderContent()}</div>, document.body);
};
