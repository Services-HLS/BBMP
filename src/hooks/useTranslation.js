import { useCallback } from 'react';
import { useThemeMode } from '../context/ThemeContext';
import { t as translate, getDictionary } from '../i18n/dictionary';

export function useTranslation() {
  const { language, setLanguage } = useThemeMode();
  const t = useCallback((key) => translate(key, language), [language]);
  return { t, language, setLanguage, dict: getDictionary(language) };
}
