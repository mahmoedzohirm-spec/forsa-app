import { useState, useCallback } from "react";
import { AppSettings, Prize } from "@/types";
import { api } from "@/services/api";

export const useSettings = () => {
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

      if (prizesData.success && prizesData.prizes.length > 0) {
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

  return { settings, prizes, loading, loadSettingsAndPrizes };
};