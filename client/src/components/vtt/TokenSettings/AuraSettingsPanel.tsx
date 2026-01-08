import React, { useState, useMemo } from 'react';
import { Aura, CombatEffect, CombatCondition, Token } from '../../../types';
import { Button } from '../../ui/Button';
import { SheetInput, SheetLabel, SheetSelect } from '../../ui/SheetPrimitives';
import { Counter } from '../../ui/Counter';
import { ColorPicker } from '../../ui/ColorPicker';
import { Plus, Trash2, Edit2, Shield, Zap, Activity, Circle, Square, Users, User, Skull, Target, Check, Ban, ChevronDown, ChevronLeft, X } from 'lucide-react';
import { STATUS_RULES } from '../../../data/rules';
import { v4 as uuidv4 } from 'uuid';
import { calculateDistance } from '../../../utils/geometry';
import { AURA_TEMPLATES, createAuraFromTemplate } from '../../../data/auraTemplates';

interface AuraSettingsPanelProps {
  auras: Aura[];
  onChange: (auras: Aura[]) => void;
  sceneTokens: Token[];
  parentToken: Token;
}

export const AuraSettingsPanel: React.FC<AuraSettingsPanelProps> = ({ auras, onChange, sceneTokens, parentToken }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  const handleAddAura = (template?: any) => {
    let newAura: Aura;

    if (template) {
      newAura = createAuraFromTemplate(template);
    } else {
      newAura = {
        id: uuidv4(),
        name: 'Nova Aura',
        radius: 3,
        color: '#fbbf24',
        shape: 'circle',
        effects: [],
        targets: 'allies',
        active: true,
        includedTokenIds: [],
        excludedTokenIds: [],
        category: 'support',
        trigger: 'Constante'
      };
    }

    onChange([...auras, newAura]);
    setEditingId(newAura.id);
    setShowTemplates(false);
  };

  const handleUpdateAura = (id: string, updates: Partial<Aura>) => {
    onChange(auras.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const handleDeleteAura = (id: string) => {
    onChange(auras.filter(a => a.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const handleAddEffect = (auraId: string) => {
    const aura = auras.find(a => a.id === auraId);
    if (!aura) return;

    const newEffect: CombatEffect = {
      id: uuidv4(),
      name: 'Efeito da Aura',
      duration: { type: 'permanent', value: 0, remaining: 0 },
      modifiers: {},
      conditions: []
    };
    handleUpdateAura(auraId, { effects: [...aura.effects, newEffect] });
  };

  const handleUpdateEffect = (auraId: string, effectId: string, updates: Partial<CombatEffect>) => {
    const aura = auras.find(a => a.id === auraId);
    if (!aura) return;

    const newEffects = aura.effects.map(e => e.id === effectId ? { ...e, ...updates } : e);
    handleUpdateAura(auraId, { effects: newEffects });
  };

  const handleDeleteEffect = (auraId: string, effectId: string) => {
    const aura = auras.find(a => a.id === auraId);
    if (!aura) return;

    const newEffects = aura.effects.filter(e => e.id !== effectId);
    handleUpdateAura(auraId, { effects: newEffects });
  };

  const editingAura = auras.find(a => a.id === editingId);

  // Targeting Logic for UI
  const targetsInRange = useMemo(() => {
    if (!editingAura || !parentToken) return [];

    return sceneTokens.filter(t => {
      if (t.id === parentToken.id) return false;

      const dist = calculateDistance(
        { x: parentToken.x, y: parentToken.y },
        { x: t.x, y: t.y },
        'euclidean'
      );
      const radiusInSquares = editingAura.radius / 1.5;
      return dist <= radiusInSquares;
    });
  }, [editingAura, sceneTokens, parentToken]);

  const getTargetStatus = (token: Token, aura: Aura) => {
    if (aura.excludedTokenIds?.includes(token.id)) return 'excluded';
    if (aura.includedTokenIds?.includes(token.id)) return 'included';

    const sourceDisp = parentToken.disposition || (parentToken.type === 'pc' ? 'friendly' : 'hostile');
    const targetDisp = token.disposition || (token.type === 'pc' ? 'friendly' : 'hostile');

    if (aura.targets === 'all') return 'auto-hit';
    if (aura.targets === 'allies' && sourceDisp === targetDisp) return 'auto-hit';
    if (aura.targets === 'enemies' && sourceDisp !== targetDisp) return 'auto-hit';

    return 'auto-miss';
  };

  const toggleInclude = (tokenId: string) => {
    if (!editingAura) return;
    const isIncluded = editingAura.includedTokenIds?.includes(tokenId);
    const newIncluded = isIncluded
      ? editingAura.includedTokenIds?.filter(id => id !== tokenId)
      : [...(editingAura.includedTokenIds || []), tokenId];

    const newExcluded = editingAura.excludedTokenIds?.filter(id => id !== tokenId);
    handleUpdateAura(editingAura.id, { includedTokenIds: newIncluded, excludedTokenIds: newExcluded });
  };

  const toggleExclude = (tokenId: string) => {
    if (!editingAura) return;
    const isExcluded = editingAura.excludedTokenIds?.includes(tokenId);
    const newExcluded = isExcluded
      ? editingAura.excludedTokenIds?.filter(id => id !== tokenId)
      : [...(editingAura.excludedTokenIds || []), tokenId];

    const newIncluded = editingAura.includedTokenIds?.filter(id => id !== tokenId);
    handleUpdateAura(editingAura.id, { excludedTokenIds: newExcluded, includedTokenIds: newIncluded });
  };

  const bulkAction = (action: 'include-allies' | 'exclude-enemies') => {
    if (!editingAura) return;
    const sourceDisp = parentToken.disposition || (parentToken.type === 'pc' ? 'friendly' : 'hostile');

    let newIncluded = [...(editingAura.includedTokenIds || [])];
    let newExcluded = [...(editingAura.excludedTokenIds || [])];

    targetsInRange.forEach(t => {
      const targetDisp = t.disposition || (t.type === 'pc' ? 'friendly' : 'hostile');
      if (action === 'include-allies' && sourceDisp === targetDisp) {
        if (!newIncluded.includes(t.id)) newIncluded.push(t.id);
        newExcluded = newExcluded.filter(id => id !== t.id);
      }
      if (action === 'exclude-enemies' && sourceDisp !== targetDisp) {
        if (!newExcluded.includes(t.id)) newExcluded.push(t.id);
        newIncluded = newIncluded.filter(id => id !== t.id);
      }
    });
    handleUpdateAura(editingAura.id, { includedTokenIds: newIncluded, excludedTokenIds: newExcluded });
  };

  // Group templates by category
  const groupedTemplates = useMemo(() => {
    const groups: Record<string, typeof AURA_TEMPLATES> = {
      'offensive': [],
      'defensive': [],
      'support': [],
      'control': [],
      'other': []
    };

    AURA_TEMPLATES.forEach(t => {
      const cat = t.category || 'other';
      if (groups[cat]) groups[cat].push(t);
      else groups['other'].push(t);
    });
    return groups;
  }, []);

  const getCategoryColor = (cat?: string) => {
    switch (cat) {
      case 'offensive': return 'text-red-400 border-red-400/30 bg-red-400/10';
      case 'defensive': return 'text-blue-400 border-blue-400/30 bg-blue-400/10';
      case 'support': return 'text-violet-400 border-violet-400/30 bg-violet-400/10';
      case 'control': return 'text-amber-400 border-amber-400/30 bg-amber-400/10';
      default: return 'text-zinc-400 border-zinc-700 bg-zinc-800';
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full gap-0 md:gap-4 relative">
      {/* List Panel - Hidden on mobile when editing */}
      <div className={`
        w-full md:w-1/3 border-b md:border-b-0 md:border-r border-zinc-800 
        p-2 md:pr-4 md:p-0 flex flex-col gap-2
        ${editingId ? 'hidden md:flex' : 'flex'}
      `}>
        <div className="relative">
          <Button size="sm" type="button" onClick={() => setShowTemplates(!showTemplates)} className="w-full mb-2 flex justify-between items-center">
            <span className="flex items-center"><Plus className="w-4 h-4 mr-2" /> Nova Aura</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showTemplates ? 'rotate-180' : ''}`} />
          </Button>

          {showTemplates && (
            <div className="absolute top-full left-0 w-full z-50 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl max-h-80 overflow-y-auto custom-scrollbar p-1">
              <button
                type="button"
                onClick={() => handleAddAura()}
                className="w-full text-left px-3 py-2 text-xs text-white hover:bg-zinc-800 rounded flex items-center gap-2"
              >
                <Edit2 className="w-3 h-3" /> Personalizada
              </button>

              {Object.entries(groupedTemplates).map(([cat, templates]) => {
                if (templates.length === 0) return null;
                return (
                  <div key={cat}>
                    <div className="h-px bg-zinc-800 my-1" />
                    <div className="px-2 py-1 text-[10px] font-bold text-zinc-500 uppercase">{cat === 'other' ? 'Outros' : cat}</div>
                    {templates.map((tpl, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleAddAura(tpl)}
                        className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 rounded hover:text-white group"
                      >
                        <div className="font-bold flex items-center justify-between">
                          {tpl.name}
                          <span className="text-[9px] opacity-50 font-normal">{tpl.radius}m</span>
                        </div>
                        <div className="text-[10px] text-zinc-500 truncate group-hover:text-zinc-400">{tpl.description}</div>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
          {auras.length === 0 && <p className="text-xs text-zinc-500 text-center py-4">Nenhuma aura configurada.</p>}
          {auras.map(aura => (
            <div
              key={aura.id}
              onClick={() => setEditingId(aura.id)}
              className={`p-2 sm:p-3 rounded-lg border cursor-pointer transition-all ${editingId === aura.id ? 'bg-primary/10 border-primary' : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800'}`}
            >
              <div className="flex justify-between items-center gap-2">
                <span className="font-bold text-sm text-white truncate flex-1">{aura.name}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-zinc-400">{aura.radius}m</span>
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: aura.color }} />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-500">
                {aura.category && (
                  <span className={`px-1 rounded border ${getCategoryColor(aura.category)} uppercase`}>{aura.category}</span>
                )}
                <span className="flex items-center gap-0.5">
                  {aura.targets === 'allies' ? <Users className="w-3 h-3" /> : aura.targets === 'enemies' ? <Skull className="w-3 h-3" /> : <User className="w-3 h-3" />}
                  {aura.targets}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editor Panel - Full screen overlay on mobile */}
      <div className={`
        ${editingId ? 'flex' : 'hidden md:flex'}
        fixed inset-0 md:relative md:inset-auto
        bg-zinc-900 md:bg-transparent
        flex-1 flex-col overflow-hidden z-50 md:z-auto
      `}>
        {editingAura ? (
          <div className="flex flex-col h-full">
            {/* Mobile Header with Back Button */}
            <div className="md:hidden flex items-center justify-between p-3 border-b border-zinc-800 bg-zinc-950 shrink-0">
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white"
              >
                <ChevronLeft className="w-5 h-5" /> Voltar
              </button>
              <Button size="sm" variant="destructive" type="button" onClick={() => handleDeleteAura(editingAura.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Desktop Header */}
            <div className="hidden md:flex justify-between items-center border-b border-zinc-800 pb-2 mb-4">
              <h3 className="font-bold text-white flex items-center gap-2"><Edit2 className="w-4 h-4" /> Editando Aura</h3>
              <Button size="icon" variant="destructive" type="button" onClick={() => handleDeleteAura(editingAura.id)}><Trash2 className="w-4 h-4" /></Button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-0 md:pr-2 space-y-4">
              {/* Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SheetInput label="Nome da Aura" value={editingAura.name} onChange={e => handleUpdateAura(editingAura.id, { name: e.target.value })} />
                <div className="space-y-1">
                  <SheetLabel>Categoria</SheetLabel>
                  <SheetSelect
                    value={editingAura.category || 'support'}
                    onChange={v => handleUpdateAura(editingAura.id, { category: v as any })}
                    options={[
                      { label: 'Ofensiva', value: 'offensive' },
                      { label: 'Defensiva', value: 'defensive' },
                      { label: 'Suporte', value: 'support' },
                      { label: 'Controle', value: 'control' }
                    ]}
                    variant="box"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <SheetLabel>Descrição / Efeito Narrativo</SheetLabel>
                <textarea
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-xs text-zinc-300 focus:ring-1 focus:ring-primary focus:border-primary outline-none resize-none h-16"
                  value={editingAura.description || ''}
                  onChange={e => handleUpdateAura(editingAura.id, { description: e.target.value })}
                  placeholder="Descreva o efeito da aura..."
                />
              </div>

              {/* Trigger & Requirements */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SheetInput label="Gatilho" value={editingAura.trigger || ''} onChange={e => handleUpdateAura(editingAura.id, { trigger: e.target.value })} placeholder="Ex: Início do turno" />
                <SheetInput label="Requisitos" value={editingAura.requirements?.join(', ') || ''} onChange={e => handleUpdateAura(editingAura.id, { requirements: e.target.value.split(',').map(s => s.trim()) })} placeholder="Ex: Consciente" />
              </div>

              {/* Radius & Shape */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <SheetLabel>Raio (metros)</SheetLabel>
                  <Counter value={editingAura.radius} onChange={v => handleUpdateAura(editingAura.id, { radius: v })} min={0.5} max={100} step={0.5} className="bg-zinc-950" />
                </div>
                <div className="space-y-1">
                  <SheetLabel>Formato</SheetLabel>
                  <div className="flex bg-zinc-950 rounded-lg p-1 border border-zinc-800">
                    <button type="button" onClick={() => handleUpdateAura(editingAura.id, { shape: 'circle' })} className={`flex-1 flex items-center justify-center py-2 rounded ${editingAura.shape === 'circle' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}><Circle className="w-4 h-4" /></button>
                    <button type="button" onClick={() => handleUpdateAura(editingAura.id, { shape: 'square' })} className={`flex-1 flex items-center justify-center py-2 rounded ${editingAura.shape === 'square' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}><Square className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>

              {/* Targets & Color */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <SheetLabel>Alvos</SheetLabel>
                  <SheetSelect
                    value={editingAura.targets}
                    onChange={v => handleUpdateAura(editingAura.id, { targets: v as any })}
                    options={[
                      { label: 'Aliados', value: 'allies' },
                      { label: 'Inimigos', value: 'enemies' },
                      { label: 'Todos', value: 'all' },
                      { label: 'Apenas Eu', value: 'self' }
                    ]}
                    variant="box"
                  />
                </div>
                <div className="space-y-1">
                  <SheetLabel>Cor</SheetLabel>
                  <ColorPicker value={editingAura.color} onChange={v => handleUpdateAura(editingAura.id, { color: v })} className="w-full" />
                </div>
              </div>

              {/* Active & Visible Toggles */}
              <div className="flex flex-wrap gap-3 p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingAura.active}
                    onChange={e => handleUpdateAura(editingAura.id, { active: e.target.checked })}
                    className="rounded border-zinc-700 bg-zinc-900 text-primary focus:ring-primary"
                  />
                  <span className="text-xs font-bold text-white">Ativa</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingAura.visible !== false}
                    onChange={e => handleUpdateAura(editingAura.id, { visible: e.target.checked })}
                    className="rounded border-zinc-700 bg-zinc-900 text-primary focus:ring-primary"
                  />
                  <span className="text-xs font-bold text-white">Visível (Jogadores)</span>
                </label>
              </div>

              {/* Targeting Preview */}
              <div className="space-y-2 border-t border-zinc-800 pt-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <SheetLabel icon={<Target className="w-3 h-3" />}>Alvos no Alcance ({targetsInRange.length})</SheetLabel>
                  <div className="flex gap-2">
                    <Button size="xs" variant="ghost" type="button" onClick={() => bulkAction('include-allies')} title="Forçar inclusão de todos aliados">
                      <Check className="w-3 h-3 mr-1" /> Aliados
                    </Button>
                    <Button size="xs" variant="ghost" type="button" onClick={() => bulkAction('exclude-enemies')} title="Forçar exclusão de todos inimigos">
                      <Ban className="w-3 h-3 mr-1" /> Inimigos
                    </Button>
                  </div>
                </div>
                <div className="bg-zinc-950/50 rounded-lg border border-zinc-800 max-h-32 overflow-y-auto custom-scrollbar p-1">
                  {targetsInRange.length === 0 && <p className="text-xs text-zinc-600 text-center py-2">Nenhum token no alcance.</p>}
                  {targetsInRange.map(t => {
                    const status = getTargetStatus(t, editingAura);
                    const isIncluded = status === 'included';
                    const isExcluded = status === 'excluded';
                    const isHit = status === 'auto-hit' || isIncluded;

                    return (
                      <div key={t.id} className={`flex items-center justify-between p-2 rounded mb-1 ${isHit ? 'bg-primary/5' : 'bg-zinc-900/50'}`}>
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${isHit ? 'bg-green-500' : 'bg-zinc-600'}`} />
                          <span className={`text-xs font-bold truncate ${isHit ? 'text-white' : 'text-zinc-500'}`}>{t.name}</span>
                          <span className="text-[9px] text-zinc-600 uppercase shrink-0 hidden sm:inline">({t.disposition || (t.type === 'pc' ? 'Aliado' : 'Inimigo')})</span>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button type="button" onClick={() => toggleInclude(t.id)} className={`p-1.5 rounded ${isIncluded ? 'bg-green-500 text-white' : 'text-zinc-600 hover:bg-zinc-800'}`} title="Forçar Incluir"><Check className="w-3 h-3" /></button>
                          <button type="button" onClick={() => toggleExclude(t.id)} className={`p-1.5 rounded ${isExcluded ? 'bg-red-500 text-white' : 'text-zinc-600 hover:bg-zinc-800'}`} title="Forçar Excluir"><Ban className="w-3 h-3" /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Effects Section */}
              <div className="border-t border-zinc-800 pt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <SheetLabel icon={<Zap className="w-3 h-3" />}>Efeitos Aplicados</SheetLabel>
                  <Button size="xs" variant="secondary" type="button" onClick={() => handleAddEffect(editingAura.id)}><Plus className="w-3 h-3 mr-1" /> Efeito</Button>
                </div>

                {editingAura.effects.map((effect) => (
                  <div key={effect.id} className="bg-zinc-950/50 border border-zinc-800 rounded-lg p-3 space-y-3">
                    <div className="flex justify-between items-center gap-2">
                      <input
                        className="bg-transparent border-none font-bold text-sm text-white focus:ring-0 p-0 w-full outline-none"
                        value={effect.name}
                        onChange={e => handleUpdateEffect(editingAura.id, effect.id, { name: e.target.value })}
                        placeholder="Nome do Efeito"
                      />
                      <button type="button" onClick={() => handleDeleteEffect(editingAura.id, effect.id)} className="text-zinc-600 hover:text-red-500 shrink-0"><Trash2 className="w-4 h-4" /></button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Mod. AC</label>
                        <input
                          type="number"
                          className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white"
                          value={effect.modifiers?.ac || 0}
                          onChange={e => handleUpdateEffect(editingAura.id, effect.id, { modifiers: { ...effect.modifiers, ac: Number(e.target.value) } })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Mod. Speed</label>
                        <input
                          type="number"
                          className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white"
                          value={effect.modifiers?.speed || 0}
                          onChange={e => handleUpdateEffect(editingAura.id, effect.id, { modifiers: { ...effect.modifiers, speed: Number(e.target.value) } })}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase">Condições</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 max-h-28 overflow-y-auto custom-scrollbar p-1">
                        {Object.keys(STATUS_RULES).map(cond => {
                          const isActive = effect.conditions?.includes(cond as CombatCondition);
                          return (
                            <button
                              key={cond}
                              type="button"
                              onClick={() => {
                                const current = effect.conditions || [];
                                const newConds = isActive ? current.filter(c => c !== cond) : [...current, cond as CombatCondition];
                                handleUpdateEffect(editingAura.id, effect.id, { conditions: newConds });
                              }}
                              className={`px-2 py-1.5 text-[10px] rounded border text-center truncate ${isActive ? 'bg-primary/20 border-primary text-primary' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800'}`}
                            >
                              {STATUS_RULES[cond].name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
                {editingAura.effects.length === 0 && <p className="text-xs text-zinc-600 italic">Nenhum efeito configurado. A aura será apenas visual.</p>}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-zinc-600 p-8">
            <Shield className="w-12 h-12 mb-2 opacity-20" />
            <p className="text-sm text-center">Selecione ou crie uma aura para editar.</p>
          </div>
        )}
      </div>
    </div>
  );
};
