
/**
 * D&D 5th Edition (2024) System Reference Document (SRD) Data
 */

import { AttributeName, SkillName } from '../types/models';

// --- COMBAT & ATTRIBUTES ---

export const ATTRIBUTE_OPTIONS = [
    { label: 'Força (+FOR)', value: '+FOR' },
    { label: 'Destreza (+DES)', value: '+DES' },
    { label: 'Constituição (+CON)', value: '+CON' },
    { label: 'Inteligência (+INT)', value: '+INT' },
    { label: 'Sabedoria (+SAB)', value: '+SAB' },
    { label: 'Carisma (+CAR)', value: '+CAR' },
    { label: 'Coragem (+COU)', value: '+COU' }, // Homebrew
    { label: 'Fixo / Nenhum', value: '0' },
] as const;

export const DAMAGE_TYPES = [
    { label: 'Cortante', value: 'Cortante' },
    { label: 'Perfurante', value: 'Perfurante' },
    { label: 'Contundente', value: 'Contundente' },
    { label: 'Ácido', value: 'Ácido' },
    { label: 'Elétrico', value: 'Elétrico' },
    { label: 'Fogo', value: 'Fogo' },
    { label: 'Frio', value: 'Frio' },
    { label: 'Força', value: 'Força' },
    { label: 'Necrótico', value: 'Necrótico' },
    { label: 'Psíquico', value: 'Psíquico' },
    { label: 'Radiante', value: 'Radiante' },
    { label: 'Trovejante', value: 'Trovejante' },
    { label: 'Veneno', value: 'Veneno' },
] as const;

export const WEAPON_MASTERIES = [
    { id: 'cleave', name: 'Cleave', desc: 'Atinge uma segunda criatura a 1,5m.' },
    { id: 'graze', name: 'Graze', desc: 'Causa dano igual ao mod de atributo se errar.' },
    { id: 'nick', name: 'Nick', desc: 'Ataque extra da propriedade Leve não custa Ação Bônus.' },
    { id: 'push', name: 'Push', desc: 'Empurra a criatura 3m.' },
    { id: 'sap', name: 'Sap', desc: 'Desvantagem na próxima jogada de ataque do alvo.' },
    { id: 'slow', name: 'Slow', desc: 'Reduz o deslocamento do alvo em 3m.' },
    { id: 'topple', name: 'Topple', desc: 'Alvo faz salvaguarda de CON ou cai.' },
    { id: 'vex', name: 'Vex', desc: 'Vantagem na próxima jogada de ataque contra o alvo.' },
] as const;

export const CONDITIONS = [
    'Agarrado', 'Amedrontado', 'Atordoado', 'Caído', 'Cego',
    'Enfeitiçado', 'Envenenado', 'Exausto', 'Impedido',
    'Incapacitado', 'Inconsciente', 'Invisível', 'Paralisado',
    'Petrificado', 'Surdo',
    // VTT-specific conditions
    'dead', 'bloodied', 'stunned', 'shielded', 'alert'
] as const;

// Definição Rica de Status para Tooltips
export interface StatusDefinition {
    id: string;
    name: string;
    effects: string[];
    duration: string;
    color?: string;
    bg?: string;
}

