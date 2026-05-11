import { translations, type TranslationKey, type Locale } from '$lib/i18n/translations';

const STORAGE_KEY = 'hk-locale';

function getInitialLocale(): Locale {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'zh') return saved;
  }
  return 'zh';
}

export const locale = $state({ current: getInitialLocale() as Locale });

export function toggleLocale() {
  locale.current = locale.current === 'en' ? 'zh' : 'en';
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, locale.current);
  }
}

export function t(key: TranslationKey): string {
  return (translations[locale.current] as Record<string, string>)[key]
    ?? (translations.en as Record<string, string>)[key]
    ?? key;
}
