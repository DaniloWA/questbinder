
import { RollResult, RollMode, RollVisibility } from '../types/models';

export type { RollResult, RollMode, RollVisibility };

export const diceEngine = {
  /**
   * Parse and roll a dice formula
   * Supports: "1d20", "2d6+4", "1d20 + 1d4 + 2", "1 d 20"
   */
  roll: (formula: string, mode: RollMode = 'normal', label?: string, visibility: RollVisibility = 'public'): RollResult => {
    // 1. Normalize
    const cleanFormula = formula.toLowerCase().replace(/\s+/g, '');
    
    let total = 0;
    const breakdownParts: string[] = [];
    const allDiceResults: number[] = [];
    let isCritical = false;
    let isFumble = false;

    // Simple parser: splits by + or - but keeps the delimiter
    const parts = cleanFormula.split(/([+-])/).filter(p => p !== '');
    
    let currentMultiplier = 1;

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];

        if (part === '+') {
            currentMultiplier = 1;
            continue;
        }
        if (part === '-') {
            currentMultiplier = -1;
            continue;
        }

        if (part.includes('d')) {
            // Dice Roll
            const [countStr, facesStr] = part.split('d');
            let count = countStr === '' ? 1 : (parseInt(countStr) || 1);
            const faces = parseInt(facesStr) || 20;
            
            // Handle Advantage/Disadvantage specifically for single d20 rolls
            // If it's a multi-dice roll (e.g. 2d20) we usually just sum them unless specifically asked for adv on skill check
            // Standard rule: Advantage applies to the d20 Test (1d20).
            if (faces === 20 && mode !== 'normal' && count === 1) {
                const r1 = Math.floor(Math.random() * faces) + 1;
                const r2 = Math.floor(Math.random() * faces) + 1;
                
                const kept = mode === 'advantage' ? Math.max(r1, r2) : Math.min(r1, r2);
                const dropped = mode === 'advantage' ? Math.min(r1, r2) : Math.max(r1, r2);
                
                total += kept * currentMultiplier;
                allDiceResults.push(kept);
                
                // Formatting: Bold the kept, strikethrough the dropped
                breakdownParts.push(`[${kept}, ~~${dropped}~~]`);
                
                if (kept === 20) isCritical = true;
                if (kept === 1) isFumble = true;
            } else {
                // Standard Multi-Dice Roll
                const currentRolls = [];
                let subTotal = 0;
                
                for (let d = 0; d < count; d++) {
                    const r = Math.floor(Math.random() * faces) + 1;
                    currentRolls.push(r);
                    subTotal += r;
                    
                    // Only check crit on d20s
                    if (faces === 20) {
                        if (r === 20) isCritical = true;
                        if (r === 1) isFumble = true;
                    }
                }
                
                total += subTotal * currentMultiplier;
                allDiceResults.push(...currentRolls);
                
                if (count === 1) {
                    breakdownParts.push(`[${currentRolls[0]}]`);
                } else {
                    breakdownParts.push(`[${currentRolls.join(', ')}]`);
                }
            }
        } else {
            // Flat Modifier
            const val = parseInt(part);
            if (!isNaN(val)) {
                total += val * currentMultiplier;
                breakdownParts.push(`${val}`);
            }
        }
    }

    // Pretty reconstruction
    let prettyBreakdown = breakdownParts.join(' + ').replace(/\+ -/g, '- ');

    return {
        total,
        formula: mode === 'normal' ? formula : `${formula} (${mode === 'advantage' ? 'Vant' : 'Desv'})`,
        breakdown: prettyBreakdown,
        diceResults: allDiceResults,
        isCritical,
        isFumble,
        timestamp: Date.now(),
        label,
        mode,
        visibility
    };
  }
};
