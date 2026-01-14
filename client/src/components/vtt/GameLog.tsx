
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useGameSession } from '../../context/GameSessionContext';
import { useAccessControl } from '../../hooks/useAccessControl';
import { useAuth } from '../../context/AuthContext';
import { ChatMessage, ChatLinkMetadata } from '../../types';
import { Send, Dices, MapPin, User, Sword, Zap, Backpack, ThumbsUp, ThumbsDown, ChevronDown, MessageSquare, ExternalLink, Maximize2, Minimize2, Move, GripHorizontal, ArrowRightToLine, Eye, EyeOff, Hash, Heart, ShieldAlert, Footprints, Activity, Filter, BookOpen, Skull, Lock, Unlock, Users } from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';
import { formatMarkdown } from '../../utils/markdown';
import { useTranslation } from '../../i18n/TranslationContext';

// --- RICH LINK CARD COMPONENT (Reusable) ---
const RichLinkCard: React.FC<{ link: ChatLinkMetadata; onClick: () => void; }> = ({ link, onClick }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const { type, data, label, compendiumSlug, contentMarkdown } = link;
    const { t } = useTranslation();

    // Check for overflow whenever content changes
    useEffect(() => {
        if (contentRef.current) {
            const { scrollHeight, clientHeight } = contentRef.current;
            setIsOverflowing(scrollHeight > clientHeight);
        }
    }, [contentMarkdown]);

    // Handling Compendium Cards
    if (type === 'compendium') {
        const config = {
            monsters: { color: 'border-red-900/50 bg-red-950/10', icon: <Skull className="w-4 h-4 text-red-500" />, accent: 'text-red-400' },
            spells: { color: 'border-purple-900/50 bg-purple-950/10', icon: <Zap className="w-4 h-4 text-purple-500" />, accent: 'text-purple-400' },
            magicitems: { color: 'border-amber-900/50 bg-amber-950/10', icon: <Backpack className="w-4 h-4 text-amber-500" />, accent: 'text-amber-400' },
            sections: { color: 'border-blue-900/50 bg-blue-950/10', icon: <BookOpen className="w-4 h-4 text-blue-500" />, accent: 'text-blue-400' },
        }[link.compendiumCategory || 'sections'] || { color: 'border-zinc-800 bg-zinc-900/50', icon: <BookOpen className="w-4 h-4" />, accent: 'text-zinc-400' };

        return (
            <div className={`mt-2 rounded-lg border overflow-hidden text-left transition-all shadow-sm w-full max-w-full ${config.color}`}>
                <div className="px-3 py-2 bg-black/20 border-b border-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-2 font-bold text-sm text-zinc-100">
                        {config.icon}
                        <span>{label}</span>
                    </div>
                    {compendiumSlug && (
                        <button
                            onClick={onClick}
                            className={`text-xs flex items-center gap-1 hover:underline ${config.accent}`}
                        >
                            {t('vtt.chat.cards.compendium.open')} <ExternalLink className="w-3 h-3" />
                        </button>
                    )}
                </div>
                {contentMarkdown && (
                    <div className="p-3 relative">
                        <div
                            ref={contentRef}
                            className={`prose prose-invert prose-xs max-w-none text-zinc-300 leading-relaxed ${!isExpanded ? 'max-h-32 overflow-hidden mask-linear-fade' : ''}`}
                            dangerouslySetInnerHTML={{ __html: formatMarkdown(contentMarkdown) }}
                        />

                        {!isExpanded && isOverflowing && (
                            <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-zinc-950/90 to-transparent flex items-end justify-center pb-1">
                                <button onClick={() => setIsExpanded(true)} className="text-[10px] uppercase font-bold text-zinc-500 hover:text-zinc-300 flex items-center gap-1 bg-zinc-900/80 px-2 py-0.5 rounded-full border border-zinc-800 transition-colors hover:bg-zinc-800">
                                    <ChevronDown className="w-3 h-3" /> {t('vtt.chat.cards.compendium.readMore')}
                                </button>
                            </div>
                        )}
                        {isExpanded && (
                            <div className="flex justify-center mt-2 pt-2 border-t border-white/5">
                                <button onClick={() => setIsExpanded(false)} className="text-[10px] uppercase font-bold text-zinc-500 hover:text-zinc-300">{t('vtt.chat.cards.compendium.collapse')}</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    if (!data) return null;

    const config = {
        attack: { color: 'border-red-500/30 bg-red-950/20', icon: <Sword className="w-3 h-3 text-red-400" />, accent: 'text-red-400', headerBg: 'bg-red-500/10' },
        spell: { color: 'border-purple-500/30 bg-purple-950/20', icon: <Zap className="w-3 h-3 text-purple-400" />, accent: 'text-purple-400', headerBg: 'bg-purple-500/10' },
        item: { color: 'border-amber-500/30 bg-amber-950/20', icon: <Backpack className="w-3 h-3 text-amber-400" />, accent: 'text-amber-400', headerBg: 'bg-amber-500/10' },
        feature: { color: 'border-emerald-500/30 bg-emerald-950/20', icon: <User className="w-3 h-3 text-emerald-400" />, accent: 'text-emerald-400', headerBg: 'bg-emerald-500/10' },
        token: { color: '', icon: null, accent: '', headerBg: '' },
        position: { color: '', icon: null, accent: '', headerBg: '' },
        movement: { color: '', icon: null, accent: '', headerBg: '' },
        damage: { color: '', icon: null, accent: '', headerBg: '' },
        heal: { color: '', icon: null, accent: '', headerBg: '' },
    }[type] || { color: 'border-zinc-700 bg-zinc-800', icon: null, accent: 'text-zinc-400', headerBg: '' };

    if (['movement', 'damage', 'heal'].includes(type)) return null;

    const renderDetails = () => {
        switch (type) {
            case 'attack': return <div className="flex gap-2 mb-2"><div className="bg-black/30 rounded px-2 py-1 text-[10px] border border-white/5 shrink-0"><span className="text-zinc-500 block text-[9px] uppercase">{t('vtt.chat.cards.attack.hit')}</span><span className={`font-bold ${config.accent}`}>{data.atkBonus}</span></div><div className="bg-black/30 rounded px-2 py-1 text-[10px] border border-white/5 shrink-0"><span className="text-zinc-500 block text-[9px] uppercase">{t('vtt.chat.cards.attack.damage')}</span><span className="font-bold text-zinc-200">{data.damage}</span></div></div>;
            case 'spell': return <div className="flex gap-2 mb-2"><div className="bg-black/30 rounded px-2 py-1 text-[10px] border border-white/5 shrink-0"><span className="text-zinc-500 block text-[9px] uppercase">{t('vtt.chat.cards.spell.level')}</span><span className={`font-bold ${config.accent}`}>{data.level === 0 ? t('vtt.chat.cards.spell.cantrip') : data.level}</span></div><div className="bg-black/30 rounded px-2 py-1 text-[10px] border border-white/5 flex-1 min-w-0"><span className="text-zinc-500 block text-[9px] uppercase">{t('vtt.chat.cards.spell.school')}</span><span className="font-bold text-zinc-200 truncate block">{data.school}</span></div></div>;
            case 'item': return <div className="flex gap-2 mb-2"><div className="bg-black/30 rounded px-2 py-1 text-[10px] border border-white/5 shrink-0"><span className="text-zinc-500 block text-[9px] uppercase">{t('vtt.chat.cards.item.qty')}</span><span className={`font-bold ${config.accent}`}>{data.qty}</span></div></div>;
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
                    {compendiumSlug ? (
                        <button onClick={(e) => { e.stopPropagation(); onClick(); }} className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider hover:underline ${config.accent}`}>{t('vtt.chat.cards.compendium.grimoire')} <ExternalLink className="w-2.5 h-2.5" /></button>
                    ) : (
                        <button onClick={(e) => { e.stopPropagation(); onClick(); }} className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider hover:underline ${config.accent}`}>{type === 'attack' ? t('vtt.chat.cards.attack.rollAttack') : t('vtt.chat.cards.generic.viewDetails')} <ExternalLink className="w-2.5 h-2.5" /></button>
                    )}
                </div>
            </div>
        </div>
    );
};

export type ChatViewMode = 'sidebar' | 'floating' | 'fullscreen';
type LogFilter = 'all' | 'chat' | 'roll' | 'system';

interface GameLogProps {
    onModeChange?: (mode: ChatViewMode) => void;
}

export const GameLog: React.FC<GameLogProps> = ({ onModeChange }) => {
    const { chatMessages, sendChatMessage, toggleChatReaction, handleChatLinkClick, campaignCharacters, setCursorChatState } = useGameSession(); // Add setCursorChatState
    const { t } = useTranslation();

    const [inputText, setInputText] = useState('');
    const { user } = useAuth();
    const { isGM } = useAccessControl();

    const [speakingAs, setSpeakingAs] = useState<'player' | string>('player');
    const [whisperTo, setWhisperTo] = useState<string | null>(null); // New: Whisper State
    const [showWhisperMenu, setShowWhisperMenu] = useState(false); // New: Menu State
    const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);
    const [viewMode, setViewMode] = useState<ChatViewMode>('sidebar');
    const [activeFilter, setActiveFilter] = useState<LogFilter>('all');

    const [position, setPosition] = useState({ x: 100, y: 100 });
    const [size, setSize] = useState({ w: 400, h: 600 });
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);
    const endRef = useRef<HTMLDivElement>(null);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const resizeStartRef = useRef({ x: 0, y: 0, w: 0, h: 0 });
    const whisperMenuRef = useRef<HTMLDivElement>(null); // New Ref

    const myCharacter = campaignCharacters.find(c => c.ownerId === user?.id);
    const playersOnline = useGameSession().players || []; // Get players for whisper list

    // Permission Check
    const canChatPrivate = isGM || true; // Assuming true for now, connect to permissions later if needed

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (whisperMenuRef.current && !whisperMenuRef.current.contains(event.target as Node)) {
                setShowWhisperMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (onModeChange) onModeChange(viewMode);
    }, [viewMode, onModeChange]);

    useEffect(() => {
        if (viewMode === 'floating' && position.x === 100) {
            setPosition({ x: window.innerWidth / 2 - 200, y: window.innerHeight / 2 - 300 });
        }
    }, [viewMode]);

    useEffect(() => {
        if (isScrolledToBottom) {
            endRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages, isScrolledToBottom, viewMode, activeFilter]);

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

    const handleScroll = () => { if (!scrollRef.current) return; const { scrollTop, scrollHeight, clientHeight } = scrollRef.current; setIsScrolledToBottom(scrollHeight - scrollTop - clientHeight < 100); };

    const handleSend = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputText.trim()) return;

        let type: 'message' | 'system' = 'message';
        let content = inputText;

        const options: any = {};

        if (speakingAs !== 'player' && myCharacter && !content.startsWith('/')) {
            options.characterId = myCharacter.id;
            options.characterName = myCharacter.name;
            options.characterAvatarUrl = myCharacter.avatarUrl;
        }

        if (whisperTo) {
            const recipient = playersOnline.find(p => p.id === whisperTo);
            if (recipient) {
                options.recipientId = recipient.id;
                options.recipientName = recipient.name;
            }
        }

        sendChatMessage(content, type, undefined, undefined, options);
        setInputText('');
    };
    const formatTime = (timestamp: number) => { return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); };

    // Filter Logic + Visibility Logic
    const filteredMessages = React.useMemo(() => {
        return chatMessages.filter(msg => {
            const isMe = msg.senderId === user?.id;

            // Visibility Check
            if (msg.visibility === 'gm' && !isGM && !isMe) return false;

            // Private Message Check
            if (msg.recipientId) {
                const isRecipient = msg.recipientId === user?.id;
                if (!isMe && !isRecipient && !isGM) return false;
            }

            if (activeFilter === 'all') return true;
            if (activeFilter === 'chat') return msg.type === 'message';
            if (activeFilter === 'roll') return msg.type === 'roll';
            if (activeFilter === 'system') return msg.type === 'system';
            return true;
        });
    }, [chatMessages, user?.id, isGM, activeFilter]);

    const groupedMessages = React.useMemo(() => {
        return filteredMessages.reduce((acc, msg, index) => {
            const prevMsg = filteredMessages[index - 1];
            const isSameSender = prevMsg &&
                prevMsg.senderId === msg.senderId &&
                prevMsg.senderName === msg.senderName &&
                prevMsg.characterName === msg.characterName && // Check Identity (RP vs OOC)
                prevMsg.recipientId === msg.recipientId &&     // Check Scope (Public vs Whisper)
                prevMsg.type === msg.type &&
                (msg.timestamp - prevMsg.timestamp < 60000);

            if (isSameSender) acc[acc.length - 1].push(msg); else acc.push([msg]);
            return acc;
        }, [] as ChatMessage[][]);
    }, [filteredMessages]);

    const renderLink = (link: ChatLinkMetadata) => {
        if (['item', 'spell', 'attack', 'feature', 'compendium'].includes(link.type)) return <RichLinkCard link={link} onClick={() => handleChatLinkClick(link)} />;
        if (['movement', 'damage', 'heal'].includes(link.type)) return null;

        const iconMap: any = { token: <User className="w-3 h-3" />, position: <MapPin className="w-3 h-3" /> };
        const styles: any = { token: 'border-blue-500/30 bg-blue-500/5 text-blue-300 hover:bg-blue-500/10 hover:border-blue-500/50', position: 'border-amber-500/30 bg-amber-500/5 text-amber-300 hover:bg-amber-500/10 hover:border-amber-500/50' };
        return <button onClick={() => handleChatLinkClick(link)} className={`mt-2 flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all w-fit shadow-sm max-w-full truncate ${styles[link.type] || 'border-zinc-700 bg-zinc-800 text-zinc-300'}`}>{iconMap[link.type]} <span className="truncate">{link.type === 'position' ? t('vtt.chat.cards.position.goTo', { label: link.label }) : link.label}</span></button>;
    };

    const renderSystemEvent = (msg: ChatMessage) => {
        const link = msg.link;
        if (link && ['damage', 'heal', 'movement'].includes(link.type) && link.data) {
            if (link.type === 'damage') {
                return (
                    <div className="flex items-center gap-3 py-2 px-3 rounded-lg bg-red-950/10 border border-red-900/20 w-full my-1 shadow-sm">
                        <div className="w-8 h-8 rounded-full bg-red-900/30 flex items-center justify-center border border-red-800/50 text-red-400 shrink-0">
                            <Sword className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-zinc-300" dangerouslySetInnerHTML={{ __html: formatMarkdown(t('vtt.chat.messages.system.damage', { name: link.data.targetName, diff: link.data.diff })) }} />
                            <div className="w-full bg-zinc-900 h-1.5 mt-1.5 rounded-full overflow-hidden"><div className="h-full bg-red-600 transition-all duration-500" style={{ width: `${Math.min(100, (link.data.new / Math.max(1, (link.data.new - link.data.diff))) * 100)}%` }}></div></div>
                        </div>
                    </div>
                );
            }
            if (link.type === 'heal') {
                return (
                    <div className="flex items-center gap-3 py-2 px-3 rounded-lg bg-green-950/10 border border-green-900/20 w-full my-1 shadow-sm">
                        <div className="w-8 h-8 rounded-full bg-green-900/30 flex items-center justify-center border border-green-800/50 text-green-400 shrink-0">
                            <Heart className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-zinc-300" dangerouslySetInnerHTML={{ __html: formatMarkdown(t('vtt.chat.messages.system.heal', { name: link.data.targetName, diff: link.data.diff })) }} />
                        </div>
                    </div>
                );
            }
            if (link.type === 'movement') {
                return (
                    <div className="flex items-center gap-2 py-1 px-2 text-zinc-500 italic text-[10px] w-full justify-center opacity-70 hover:opacity-100 transition-opacity">
                        <Footprints className="w-3 h-3 text-zinc-600" />
                        <span>{msg.content}</span>
                    </div>
                );
            }
        }

        // Compendium Share
        if (link && link.type === 'compendium') {
            return (
                <div className="w-full my-2">
                    {renderLink(link)}
                </div>
            );
        }

        // Generic System Message
        return (
            <div className="flex items-center gap-2 w-full py-2 my-1 justify-center">
                <div className="h-px bg-zinc-800 flex-1"></div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800 shadow-sm">
                    <ShieldAlert className="w-3 h-3" /> {msg.content}
                </div>
                <div className="h-px bg-zinc-800 flex-1"></div>
            </div>
        );
    };

    const renderRoll = (msg: ChatMessage) => {
        if (!msg.rollDetails) return null;
        const { visibility = 'public' } = msg.rollDetails;
        const isMe = msg.senderId === user?.id;
        const canSee = visibility === 'public' || isGM || isMe;
        const isObfuscated = visibility === 'total';

        if (!canSee && !isObfuscated) return null; // Double check

        if (!canSee && isObfuscated) {
            return (
                <div className="p-2 rounded border bg-zinc-900/50 border-zinc-800 flex items-center gap-2 text-zinc-600 italic text-[10px] justify-center">
                    <Hash className="w-3 h-3" /> {t('vtt.chat.messages.roll.hidden')}
                </div>
            );
        }

        return (
            <div className={`relative p-3 rounded-lg border shadow-sm overflow-hidden w-full ${msg.rollDetails.isCritical ? 'bg-yellow-950/20 border-yellow-500/40 shadow-[0_0_10px_rgba(234,179,8,0.1)]' : msg.rollDetails.isFumble ? 'bg-red-950/20 border-red-500/40' : 'bg-zinc-800/50 border-zinc-700'}`}>
                <div className="flex items-center justify-between gap-2 mb-2 border-b border-white/5 pb-2">
                    <span className="font-bold text-xs text-zinc-300 truncate">{msg.rollDetails.label || t('vtt.chat.messages.roll.label')}</span>
                    <div className="flex gap-1">
                        {visibility === 'gm' && <EyeOff className="w-3 h-3 text-purple-400" />}
                        {visibility === 'total' && <Hash className="w-3 h-3 text-amber-400" />}
                        <Dices className={`w-3 h-3 shrink-0 ${msg.rollDetails.isCritical ? 'text-yellow-400' : msg.rollDetails.isFumble ? 'text-red-400' : 'text-zinc-500'}`} />
                    </div>
                </div>
                <div className="flex justify-between items-end gap-2">
                    {isObfuscated && !isGM && !isMe ? (
                        <div className="text-[10px] text-zinc-600 font-mono italic flex-1">? + ?</div>
                    ) : (
                        <div className="text-[10px] text-zinc-500 font-mono truncate opacity-70 flex-1" title={msg.rollDetails.breakdown}>{msg.rollDetails.formula}</div>
                    )}
                    <div className={`text-2xl font-black font-mono leading-none ${msg.rollDetails.isCritical ? 'text-yellow-400 animate-pulse' : msg.rollDetails.isFumble ? 'text-red-500' : 'text-white'}`}>
                        {msg.rollDetails.total}
                    </div>
                </div>
            </div>
        );
    };

    const renderContent = () => (
        <div
            className={`flex flex-col h-full relative ${viewMode === 'floating' ? 'bg-zinc-950/95 backdrop-blur-md' : 'bg-zinc-950'}`}
            onMouseEnter={() => setCursorChatState?.(true)}
            onMouseLeave={() => setCursorChatState?.(false)}
        >

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
                    <Activity className="w-4 h-4 text-primary" />
                    <span className="font-bold font-fantasy tracking-wider text-sm">{t('vtt.chat.title')}</span>
                </div>

                <div className="flex items-center gap-1">
                    {viewMode !== 'sidebar' && <Tooltip content={t('vtt.chat.tooltips.dock')}><button onClick={() => setViewMode('sidebar')} className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-white"><ArrowRightToLine className="w-4 h-4" /></button></Tooltip>}
                    {viewMode === 'sidebar' && <Tooltip content={t('vtt.chat.tooltips.popout')}><button onClick={() => setViewMode('floating')} className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-white"><ExternalLink className="w-4 h-4" /></button></Tooltip>}
                    {viewMode !== 'fullscreen' ? <Tooltip content={t('vtt.chat.tooltips.expand')}><button onClick={() => setViewMode('fullscreen')} className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-white"><Maximize2 className="w-4 h-4" /></button></Tooltip> : <Tooltip content={t('vtt.chat.tooltips.collapse')}><button onClick={() => setViewMode('sidebar')} className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-white"><Minimize2 className="w-4 h-4" /></button></Tooltip>}
                </div>
            </div>

            {/* FILTERS */}
            <div className="flex border-b border-white/5 bg-zinc-900/30 px-2 overflow-x-auto hide-scrollbar shrink-0">
                {[
                    { id: 'all', label: t('vtt.chat.tabs.all') },
                    { id: 'chat', label: t('vtt.chat.tabs.chat') },
                    { id: 'roll', label: t('vtt.chat.tabs.roll') },
                    { id: 'system', label: t('vtt.chat.tabs.system') },
                ].map((f) => (
                    <button
                        key={f.id}
                        onClick={() => setActiveFilter(f.id as LogFilter)}
                        className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-all ${activeFilter === f.id ? 'border-primary text-primary' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* MESSAGES */}
            <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 custom-scrollbar relative">
                {filteredMessages.length === 0 && <div className="flex flex-col items-center justify-center h-full text-zinc-600 gap-3 opacity-50"><Filter className="w-8 h-8" /><p className="text-xs italic">{t('vtt.chat.tabs.empty')}</p></div>}

                {groupedMessages.map((group, gIndex) => {
                    const firstMsg = group[0];
                    const isMe = firstMsg.senderId === user?.id;
                    const isSystem = firstMsg.type === 'system';

                    if (isSystem) return <div key={`g-${gIndex}`} className="w-full px-1 animate-in fade-in slide-in-from-bottom-2 duration-300">{group.map(msg => <div key={msg.id}>{renderSystemEvent(msg)}</div>)}</div>;

                    return (
                        <div key={`g-${gIndex}`} className={`flex gap-3 group w-full ${isMe ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                            <div className="shrink-0 flex flex-col items-center pt-1">
                                <div className={`w-9 h-9 rounded-lg border border-white/10 overflow-hidden shadow-md ${isMe ? 'ring-1 ring-primary/40' : ''}`}>
                                    {(() => {
                                        const avatar = firstMsg.characterAvatarUrl || (() => {
                                            const char = campaignCharacters.find(c => c.name === firstMsg.senderName);
                                            return char ? char.avatarUrl : `https://api.dicebear.com/7.x/avataaars/svg?seed=${firstMsg.senderName}`;
                                        })();
                                        return <img src={avatar} className="w-full h-full object-cover" alt="Avatar" />;
                                    })()}
                                </div>
                            </div>
                            <div className={`flex-1 min-w-0 flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                <div className={`flex items-baseline gap-2 mb-0.5 px-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                                    <span className={`text-xs font-bold truncate max-w-[150px] flex items-center gap-1 ${isMe ? 'text-primary' : 'text-zinc-300'}`}>
                                        {firstMsg.characterName || firstMsg.senderName}
                                        {firstMsg.characterName && <span className="text-[9px] px-1 py-0.5 bg-primary/20 text-primary rounded border border-primary/30 uppercase tracking-wider">{t('vtt.chat.badges.rp')}</span>}
                                        {!firstMsg.characterName && <span className="text-[9px] px-1 py-0.5 bg-zinc-800 text-zinc-500 rounded border border-white/5 uppercase tracking-wider">{t('vtt.chat.badges.ooc')}</span>}
                                    </span>
                                    <span className="text-[9px] text-zinc-600 shrink-0">{formatTime(firstMsg.timestamp)}</span>
                                </div>
                                <div className={`flex flex-col gap-1 w-full ${isMe ? 'items-end' : 'items-start'}`}>
                                    {group.map((msg) => {
                                        const isRoll = msg.type === 'roll';
                                        const hasReactions = msg.reactions && (msg.reactions.like?.count > 0 || msg.reactions.dislike?.count > 0);

                                        return (
                                            <div key={msg.id} className={`max-w-[95%] lg:max-w-[85%] relative ${isRoll ? 'w-64' : ''}`}>
                                                {isRoll ? renderRoll(msg) : (
                                                    <div className={`px-3 py-2 text-sm rounded-xl leading-relaxed shadow-sm break-words whitespace-pre-wrap w-full ${msg.recipientId ? 'bg-purple-500/10 text-purple-100 border border-purple-500/30' : isMe ? 'bg-primary/10 text-zinc-100 rounded-tr-none border border-primary/10' : 'bg-zinc-800/80 text-zinc-300 rounded-tl-none border border-zinc-700/50'}`}>
                                                        {msg.recipientId && (
                                                            <div className="text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1 text-purple-400 border-b border-purple-500/20 pb-1">
                                                                <Lock className="w-3 h-3" />
                                                                {msg.senderId === user?.id ? t('vtt.chat.messages.whisper.fromMe', { name: msg.recipientName }) : msg.recipientId === user?.id ? t('vtt.chat.messages.whisper.toMe') : t('vtt.chat.messages.whisper.other', { name: msg.recipientName })}
                                                            </div>
                                                        )}
                                                        {msg.content} {msg.link && renderLink(msg.link)}
                                                    </div>
                                                )}
                                                {!isRoll && (<div className={`absolute -right-14 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 border border-zinc-700 rounded p-0.5 z-10 shadow-lg`}><button onClick={() => toggleChatReaction(msg, 'like')} className="p-1 hover:bg-white/10 rounded text-zinc-500 hover:text-green-400"><ThumbsUp className="w-3 h-3" /></button><button onClick={() => toggleChatReaction(msg, 'dislike')} className="p-1 hover:bg-white/10 rounded text-zinc-500 hover:text-red-400"><ThumbsDown className="w-3 h-3" /></button></div>)}
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

            {/* FOOTER: INPUT AND MENU */}
            <div className="p-3 bg-zinc-900/90 border-t border-white/10 shrink-0 flex flex-col gap-2 relative">

                {/* CHAT MENU (Above Input) */}
                <div className="relative w-full" ref={whisperMenuRef}>
                    <button
                        onClick={() => setShowWhisperMenu(!showWhisperMenu)}
                        className={`
                            flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide border transition-all w-full text-left
                            ${whisperTo
                                ? 'bg-purple-500/5 border-purple-500/30 text-purple-300 hover:bg-purple-500/10'
                                : speakingAs !== 'player'
                                    ? 'bg-primary/5 border-primary/30 text-primary-300 hover:bg-primary/10'
                                    : 'bg-zinc-950/50 border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}
                        `}
                    >
                        {whisperTo ? (
                            <>
                                <Lock className="w-3 h-3 shrink-0" />
                                <span className="truncate flex-1">{t('vtt.chat.labels.private')} {playersOnline.find(p => p.id === whisperTo)?.name || t('vtt.common.all')}</span>
                            </>
                        ) : (
                            <>
                                {speakingAs !== 'player' && myCharacter ? (
                                    <>
                                        <img src={myCharacter.avatarUrl} className="w-4 h-4 rounded-full object-cover border border-white/10 select-none" />
                                        <span className="truncate flex-1">{myCharacter.name}</span>
                                    </>
                                ) : (
                                    <>
                                        <MessageSquare className="w-3 h-3 shrink-0" />
                                        <span className="truncate flex-1">{t('vtt.chat.menus.global')}</span>
                                    </>
                                )}
                            </>
                        )}
                        <ChevronDown className={`w-3 h-3 opacity-50 transition-transform ${showWhisperMenu ? 'rotate-180' : ''}`} />
                    </button>

                    {showWhisperMenu && (
                        <div className="absolute bottom-full left-0 right-0 mb-2 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[100] animate-in slide-in-from-bottom-2">
                            {/* IDENTITY */}
                            {myCharacter && (
                                <div className="p-1 border-b border-white/5">
                                    <div className="px-2 py-1 text-[10px] font-bold text-zinc-600 uppercase tracking-wider">{t('vtt.chat.labels.identity')}</div>
                                    <button
                                        onClick={() => { setSpeakingAs('player'); setShowWhisperMenu(false); }}
                                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${speakingAs === 'player' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'}`}
                                    >
                                        <User className="w-3 h-3" />
                                        {user?.name || t('vtt.common.me')} {t('vtt.chat.tags.ooc')}
                                        {speakingAs === 'player' && <div className="w-1.5 h-1.5 rounded-full bg-primary ml-auto"></div>}
                                    </button>
                                    <button
                                        onClick={() => { setSpeakingAs(myCharacter.id); setShowWhisperMenu(false); }}
                                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${speakingAs === myCharacter.id ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'}`}
                                    >
                                        <img src={myCharacter.avatarUrl} className="w-3 h-3 rounded-full" />
                                        {myCharacter.name}
                                        {speakingAs === myCharacter.id && <div className="w-1.5 h-1.5 rounded-full bg-primary ml-auto"></div>}
                                    </button>
                                </div>
                            )}

                            {/* RECIPIENT */}
                            <div className="p-1">
                                <div className="px-2 py-1 text-[10px] font-bold text-zinc-600 uppercase tracking-wider">{t('vtt.chat.labels.recipient')}</div>
                                <button
                                    onClick={() => { setWhisperTo(null); setShowWhisperMenu(false); }}
                                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${!whisperTo ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'}`}
                                >
                                    <Users className="w-3 h-3" />
                                    {t('vtt.chat.menus.recipient.global')}
                                    {!whisperTo && <div className="w-1.5 h-1.5 rounded-full bg-primary ml-auto"></div>}
                                </button>
                                {canChatPrivate && playersOnline.filter(p => p.id !== user?.id).map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => { setWhisperTo(p.id); setShowWhisperMenu(false); }}
                                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${whisperTo === p.id ? 'bg-purple-500/20 text-purple-200' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'}`}
                                    >
                                        <Lock className="w-3 h-3" />
                                        {t('vtt.chat.menus.recipient.whisper', { name: p.name })}
                                        {whisperTo === p.id && <div className="w-1.5 h-1.5 rounded-full bg-purple-500 ml-auto"></div>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* FORM */}
                <form onSubmit={handleSend} className="relative flex items-center gap-2">
                    <div className={`flex-1 relative transition-all rounded-xl border flex items-center bg-zinc-950 overflow-hidden ${whisperTo ? 'border-purple-500/50 ring-1 ring-purple-500/20' : speakingAs !== 'player' ? 'border-primary/50 ring-1 ring-primary/20' : 'border-zinc-700/50 focus-within:border-zinc-500 focus-within:ring-1 focus-within:ring-zinc-500/20'}`}>
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onFocus={() => setCursorChatState?.(true)}
                            onBlur={() => setCursorChatState?.(false)}
                            placeholder={whisperTo ? t('vtt.chat.input.placeholder.whisper') : t('vtt.chat.input.placeholder.global')}
                            className="flex-1 bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none min-w-0"
                        />
                        <button
                            type="submit"
                            disabled={!inputText.trim()}
                            className={`
                                m-1 p-1.5 rounded-lg transition-all shrink-0 flex items-center justify-center
                                ${inputText.trim()
                                    ? (whisperTo ? 'bg-purple-600 text-white hover:bg-purple-500 shadow-lg shadow-purple-500/20' : 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20')
                                    : 'text-zinc-600 bg-zinc-900/50 hover:bg-zinc-800'}
                            `}
                        >
                            {whisperTo ? <Lock className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                        </button>
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

    if (viewMode === 'sidebar') { return <div className="h-full border-l border-white/10 shadow-2xl w-full">{renderContent()}</div>; }
    if (viewMode === 'fullscreen') { return createPortal(<div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm"><div className="w-full h-full flex flex-col">{renderContent()}</div></div>, document.body); }
    return createPortal(<div style={{ position: 'fixed', left: position.x, top: position.y, width: size.w, height: size.h, zIndex: 9990 }} className="rounded-xl overflow-hidden shadow-2xl border border-zinc-700 ring-1 ring-black/50">{renderContent()}</div>, document.body);
};
