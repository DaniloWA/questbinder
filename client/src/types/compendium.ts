
export type CompendiumCategory = 'monsters' | 'spells' | 'magicitems' | 'sections';

export interface CompendiumResult<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiMonster {
  slug: string;
  name: string;
  size: string;
  type: string;
  subtype: string;
  group: string;
  alignment: string;
  armor_class: number;
  armor_desc: string;
  hit_points: number;
  hit_dice: string;
  speed: { walk: number; fly?: number; swim?: number; climb?: number };
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  challenge_rating: number;
  actions: { name: string; desc: string; attack_bonus?: number; damage_dice?: string }[];
  special_abilities?: { name: string; desc: string }[];
  legendary_actions?: { name: string; desc: string }[];
  spell_list: string[];
  img_main?: string;
  senses?: string;
  languages?: string;
}

export interface ApiSpell {
  slug: string;
  name: string;
  desc: string;
  higher_level: string;
  page: string;
  range: string;
  components: string;
  material: string;
  ritual: string;
  duration: string;
  concentration: string;
  casting_time: string;
  level: string; // "1st-level"
  level_int: number;
  school: string;
  dnd_class: string;
  prepared?: boolean; // UI state
}

export interface ApiMagicItem {
  slug: string;
  name: string;
  type: string;
  desc: string;
  rarity: string;
  requires_attunement: string;
}

export interface ApiSection { // Rules
  slug: string;
  name: string;
  desc: string;
  parent: string;
}