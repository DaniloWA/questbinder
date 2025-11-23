import { RollResult, RollMode, RollVisibility } from '../types/models';

export type { RollResult, RollMode, RollVisibility };

/**
 * Gerador de números aleatórios criptograficamente seguro
 * Usa Web Crypto API para aleatoriedade superior ao Math.random()
 */
const cryptoRandom = (): number => {
    const randomBuffer = new Uint32Array(1);
    crypto.getRandomValues(randomBuffer);
    return randomBuffer[0] / (0xFFFFFFFF + 1);
};

/**
 * Rola um dado de N faces usando aleatoriedade criptográfica
 */
const rollDice = (faces: number): number => {
    return Math.floor(cryptoRandom() * faces) + 1;
};

/**
 * Determina o tipo de rolagem baseado no resultado do d20
 */
const evaluateCriticalStatus = (diceValue: number, faces: number): { isCritical: boolean; isFumble: boolean; } => {
    if (faces !== 20) {
        return { isCritical: false, isFumble: false };
    }

    return {
        isCritical: diceValue === 20,
        isFumble: diceValue === 1
    };
};

/**
 * Processa vantagem ou desvantagem em um d20
 */
const rollWithAdvantageOrDisadvantage = (
    mode: RollMode,
    currentMultiplier: number
): {
    total: number;
    breakdown: string;
    diceResults: number[];
    isCritical: boolean;
    isFumble: boolean;
} => {
    const firstRoll = rollDice(20);
    const secondRoll = rollDice(20);

    const keptValue = mode === 'advantage'
        ? Math.max(firstRoll, secondRoll)
        : Math.min(firstRoll, secondRoll);

    const droppedValue = mode === 'advantage'
        ? Math.min(firstRoll, secondRoll)
        : Math.max(firstRoll, secondRoll);

    const { isCritical, isFumble } = evaluateCriticalStatus(keptValue, 20);

    return {
        total: keptValue * currentMultiplier,
        breakdown: `[${keptValue}, ~~${droppedValue}~~]`,
        diceResults: [keptValue],
        isCritical,
        isFumble
    };
};

/**
 * Processa uma rolagem normal de múltiplos dados
 */
const rollMultipleDice = (
    count: number,
    faces: number,
    currentMultiplier: number
): {
    total: number;
    breakdown: string;
    diceResults: number[];
    isCritical: boolean;
    isFumble: boolean;
} => {
    const rolls: number[] = [];
    let subTotal = 0;
    let isCritical = false;
    let isFumble = false;

    for (let diceIndex = 0; diceIndex < count; diceIndex++) {
        const rollValue = rollDice(faces);
        rolls.push(rollValue);
        subTotal += rollValue;

        const criticalStatus = evaluateCriticalStatus(rollValue, faces);
        if (criticalStatus.isCritical) isCritical = true;
        if (criticalStatus.isFumble) isFumble = true;
    }

    const breakdown = count === 1
        ? `[${rolls[0]}]`
        : `[${rolls.join(', ')}]`;

    return {
        total: subTotal * currentMultiplier,
        breakdown,
        diceResults: rolls,
        isCritical,
        isFumble
    };
};

/**
 * Processa um modificador numérico fixo
 */
const processModifier = (
    modifierString: string,
    currentMultiplier: number
): {
    total: number;
    breakdown: string;
} => {
    const modifierValue = parseInt(modifierString);

    if (isNaN(modifierValue)) {
        return { total: 0, breakdown: '' };
    }

    return {
        total: modifierValue * currentMultiplier,
        breakdown: `${modifierValue}`
    };
};

/**
 * Processa uma parte da fórmula de dados (dados ou modificador)
 */
