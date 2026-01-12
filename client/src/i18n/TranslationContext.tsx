/**
 * Translation React Context
 * QuestBinder VTT - React Integration
 *
 * Provides:
 * - useTranslation() hook with t(), locale, changeLocale
 * - useT() hook for simple translation
 * - TranslationProvider for app wrapping
 */

import React, {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useSyncExternalStore,
} from 'react';
import {
  ___,
  setLocale,
  getLocale,
  initLocale,
  getAvailableLocales,
  hasTranslation,
} from './index';
import type { SupportedLocale, TranslationKey } from './types';

// === External Store for Performance ===
let listeners: Array<() => void> = [];

const subscribe = (listener: () => void) => {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
};

const notifyListeners = () => {
  listeners.forEach((l) => l());
};

// === Context Types ===
interface TranslationContextValue {
  locale: SupportedLocale;
  availableLocales: SupportedLocale[];
  changeLocale: (locale: SupportedLocale) => void;
  t: (
    key: TranslationKey | string,
    replacements?: Record<string, string | number>
  ) => string;
  hasKey: (key: string) => boolean;
}

console.log('[DEBUG] TranslationContext Module Loaded', new Error().stack); // Log stack to see importer
const TranslationContext = (globalThis as any).__TranslationContext || createContext<TranslationContextValue | null>(null);
if (process.env.NODE_ENV !== 'production') {
  (globalThis as any).__TranslationContext = TranslationContext;
}

// === Provider ===
export const TranslationProvider: React.FC<{ children: React.ReactNode; }> = ({
  children,
}) => {
  // Initialize locale on first render
  useMemo(() => initLocale(), []);

  // Subscribe to locale changes using useSyncExternalStore (React 18+)
  const locale = useSyncExternalStore(subscribe, getLocale, getLocale);

  const changeLocale = useCallback((newLocale: SupportedLocale) => {
    setLocale(newLocale);
    notifyListeners();
  }, []);

  const t = useCallback(
    (
      key: TranslationKey | string,
      replacements?: Record<string, string | number>
    ) => ___(key, replacements),
    [locale]
  );

  const hasKey = useCallback((key: string) => hasTranslation(key), [locale]);

  const availableLocales = useMemo(() => getAvailableLocales(), []);

  const value = useMemo(
    () => ({ locale, availableLocales, changeLocale, t, hasKey }),
    [locale, availableLocales, changeLocale, t, hasKey]
  );

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};

// === Hooks ===

/**
 * Full translation hook with locale management.
 *
 * @example
 * const { t, locale, changeLocale } = useTranslation();
 * <button onClick={() => changeLocale('en-US')}>{locale}</button>
 * <span>{t('common.actions.save.label')}</span>
 */
export function useTranslation(): TranslationContextValue {
  const ctx = useContext(TranslationContext);
  if (!ctx) {
    throw new Error('useTranslation must be used within TranslationProvider');
  }
  return ctx as TranslationContextValue;
}

/**
 * Simple hook that returns just the t() function.
 *
 * @example
 * const t = useT();
 * <button>{t('common.actions.save.label')}</button>
 */
export function useT() {
  return useTranslation().t;
}
