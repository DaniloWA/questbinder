
import { MockDataLayer } from '../data/mockDataLayer';
import { translateText as algoTranslate, t as simpleT } from '../utils/dndTranslator';
import { CompendiumCategory } from '../types/compendium';

interface TranslateResult {
    text: string;
    source: 'cache' | 'algo' | 'api' | 'original';
    error?: boolean;
}

/**
 * Serviço de Tradução Híbrida
 * Fluxo: Cache -> Dicionário Local -> LibreTranslate -> Argos OpenTech -> Original (Erro)
 */
class TranslationService {
    private memory: Map<string, string> = new Map();
    private isInitialized = false;

    private initialize() {
        if (this.isInitialized) return;
        try {
            const stored = MockDataLayer.readTable('translations');
            stored.forEach(t => this.memory.set(t.key, t.translated));
            this.isInitialized = true;
        } catch (e) {
            console.error('Failed to load translations:', e);
        }
    }

    /**
     * Tenta traduzir usando APIs externas com fallback.
     */
    private async fetchExternalTranslation(text: string): Promise<string | null> {
        // 1. LibreTranslate (API Gratuita Comum)
        try {
            const res = await fetch("https://libretranslate.com/translate", {
                method: "POST",
                body: JSON.stringify({
                    q: text,
                    source: "en",
                    target: "pt",
                    format: "text"
                }),
                headers: { "Content-Type": "application/json" }
            });

            if (res.ok) {
                const data = await res.json();
                if (data.translatedText) return data.translatedText;
            }
        } catch (e) {
            console.warn("LibreTranslate failed/limit reached, trying Argos...", e);
        }

        // 2. Argos Open Tech (Fallback Robusto)
        try {
            const res = await fetch("https://translate.argosopentech.com/translate", {
                method: "POST",
                body: JSON.stringify({
                    q: text,
                    source: "en",
                    target: "pt"
                }),
                headers: { "Content-Type": "application/json" }
            });

            if (res.ok) {
                const data = await res.json();
                if (data.translatedText) return data.translatedText;
            }
        } catch (e) {
            console.warn("Argos failed.", e);
        }

        return null;
    }

    /**
     * Traduz um texto único de forma inteligente (Sync/Async híbrido).
     */
    public async translateSmart(text: string, type: 'term' | 'description' | 'name' = 'description'): Promise<TranslateResult> {
        if (!text || text.trim() === '') return { text: '', source: 'original' };

        this.initialize();

        // 1. Check Cache
        if (this.memory.has(text)) {
            return { text: this.memory.get(text)!, source: 'cache' };
        }

        // 2. Check Dictionary/Regex (Instant)
        // Se for termo curto ou nome, tentamos o dicionário estrito primeiro
        if (type === 'term' || type === 'name') {
            const dictMatch = simpleT(text);
            if (dictMatch !== text) {
                this.saveToCache(text, dictMatch, type);
                return { text: dictMatch, source: 'algo' };
            }
        }

        // 3. Use Algorithm for longer text (Regex replacements)
        const algoMatch = algoTranslate(text);
        const isLongText = text.length > 60;

        // Se for texto curto ou se o algoritmo fez mudanças, use-o (evita API call desnecessária para coisas simples)
        if (!isLongText && algoMatch !== text) {
            this.saveToCache(text, algoMatch, type);
            return { text: algoMatch, source: 'algo' };
        }

        // 4. External API (The heavy lifting for Descriptions)
        const apiTranslation = await this.fetchExternalTranslation(text);

        if (apiTranslation) {
            // Aplica o algoritmo SOBRE a tradução da API para garantir termos de D&D corretos 
            // (ex: API traduz "Saving Throw" como "Jogada de Economia", o regex corrige para "Salvaguarda")
            const refinedTranslation = algoTranslate(apiTranslation);
            this.saveToCache(text, refinedTranslation, type);
            return { text: refinedTranslation, source: 'api' };
        }

        // 5. Fail - Return Original (com regex aplicado como consolo)
        return { text: algoMatch, source: 'original', error: true };
    }

    /**
     * Traduz um objeto complexo inteiro (Monstro, Magia)
     */
    public async translateObject(data: any, category: CompendiumCategory): Promise<{ translated: any, error: boolean; }> {
        const copy = JSON.parse(JSON.stringify(data));
        let hasError = false;

        const t = async (txt: string, type: 'term' | 'description' | 'name') => {
            const res = await this.translateSmart(txt, type);
            if (res.error) hasError = true;
            return res.text;
        };

        // Mapeamento específico por categoria para não traduzir IDs ou números
        if (category === 'monsters') {
            copy.name = await t(copy.name, 'name');
            copy.type = await t(copy.type, 'term');
            copy.alignment = await t(copy.alignment, 'term');
            copy.size = await t(copy.size, 'term');

            if (copy.special_abilities) {
                await Promise.all(copy.special_abilities.map(async (ab: any) => {
                    ab.name = await t(ab.name, 'term');
                    ab.desc = await t(ab.desc, 'description');
                }));
            }
            if (copy.actions) {
                await Promise.all(copy.actions.map(async (act: any) => {
                    act.name = await t(act.name, 'term');
                    act.desc = await t(act.desc, 'description');
                }));
            }
            if (copy.legendary_actions) {
                await Promise.all(copy.legendary_actions.map(async (act: any) => {
                    act.name = await t(act.name, 'term');
                    act.desc = await t(act.desc, 'description');
                }));
            }
        }
        else if (category === 'spells') {
            copy.name = await t(copy.name, 'name');
            copy.desc = await t(copy.desc, 'description');
            copy.higher_level = copy.higher_level ? await t(copy.higher_level, 'description') : '';
            copy.school = await t(copy.school, 'term');
            copy.casting_time = await t(copy.casting_time, 'term');
            copy.range = await t(copy.range, 'term');
            copy.duration = await t(copy.duration, 'term');
            copy.components = await t(copy.components, 'term');
        }
        else if (category === 'magicitems') {
            copy.name = await t(copy.name, 'name');
            copy.desc = await t(copy.desc, 'description');
            copy.type = await t(copy.type, 'term');
            copy.rarity = await t(copy.rarity, 'term');
        }
        else if (category === 'sections') {
            copy.name = await t(copy.name, 'name');
            copy.desc = await t(copy.desc, 'description');
        }

        return { translated: copy, error: hasError };
    }

    private saveToCache(original: string, translated: string, type: 'term' | 'description' | 'name') {
        if (original === translated) return; // Don't cache if identical
        this.memory.set(original, translated);

        // Fire and forget storage (don't block UI)
        setTimeout(() => {
            try {
                const stored = MockDataLayer.readTable('translations');
                // Check dupe
                if (!stored.find(t => t.key === original)) {
                    stored.push({ key: original, translated, type });
                    MockDataLayer.writeTable('translations', stored);
                }
            } catch (e) { console.error(e); }
        }, 10);
    }
}

export const translationService = new TranslationService();
