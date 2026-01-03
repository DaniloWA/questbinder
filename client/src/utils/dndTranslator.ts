
/**
 * Dicionário de Tradução EN -> PT-BR para termos de D&D 5e (SRD)
 * Usado como primeira camada de tradução (instantânea e precisa para termos técnicos).
 */

const DICTIONARY: Record<string, string> = {
    // --- ATRIBUTOS ---
    "Strength": "Força",
    "Dexterity": "Destreza",
    "Constitution": "Constituição",
    "Intelligence": "Inteligência",
    "Wisdom": "Sabedoria",
    "Charisma": "Carisma",
    "STR": "FOR", "DEX": "DES", "CON": "CON", "INT": "INT", "WIS": "SAB", "CHA": "CAR",
  
    // --- TAMANHOS ---
    "Tiny": "Minúsculo", "Small": "Pequeno", "Medium": "Médio", "Large": "Grande", "Huge": "Enorme", "Gargantuan": "Imenso",
  
    // --- TIPOS DE CRIATURA ---
    "aberration": "Aberração", "beast": "Fera", "celestial": "Celestial", "construct": "Construto",
    "dragon": "Dragão", "elemental": "Elemental", "fey": "Fada", "fiend": "Corruptor",
    "giant": "Gigante", "humanoid": "Humanoide", "monstrosity": "Monstruosidade",
    "ooze": "Limo", "plant": "Planta", "undead": "Morto-vivo",
  
    // --- ALINHAMENTOS ---
    "lawful good": "Leal e Bom", "neutral good": "Neutro e Bom", "chaotic good": "Caótico e Bom",
    "lawful neutral": "Leal e Neutro", "neutral": "Neutro", "chaotic neutral": "Caótico e Neutro",
    "lawful evil": "Leal e Mau", "neutral evil": "Neutro e Mau", "chaotic evil": "Caótico e Mau",
    "unaligned": "Sem alinhamento",
  
    // --- ESCOLAS DE MAGIA ---
    "Abjuration": "Abjuração", "Conjuration": "Conjuração", "Divination": "Adivinhação",
    "Enchantment": "Encantamento", "Evocation": "Evocação", "Illusion": "Ilusão",
    "Necromancy": "Necromancia", "Transmutation": "Transmutação",
  
    // --- PERÍCIAS ---
    "Acrobatics": "Acrobacia", "Animal Handling": "Lidar com Animais", "Arcana": "Arcanismo",
    "Athletics": "Atletismo", "Deception": "Enganação", "History": "História",
    "Insight": "Intuição", "Intimidation": "Intimidação", "Investigation": "Investigação",
    "Medicine": "Medicina", "Nature": "Natureza", "Perception": "Percepção",
    "Performance": "Atuação", "Persuasion": "Persuasão", "Religion": "Religião",
    "Sleight of Hand": "Prestidigitação", "Stealth": "Furtividade", "Survival": "Sobrevivência",
  
    // --- TIPOS DE DANO ---
    "acid": "ácido", "bludgeoning": "contundente", "cold": "frio", "fire": "fogo",
    "force": "força", "lightning": "elétrico", "necrotic": "necrótico", "piercing": "perfurante",
    "poison": "veneno", "psychic": "psíquico", "radiant": "radiante", "slashing": "cortante", "thunder": "trovejante",
  
    // --- TERMOS DE COMBATE / REGRAS ---
    "Melee Weapon Attack": "Ataque com Arma Corpo a Corpo",
    "Ranged Weapon Attack": "Ataque com Arma à Distância",
    "Melee or Ranged Weapon Attack": "Ataque com Arma (C.a.C ou Distância)",
    "to hit": "para acertar",
    "reach": "alcance", "range": "distância",
    "one target": "um alvo",
    "Hit": "Acerto",
    "damage": "dano", "plus": "mais",
    "saving throw": "salvaguarda",
    
    // --- ITENS E RARIDADE ---
    "Common": "Comum", "Uncommon": "Incomum", "Rare": "Raro", "Very Rare": "Muito Raro", "Legendary": "Lendário", "Artifact": "Artefato",
    "requires attunement": "requer sintonização",
    "Wondrous item": "Item Maravilhoso", "Weapon": "Arma", "Armor": "Armadura", "Potion": "Poção", "Ring": "Anel", "Scroll": "Pergaminho", "Staff": "Cajado", "Wand": "Varinha",
  };
  
  /**
   * Tenta traduzir uma palavra ou frase exata.
   */
  export const t = (text: string | undefined | null): string => {
      if (!text) return '';
      // Tenta match exato
      if (DICTIONARY[text]) return DICTIONARY[text];
      // Tenta match lowercase
      if (DICTIONARY[text.toLowerCase()]) return DICTIONARY[text.toLowerCase()];
      // Tenta Capitalized
      const capitalized = text.charAt(0).toUpperCase() + text.slice(1);
      if (DICTIONARY[capitalized]) return DICTIONARY[capitalized];
      
      return text;
  };
  
  /**
   * Tradução contextual para textos longos (Substituição inteligente de termos via Regex).
   * Útil para descrições de ações e blocos de estatísticas.
   */
  export const translateText = (text: string): string => {
      if (!text) return '';
      let translated = text;
  
      // Substituições de frases comuns em blocos de monstros
      const replacements = [
          [/Melee Weapon Attack:/gi, "Ataque Corpo a Corpo com Arma:"],
          [/Ranged Weapon Attack:/gi, "Ataque à Distância com Arma:"],
          [/Melee or Ranged Weapon Attack:/gi, "Ataque Corpo a Corpo ou à Distância:"],
          [/to hit/gi, "para acertar"],
          [/reach (.*?) ft\./gi, "alcance $1 ft."], // Mantendo ft por enquanto para não quebrar numeros
          [/range (.*?) ft\./gi, "distância $1 ft."],
          [/one target\./gi, "um alvo."],
          [/Hit:/gi, "Acerto:"],
          [/bludgeoning damage/gi, "dano contundente"],
          [/piercing damage/gi, "dano perfurante"],
          [/slashing damage/gi, "dano cortante"],
          [/fire damage/gi, "dano de fogo"],
          [/cold damage/gi, "dano de frio"],
          [/lightning damage/gi, "dano elétrico"],
          [/poison damage/gi, "dano de veneno"],
          [/necrotic damage/gi, "dano necrótico"],
          [/radiant damage/gi, "dano radiante"],
          [/force damage/gi, "dano de força"],
          [/psychic damage/gi, "dano psíquico"],
          [/acid damage/gi, "dano ácido"],
          [/thunder damage/gi, "dano trovejante"],
          [/saving throw/gi, "salvaguarda"],
          [/succeed on a DC/gi, "passar numa CD"],
          [/failed save/gi, "falha na resistência"],
          [/taking (.*?) damage/gi, "sofrendo $1 de dano"],
          [/half as much damage/gi, "metade do dano"],
          [/ft\./gi, "m"], // Conversão simples de unidade visual
      ];
  
      replacements.forEach(([regex, replacement]) => {
          translated = translated.replace(regex, replacement as string);
      });
      
      return translated;
  };
  
  /**
   * Converte ft para metros (Exibição: 30 ft. -> 9m)
   */
  export const ftToM = (ft: number | string): string => {
      const val = parseInt(String(ft));
      if (isNaN(val)) return String(ft);
      return `${(val * 0.3).toFixed(1).replace('.0', '')}m`;
  };