export const STATUS_RULES: Record<string, StatusDefinition> = {
    // Oficiais
    'frightened': {
        id: 'frightened',
        name: 'dnd.rules.conditions.frightened.name',
        effects: [
            'dnd.rules.conditions.frightened.effects.0',
            'dnd.rules.conditions.frightened.effects.1'
        ],
        duration: 'dnd.rules.conditions.frightened.duration'
    },
    'grappled': {
        id: 'grappled',
        name: 'dnd.rules.conditions.grappled.name',
        effects: [
            'dnd.rules.conditions.grappled.effects.0',
            'dnd.rules.conditions.grappled.effects.1'
        ],
        duration: 'dnd.rules.conditions.grappled.duration'
    },
    'stunned': {
        id: 'stunned',
        name: 'dnd.rules.conditions.stunned.name',
        effects: [
            'dnd.rules.conditions.stunned.effects.0',
            'dnd.rules.conditions.stunned.effects.1',
            'dnd.rules.conditions.stunned.effects.2'
        ],
        duration: 'dnd.rules.conditions.stunned.duration'
    },
    'prone': {
        id: 'prone',
        name: 'dnd.rules.conditions.prone.name',
        effects: [
            'dnd.rules.conditions.prone.effects.0',
            'dnd.rules.conditions.prone.effects.1',
            'dnd.rules.conditions.prone.effects.2'
        ],
        duration: 'dnd.rules.conditions.prone.duration'
    },
    'blinded': {
        id: 'blinded',
        name: 'dnd.rules.conditions.blinded.name',
        effects: [
            'dnd.rules.conditions.blinded.effects.0',
            'dnd.rules.conditions.blinded.effects.1',
            'dnd.rules.conditions.blinded.effects.2'
        ],
        duration: 'dnd.rules.conditions.blinded.duration'
    },
    'charmed': {
        id: 'charmed',
        name: 'dnd.rules.conditions.charmed.name',
        effects: [
            'dnd.rules.conditions.charmed.effects.0',
            'dnd.rules.conditions.charmed.effects.1'
        ],
        duration: 'dnd.rules.conditions.charmed.duration'
    },
    'poisoned': {
        id: 'poisoned',
        name: 'dnd.rules.conditions.poisoned.name',
        effects: [
            'dnd.rules.conditions.poisoned.effects.0'
        ],
        duration: 'dnd.rules.conditions.poisoned.duration'
    },
    'restrained': {
        id: 'restrained',
        name: 'dnd.rules.conditions.restrained.name',
        effects: [
            'dnd.rules.conditions.restrained.effects.0',
            'dnd.rules.conditions.restrained.effects.1',
            'dnd.rules.conditions.restrained.effects.2'
        ],
        duration: 'dnd.rules.conditions.restrained.duration'
    },
    'incapacitated': {
        id: 'incapacitated',
        name: 'dnd.rules.conditions.incapacitated.name',
        effects: [
            'dnd.rules.conditions.incapacitated.effects.0'
        ],
        duration: 'dnd.rules.conditions.paralyzed.duration' // Reusing varied duration from paralyzed or just empty
    },
    'unconscious': {
        id: 'unconscious',
        name: 'dnd.rules.conditions.unconscious.name',
        effects: [
            'dnd.rules.conditions.unconscious.effects.0',
            'dnd.rules.conditions.unconscious.effects.1',
            'dnd.rules.conditions.unconscious.effects.2',
            'dnd.rules.conditions.unconscious.effects.3'
        ],
        duration: 'dnd.rules.conditions.unconscious.duration'
    },
    'invisible': {
        id: 'invisible',
        name: 'dnd.rules.conditions.invisible.name',
        effects: [
            'dnd.rules.conditions.invisible.effects.0',
            'dnd.rules.conditions.invisible.effects.1',
            'dnd.rules.conditions.invisible.effects.2',
            'dnd.rules.conditions.invisible.effects.3'
        ],
        duration: 'dnd.rules.conditions.paralyzed.duration' // Varies
    },
    'paralyzed': {
        id: 'paralyzed',
        name: 'dnd.rules.conditions.paralyzed.name',
        effects: [
            'dnd.rules.conditions.paralyzed.effects.0',
            'dnd.rules.conditions.paralyzed.effects.1',
            'dnd.rules.conditions.paralyzed.effects.2'
        ],
        duration: 'dnd.rules.conditions.paralyzed.duration' // Varies
    },
    'petrified': {
        id: 'petrified',
        name: 'dnd.rules.conditions.petrified.name',
        effects: [
            'dnd.rules.conditions.petrified.effects.0',
            'dnd.rules.conditions.petrified.effects.1',
            'dnd.rules.conditions.petrified.effects.2'
        ],
        duration: 'dnd.rules.conditions.petrified.duration'
    },
    'deafened': {
        id: 'deafened',
        name: 'dnd.rules.conditions.deafened.name',
        effects: [
            'dnd.rules.conditions.deafened.effects.0'
        ],
        duration: 'dnd.rules.conditions.deafened.duration'
    },
    // Especiais / Homebrew Comuns
    'exhausted': {
        id: 'exhausted',
        name: 'dnd.rules.conditions.exhausted.name',
        effects: [
            'dnd.rules.conditions.exhausted.effects.0',
            'dnd.rules.conditions.exhausted.effects.1',
            'dnd.rules.conditions.exhausted.effects.2',
            'dnd.rules.conditions.exhausted.effects.3',
            'dnd.rules.conditions.exhausted.effects.4',
            'dnd.rules.conditions.exhausted.effects.5'
        ],
        duration: 'dnd.rules.conditions.exhausted.duration'
    },
    'burning': {
        id: 'burning',
        name: 'dnd.rules.conditions.burning.name',
        effects: [
            'dnd.rules.conditions.burning.effects.0',
            'dnd.rules.conditions.burning.effects.1'
        ],
        duration: 'dnd.rules.conditions.burning.duration'
    },
    'bleeding': {
        id: 'bleeding',
        name: 'dnd.rules.conditions.bleeding.name',
        effects: [
            'dnd.rules.conditions.bleeding.effects.0',
            'dnd.rules.conditions.bleeding.effects.1'
        ],
        duration: 'dnd.rules.conditions.bleeding.duration'
    },
    'dead': {
        id: 'dead',
        name: 'dnd.rules.conditions.dead.name',
        effects: ['dnd.rules.conditions.dead.effects.0'],
        duration: 'dnd.rules.conditions.dead.duration'
    },
    'bloodied': {
        id: 'bloodied',
        name: 'dnd.rules.conditions.bloodied.name',
        effects: ['dnd.rules.conditions.bloodied.effects.0'],
        duration: 'dnd.rules.conditions.bloodied.duration'
    },
    'shielded': {
        id: 'shielded',
        name: 'dnd.rules.conditions.shielded.name',
        effects: ['dnd.rules.conditions.shielded.effects.0'],
        duration: 'dnd.rules.conditions.paralyzed.duration' // Varies
    },
    'alert': {
        id: 'alert',
        name: 'dnd.rules.conditions.alert.name',
        effects: ['dnd.rules.conditions.alert.effects.0'],
        duration: 'dnd.rules.conditions.paralyzed.duration' // Varies
    }
};

