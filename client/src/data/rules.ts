
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
        name: 'Amedrontado',
        effects: [
            'Desvantagem em testes de habilidade e jogadas de ataque enquanto a fonte do medo estiver à vista.',
            'Não pode se aproximar voluntariamente da fonte do medo.'
        ],
        duration: 'Até o fim do próximo turno ou removido da visão da fonte.'
    },
    'grappled': {
        id: 'grappled',
        name: 'Agarrado',
        effects: [
            'Deslocamento reduzido a 0.',
            'Termina se o agarrador ficar incapacitado ou se a criatura for removida do alcance.'
        ],
        duration: 'Até o fim do agarrador ou teste de Força/Fuga.'
    },
    'stunned': {
        id: 'stunned',
        name: 'Atordoado',
        effects: [
            'Incapacitado (sem ações/reações).',
            'Falha automática em testes de Força e Destreza.',
            'Jogadas de ataque contra a criatura têm vantagem.'
        ],
        duration: 'Até o fim do próximo turno (geralmente).'
    },
    'prone': {
        id: 'prone',
        name: 'Caído',
        effects: [
            'Só pode rastejar ou gastar metade do movimento para levantar.',
            'Desvantagem em suas jogadas de ataque.',
            'Ataques corpo a corpo contra a criatura têm vantagem; à distância têm desvantagem.'
        ],
        duration: 'Até se levantar.'
    },
    'blinded': {
        id: 'blinded',
        name: 'Cego',
        effects: [
            'Falha automática em testes que dependam de visão.',
            'Suas jogadas de ataque têm desvantagem.',
            'Ataques contra a criatura têm vantagem.'
        ],
        duration: 'Varia.'
    },
    'charmed': {
        id: 'charmed',
        name: 'Enfeitiçado',
        effects: [
            'Não pode atacar o enfeitiçador nem mirar nele efeitos hostis.',
            'O enfeitiçador tem vantagem em testes de Carisma contra a criatura.'
        ],
        duration: '1 hora ou até sofrer dano do enfeitiçador.'
    },
    'poisoned': {
        id: 'poisoned',
        name: 'Envenenado',
        effects: [
            'Desvantagem em jogadas de ataque e testes de habilidade.'
        ],
        duration: 'Varia (TS CON repetido).'
    },
    'restrained': {
        id: 'restrained',
        name: 'Impedido',
        effects: [
            'Deslocamento 0.',
            'Desvantagem em jogadas de ataque e testes de Destreza.',
            'Ataques contra a criatura têm vantagem.'
        ],
        duration: 'Varia.'
    },
    'incapacitated': {
        id: 'incapacitated',
        name: 'Incapacitado',
        effects: [
            'Não pode realizar ações nem reações.'
        ],
        duration: 'Varia.'
    },
    'unconscious': {
        id: 'unconscious',
        name: 'Inconsciente',
        effects: [
            'Incapacitado, não se move, não fala, sem consciência.',
            'Solta itens e fica Caído.',
            'Falha automática em testes de Força e Destreza.',
            'Ataques contra a criatura têm vantagem e são críticos se atacante estiver a 1,5m.'
        ],
        duration: 'Até ser curado ou estabilizado.'
    },
    'invisible': {
        id: 'invisible',
        name: 'Invisível',
        effects: [
            'Impossível de ser visto sem magia/sentidos especiais.',
            'Considerado muito obscurecido para esconder-se.',
            'Suas jogadas de ataque têm vantagem.',
            'Ataques contra a criatura têm desvantagem.'
        ],
        duration: 'Varia (magia).'
    },
    'paralyzed': {
        id: 'paralyzed',
        name: 'Paralisado',
        effects: [
            'Incapacitado e não pode se mover nem falar.',
            'Falha automática em testes de Força e Destreza.',
            'Ataques contra a criatura têm vantagem e são críticos se atacante estiver a 1,5m.'
        ],
        duration: 'Varia.'
    },
    'petrified': {
        id: 'petrified',
        name: 'Petrificado',
        effects: [
            'Transformado em substância sólida (inanimado).',
            'Incapacitado, não envelhece, peso x10.',
            'Resistência a todo dano, imune a veneno/doença.',
            'Falha automática em testes de Força e Destreza.'
        ],
        duration: 'Permanente até restaurado.'
    },
    'deafened': {
        id: 'deafened',
        name: 'Surdo',
        effects: [
            'Falha automática em testes que dependam de audição.'
        ],
        duration: '1 hora (típico).'
    },
    // Especiais / Homebrew Comuns
    'exhausted': {
        id: 'exhausted',
        name: 'Exausto',
        effects: [
            'Nvl 1: Desvantagem em testes de habilidade.',
            'Nvl 2: Deslocamento reduzido à metade.',
            'Nvl 3: Desvantagem em ataques e testes de resistência.',
            'Nvl 4: PV Máximo reduzido à metade.',
            'Nvl 5: Deslocamento 0.',
            'Nvl 6: Morte.'
        ],
        duration: 'Descanso Longo reduz 1 nível.'
    },
    'burning': {
        id: 'burning',
        name: 'Queimando',
        effects: [
            'Sofre 1d6 de dano de fogo no início de cada turno.',
            'Pode gastar uma ação para apagar as chamas (CD 10 Destreza).'
        ],
        duration: '1 minuto ou até apagado.'
    },
    'bleeding': {
        id: 'bleeding',
        name: 'Sangrando',
        effects: [
            'Sofre 1d4 de dano necrótico/perfurante no início do turno.',
            'Qualquer cura mágica encerra a condição.'
        ],
        duration: 'Até curado (Medicina CD 10 ou Cura).'
    },
    'dead': {
        id: 'dead',
        name: 'Morto',
        effects: ['Personagem faleceu.'],
        duration: 'Permanente.'
    },
    'bloodied': {
        id: 'bloodied',
        name: 'Ferido (Bloodied)',
        effects: ['Abaixo da metade dos pontos de vida.'],
        duration: 'Até ser curado acima de 50%.'
    },
    'shielded': {
        id: 'shielded',
        name: 'Protegido',
        effects: ['Possui bônus na CA ou proteção mágica.'],
        duration: 'Varia.'
    },
    'alert': {
        id: 'alert',
        name: 'Alerta',
        effects: ['Vantagem em iniciativa e percepção.'],
        duration: 'Varia.'
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

export const SKILLS_DATA: { id: SkillName; name: string; attr: AttributeName }[] = [
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
