import { useState, useCallback } from "react";

export const useToast = () => {
  const [toast, setToast] = useState("");

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }, []);

  return { toast, showToast };
};