/**
 * Translation System Types
 * QuestBinder VTT - i18n Infrastructure
 */

// Recursive type for nested translation objects
export type TranslationValue = string | { [key: string]: TranslationValue; };
export type Translations = Record<string, TranslationValue>;

// Supported locales
export type SupportedLocale = 'pt-BR' | 'en-US';

// Type-safe translation keys using DeepKeys utility
type DeepKeys<T, Prefix extends string = ''> = T extends string
  ? Prefix
  : T extends object
  ? {
    [K in keyof T & string]: DeepKeys<
      T[K],
      Prefix extends '' ? K : `${Prefix}.${K}`
    >;
  }[keyof T & string]
  : never;

// Import locale for type generation
import type ptBR from './locales/pt-BR';

// Generated type-safe keys from PT-BR locale (source of truth)
export type TranslationKey = DeepKeys<typeof ptBR>;
