"use client";
import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from "react";
import { AppSettings, Prize } from "@/types";
import { api } from "@/services/api";

interface SettingsContextType {
  settings: AppSettings;
  prizes: Prize[];
  loading: boolean;
  loadSettingsAndPrizes: () => Promise<void>;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  addPrize: (prize: Omit<Prize, "id">) => Promise<void>;
  updatePrize: (prize: Prize) => Promise<void>;
  deletePrize: (id: number) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<AppSettings>({
    site_name: "فرصة العمر",
    currency: "ريال",
    ticket_price: "100",
    max_tickets: "3000",
  });
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSettingsAndPrizes = useCallback(async () => {
    setLoading(true);
    try {
      const [settingsData, prizesData] = await Promise.all([
        api.getSettings(),
        api.getPrizes(),
      ]);
      if (settingsData.success) {
        setSettings(settingsData.settings);
      }
      if (prizesData.success) {
        setPrizes(prizesData.prizes);
      } else {
        // Fallback prizes
        setPrizes([
          { id: 1, tier: 1, title: "الجائزة الكبرى", description: "سيارة فاخرة موديل 2025" },
          { id: 2, tier: 2, title: "رحلة سياحية", description: "رحلة سياحية لشخصين إلى المالديف" },
          { id: 3, tier: 3, title: "جهاز إلكتروني", description: "آيفون 16 برو ماكس + آيباد برو" },
        ]);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    const result = await api.saveSettings(updated);
    if (result.success) {
      setSettings(updated);
    } else {
      throw new Error(result.error || "Failed to save settings");
    }
  }, [settings]);

  const addPrize = useCallback(async (prize: Omit<Prize, "id">) => {
    const result = await api.addPrize(prize);
    if (result.success) {
      await loadSettingsAndPrizes(); // reload
    } else {
      throw new Error(result.error || "Failed to add prize");
    }
  }, [loadSettingsAndPrizes]);

  const updatePrize = useCallback(async (prize: Prize) => {
    const result = await api.updatePrize(prize);
    if (result.success) {
      await loadSettingsAndPrizes();
    } else {
      throw new Error(result.error || "Failed to update prize");
    }
  }, [loadSettingsAndPrizes]);

  const deletePrize = useCallback(async (id: number) => {
    const result = await api.deletePrize(id);
    if (result.success) {
      await loadSettingsAndPrizes();
    } else {
      throw new Error(result.error || "Failed to delete prize");
    }
  }, [loadSettingsAndPrizes]);

  useEffect(() => {
    loadSettingsAndPrizes();
  }, [loadSettingsAndPrizes]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        prizes,
        loading,
        loadSettingsAndPrizes,
        updateSettings,
        addPrize,
        updatePrize,
        deletePrize,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return context;
};