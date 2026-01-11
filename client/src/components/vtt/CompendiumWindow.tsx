import { useTranslation } from '../../i18n/TranslationContext';

import React, { useState, useEffect, useCallback } from 'react';
import { DraggableWindow } from '../ui/DraggableWindow';
import { compendiumService } from '../../services/compendiumService';

import { CompendiumCategory, ApiMonster, ApiSpell, ApiMagicItem, ApiSection } from '../../types/compendium';
import { Book, Skull, Zap, Backpack, Scale, Search, ChevronRight, ChevronDown, ExternalLink, Activity, Shield, Heart, Loader2, RotateCw, Star, Bookmark, Image as ImageIcon, MessageSquare, Copy, Share2, Lock } from 'lucide-react';
import { Button } from '../ui/Button';
import { useGameSession } from '../../context/GameSessionContext';
import { useNotification } from '../../context/NotificationContext';
import { ftToM } from '../../utils/unitConversion';
import { formatMarkdown } from '../../utils/markdown';
import { Tooltip } from '../ui/Tooltip';
import { TokenStats } from '../../types';

interface CompendiumWindowProps {
    isOpen: boolean;
    onClose: () => void;
}

type DetailItem = ApiMonster | ApiSpell | ApiMagicItem | ApiSection | null;

interface FavoriteItem {
    slug: string;
    name: string;
    category: CompendiumCategory;
    data: DetailItem; // Storing full data for offline/quick access
}

// ... (Existing Components: CompendiumImage, CompendiumSection remain same) ...
const CompendiumImage: React.FC<{ monster: ApiMonster; onImageFound?: (url: string) => void; }> = ({ monster, onImageFound }) => {
    const [src, setSrc] = useState<string | null>(null);
    const [attemptedDnd, setAttemptedDnd] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        // Reset when monster changes
        setError(false);
        setAttemptedDnd(false);

        if (monster.img_main) {
            setSrc(monster.img_main);
        } else {
            // Start with D&D 5e API if no main image
            // NOTE: D&D 5e API uses lower-kebab-case slugs generally matching Open5e
            const dndUrl = `https://www.dnd5eapi.co/api/images/monsters/${monster.slug}.png`;
            setSrc(dndUrl);
            setAttemptedDnd(true);
        }
    }, [monster]);

    const handleError = () => {
        if (!attemptedDnd) {
            // Fallback to D&D 5e API if Open5e failed
            const dndUrl = `https://www.dnd5eapi.co/api/images/monsters/${monster.slug}.png`;
            setSrc(dndUrl);
            setAttemptedDnd(true);
        } else {
            // Both failed
            setError(true);
            setSrc(null);
        }
    };

    const handleLoad = () => {
        if (src && onImageFound) {
            onImageFound(src);
        }
    };

    if (error || !src) return null;

    return (
        <div className="relative w-full h-48 sm:h-64 rounded-lg overflow-hidden mb-4 border border-zinc-700 shadow-lg bg-black group">
            <img
                src={src}
                alt={monster.name}
                className="w-full h-full object-contain opacity-90 group-hover:opacity-100 transition-opacity"
                onError={handleError}
                onLoad={handleLoad}
            />
            <div className="absolute bottom-0 left-0 w-full h-1/4 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none"></div>
        </div>
    );
};

const CompendiumSection: React.FC<{
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    onShare?: () => void;
    icon?: React.ReactNode;
    className?: string;
}> = ({ title, children, defaultOpen = true, onShare, icon, className = '' }) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className={`border border-zinc-800 rounded-lg bg-zinc-900/30 overflow-hidden ${className}`}>
            <div className="flex items-center justify-between p-3 bg-zinc-900/80 border-b border-zinc-800/50 select-none">
                <div
                    className="flex items-center gap-2 cursor-pointer flex-1 hover:text-white text-zinc-300 transition-colors"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {icon}
                    <span className="font-bold font-fantasy tracking-wide text-sm">{title}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
                {onShare && (
                    <Tooltip content={t('vtt.compendium.window.compartilharSeoNo.tooltip')}>
                        <button
                            onClick={(e) => { e.stopPropagation(); onShare(); }}
                            className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-700/50 rounded transition-colors"
                        >
                            <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                    </Tooltip>
                )}
            </div>
            {isOpen && (
                <div className="p-3 animate-in slide-in-from-top-2 duration-200">
                    {children}
                </div>
            )}
        </div>
    );
};

