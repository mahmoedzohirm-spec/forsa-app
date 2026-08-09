import { useState, useCallback } from "react";
import { Prize } from "@/types";
import { api } from "@/services/api";

export const usePrizes = () => {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPrizes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getPrizes();
      if (data.success) {
        setPrizes(data.prizes);
      }
    } catch (error) {
      console.error("Error loading prizes:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addPrize = useCallback(
    async (prize: Omit<Prize, "id">) => {
      const data = await api.addPrize(prize);
      if (data.success) {
        await loadPrizes();
      }
      return data;
    },
    [loadPrizes]
  );

  const updatePrize = useCallback(
    async (prize: Prize) => {
      const data = await api.updatePrize(prize);
      if (data.success) {
        await loadPrizes();
      }
      return data;
    },
    [loadPrizes]
  );

  const deletePrize = useCallback(
    async (id: number) => {
      const data = await api.deletePrize(id);
      if (data.success) {
        await loadPrizes();
      }
      return data;
    },
    [loadPrizes]
  );

  return { prizes, loading, loadPrizes, addPrize, updatePrize, deletePrize };
};