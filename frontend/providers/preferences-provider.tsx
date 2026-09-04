"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  DEFAULT_PREFERENCES,
  loadPreferences,
  savePreferences,
  type AppPreferences,
} from "@/lib/preferences";

type PreferencesContextValue = {
  preferences: AppPreferences;
  update: (patch: Partial<AppPreferences>) => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<AppPreferences>(DEFAULT_PREFERENCES);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setPreferences(loadPreferences());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) {
      savePreferences(preferences);
    }
  }, [preferences, ready]);

  const value = useMemo(
    () => ({
      preferences,
      update: (patch: Partial<AppPreferences>) => {
        setPreferences((current) => ({ ...current, ...patch }));
      },
    }),
    [preferences],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesContextValue {
  const value = useContext(PreferencesContext);
  if (!value) {
    throw new Error("usePreferences must be used within PreferencesProvider");
  }
  return value;
}