export const CompendiumWindow: React.FC<CompendiumWindowProps> = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<CompendiumCategory | 'favorites'>('monsters');
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedItem, setSelectedItem] = useState<DetailItem>(null);

    const [displayItem, setDisplayItem] = useState<DetailItem>(null);
    const [isTranslating, setIsTranslating] = useState(false);

    const [validMonsterImage, setValidMonsterImage] = useState<string | null>(null);

    const [page, setPage] = useState(1);
    const [hasNext, setHasNext] = useState(false);
    const [language, setLanguage] = useState<'pt' | 'en'>('pt');

    const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

    const { isGM, addToken, sendChatMessage, viewport, activeScene, compendiumTarget, permissionHelper } = useGameSession();
    const { show } = useNotification();

    // REGRA MILENAR: Use PermissionHelper
    const canBrowse = permissionHelper.can('compendiumBrowse');

    // Load favorites on mount
    useEffect(() => {
        const stored = localStorage.getItem('questbinder_favorites');
        if (stored) {
            try {
                setFavorites(JSON.parse(stored));
            } catch (e) { console.error(t('vtt.compendium.window.failedToLoad.errorMessage'), e); }
        }
    }, []);

    // ... (Deep linking logic remains the same) ...
    useEffect(() => {
        const openTarget = async () => {
            if (compendiumTarget && isOpen && canBrowse) {
                setActiveTab(compendiumTarget.category);
                setIsLoading(true);
                try {
                    let targetItem = null;
                    // @ts-ignore
                    const fav = favorites.find(f => f.slug === compendiumTarget.slug && f.category === compendiumTarget.category);
                    if (fav) {
                        targetItem = fav.data;
                    } else {
                        let res;
                        switch (compendiumTarget.category) {
                            case 'monsters': res = await compendiumService.searchMonsters(compendiumTarget.slug); break;
                            case 'spells': res = await compendiumService.searchSpells(compendiumTarget.slug); break;
                            case 'magicitems': res = await compendiumService.searchItems(compendiumTarget.slug); break;
                            case 'sections': res = await compendiumService.searchRules(compendiumTarget.slug); break;
                        }
                        // @ts-ignore
                        if (res && res.results) {
                            // @ts-ignore
                            targetItem = res.results.find((r: any) => r.slug === compendiumTarget.slug) || res.results[0];
                        }
                    }

                    if (targetItem) {
                        setSelectedItem(targetItem);
                    } else {
                        show({ type: 'warning', message: t('vtt.compendium.window.itemNoEncontrado.text') });
                    }

                } catch (e) {
                    console.error(t('vtt.compendium.window.failedToLoad.errorMessage'), e);
                }
                setIsLoading(false);
            }
        };
        openTarget();
    }, [compendiumTarget, isOpen, canBrowse]);


    const toggleFavorite = (item: DetailItem, category: CompendiumCategory) => {
        if (!item) return;
        // @ts-ignore
        const slug = item.slug;
        const isFav = favorites.some(f => f.slug === slug);

        let newFavs;
        if (isFav) {
            newFavs = favorites.filter(f => f.slug !== slug);
            show({ type: 'info', message: t('vtt.compendium.window.removidoDosFavoritos.text') });
        } else {
            // @ts-ignore
            newFavs = [...favorites, { slug, name: item.name, category, data: item }];
            show({ type: 'success', message: t('vtt.compendium.window.salvoNosFavoritos.successMessage') });
        }
        setFavorites(newFavs);
        localStorage.setItem('questbinder_favorites', JSON.stringify(newFavs));
    };

    const doSearch = useCallback(async (resetPage = false) => {
        if (!canBrowse) return; // Stop search if no perm

        if (activeTab === 'favorites') {
            const filtered = favorites.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
            setResults(filtered);
            setHasNext(false);
            return;
        }

        setIsLoading(true);
        try {
            const p = resetPage ? 1 : page;
            let res;

            switch (activeTab) {
                case 'monsters': res = await compendiumService.searchMonsters(searchQuery, p); break;
                case 'spells': res = await compendiumService.searchSpells(searchQuery, p); break;
                case 'magicitems': res = await compendiumService.searchItems(searchQuery, p); break;
                case 'sections': res = await compendiumService.searchRules(searchQuery); break;
                default: res = { results: [], next: null };
            }

            if (resetPage) {
                setResults(res.results);
                setPage(1);
            } else {
                setResults(prev => [...prev, ...res.results]);
            }
            setHasNext(!!res.next);
        } catch (e) {
            console.error(e);
        }
        setIsLoading(false);
    }, [activeTab, searchQuery, page, favorites, canBrowse]);

    useEffect(() => {
        if (!compendiumTarget) {
            setResults([]);
            setSelectedItem(null);
            doSearch(true);
        }
    }, [activeTab]);

    useEffect(() => {
        const timer = setTimeout(() => {
            doSearch(true);
        }, 600);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        setValidMonsterImage(null);
    }, [selectedItem]);

    // --- DISPLAY LOGIC (Legacy translationService removed) ---
    useEffect(() => {
        if (!selectedItem) {
            setDisplayItem(null);
            return;
        }
        // Note: The legacy API-based translation service was removed.
        // Items are now displayed as-is from the Open5e API (English).
        // PT-BR translations are available via the i18n system for UI labels.
        setDisplayItem(selectedItem);
        setIsTranslating(false);
    }, [selectedItem]);


    const handleLoadMore = () => {
        setPage(prev => prev + 1);
        doSearch(false);
    };

    const distTr = (val: number | string | undefined) => {
        if (val === undefined) return '';
        if (language === 'en') return `${val} ft.`;
        return ftToM(val);
    };

    const handleShareRich = (title: string, content: string, slug: string, category: CompendiumCategory) => {
        const linkMetadata = {
            type: 'compendium' as const,
            label: title,
            compendiumSlug: slug,
            compendiumCategory: category,
            contentMarkdown: content
        };

        sendChatMessage(
            `Compartilhou **${title}**`,
            'system',
            undefined,
            linkMetadata
        );
        show({ type: 'success', message: t('vtt.compendium.window.enviadoAoChat.successMessage') });
    };

    const renderMarkdown = (text: string) => {
        return <div className="prose prose-invert prose-sm max-w-none leading-relaxed text-zinc-300" dangerouslySetInnerHTML={{ __html: formatMarkdown(text) }} />;
    };

    // ... (Detail Renderers: renderMonsterDetail, renderSpellDetail, etc. remain same) ...
    const renderMonsterDetail = (m: ApiMonster) => (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* MONSTER IMAGE WITH FALLBACK */}
            <CompendiumImage
                monster={m}
                onImageFound={(url) => setValidMonsterImage(url)}
            />

            <div className="border-b border-zinc-700 pb-2 mb-2 flex justify-between items-start">
                <div>
                    <h2 className="text-3xl font-fantasy text-red-500 leading-none">{m.name}</h2>
                    <p className="text-sm italic text-zinc-400 capitalize mt-1">{m.size} {m.type}, {m.alignment}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Tooltip content={t('vtt.compendium.window.compartilharFichaInteira.tooltip')}>
                        <button
                            onClick={() => {
                                let fullContent = `**${m.name}**\n*${m.size} ${m.type}, ${m.alignment}*\n\n`;
                                fullContent += `**CA** ${m.armor_class} | **PV** ${m.hit_points} | **Desl.** ${distTr(m.speed.walk)}\n\n`;
                                fullContent += `**STR** ${m.strength} | **DEX** ${m.dexterity} | **CON** ${m.constitution} | **INT** ${m.intelligence} | **WIS** ${m.wisdom} | **CHA** ${m.charisma}\n\n`;
                                if (m.actions) fullContent += t('vtt.compendium.window.aesn.label') + m.actions.map(a => `**${a.name}.** ${a.desc}`).join('\n\n');
                                handleShareRich(m.name, fullContent, m.slug, 'monsters');
                            }}
                            className="p-2 text-zinc-500 hover:text-primary transition-colors"
                        >
                            <Share2 className="w-5 h-5" />
                        </button>
                    </Tooltip>
                    <button
                        // @ts-ignore
                        onClick={() => toggleFavorite(selectedItem, activeTab === 'favorites' ? favorites.find(f => f.slug === m.slug)?.category || 'monsters' : activeTab)}
                        className="p-2 text-zinc-500 hover:text-yellow-400 transition-colors"
                    >
                        {/* @ts-ignore */}
                        <Star className={`w-6 h-6 ${favorites.some(f => f.slug === m.slug) ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                    </button>
                </div>
            </div>

            {/* CORE STATS - Grid */}
            <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-zinc-900 p-2 rounded border border-zinc-800 text-center">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 block">CA</span>
                    <span className="text-lg font-bold text-white flex items-center justify-center gap-1"><Shield className="w-3 h-3" /> {m.armor_class}</span>
                </div>
                <div className="bg-zinc-900 p-2 rounded border border-zinc-800 text-center">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 block">PV</span>
                    <span className="text-lg font-bold text-green-500 flex items-center justify-center gap-1"><Heart className="w-3 h-3" /> {m.hit_points}</span>
                    <span className="text-[10px] text-zinc-500 block -mt-1">({m.hit_dice})</span>
                </div>
                <div className="bg-zinc-900 p-2 rounded border border-zinc-800 text-center">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 block">ND</span>
                    <span className="text-lg font-bold text-yellow-500 flex items-center justify-center gap-1"><Activity className="w-3 h-3" /> {m.challenge_rating}</span>
                </div>
            </div>

            <div className="text-xs text-zinc-400 flex gap-2 flex-wrap">
                <strong className="text-zinc-500 uppercase">{language === 'pt' ? t('vtt.compendium.window.deslocamento.label') : t('vtt.compendium.window.speed.label')}:</strong>
                {Object.entries(m.speed).map(([mode, val]) => (
                    <span key={mode} className="bg-zinc-900 px-1.5 rounded border border-zinc-800">
                        {mode === 'walk' ? (language === 'pt' ? t('vtt.compendium.window.cho.label') : t('vtt.compendium.window.walk.label')) : mode} {distTr(val).replace('m', 'm').replace(' ft.', 'ft')}
                    </span>
                ))}
            </div>

            {/* ATTRIBUTES GRID */}
            <div className="grid grid-cols-6 gap-1 text-center text-xs mb-4 bg-zinc-900/50 p-2 rounded mt-2 border border-zinc-800">
                {[t('vtt.compendium.window.str.label'), t('vtt.compendium.window.dex.label'), t('vtt.compendium.window.con.label'), t('vtt.compendium.window.int.label'), t('vtt.compendium.window.wis.label'), t('vtt.compendium.window.cha.label')].map(stat => {
                    const key = { STR: t('vtt.compendium.window.strength.label'), DEX: t('vtt.compendium.window.dexterity.label'), CON: t('vtt.compendium.window.constitution.label'), INT: t('vtt.compendium.window.intelligence.label'), WIS: t('vtt.compendium.window.wisdom.label'), CHA: t('vtt.compendium.window.charisma.label') }[stat] as keyof ApiMonster;
                    const val = m[key] as number;
                    const mod = Math.floor((val - 10) / 2);
                    return (
                        <div key={stat}>
                            <div className="font-bold text-zinc-500 mb-1">{stat}</div>
                            <div className="text-white font-mono text-sm">{val} <span className="text-zinc-500 text-xs">({mod >= 0 ? '+' : ''}{mod})</span></div>
                        </div>
                    );
                })}
            </div>

            {/* SPECIAL ABILITIES - Collapsible */}
            {m.special_abilities && m.special_abilities.length > 0 && (
                <CompendiumSection title={language === 'pt' ? t('vtt.compendium.window.habilidadesEspeciais.title') : t('vtt.compendium.window.specialAbilities.title')} className="mb-4" icon={<Star className="w-4 h-4 text-amber-500" />}>
                    <div className="space-y-4 text-sm text-zinc-300">
                        {m.special_abilities.map((a, i) => (
                            <div key={i} className="bg-zinc-950/30 p-3 rounded border border-zinc-800/50 group">
                                <div className="flex justify-between items-start">
                                    <strong className="text-white block mb-1">{a.name}</strong>
                                    <button onClick={() => handleShareRich(a.name, a.desc, m.slug, 'monsters')} className="text-zinc-600 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity p-1"><MessageSquare className="w-3 h-3" /></button>
                                </div>
                                <div className="text-zinc-400 leading-relaxed">{renderMarkdown(a.desc)}</div>
                            </div>
                        ))}
                    </div>
                </CompendiumSection>
            )}

            {/* ACTIONS - Collapsible */}
            {m.actions && (
                <CompendiumSection
                    title={language === 'pt' ? t('vtt.compendium.window.aes.title') : t('vtt.compendium.window.actions.title')}
                    className="mb-4"
                    icon={<Skull className="w-4 h-4 text-red-500" />}
                    onShare={() => {
                        const content = m.actions.map(a => `**${a.name}**. ${a.desc}`).join('\n\n');
                        handleShareRich(`${m.name} - Ações`, content, m.slug, 'monsters');
                    }}
                >
                    <div className="space-y-4 text-sm text-zinc-300">
                        {m.actions.map((a, i) => (
                            <div key={i} className="group">
                                <div className="flex items-center justify-between mb-1">
                                    <strong className="text-white italic text-base">{a.name}.</strong>
                                    <button onClick={() => handleShareRich(a.name, a.desc, m.slug, 'monsters')} className="text-zinc-600 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity p-1"><MessageSquare className="w-3.5 h-3.5" /></button>
                                </div>
                                <div className="ml-2 mt-1 text-zinc-300">{renderMarkdown(a.desc)}</div>
                            </div>
                        ))}
                    </div>
                </CompendiumSection>
            )}

            {/* LEGENDARY ACTIONS - Collapsible */}
            {m.legendary_actions && (
                <CompendiumSection
                    title={language === 'pt' ? t('vtt.compendium.window.aesLendrias.title') : t('vtt.compendium.window.legendaryActions.title')}
                    icon={<RotateCw className="w-4 h-4 text-purple-500" />}
                    defaultOpen={false}
                >
                    <div className="space-y-4 text-sm text-zinc-300">
                        {m.legendary_actions.map((a, i) => (
                            <div key={i} className="group">
                                <div className="flex items-center justify-between mb-1">
                                    <strong className="text-white italic text-base">{a.name}.</strong>
                                    <button onClick={() => handleShareRich(a.name, a.desc, m.slug, 'monsters')} className="text-zinc-600 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity p-1"><MessageSquare className="w-3.5 h-3.5" /></button>
                                </div>
                                <div className="ml-2 mt-1 text-zinc-300">{renderMarkdown(a.desc)}</div>
                            </div>
                        ))}
                    </div>
                </CompendiumSection>
            )}

            {isGM && (
                <div className="pt-6 mt-6 border-t border-zinc-800 sticky bottom-0 bg-zinc-950 pb-2">
                    <Button fullWidth onClick={() => {
                        let x = 0, y = 0;
                        if (activeScene && viewport) {
                            const gridSize = activeScene.grid.size;
                            x = Math.floor(((window.innerWidth / 2) - viewport.x) / viewport.zoom / gridSize);
                            y = Math.floor(((window.innerHeight / 2) - viewport.y) / viewport.zoom / gridSize);
                        }

                        // PARSE MOVEMENT (Feet to Meters)
                        // m.speed is object { walk: 30, fly: 60 } etc.
                        // We need a string for the sheet "9m, voo 18m"
                        const speedStr = Object.entries(m.speed).map(([k, v]) => {
                            const valM = Math.round(v * 0.3 * 10) / 10;
                            const label = k === 'walk' ? '' : (language === 'pt' ? (k === 'fly' ? t('vtt.compendium.window.voo.label') : k === 'swim' ? t('vtt.compendium.window.natao.label') : k === 'climb' ? t('vtt.compendium.window.escalada.label') : k) : k) + ' ';
                            return `${label}${valM}m`;
                        }).join(', ');

                        // Physical speed on grid (walk speed or first available)
                        const baseSpeedFeet = m.speed.walk || Object.values(m.speed)[0] || 30;
                        const baseSpeedMeters = Math.round(baseSpeedFeet * 0.3 * 10) / 10;

                        // PARSE DARKVISION
                        let darkvisionRange = 0;
                        if (m.senses) {
                            const dvMatch = m.senses.match(/darkvision\s+(\d+)\s*ft/i) || m.senses.match(/visão no escuro\s+(\d+)\s*m/i);
                            if (dvMatch) {
                                // If it was 'ft', convert. If 'm' (translated), use as is.
                                const val = parseInt(dvMatch[1]);
                                darkvisionRange = m.senses.includes('ft') ? Math.round(val * 0.3) : val;
                            }
                        }

                        // COMPILE NOTES (Markdown)
                        const notesParts = [];
                        if (m.special_abilities) notesParts.push(...m.special_abilities.map(a => `**${a.name}.** ${a.desc}`));
                        if (m.actions) {
                            notesParts.push(t('vtt.compendium.window.aes.label'));
                            notesParts.push(...m.actions.map(a => `**${a.name}.** ${a.desc}`));
                        }
                        if (m.legendary_actions) {
                            notesParts.push(t('vtt.compendium.window.aesLendrias.label'));
                            notesParts.push(...m.legendary_actions.map(a => `**${a.name}.** ${a.desc}`));
                        }

                        // CREATE STATS OBJECT
                        const tokenStats: TokenStats = {
                            ac: m.armor_class,
                            hpFormula: m.hit_dice,
                            speed: speedStr,
                            attributes: {
                                str: m.strength,
                                dex: m.dexterity,
                                con: m.constitution,
                                int: m.intelligence,
                                wis: m.wisdom,
                                cha: m.charisma,
                                cou: 10
                            },
                            alignment: m.alignment,
                            type: `${m.size} ${m.type}`,
                            cr: String(m.challenge_rating),
                            senses: m.senses || '',
                            languages: m.languages || '',
                            notes: notesParts.join('\n\n')
                        };

                        const sizeMap: Record<string, number> = { 'Tiny': 0.5, 'Small': 1, 'Medium': 1, 'Large': 2, 'Huge': 3, 'Gargantuan': 4 };
                        const size = sizeMap[m.size] || 1;

                        console.log('[COMPENDIUM] Invoking token:', { name: m.name, x, y });
                        addToken({
                            name: m.name,
                            type: 'npc',
                            x, y,
                            size: size,
                            imgUrl: validMonsterImage || m.img_main || `https://api.dicebear.com/7.x/initials/svg?seed=${m.name}`,
                            isVisibleToPlayers: true, // Changed to true to match other token creation
                            bars: { bar1: { value: m.hit_points, max: m.hit_points, visible: true } },
                            speed: baseSpeedMeters,
                            darkvisionRange: darkvisionRange,
                            visionRange: 0, // Monsters usually rely on DV or assume standard sight if light exists
                            stats: tokenStats // Populate stats!
                        });
                        sendChatMessage(`Invocou **${m.name}** do Compêndio.`, 'system');
                    }} className="shadow-lg shadow-primary/20">{t('vtt.compendium.window.invocarToken.text')}</Button>
                </div>
            )}
        </div>
    );

    const renderSpellDetail = (s: ApiSpell) => (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="border-b border-zinc-700 pb-2 mb-2 flex justify-between items-start">
                <div>
                    <h2 className="text-3xl font-fantasy text-purple-400 leading-none">{s.name}</h2>
                    <p className="text-sm italic text-zinc-400 mt-1">{s.level} {s.school}</p>
                </div>
                <button
                    // @ts-ignore
                    onClick={() => toggleFavorite(selectedItem, activeTab === 'favorites' ? favorites.find(f => f.slug === s.slug)?.category || 'spells' : activeTab)}
                    className="p-2 text-zinc-500 hover:text-yellow-400 transition-colors"
                >
                    {/* @ts-ignore */}
                    <Star className={`w-6 h-6 ${favorites.some(f => f.slug === s.slug) ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                </button>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-zinc-300 bg-zinc-900/50 p-3 rounded border border-zinc-800">
                <div><strong className="text-zinc-500 uppercase text-[10px]">{language === 'pt' ? t('vtt.compendium.window.tempo.label') : t('vtt.compendium.window.castingTime.label')}</strong> <span className="block">{s.casting_time}</span></div>
                <div><strong className="text-zinc-500 uppercase text-[10px]">{language === 'pt' ? t('vtt.compendium.window.alcance.label') : t('vtt.compendium.window.range.label')}</strong> <span className="block">{s.range}</span></div>
                <div><strong className="text-zinc-500 uppercase text-[10px]">{language === 'pt' ? t('vtt.compendium.window.durao.label') : t('vtt.compendium.window.duration.label')}</strong> <span className="block">{s.duration}</span></div>
                <div><strong className="text-zinc-500 uppercase text-[10px]">{language === 'pt' ? t('vtt.compendium.window.componentes.label') : t('vtt.compendium.window.components.label')}</strong> <span className="block">{s.components}</span></div>
            </div>

            <div className="mt-4">
                {renderMarkdown(s.desc)}
            </div>

            {s.higher_level && (
                <div className="mt-4 p-3 bg-purple-900/10 border border-purple-500/20 rounded">
                    <strong className="text-purple-300 block text-xs uppercase mb-1">{language === 'pt' ? t('vtt.compendium.window.emNveisSuperiores.text') : t('vtt.compendium.window.atHigherLevels.text')}</strong>
                    <p className="text-sm text-zinc-300">{s.higher_level}</p>
                </div>
            )}
            <div className="grid grid-cols-2 gap-3 pt-4 mt-4 border-t border-zinc-800">
                <Button variant="outline" fullWidth onClick={() => sendChatMessage(`Compartilhou a magia **${s.name}**`, 'message', undefined, { type: 'spell', label: s.name, data: { ...s, level: s.level_int }, compendiumSlug: s.slug, compendiumCategory: 'spells' })}>
                    <ExternalLink className="w-4 h-4 mr-2" />{t('vtt.compendium.window.linkCard.text')}</Button>
                <Button variant="ghost" fullWidth onClick={() => handleShareRich(s.name, s.desc, s.slug, 'spells')}>
                    <MessageSquare className="w-4 h-4 mr-2" />{t('vtt.compendium.window.textoCompleto.text')}</Button>
            </div>
        </div>
    );

    const renderItemDetail = (i: ApiMagicItem) => (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="border-b border-zinc-700 pb-2 mb-2 flex justify-between items-start">
                <div>
                    <h2 className="text-3xl font-fantasy text-amber-400 leading-none">{i.name}</h2>
                    <p className="text-sm italic text-zinc-400 mt-1">{i.rarity}, {i.type}</p>
                </div>
                <button
                    // @ts-ignore
                    onClick={() => toggleFavorite(selectedItem, activeTab === 'favorites' ? favorites.find(f => f.slug === i.slug)?.category || 'magicitems' : activeTab)}
                    className="p-2 text-zinc-500 hover:text-yellow-400 transition-colors"
                >
                    {/* @ts-ignore */}
                    <Star className={`w-6 h-6 ${favorites.some(f => f.slug === i.slug) ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                </button>
            </div>
            {i.requires_attunement && (
                <div className="bg-amber-900/20 text-amber-200 px-3 py-1.5 rounded text-xs font-bold border border-amber-700/30 inline-block">
                    {language === 'pt' ? t('vtt.compendium.window.requerSintonizao.text') : t('vtt.compendium.window.requiresAttunement.text')}
                </div>
            )}
            <div className="mt-4">
                {renderMarkdown(i.desc)}
            </div>
            <div className="grid grid-cols-2 gap-3 pt-4 mt-4 border-t border-zinc-800">
                <Button variant="outline" fullWidth onClick={() => sendChatMessage(`Compartilhou o item **${i.name}**`, 'message', undefined, { type: 'item', label: i.name, data: { name: i.name, qty: 1, description: i.desc }, compendiumSlug: i.slug, compendiumCategory: 'magicitems' })}>
                    <ExternalLink className="w-4 h-4 mr-2" />{t('vtt.compendium.window.linkCard.text')}</Button>
                <Button variant="ghost" fullWidth onClick={() => handleShareRich(i.name, i.desc, i.slug, 'magicitems')}>
                    <MessageSquare className="w-4 h-4 mr-2" />{t('vtt.compendium.window.textoCompleto.text')}</Button>
            </div>
        </div>
    );

    const renderRuleDetail = (r: ApiSection) => (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex justify-between items-start border-b border-zinc-700 pb-2">
                <h2 className="text-3xl font-fantasy text-zinc-200">{r.name}</h2>
                <div className="flex items-center gap-2">
                    <button onClick={() => handleShareRich(r.name, r.desc, r.slug, 'sections')} className="p-2 text-zinc-500 hover:text-primary transition-colors" title={t('vtt.compendium.window.compartilharRegra.title')}>
                        <MessageSquare className="w-5 h-5" />
                    </button>
                    <button
                        // @ts-ignore
                        onClick={() => toggleFavorite(selectedItem, activeTab === 'favorites' ? favorites.find(f => f.slug === r.slug)?.category || 'sections' : activeTab)}
                        className="p-2 text-zinc-500 hover:text-yellow-400 transition-colors"
                    >
                        {/* @ts-ignore */}
                        <Star className={`w-6 h-6 ${favorites.some(f => f.slug === r.slug) ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                    </button>
                </div>
            </div>
            <div className="mt-2">
                {renderMarkdown(r.desc)}
            </div>
        </div>
    );

    if (!isOpen) return null;

    return (
        <DraggableWindow
            isOpen={isOpen}
            onClose={onClose}
            title={t('vtt.compendium.window.grimrioDoConhecimento.title')}
            icon={<Book className="w-4 h-4 text-primary" />}
            initialSize={{ w: 900, h: 650 }}
            initialPosition={{ x: 50, y: 50 }}
            className="bg-zinc-950 border-zinc-800 shadow-2xl"
        >
            {canBrowse ? (
                <div className="flex h-full overflow-hidden text-white">

                    {/* SIDEBAR - CATEGORIES */}
                    <div className="w-16 md:w-48 border-r border-zinc-800 bg-zinc-900 flex flex-col shrink-0">
                        {[
                            { id: 'monsters', label: t('vtt.compendium.window.bestirio.label'), icon: <Skull className="w-5 h-5" /> },
                            { id: 'spells', label: 'Magias', icon: <Zap className="w-5 h-5" /> },
                            { id: 'magicitems', label: t('vtt.compendium.window.tesouros.label'), icon: <Backpack className="w-5 h-5" /> },
                            { id: 'sections', label: t('vtt.compendium.window.regras.label'), icon: <Scale className="w-5 h-5" /> },
                        ].map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => { setActiveTab(cat.id as CompendiumCategory); setSelectedItem(null); setDisplayItem(null); }}
                                className={`flex items-center gap-3 p-4 transition-all hover:bg-zinc-800 ${activeTab === cat.id ? 'bg-primary/10 border-r-2 border-primary text-white' : 'text-zinc-500'}`}
                            >
                                {cat.icon}
                                <span className="hidden md:inline font-bold text-sm">{cat.label}</span>
                            </button>
                        ))}

                        <div className="h-px bg-zinc-800 my-2" />

                        <button
                            onClick={() => { setActiveTab('favorites'); setSelectedItem(null); setDisplayItem(null); }}
                            className={`flex items-center gap-3 p-4 transition-all hover:bg-zinc-800 ${activeTab === 'favorites' ? 'bg-yellow-500/10 border-r-2 border-yellow-500 text-yellow-100' : 'text-zinc-500'}`}
                        >
                            <Bookmark className={`w-5 h-5 ${activeTab === 'favorites' ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                            <span className="hidden md:inline font-bold text-sm">{t('vtt.compendium.window.favoritos.label')}</span>
                        </button>
                    </div>

                    {/* LIST AREA */}
                    <div className={`${selectedItem ? 'hidden lg:flex' : 'flex'} w-full lg:w-80 flex-col border-r border-zinc-800 bg-zinc-900/50 shrink-0`}>
                        <div className="p-3 border-b border-zinc-800 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                                    {activeTab === 'favorites' ? `Salvos (${favorites.length})` : t('vtt.compendium.window.buscar.label')}
                                </span>
                                {/* LANGUAGE TOGGLE */}
                                <div className="flex bg-zinc-950 rounded-lg border border-zinc-800 p-0.5">
                                    <button onClick={() => setLanguage('pt')} className={`px-2 py-0.5 text-xs font-bold rounded-md transition-colors ${language === 'pt' ? 'bg-green-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>PT</button>
                                    <button onClick={() => setLanguage('en')} className={`px-2 py-0.5 text-xs font-bold rounded-md transition-colors ${language === 'en' ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>EN</button>
                                </div>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                <input
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-2 py-2 text-sm text-white focus:border-primary outline-none"
                                    placeholder={language === 'pt' ? t('vtt.compendium.window.buscar.placeholder') : t('vtt.compendium.window.search.placeholder')}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                            {isLoading && results.length === 0 && <div className="text-center p-4 text-zinc-500 text-sm">{t('vtt.compendium.window.invocandoSabedoria.text')}</div>}
                            {activeTab === 'favorites' && results.length === 0 && !isLoading && (
                                <div className="text-center p-8 text-zinc-500 text-sm italic">
                                    {searchQuery ? t('vtt.compendium.window.nadaEncontrado.text') : t('vtt.compendium.window.nenhumFavoritoSalvo.text')}
                                </div>
                            )}
                            {results.map((item, idx) => {
                                // Handle difference between API result and Favorite Item structure
                                const isFavItem = activeTab === 'favorites';
                                const data = isFavItem ? (item as FavoriteItem).data : item;
                                const name = item.name;
                                const slug = item.slug;
                                // Safe cast to access potential category if it's a favorite item
                                const categoryLabel = isFavItem ? ((item as FavoriteItem).category || '').substring(0, 3) : '';

                                return (
                                    <button
                                        key={slug || idx}
                                        onClick={() => setSelectedItem(data)}
                                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center justify-between group transition-all ${selectedItem && (selectedItem as any).slug === slug ? 'bg-zinc-800 text-white font-bold shadow-sm' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'}`}
                                    >
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            {isFavItem && (
                                                <span className="text-[9px] bg-zinc-950 border border-zinc-800 px-1 rounded text-zinc-600 uppercase">
                                                    {categoryLabel}
                                                </span>
                                            )}
                                            {/* Small icon indicator if monster has image */}
                                            {item.img_main && <ImageIcon className="w-3 h-3 text-zinc-500" />}
                                            <span className="truncate">{name}</span>
                                        </div>
                                        <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                    </button>
                                );
                            })}
                            {hasNext && activeTab !== 'favorites' && (
                                <Button variant="ghost" size="sm" fullWidth onClick={handleLoadMore} disabled={isLoading}>
                                    {isLoading ? t('vtt.compendium.window.carregando.label') : t('vtt.compendium.window.carregarMais.text')}
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* DETAIL AREA */}
                    <div className={`flex-1 bg-zinc-950 p-6 overflow-y-auto custom-scrollbar relative ${selectedItem ? 'flex' : 'hidden lg:flex'} flex-col`}>
                        {selectedItem ? (
                            <>
                                <button onClick={() => { setSelectedItem(null); setDisplayItem(null); }} className="lg:hidden absolute top-4 right-4 text-zinc-500 hover:text-white">{t('vtt.compendium.window.fechar.label')}</button>

                                {isTranslating ? (
                                    <div className="flex flex-col items-center justify-center h-full text-primary animate-pulse gap-3">
                                        <div className="relative">
                                            <Loader2 className="w-12 h-12 animate-spin" />
                                            <RotateCw className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-reverse-spin opacity-50" />
                                        </div>
                                        <p className="text-sm font-fantasy tracking-widest">{t('vtt.compendium.window.decifrandoRunasAntigas.text')}</p>
                                        <p className="text-xs text-zinc-500">{t('vtt.compendium.window.consultandoOrculosDe.text')}</p>
                                    </div>
                                ) : displayItem ? (
                                    <div className="max-w-3xl mx-auto w-full">
                                        {activeTab === 'monsters' || (activeTab === 'favorites' && (selectedItem as any).hit_points) ? renderMonsterDetail(displayItem as ApiMonster) : null}
                                        {activeTab === 'spells' || (activeTab === 'favorites' && (selectedItem as any).school) ? renderSpellDetail(displayItem as ApiSpell) : null}
                                        {activeTab === 'magicitems' || (activeTab === 'favorites' && (selectedItem as any).rarity) ? renderItemDetail(displayItem as ApiMagicItem) : null}
                                        {activeTab === 'sections' || (activeTab === 'favorites' && (selectedItem as any).parent) ? renderRuleDetail(displayItem as ApiSection) : null}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-red-400">{t('vtt.compendium.window.erroAoCarregar.text')}</div>
                                )}
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-zinc-700">
                                <Book className="w-24 h-24 mb-6 opacity-10" />
                                <p className="text-xl font-fantasy opacity-50">{t('vtt.compendium.window.selecioneUmItem.text')}</p>
                                <p className="text-sm text-zinc-600 mt-2">{t('vtt.compendium.window.busquePorMonstros.text')}</p>
                            </div>
                        )}
                    </div>

                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                    <Lock className="w-16 h-16 mb-4 opacity-20" />
                    <h3 className="text-lg font-bold text-zinc-300">{t('vtt.compendium.window.acessoRestrito.text')}</h3>
                    <p className="text-sm">{t('vtt.compendium.window.oMestreBloqueou.text')}</p>
                </div>
            )}
        </DraggableWindow>
    );
};
