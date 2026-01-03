import React, { useEffect, useRef } from 'react';
import { GameSessionState } from '../types';
import { Token, CombatEffect } from '../../../types';
import { calculateDistance } from '../../../utils/geometry';
import { v4 as uuidv4 } from 'uuid';

export const useAuraSystem = (
  state: GameSessionState,
  onUpdateToken: (id: string, data: Partial<Token>) => void,
  campaignId: string,
  isGM: boolean
) => {
  const processingRef = useRef(false);

  useEffect(() => {
    if (!isGM) return; // Only GM calculates auras
    if (processingRef.current) return;

    const activeScene = state.scenes.find(s => s.id === state.activeSceneId);
    if (!activeScene) return;

    const tokens = activeScene.tokens;

    // Only the GM should run the aura system logic to avoid conflicts and double-updates
    // The GM's client acts as the "server" for this logic
    // However, we need to check if we are the GM. The hook doesn't receive 'user' or 'isGM'.
    // We can check state.isGM if available, or pass it in.
    // Assuming for now this hook is run by everyone, but we should restrict it.
    // Actually, if everyone runs it, everyone emits updates. That's bad.
    // We should pass 'isGM' to this hook and only run if true.

    // ... waiting for next step to fix GameSessionContext to pass isGM ...
    // For now, I will implement the logic assuming it runs.
    // BUT, I will add a check for isGM in the arguments in the next step.

    // Helper to determine disposition
    const getDisposition = (t: Token) => {
      if (t.disposition) return t.disposition;
      if (t.type === 'pc') return 'friendly';
      return 'hostile'; // NPCs/Monsters default to hostile
    };

    // Map to track active aura effects on each token
    // Key: TokenID, Value: Set of AuraIDs that are currently affecting this token
    const activeAuraEffects = new Map<string, Set<string>>();

    // 1. Calculate which auras should be active on which tokens
    tokens.forEach(sourceToken => {
      if (!sourceToken.auras) return;

      const sourceDisp = getDisposition(sourceToken);

      sourceToken.auras.forEach(aura => {
        if (!aura.active) return;

        tokens.forEach(targetToken => {
          // Self check
          if (sourceToken.id === targetToken.id) {
            if (aura.targets !== 'self' && aura.targets !== 'all' && aura.targets !== 'allies') return;
          } else {
            if (aura.targets === 'self') return;
          }

          // Smart Targeting Logic
          const targetDisp = getDisposition(targetToken);
          let isTarget = false;

          // 1. Check Explicit Exclusions
          if (aura.excludedTokenIds?.includes(targetToken.id)) return;

          // 2. Check Explicit Inclusions (Overrides disposition)
          if (aura.includedTokenIds?.includes(targetToken.id)) {
            isTarget = true;
          } else {
            // 3. Standard Disposition Check
            if (aura.targets === 'all') isTarget = true;
            else if (aura.targets === 'self') isTarget = sourceToken.id === targetToken.id;
            else if (aura.targets === 'allies') isTarget = sourceDisp === targetDisp;
            else if (aura.targets === 'enemies') isTarget = sourceDisp !== targetDisp;
          }

          if (!isTarget) return;

          const dist = calculateDistance(
            { x: sourceToken.x, y: sourceToken.y },
            { x: targetToken.x, y: targetToken.y },
            'euclidean'
          );

          // Convert radius from meters to grid units (assuming 1.5m per square)
          const radiusInSquares = aura.radius / 1.5;

          if (dist <= radiusInSquares) {
            // Target is in range
            if (!activeAuraEffects.has(targetToken.id)) {
              activeAuraEffects.set(targetToken.id, new Set());
            }
            activeAuraEffects.get(targetToken.id)!.add(aura.id);
          }
        });
      });
    });

    // 2. Apply or remove effects based on calculation
    let updatesCount = 0;

    tokens.forEach((token) => {
      const currentAuraEffects = token.effects?.filter(e => e.sourceAuraId) || [];
      const shouldHaveAuras = activeAuraEffects.get(token.id) || new Set();
      const ignoredAuras = new Set(token.ignoredAuras || []);

      let tokenChanged = false;
      let newEffects = [...(token.effects || [])];
      let newIgnored = [...(token.ignoredAuras || [])];

      // Remove effects from auras that are no longer in range (or no longer valid targets)
      currentAuraEffects.forEach(effect => {
        if (effect.sourceAuraId && !shouldHaveAuras.has(effect.sourceAuraId)) {
          newEffects = newEffects.filter(e => e.id !== effect.id);

          // Also remove from ignored list if we leave the aura, so it resets
          if (ignoredAuras.has(effect.sourceAuraId)) {
            newIgnored = newIgnored.filter(id => id !== effect.sourceAuraId);
          }
          tokenChanged = true;
        }
      });

      // Add effects for auras that are now in range but missing
      shouldHaveAuras.forEach(auraId => {
        // Check if manually ignored
        if (ignoredAuras.has(auraId)) return;

        const alreadyHas = currentAuraEffects.some(e => e.sourceAuraId === auraId);
        if (!alreadyHas) {
          // Find the aura source and definition
          const sourceToken = tokens.find(t => t.auras?.some(a => a.id === auraId));
          const aura = sourceToken?.auras?.find(a => a.id === auraId);

          if (aura && aura.effects) {
            aura.effects.forEach(templateEffect => {
              const newEffect: CombatEffect = {
                ...templateEffect,
                id: uuidv4(),
                sourceAuraId: auraId,
                duration: { type: 'permanent', value: -1, remaining: -1 } // Infinite duration while in aura
              };
              newEffects.push(newEffect);
              tokenChanged = true;
            });
          }
        }
      });

      // Check if ignored list changed (due to leaving aura)
      if (newIgnored.length !== (token.ignoredAuras || []).length) {
        tokenChanged = true;
      }

      if (tokenChanged) {
        // Call the update callback which should handle persistence (socket) and local state
        onUpdateToken(token.id, { effects: newEffects, ignoredAuras: newIgnored });
        updatesCount++;
      }
    });

    if (updatesCount > 0) {
      processingRef.current = true;
      setTimeout(() => { processingRef.current = false; }, 200); // Debounce slightly longer to allow updates to propagate
    }

  }, [state.scenes, state.activeSceneId]); // Dependency on scenes ensures it runs when tokens move
};