// --- MAGIC ---

export const SPELL_SCHOOLS = [
    { label: 'Abjuração', value: 'Abjuração' },
    { label: 'Adivinhação', value: 'Adivinhação' },
    { label: 'Conjuração', value: 'Conjuração' },
    { label: 'Encantamento', value: 'Encantamento' },
    { label: 'Evocação', value: 'Evocação' },
    { label: 'Ilusão', value: 'Ilusão' },
    { label: 'Necromancia', value: 'Necromancia' },
    { label: 'Transmutação', value: 'Transmutação' },
    { label: 'Universal', value: 'Universal' },
] as const;

// --- CHARACTER OPTIONS ---

export const CLASSES = [
    { id: 'barbaro', name: 'Bárbaro', hitDie: 12, desc: 'Fúria primordial e resistência física.', color: 'text-orange-600 bg-orange-100 border-orange-200' },
    { id: 'bardo', name: 'Bardo', hitDie: 8, desc: 'Magia através da música e inspiração.', color: 'text-purple-600 bg-purple-100 border-purple-200' },
    { id: 'bruxo', name: 'Bruxo', hitDie: 8, desc: 'Pacto com uma entidade extraplanar.', color: 'text-violet-600 bg-violet-100 border-violet-200' },
    { id: 'clerigo', name: 'Clérigo', hitDie: 8, desc: 'Magia divina a serviço de um poder maior.', color: 'text-yellow-600 bg-yellow-100 border-yellow-200' },
    { id: 'druida', name: 'Druida', hitDie: 8, desc: 'Poderes da natureza e forma selvagem.', color: 'text-green-600 bg-green-100 border-green-200' },
    { id: 'feiticeiro', name: 'Feiticeiro', hitDie: 6, desc: 'Magia inata de uma linhagem poderosa.', color: 'text-pink-600 bg-pink-100 border-pink-200' },
    { id: 'guerreiro', name: 'Guerreiro', hitDie: 10, desc: 'Combate tático e maestria em armas.', color: 'text-red-600 bg-red-100 border-red-200' },
    { id: 'ladino', name: 'Ladino', hitDie: 8, desc: 'Furtividade, perícias e ataques precisos.', color: 'text-slate-600 bg-slate-100 border-slate-200' },
    { id: 'mago', name: 'Mago', hitDie: 6, desc: 'Conhecimento arcano e magias poderosas.', color: 'text-blue-600 bg-blue-100 border-blue-200' },
    { id: 'monge', name: 'Monge', hitDie: 8, desc: 'Artes marciais e disciplina do ki.', color: 'text-cyan-600 bg-cyan-100 border-cyan-200' },
    { id: 'paladino', name: 'Paladino', hitDie: 10, desc: 'Guerreiro sagrado jurado a um ideal.', color: 'text-amber-600 bg-amber-100 border-amber-200' },
    { id: 'patrulheiro', name: 'Patrulheiro', hitDie: 10, desc: 'Caçador e rastreador das fronteiras.', color: 'text-emerald-600 bg-emerald-100 border-emerald-200' },
] as const;

