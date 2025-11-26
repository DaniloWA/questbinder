import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { Character } from '../../../types';

interface UseOptimizedCharacterSheetProps {
  character: Character;
  onUpdate: (updates: Partial<Character>, immediate?: boolean) => void;
  onTogglePrivacy: (fieldName: string) => Promise<void>;
}

interface FieldUpdateOptions {
  immediate?: boolean;
  debounceMs?: number;
}

/**
 * Hook otimizado para gerenciar estado da ficha de personagem
 * - Debounce inteligente por campo
 * - Memoização de callbacks
 * - Batching de atualizações
 * - Detecção de campos críticos
 */
export const useOptimizedCharacterSheet = ({
  character,
  onUpdate,
  onTogglePrivacy
}: UseOptimizedCharacterSheetProps) => {
  // Timers individuais por campo para debounce granular
  const fieldTimers = useRef<Record<string, NodeJS.Timeout>>({});

  // Atualizações pendentes por campo
  const pendingUpdates = useRef<Record<string, any>>({});

  // Estado local para UI responsiva
  const [localCharacter, setLocalCharacter] = useState(character);

  // Campos críticos que devem ser atualizados imediatamente
  const criticalFields = useMemo(() => new Set([
    'hpCurrent', 'hpMax', 'hpTemp',
    'manaCurrent', 'manaMax',
    'deathSaves', 'exhaustion',
    'heroicInspiration', 'conditions'
  ]), []);

  // Sincronizar estado local quando character externo mudar
  // Sincronizar estado local quando character externo mudar
  // Sincronizar estado local quando character externo mudar
  useEffect(() => {
    setLocalCharacter(prev => {
      // Começa com o novo estado externo
      const newState = { ...character };

      // Restaura campos que estão sendo editados localmente (têm timer ativo)
      // para evitar sobrescrever o que o usuário está digitando
      Object.keys(fieldTimers.current).forEach(key => {
        // @ts-ignore - Chaves dinâmicas
        if (prev[key] !== undefined) {
          // @ts-ignore
          newState[key] = prev[key];
        }
      });

      return newState;
    });
  }, [character]);

  /**
   * Atualiza um campo com debounce inteligente
   */
  const updateField = useCallback((
    fieldName: keyof Character,
    value: any,
    options: FieldUpdateOptions = {}
  ) => {
    console.log('[useOptimizedCharacterSheet] updateField called:', fieldName, value, options);
    const {
      immediate = criticalFields.has(fieldName as string),
      debounceMs = 800
    } = options;

    // Atualizar estado local imediatamente para UI responsiva
    setLocalCharacter(prev => ({ ...prev, [fieldName]: value }));

    // Limpar timer anterior deste campo
    if (fieldTimers.current[fieldName]) {
      clearTimeout(fieldTimers.current[fieldName]);
    }

    // Armazenar atualização pendente
    pendingUpdates.current[fieldName] = value;

    if (immediate) {
      // Atualização imediata para campos críticos
      const updates = { [fieldName]: value };
      onUpdate(updates, true);
      delete pendingUpdates.current[fieldName];
    } else {
      // Debounce para campos normais
      fieldTimers.current[fieldName] = setTimeout(() => {
        const updates = { [fieldName]: pendingUpdates.current[fieldName] };
        onUpdate(updates, false);
        delete pendingUpdates.current[fieldName];
        delete fieldTimers.current[fieldName];
      }, debounceMs);
    }
  }, [criticalFields, onUpdate]);

  /**
   * Atualiza múltiplos campos de uma vez (batching)
   */
  const updateFields = useCallback((
    updates: Partial<Character>,
    immediate: boolean = false
  ) => {
    // Atualizar estado local
    setLocalCharacter(prev => ({ ...prev, ...updates }));

    // Limpar timers dos campos sendo atualizados
    Object.keys(updates).forEach(field => {
      if (fieldTimers.current[field]) {
        clearTimeout(fieldTimers.current[field]);
        delete fieldTimers.current[field];
      }
      delete pendingUpdates.current[field];
    });

    // Enviar atualização
    onUpdate(updates, immediate);
  }, [onUpdate]);

  /**
   * Verifica se um campo é privado
   */
  const isFieldPrivate = useCallback((fieldName: string): boolean => {
    return localCharacter.privateFields?.includes(fieldName) || false;
  }, [localCharacter.privateFields]);

  /**
   * Toggle privacidade de um campo
   */
  const toggleFieldPrivacy = useCallback(async (fieldName: string) => {
    await onTogglePrivacy(fieldName);
  }, [onTogglePrivacy]);

  /**
   * Limpa todos os timers pendentes (cleanup)
   */
  const cleanup = useCallback(() => {
    Object.values(fieldTimers.current).forEach((timer: NodeJS.Timeout) => clearTimeout(timer));
    fieldTimers.current = {};
    pendingUpdates.current = {};
  }, []);

  // Memoizar valores derivados para evitar recálculos
  const derivedValues = useMemo(() => ({
    // Modificadores de atributos
    strMod: Math.floor((localCharacter.attributes.str - 10) / 2),
    dexMod: Math.floor((localCharacter.attributes.dex - 10) / 2),
    conMod: Math.floor((localCharacter.attributes.con - 10) / 2),
    intMod: Math.floor((localCharacter.attributes.int - 10) / 2),
    wisMod: Math.floor((localCharacter.attributes.wis - 10) / 2),
    chaMod: Math.floor((localCharacter.attributes.cha - 10) / 2),
    couMod: Math.floor((localCharacter.attributes.cou - 10) / 2),

    // Estados derivados
    isDead: localCharacter.hpCurrent === 0,
    isBloodied: localCharacter.hpCurrent <= localCharacter.hpMax / 2 && localCharacter.hpCurrent > 0,
    hpPercentage: (localCharacter.hpCurrent / localCharacter.hpMax) * 100,

    // Recursos disponíveis
    hasHeroicInspiration: localCharacter.heroicInspiration,
    exhaustionLevel: localCharacter.exhaustion,

    // Spell slots disponíveis
    availableSpellSlots: localCharacter.spellSlots.reduce((acc, slot) =>
      acc + (slot.total - slot.used), 0
    )
  }), [localCharacter]);

  return {
    // Estado
    character: localCharacter,
    derivedValues,

    // Ações
    updateField,
    updateFields,
    isFieldPrivate,
    toggleFieldPrivacy,
    cleanup,

    // Utilitários
    hasPendingUpdates: Object.keys(pendingUpdates.current).length > 0
  };
};
