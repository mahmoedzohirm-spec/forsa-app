import { useState, useCallback, useEffect, useRef } from "react";
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
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const limit = 300; // ✅ 300 بطاقة لكل دفعة
  const isBackgroundFetching = useRef(false);
  const totalPagesRef = useRef(0);

  // ✅ تحميل الدفعة الأولى (أو إعادة التحميل)
  const loadTickets = useCallback(async (reset = true) => {
    setLoading(true);
    try {
      const currentPage = reset ? 1 : page;
      const res = await fetch(`/api/tickets?page=${currentPage}&limit=${limit}`);
      const data = await res.json();
      if (data.success) {
        if (reset) {
          setTickets(data.tickets);
          setAllTickets(data.tickets);
          setPage(1);
        } else {
          setTickets(prev => [...prev, ...data.tickets]);
          setAllTickets(prev => [...prev, ...data.tickets]);
          setPage(currentPage + 1);
        }
        setCounts(data.counts);
        setHasMore(data.pagination.hasMore);
        setTotal(data.pagination.total);
        totalPagesRef.current = data.pagination.totalPages;
        if (data.subscribers !== undefined) setSubscribers(data.subscribers);
      }
    } catch (error) {
      console.error("Error loading tickets:", error);
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  // ✅ تحميل الخلفي (باقي البطاقات)
  const fetchAllInBackground = useCallback(async () => {
    if (isBackgroundFetching.current || !hasMore) return;
    isBackgroundFetching.current = true;
    setBackgroundLoading(true);

    try {
      let currentPage = 2;
      const allFetched: Ticket[] = [...tickets];

      while (currentPage <= totalPagesRef.current) {
        const res = await fetch(`/api/tickets?page=${currentPage}&limit=${limit}`);
        const data = await res.json();
        if (data.success && data.tickets.length > 0) {
          allFetched.push(...data.tickets);
          setAllTickets([...allFetched]);
          // ✅ تحديث tickets فوراً (يظهر البطاقات في الخلفية)
          setTickets([...allFetched]);
          currentPage++;
        } else {
          break;
        }
      }

      setHasMore(false);
    } catch (error) {
      console.error("Background fetch error:", error);
    } finally {
      setBackgroundLoading(false);
      isBackgroundFetching.current = false;
    }
  }, [tickets, limit, hasMore]);

  // ✅ تحميل المزيد (عند الضغط على الزر)
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      // إذا كانت كل البطاقات محمّلة في الخلفية، نظهرها فوراً
      if (allTickets.length > tickets.length) {
        setTickets([...allTickets]);
        setHasMore(false);
        return;
      }
      // وإلا نحمّل دفعة جديدة
      loadTickets(false);
    }
  }, [loading, hasMore, loadTickets, allTickets, tickets]);

  // ✅ بدء التحميل الخلفي تلقائياً بعد تحميل الدفعة الأولى
  useEffect(() => {
    if (tickets.length > 0 && !backgroundLoading && !isBackgroundFetching.current && hasMore) {
      const timer = setTimeout(() => {
        fetchAllInBackground();
      }, 1500); // تأخير 1.5 ثانية عشان ما نضغط على السيرفر فوراً
      return () => clearTimeout(timer);
    }
  }, [tickets, backgroundLoading, hasMore, fetchAllInBackground]);

  return {
    tickets,
    counts,
    subscribers,
    loading,
    backgroundLoading,
    loadTickets,
    loadMore,
    hasMore,
    total,
    limit,
    allTickets,
  };
};
