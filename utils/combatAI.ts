import { CombatState, Combatant, CombatEffect } from '../types';

export type SuggestionType = 'action' | 'warning' | 'tip' | 'reminder';
export type SuggestionPriority = 'low' | 'medium' | 'high' | 'critical';

export interface CombatSuggestion {
  id: string;
  type: SuggestionType;
  priority: SuggestionPriority;
  title: string;
  description: string;
  icon?: string;
  targetId?: string; // ID do combatente relacionado
  action?: {
    label: string;
    callback: () => void;
  };
}

/**
 * Gera sugestões inteligentes baseadas no estado atual do combate
 */
export function getCombatSuggestions(
  combat: CombatState,
  activeCombatant: Combatant,
  isGM: boolean
): CombatSuggestion[] {
  const suggestions: CombatSuggestion[] = [];

  if (!combat.settings.enableSuggestions) {
    return suggestions;
  }

  // ==================== HP CRÍTICO ====================

  combat.turnOrder.forEach(combatant => {
    if (!combatant.hp || !combatant.maxHp) return;

    const hpPercentage = (combatant.hp / combatant.maxHp) * 100;

    // HP Crítico (< 25%)
    if (hpPercentage < 25 && hpPercentage > 0) {
      suggestions.push({
        id: `low-hp-${combatant.id}`,
        type: 'warning',
        priority: hpPercentage < 10 ? 'critical' : 'high',
        title: `${combatant.name} está com HP crítico!`,
        description: `${combatant.hp}/${combatant.maxHp} HP (${Math.round(hpPercentage)}%)`,
        icon: '❤️',
        targetId: combatant.id
      });
    }

    // Morto mas não removido
    if (combatant.hp === 0 && !combatant.conditions.includes('dead')) {
      suggestions.push({
        id: `dead-${combatant.id}`,
        type: 'warning',
        priority: 'high',
        title: `${combatant.name} está em 0 HP`,
        description: 'Considere adicionar a condição "dead" ou remover do combate',
        icon: '💀',
        targetId: combatant.id
      });
    }
  });

  // ==================== EFEITOS EXPIRANDO ====================

  combat.turnOrder.forEach(combatant => {
    combatant.effects.forEach(effect => {
      if (effect.duration.type === 'permanent') return;

      // Efeito expira no próximo turno
      if (effect.duration.remaining === 1) {
        suggestions.push({
          id: `expiring-${effect.id}`,
          type: 'reminder',
          priority: 'medium',
          title: `${effect.name} expira em breve`,
          description: `${combatant.name} - ${effect.name} expira no próximo turno`,
          icon: '⏰',
          targetId: combatant.id
        });
      }

      // Efeito expira neste turno
      if (effect.duration.remaining === 0) {
        suggestions.push({
          id: `expired-${effect.id}`,
          type: 'action',
          priority: 'high',
          title: `${effect.name} expirou!`,
          description: `Remover de ${combatant.name}`,
          icon: '⚠️',
          targetId: combatant.id
        });
      }
    });
  });

  // ==================== CONCENTRAÇÃO ====================

  if (combat.settings.trackConcentration) {
    combat.turnOrder.forEach(combatant => {
      if (combatant.isConcentrating && combatant.concentrationSpell) {
        const hpPercentage = combatant.hp && combatant.maxHp
          ? (combatant.hp / combatant.maxHp) * 100
          : 100;

        // Concentrando com HP baixo
        if (hpPercentage < 50) {
          suggestions.push({
            id: `concentration-risk-${combatant.id}`,
            type: 'warning',
            priority: 'medium',
            title: `${combatant.name} concentrando com HP baixo`,
            description: `Concentração em ${combatant.concentrationSpell} - ${Math.round(hpPercentage)}% HP`,
            icon: '🧘',
            targetId: combatant.id
          });
        }
      }
    });
  }

  // ==================== AÇÕES NÃO USADAS ====================

  // Apenas para o combatente ativo
  if (activeCombatant) {
    const { actions } = activeCombatant;

    // Tem reação disponível
    if (actions.reaction && combat.round > 1) {
      suggestions.push({
        id: `reaction-available-${activeCombatant.id}`,
        type: 'tip',
        priority: 'low',
        title: 'Reação disponível',
        description: `${activeCombatant.name} ainda tem sua reação`,
        icon: '⚡',
        targetId: activeCombatant.id
      });
    }

    // Tem ação bônus disponível
    if (actions.bonusAction) {
      suggestions.push({
        id: `bonus-action-available-${activeCombatant.id}`,
        type: 'tip',
        priority: 'low',
        title: 'Ação bônus disponível',
        description: `${activeCombatant.name} pode usar ação bônus`,
        icon: '⭐',
        targetId: activeCombatant.id
      });
    }

    // Tem movimento restante
    if (actions.movement > 0) {
      suggestions.push({
        id: `movement-available-${activeCombatant.id}`,
        type: 'tip',
        priority: 'low',
        title: 'Movimento disponível',
        description: `${actions.movement}m de movimento restante`,
        icon: '🏃',
        targetId: activeCombatant.id
      });
    }
  }

  // ==================== CONDIÇÕES IMPORTANTES ====================

  combat.turnOrder.forEach(combatant => {
    // Inconsciente mas com HP > 0
    if (combatant.conditions.includes('unconscious') && combatant.hp && combatant.hp > 0) {
      suggestions.push({
        id: `unconscious-${combatant.id}`,
        type: 'warning',
        priority: 'high',
        title: `${combatant.name} está inconsciente`,
        description: 'Mas ainda tem HP - verificar condição',
        icon: '😴',
        targetId: combatant.id
      });
    }

    // Paralisado ou Atordoado
    if (combatant.conditions.includes('paralyzed') || combatant.conditions.includes('stunned')) {
      suggestions.push({
        id: `incapacitated-${combatant.id}`,
        type: 'reminder',
        priority: 'medium',
        title: `${combatant.name} está incapacitado`,
        description: 'Não pode realizar ações',
        icon: '😵',
        targetId: combatant.id
      });
    }
  });

  // ==================== VANTAGENS TÁTICAS ====================

  combat.turnOrder.forEach(combatant => {
    // Invisível
    if (combatant.conditions.includes('invisible')) {
      suggestions.push({
        id: `invisible-${combatant.id}`,
        type: 'tip',
        priority: 'medium',
        title: `${combatant.name} está invisível`,
        description: 'Vantagem em ataques, inimigos têm desvantagem',
        icon: '👻',
        targetId: combatant.id
      });
    }

    // Caído
    if (combatant.conditions.includes('prone')) {
      suggestions.push({
        id: `prone-${combatant.id}`,
        type: 'reminder',
        priority: 'low',
        title: `${combatant.name} está caído`,
        description: 'Desvantagem em ataques, ataques corpo a corpo têm vantagem',
        icon: '🤕',
        targetId: combatant.id
      });
    }
  });

  // ==================== COMBATE LONGO ====================

  if (combat.round > 10) {
    suggestions.push({
      id: 'long-combat',
      type: 'tip',
      priority: 'low',
      title: 'Combate longo',
      description: `Rodada ${combat.round} - considere acelerar ou ajustar dificuldade`,
      icon: '⏱️'
    });
  }

  // ==================== PRIMEIRO TURNO ====================

  if (combat.round === 1 && combat.activeTurnIndex === 0) {
    suggestions.push({
      id: 'first-turn',
      type: 'tip',
      priority: 'low',
      title: 'Primeiro turno!',
      description: 'Boa sorte no combate! 🎲',
      icon: '⚔️'
    });
  }

  // ==================== COMBATE DESEQUILIBRADO ====================

  const alivePCs = combat.turnOrder.filter(c => c.type === 'pc' && (!c.hp || c.hp > 0)).length;
  const aliveNPCs = combat.turnOrder.filter(c => c.type === 'npc' && (!c.hp || c.hp > 0)).length;

  if (alivePCs === 0 && aliveNPCs > 0) {
    suggestions.push({
      id: 'tpk-warning',
      type: 'warning',
      priority: 'critical',
      title: 'TPK iminente!',
      description: 'Todos os PCs estão em 0 HP',
      icon: '💀'
    });
  }

  if (aliveNPCs === 0 && alivePCs > 0 && isGM) {
    suggestions.push({
      id: 'victory',
      type: 'action',
      priority: 'medium',
      title: 'Vitória dos jogadores!',
      description: 'Todos os inimigos foram derrotados - considere finalizar o combate',
      icon: '🎉'
    });
  }

  // Ordenar por prioridade
  const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
  suggestions.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

  return suggestions;
}

/**
 * Filtra sugestões por tipo
 */
export function filterSuggestionsByType(
  suggestions: CombatSuggestion[],
  types: SuggestionType[]
): CombatSuggestion[] {
  return suggestions.filter(s => types.includes(s.type));
}

/**
 * Filtra sugestões por prioridade mínima
 */
export function filterSuggestionsByPriority(
  suggestions: CombatSuggestion[],
  minPriority: SuggestionPriority
): CombatSuggestion[] {
  const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
  const minValue = priorityOrder[minPriority];

  return suggestions.filter(s => priorityOrder[s.priority] >= minValue);
}

/**
 * Obtém sugestões para um combatente específico
 */
export function getSuggestionsForCombatant(
  suggestions: CombatSuggestion[],
  combatantId: string
): CombatSuggestion[] {
  return suggestions.filter(s => s.targetId === combatantId);
}
