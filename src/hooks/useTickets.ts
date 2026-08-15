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
  const [allTickets, setAllTickets] = useState<Ticket[]>([]); // ✅ تخزين كل البطاقات
  const limit = 200;
  const isBackgroundFetching = useRef(false);

  // ✅ تحميل الدفعة الأولى
  const loadTickets = useCallback(async (reset = true) => {
    setLoading(true);
    try {
      const currentPage = reset ? 1 : page;
      const res = await fetch(`/api/tickets?page=${currentPage}&limit=${limit}`);
      const data = await res.json();
      if (data.success) {
        if (reset) {
          setTickets(data.tickets);
          setAllTickets(data.tickets); // ✅ تخزين النسخة الكاملة
          setPage(1);
        } else {
          setTickets(prev => [...prev, ...data.tickets]);
          setAllTickets(prev => [...prev, ...data.tickets]);
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

  // ✅ تحميل الخلفي (باقي البطاقات)
  const fetchAllInBackground = useCallback(async () => {
    if (isBackgroundFetching.current || !hasMore) return;
    isBackgroundFetching.current = true;
    setBackgroundLoading(true);

    try {
      let currentPage = 2; // نبدأ من الصفحة الثانية
      let more = true;
      const allFetched: Ticket[] = [...tickets];

      while (more && currentPage <= Math.ceil(total / limit)) {
        const res = await fetch(`/api/tickets?page=${currentPage}&limit=${limit}`);
        const data = await res.json();
        if (data.success && data.tickets.length > 0) {
          allFetched.push(...data.tickets);
          setAllTickets([...allFetched]); // ✅ تحديث الكل تدريجياً
          setTickets([...allFetched]); // ✅ تحديث المعروض (اختياري)
          more = data.pagination.hasMore;
          currentPage++;
        } else {
          break;
        }
      }

      // بعد الانتهاء، نحدّث hasMore
      setHasMore(false);
    } catch (error) {
      console.error("Background fetch error:", error);
    } finally {
      setBackgroundLoading(false);
      isBackgroundFetching.current = false;
    }
  }, [tickets, total, limit, hasMore]);

  // ✅ تحميل المزيد (عند الضغط على الزر)
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      // إذا كانت البطاقات محمّلة بالكامل في الخلفية، نظهرها فوراً
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
      }, 1000); // تأخير 1 ثانية عشان ما نضغط على السيرفر فوراً
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
