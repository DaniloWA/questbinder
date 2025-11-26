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
  // Queue global de atualizações para batching
  const updateQueue = useRef<Record<string, any>>({});
  const batchTimer = useRef<NodeJS.Timeout | null>(null);

  /**
   * Processa a fila de atualizações (flush)
   */
  const processQueue = useCallback(() => {
    if (Object.keys(updateQueue.current).length === 0) return;

    const updates = { ...updateQueue.current };
    updateQueue.current = {}; // Limpa a fila

    // Remove chaves da lista de "dirty fields" (timers)
    Object.keys(updates).forEach(key => {
      if (fieldTimers.current[key]) {
        clearTimeout(fieldTimers.current[key]);
        delete fieldTimers.current[key];
      }
    });

    onUpdate(updates, false);
    batchTimer.current = null;
  }, [onUpdate]);

  /**
   * Atualiza um campo com debounce inteligente e batching
   */
  const updateField = useCallback((
    fieldName: keyof Character,
    value: any,
    options: FieldUpdateOptions = {}
  ) => {
    const {
      immediate = criticalFields.has(fieldName as string),
      debounceMs = 1000 // Aumentado para 1s para garantir batching eficaz
    } = options;

    // 1. Atualização Otimista Local
    setLocalCharacter(prev => ({ ...prev, [fieldName]: value }));

    // 2. Se for crítico, envia imediatamente e limpa qualquer pendência desse campo
    if (immediate) {
      // Se houver algo na fila para este campo, sobrescreve
      delete updateQueue.current[fieldName as string];

      // Se houver timer específico, limpa
      if (fieldTimers.current[fieldName as string]) {
        clearTimeout(fieldTimers.current[fieldName as string]);
        delete fieldTimers.current[fieldName as string];
      }

      onUpdate({ [fieldName]: value }, true);
      return;
    }

    // 3. Adiciona à fila de batching
    updateQueue.current[fieldName as string] = value;

    // 4. Gerencia o timer de batching global
    // Se já existe um timer rodando, deixamos ele continuar (debounce)
    // OU reiniciamos ele para adiar o envio (debounce clássico)?
    // Para campos de texto, queremos adiar. Para múltiplos campos diferentes, queremos agrupar.

    // Estratégia Híbrida:
    // - Se já tem timer para ESSE campo específico, cancela (debounce por campo)
    if (fieldTimers.current[fieldName as string]) {
      clearTimeout(fieldTimers.current[fieldName as string]);
    }

    // Define um novo timer para este campo que vai disparar o processamento da fila
    fieldTimers.current[fieldName as string] = setTimeout(() => {
      processQueue();
    }, debounceMs);

  }, [criticalFields, onUpdate, processQueue]);

  /**
   * Atualiza múltiplos campos de uma vez (batching explícito)
   */
  const updateFields = useCallback((
    updates: Partial<Character>,
    immediate: boolean = false
  ) => {
    // 1. Atualização Otimista Local
    setLocalCharacter(prev => ({ ...prev, ...updates }));

    if (immediate) {
      // Remove da fila qualquer campo que esteja sendo atualizado agora
      Object.keys(updates).forEach(key => {
        delete updateQueue.current[key];
        if (fieldTimers.current[key]) {
          clearTimeout(fieldTimers.current[key]);
          delete fieldTimers.current[key];
        }
      });
      onUpdate(updates, true);
    } else {
      // Adiciona tudo à fila
      Object.entries(updates).forEach(([key, value]) => {
        updateQueue.current[key] = value;

        // Reinicia timer para esses campos
        if (fieldTimers.current[key]) {
          clearTimeout(fieldTimers.current[key]);
        }
        fieldTimers.current[key] = setTimeout(() => processQueue(), 1000);
      });
    }
  }, [onUpdate, processQueue]);

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
