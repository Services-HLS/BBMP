import { createContext, useCallback, useContext, useMemo, useState, useEffect } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { createAppTheme } from '../theme';
import { loadPrefs, savePrefs } from '../utils/storage';

const ThemeModeContext = createContext(null);

export function AppThemeProvider({ children }) {
  const [mode, setMode] = useState('light');
  const [language, setLanguageState] = useState('en');

  useEffect(() => {
    const prefs = loadPrefs();
    if (prefs.theme) setMode(prefs.theme);
    if (prefs.language) setLanguageState(prefs.language);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === 'kn' ? 'kn' : 'en';
  }, [language]);

  const toggleTheme = useCallback(() => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      const prefs = loadPrefs();
      savePrefs({ ...prefs, theme: next });
      return next;
    });
  }, []);

  const setLanguage = useCallback((lang) => {
    setLanguageState(lang);
    const prefs = loadPrefs();
    savePrefs({ ...prefs, language: lang });
  }, []);

  const theme = useMemo(() => createAppTheme(mode), [mode]);

  const value = useMemo(() => ({
    mode,
    toggleTheme,
    language,
    setLanguage,
  }), [mode, toggleTheme, language, setLanguage]);

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode() {
  const ctx = useContext(ThemeModeContext);
  if (!ctx) throw new Error('useThemeMode must be used within AppThemeProvider');
  return ctx;
}
