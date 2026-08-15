import { useState, useCallback } from "react";
import { Ticket, TicketCounts } from "@/types";

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
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const limit = 200; // ← عدد البطاقات لكل دفعة

  const loadTickets = useCallback(async (reset = true) => {
    setLoading(true);
    try {
      const currentPage = reset ? 1 : page;
      const res = await fetch(`/api/tickets?page=${currentPage}&limit=${limit}`);
      const data = await res.json();
      if (data.success) {
        if (reset) {
          setTickets(data.tickets);
          setPage(1);
        } else {
          setTickets(prev => [...prev, ...data.tickets]);
          setPage(currentPage + 1);
        }
        setCounts(data.counts);
        setHasMore(data.pagination.hasMore);
        setTotal(data.pagination.total);
        if (data.subscribers !== undefined) setSubscribers(data.subscribers);
      }
    } catch (error) {
      console.error("Error loading tickets:", error);
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadTickets(false);
    }
  }, [loading, hasMore, loadTickets]);

  return {
    tickets,
    counts,
    subscribers,
    loading,
    loadTickets,
    loadMore,
    hasMore,
    total,
    limit,
  };
};
