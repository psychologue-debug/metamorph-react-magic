import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export type DisplayPrefKey = 'showPriorities' | 'showLinks' | 'showHalos';

interface DisplayPrefs {
  showPriorities: boolean;
  showLinks: boolean;
  showHalos: boolean;
  toggle: (key: DisplayPrefKey) => void;
}

const STORAGE_KEY = 'mortes-display-prefs';

const DEFAULTS: Omit<DisplayPrefs, 'toggle'> = {
  showPriorities: false,
  showLinks: true,
  showHalos: true,
};

const DisplayPrefsContext = createContext<DisplayPrefs>({ ...DEFAULTS, toggle: () => {} });

export const DisplayPreferencesProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
    } catch {}
    return DEFAULTS;
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }, [state]);

  const toggle = useCallback((key: DisplayPrefKey) => {
    setState(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  return (
    <DisplayPrefsContext.Provider value={{ ...state, toggle }}>
      {children}
    </DisplayPrefsContext.Provider>
  );
};

export const useDisplayPreferences = () => useContext(DisplayPrefsContext);
