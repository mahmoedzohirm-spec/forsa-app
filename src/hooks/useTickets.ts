import { useState, useCallback } from "react";
import { Ticket, TicketCounts } from "@/types";
import { api } from "@/services/api";

export const useTickets = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [counts, setCounts] = useState<TicketCounts>({
    total: "0",
    available: "0",
    pending: "0",
    sold: "0",
  });
  const [subscribers, setSubscribers] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getTickets(5000); // ✅ تم التغيير إلى 5000
      if (data.success) {
        setTickets(data.tickets);
        setCounts(data.counts);
        setSubscribers(parseInt(data.subscribers || "0"));
      }
    } catch (error) {
      console.error("Error loading tickets:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { tickets, counts, subscribers, loading, loadTickets };
};
