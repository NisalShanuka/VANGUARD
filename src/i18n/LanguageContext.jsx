"use client";
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { translations } from './translations.js';

const LanguageContext = createContext(null);

const STORAGE_KEY = 'vanguard_language';
const DEFAULT_LANGUAGE = 'en';

const resolvePath = (source, path) => {
  if (!source || !path) return undefined;
  return path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), source);
};

const interpolate = (value, params) => {
  if (!params) return value;
  return value.replace(/\{(\w+)\}/g, (match, key) => {
    if (Object.prototype.hasOwnProperty.call(params, key)) {
      return String(params[key]);
    }
    return match;
  });
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'si' ? 'si' : DEFAULT_LANGUAGE;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, language);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language === 'si' ? 'si' : 'en';
    }
  }, [language]);

  const t = useMemo(() => {
    const dictionary = translations[language] || translations[DEFAULT_LANGUAGE];
    return (key, params) => {
      const value = resolvePath(dictionary, key) ?? resolvePath(translations[DEFAULT_LANGUAGE], key);
      if (typeof value !== 'string') return value ?? key;
      return interpolate(value, params);
    };
  }, [language]);

  const toggleLanguage = () => {
    setLanguage((current) => (current === 'si' ? 'en' : 'si'));
  };

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
      t,
    }),
    [language, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
