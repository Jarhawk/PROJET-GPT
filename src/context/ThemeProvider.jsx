// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { createContext, useContext, useEffect } from "react";
import useMamaSettings from "@/hooks/useMamaSettings";
import { useAuth } from '@/hooks/useAuth';

const ThemeContext = createContext({});

export function ThemeProvider({ children }) {
  const { mama_id } = useAuth();
  const { settings, fetchMamaSettings } = useMamaSettings();

  useEffect(() => {
    if (mama_id) fetchMamaSettings();
  }, [mama_id, fetchMamaSettings]);

  useEffect(() => {
    if (settings.primary_color) {
      document.documentElement.style.setProperty(
        "--primary-color",
        settings.primary_color
      );
      document.documentElement.style.setProperty(
        "--mamastock-gold",
        settings.primary_color
      );
    }
    if (settings.secondary_color) {
      document.documentElement.style.setProperty(
        "--secondary-color",
        settings.secondary_color
      );
    }
  }, [settings.primary_color, settings.secondary_color]);

  useEffect(() => {
    if (typeof settings.dark_mode === "boolean") {
      if (settings.dark_mode) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    } else {
      const prefers = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefers) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
    }
  }, [settings.dark_mode]);

  const value = {
    logo: settings.logo_url,
    primaryColor: settings.primary_color,
    secondaryColor: settings.secondary_color,
    darkMode: settings.dark_mode,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  return useContext(ThemeContext) || {};
}