export const RACES = [
    { id: 'humano', name: 'Humano', speed: 9, bonus: '+1 Todos (ou Talento)' },
    { id: 'elfo', name: 'Elfo', speed: 9, bonus: '+2 Des' },
    { id: 'anao', name: 'Anão', speed: 9, bonus: '+2 Con' },
    { id: 'halfling', name: 'Halfling', speed: 9, bonus: '+2 Des' },
    { id: 'draconato', name: 'Draconato', speed: 9, bonus: '+2 For' },
    { id: 'gnomo', name: 'Gnomo', speed: 9, bonus: '+2 Int' },
    { id: 'orc', name: 'Orc', speed: 9, bonus: '+2 For' },
    { id: 'tiefling', name: 'Tiefling', speed: 9, bonus: '+2 Car' },
    { id: 'goliath', name: 'Golias', speed: 10.5, bonus: '+2 For' },
    { id: 'aasimar', name: 'Aasimar', speed: 9, bonus: '+2 Car' },
] as const;

export const BACKGROUNDS = [
    { id: 'acolyte', name: 'Acólito', skill: 'Religião, Intuição' },
    { id: 'charlatan', name: 'Charlatão', skill: 'Enganação, Prestidigitação' },
    { id: 'criminal', name: 'Criminoso', skill: 'Enganação, Furtividade' },
    { id: 'entertainer', name: 'Artista', skill: 'Acrobacia, Atuação' },
    { id: 'farmer', name: 'Fazendeiro', skill: 'Lidar com Animais, Natureza' },
    { id: 'guard', name: 'Guarda', skill: 'Atletismo, Percepção' },
    { id: 'guide', name: 'Guia', skill: 'Sobrevivência, Furtividade' },
    { id: 'hermit', name: 'Eremita', skill: 'Medicina, Religião' },
    { id: 'merchant', name: 'Mercador', skill: 'Persuasão, Intuição' },
    { id: 'noble', name: 'Nobre', skill: 'História, Persuasão' },
    { id: 'sage', name: 'Sábio', skill: 'Arcanismo, História' },
    { id: 'soldier', name: 'Soldado', skill: 'Atletismo, Intimidação' },
    { id: 'wayfarer', name: 'Viajante', skill: 'Furtividade, Intuição' },
] as const;

export const ALIGNMENTS = [
    { id: 'lg', name: 'Leal e Bom', code: 'LG' },
    { id: 'ng', name: 'Neutro e Bom', code: 'NG' },
    { id: 'cg', name: 'Caótico e Bom', code: 'CG' },
    { id: 'ln', name: 'Leal e Neutro', code: 'LN' },
    { id: 'n', name: 'Neutro', code: 'N' },
    { id: 'cn', name: 'Caótico e Neutro', code: 'CN' },
    { id: 'le', name: 'Leal e Mau', code: 'LE' },
    { id: 'ne', name: 'Neutro e Mau', code: 'NE' },
    { id: 'ce', name: 'Caótico e Mau', code: 'CE' },
] as const;

export const SKILLS_DATA: { id: SkillName; name: string; attr: AttributeName; }[] = [
    { id: 'acrobatics', name: 'Acrobacia', attr: 'dex' },
    { id: 'animal_handling', name: 'Lidar com Animais', attr: 'wis' },
    { id: 'arcana', name: 'Arcanismo', attr: 'int' },
    { id: 'athletics', name: 'Atletismo', attr: 'str' },
    { id: 'deception', name: 'Enganação', attr: 'cha' },
    { id: 'history', name: 'História', attr: 'int' },
    { id: 'insight', name: 'Intuição', attr: 'wis' },
    { id: 'intimidation', name: 'Intimidação', attr: 'cha' },
    { id: 'investigation', name: 'Investigação', attr: 'int' },
    { id: 'medicine', name: 'Medicina', attr: 'wis' },
    { id: 'nature', name: 'Natureza', attr: 'int' },
    { id: 'perception', name: 'Percepção', attr: 'wis' },
    { id: 'performance', name: 'Atuação', attr: 'cha' },
    { id: 'persuasion', name: 'Persuasão', attr: 'cha' },
    { id: 'religion', name: 'Religião', attr: 'int' },
    { id: 'sleight_of_hand', name: 'Prestidigitação', attr: 'dex' },
    { id: 'stealth', name: 'Furtividade', attr: 'dex' },
    { id: 'survival', name: 'Sobrevivência', attr: 'wis' },
];

export const COIN_TYPES = [
    { id: 'cp', name: 'Cobre (PC)' },
    { id: 'sp', name: 'Prata (PP)' },
    { id: 'ep', name: 'Electro (PE)' },
    { id: 'gp', name: 'Ouro (PO)' },
    { id: 'pp', name: 'Platina (PL)' },
] as const;