const processDiceOrModifier = (
    part: string,
    mode: RollMode,
    currentMultiplier: number
): {
    total: number;
    breakdown: string;
    diceResults: number[];
    isCritical: boolean;
    isFumble: boolean;
} => {
    // Verifica se é uma rolagem de dados
    if (!part.includes('d')) {
        const modifierResult = processModifier(part, currentMultiplier);
        return {
            ...modifierResult,
            diceResults: [],
            isCritical: false,
            isFumble: false
        };
    }

    // Parseia a rolagem de dados (ex: "2d6", "d20")
    const [countString, facesString] = part.split('d');
    const diceCount = countString === '' ? 1 : (parseInt(countString) || 1);
    const diceFaces = parseInt(facesString) || 20;

    // Aplica vantagem/desvantagem apenas em 1d20
    const shouldApplyAdvantage = diceFaces === 20 && mode !== 'normal' && diceCount === 1;

    if (shouldApplyAdvantage) {
        return rollWithAdvantageOrDisadvantage(mode, currentMultiplier);
    }

    return rollMultipleDice(diceCount, diceFaces, currentMultiplier);
};

/**
 * Normaliza e divide a fórmula em partes processáveis
 */
const parseFormula = (formula: string): string[] => {
    const normalizedFormula = formula.toLowerCase().replace(/\s+/g, '');
    return normalizedFormula.split(/([+-])/).filter(part => part !== '');
};

/**
 * Formata o breakdown final da rolagem
 */
const formatBreakdown = (parts: string[]): string => {
    return parts.join(' + ').replace(/\+ -/g, '- ');
};

/**
 * Formata a fórmula com indicador de vantagem/desvantagem
 */
const formatFormula = (formula: string, mode: RollMode): string => {
    if (mode === 'normal') return formula;

    const modeLabel = mode === 'advantage' ? 'Vant' : 'Desv';
    return `${formula} (${modeLabel})`;
};

export const diceEngine = {
    /**
     * Parseia e rola uma fórmula de dados
     * 
     * Suporta formatos:
     * - "1d20" - Rolagem simples
     * - "2d6+4" - Múltiplos dados com modificador
     * - "1d20 + 1d4 + 2" - Múltiplas rolagens combinadas
     * - "1 d 20" - Espaços são ignorados
     * 
     * @param formula - Fórmula de dados no formato padrão D&D
     * @param mode - Modo de rolagem: 'normal', 'advantage', 'disadvantage'
     * @param label - Rótulo opcional para a rolagem
     * @param visibility - Visibilidade da rolagem: 'public', 'gm', 'hidden'
     */
    roll: (
        formula: string,
        mode: RollMode = 'normal',
        label?: string,
        visibility: RollVisibility = 'public'
    ): RollResult => {
        const formulaParts = parseFormula(formula);

        let totalSum = 0;
        const breakdownParts: string[] = [];
        const allDiceResults: number[] = [];
        let hasAnyCritical = false;
        let hasAnyFumble = false;
        let currentMultiplier = 1;

        for (let partIndex = 0; partIndex < formulaParts.length; partIndex++) {
            const currentPart = formulaParts[partIndex];

            // Operador de adição
            if (currentPart === '+') {
                currentMultiplier = 1;
                continue;
            }

            // Operador de subtração
            if (currentPart === '-') {
                currentMultiplier = -1;
                continue;
            }

            // Processa dados ou modificador
            const rollResult = processDiceOrModifier(currentPart, mode, currentMultiplier);

            totalSum += rollResult.total;
            allDiceResults.push(...rollResult.diceResults);

            if (rollResult.breakdown) {
                breakdownParts.push(rollResult.breakdown);
            }

            if (rollResult.isCritical) hasAnyCritical = true;
            if (rollResult.isFumble) hasAnyFumble = true;
        }

        return {
            total: totalSum,
            formula: formatFormula(formula, mode),
            breakdown: formatBreakdown(breakdownParts),
            diceResults: allDiceResults,
            isCritical: hasAnyCritical,
            isFumble: hasAnyFumble,
            timestamp: Date.now(),
            label,
            mode,
            visibility
        };
    }
};