import { Character, Attributes } from '../../types';

export class AttributeCalculator {
  /**
   * Calculates the ability modifier from a score.
   * Formula: floor((score - 10) / 2)
   */
  static calcModifier(score: number): number {
    return Math.floor((score - 10) / 2);
  }

  /**
   * Formats a modifier as a string with sign (e.g., "+2", "-1", "0").
   */
  static formatModifier(mod: number): string {
    return mod >= 0 ? `+${mod}` : `${mod}`;
  }

  /**
   * Calculates passive perception based on wisdom modifier, proficiency, and expertise.
   * Assumes 'perception' skill ID is 'perception'.
   */
  static calcPassivePerception(character: Character): number {
    // Fallback if attributes are missing
    if (!character.attributes || !character.attributes.wis) return 10;

    const wisMod = this.calcModifier(character.attributes.wis);
    let passive = 10 + wisMod;

    // Check proficiency
    if (character.skills && character.skills.includes('perception')) {
      passive += character.profBonus;
    }

    // Check expertise
    if (character.expertise && character.expertise.includes('perception')) {
      passive += character.profBonus;
    }

    // Feat: Observant (example logic, would need feat checking)
    // if (hasFeat(character, 'observant')) passive += 5;

    return passive;
  }

  /**
   * Calculates the total bonus for a skill check.
   */
  static calcSkillBonus(character: Character, skillId: string, attributeKey: keyof Attributes): number {
    const attrScore = character.attributes[attributeKey];
    const mod = this.calcModifier(attrScore);
    let bonus = mod;

    if (character.skills.includes(skillId)) {
      bonus += character.profBonus;
    }

    if (character.expertise?.includes(skillId)) {
      bonus += character.profBonus;
    }

    return bonus;
  }
}
