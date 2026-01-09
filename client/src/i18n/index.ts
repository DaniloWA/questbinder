/**
 * Translation Engine
 * QuestBinder VTT - Core i18n System
 *
 * Laravel-inspired translation function with:
 * - Type-safe keys
 * - Nested key resolution
 * - Pluralization (PT-BR correct)
 * - Variable interpolation (:name)
 * - Fallback chain
 * - Missing key tracking
 */

import type { SupportedLocale, Translations, TranslationKey } from './types';
import ptBR from './locales/pt-BR';
import enUS from './locales/en-US';

// === Configuration ===
const CONFIG = {
  defaultLocale: 'pt-BR' as SupportedLocale,
  fallbackLocale: 'en-US' as SupportedLocale,
  storageKey: 'questbinder_locale',
};

// === Locale Registry ===
const locales: Record<SupportedLocale, Translations> = {
  'pt-BR': ptBR as unknown as Translations,
  'en-US': enUS as unknown as Translations,
};

// === State ===
let currentLocale: SupportedLocale = CONFIG.defaultLocale;

// Missing keys tracking (dev only)
const missingKeys = new Set<string>();

// Cached keys per locale
const keysCache = new Map<SupportedLocale, string[]>();

// === Core Functions ===

export function setLocale(locale: SupportedLocale): void {
  if (locales[locale]) {
    currentLocale = locale;
    try {
      localStorage.setItem(CONFIG.storageKey, locale);
    } catch {
      // localStorage unavailable (private mode, etc.)
    }
    document.documentElement.lang = locale;
  }
}

export function getLocale(): SupportedLocale {
  return currentLocale;
}

export function getAvailableLocales(): SupportedLocale[] {
  return Object.keys(locales) as SupportedLocale[];
}

export function initLocale(): SupportedLocale {
  let stored: SupportedLocale | null = null;

  try {
    stored = localStorage.getItem(CONFIG.storageKey) as SupportedLocale | null;
  } catch {
    console.warn('[i18n] localStorage unavailable');
  }

  const browserLocale = navigator.language as SupportedLocale;
  const locale =
    stored ?? (locales[browserLocale] ? browserLocale : CONFIG.defaultLocale);
  setLocale(locale);
  return locale;
}

// === Key Resolution (Deep Nested Support) ===

function resolveKey(
  translations: Translations,
  key: string
): string | undefined {
  const parts = key.split('.');
  let current: unknown = translations;

  for (const part of parts) {
    if (current === undefined || current === null) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return typeof current === 'string' ? current : undefined;
}

// === Pluralization Engine (PT-BR Correct) ===

function pluralize(
  template: string,
  count: number,
  replacements: Record<string, string | number>
): string {
  const segments = template.split('|');

  for (const segment of segments) {
    // Exact match: {0}, {1}
    const exactMatch = segment.match(/^\{(\d+)\}\s*(.*)$/);
    if (exactMatch && count === parseInt(exactMatch[1])) {
      return interpolate(exactMatch[2].trim(), { ...replacements, count });
    }

    // Range match: [2,5], [6,*]
    const rangeMatch = segment.match(/^\[(\d+),(\d+|\*)\]\s*(.*)$/);
    if (rangeMatch) {
      const min = parseInt(rangeMatch[1]);
      const max = rangeMatch[2] === '*' ? Infinity : parseInt(rangeMatch[2]);
      if (count >= min && count <= max) {
        return interpolate(rangeMatch[3].trim(), { ...replacements, count });
      }
    }
  }

  // Simple plural: "item|itens"
  const forms = template.split('|');
  if (forms.length === 2 && !forms[0].includes('{')) {
    const text = count === 1 ? forms[0].trim() : forms[1].trim();
    return interpolate(text, { ...replacements, count });
  }

  return interpolate(template, { ...replacements, count });
}

// === Variable Interpolation (Laravel :name style only) ===

function interpolate(
  text: string,
  replacements: Record<string, string | number>
): string {
  let result = text;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(`:${key}`, 'gi'), String(value));
  }
  return result;
}

// === Main Translation Function ===

/**
 * Translate a key with optional replacements.
 *
 * @example Basic
 * t('common.actions.save.label')  // "Salvar"
 *
 * @example Interpolation
 * t('common.validation.minLength.errorMessage', { min: 3 })  // "Mínimo de 3 caracteres."
 *
 * @example Pluralization
 * t('common.plurals.items', { count: 0 })  // "Nenhum item"
 * t('common.plurals.items', { count: 5 })  // "5 itens"
 */
export function ___(
  key: TranslationKey | string,
  replacements: Record<string, string | number> = {}
): string {
  // 1. Try current locale
  let value = resolveKey(locales[currentLocale], key);

  // 2. Fallback to fallback locale
  if (value === undefined && currentLocale !== CONFIG.fallbackLocale) {
    value = resolveKey(locales[CONFIG.fallbackLocale], key);
  }

  // 3. Handle missing key
  if (value === undefined) {
    if (import.meta.env.DEV) {
      console.warn(`[i18n] Missing: "${key}"`);
      missingKeys.add(key);
    }
    return key; // Always return key, never expose internal state
  }

  // 4. Pluralize + Interpolate
  if ('count' in replacements && typeof replacements.count === 'number') {
    return pluralize(value, replacements.count, replacements);
  }

  // 5. Just interpolate
  return interpolate(value, replacements);
}

// Shorthand alias (recommended for components)
export const t = ___;

// === Utilities ===

export function hasTranslation(key: string): boolean {
  return resolveKey(locales[currentLocale], key) !== undefined;
}

export function getAllKeys(locale?: SupportedLocale): string[] {
  const target = locale ?? currentLocale;

  if (keysCache.has(target)) {
    return keysCache.get(target)!;
  }

  const keys: string[] = [];
  const collect = (obj: unknown, prefix = '') => {
    if (!obj || typeof obj !== 'object') return;
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      const full = prefix ? `${prefix}.${k}` : k;
      if (typeof v === 'string') {
        keys.push(full);
      } else if (typeof v === 'object') {
        collect(v, full);
      }
    }
  };
  collect(locales[target]);
  keysCache.set(target, keys);
  return keys;
}

export function getMissingKeys(): string[] {
  return Array.from(missingKeys);
}

// === Dev Tools ===
if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__i18n = {
    getMissingKeys,
    getAllKeys,
    setLocale,
    getLocale,
    t: ___,
  };
}

// Re-export types
export type { SupportedLocale, TranslationKey } from './types';
