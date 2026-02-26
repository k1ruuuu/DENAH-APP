import { useState, useCallback, useRef, useEffect } from "react";
import { apiService } from "@/services/api";

interface ApiStatusReturn {
  apiStatus: "online" | "offline" | "checking";
  lastChecked: Date | null;
  responseTime: number | null;
  getLastCheckedText: () => string;
  checkApiStatus: () => Promise<void>;
  startMonitoring: (intervalMs?: number) => void;
  stopMonitoring: () => void;
}

export const useApiStatus = (): ApiStatusReturn => {
  const [apiStatus, setApiStatus] = useState<"online" | "offline" | "checking">("checking");
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const checkApiStatus = useCallback(async () => {
    try {
      setApiStatus("checking");
      const startTime = performance.now();
      const result = await apiService.getStatistics();
      const endTime = performance.now();

      setResponseTime(Math.round(endTime - startTime));
      setApiStatus(result.success ? "online" : "offline");
    } catch (error) {
      console.error("API status check failed:", error);
      setApiStatus("offline");
      setResponseTime(null);
    } finally {
      setLastChecked(new Date());
    }
  }, []);

  const startMonitoring = useCallback(
    (intervalMs = 30000) => {
      checkApiStatus();
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = setInterval(checkApiStatus, intervalMs);
    },
    [checkApiStatus]
  );

  const stopMonitoring = useCallback(() => {
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }
  }, []);

  const getLastCheckedText = (): string => {
    if (!lastChecked) return "Belum diperiksa";

    const diffSec = Math.floor((Date.now() - lastChecked.getTime()) / 1000);
    if (diffSec < 60) return `${diffSec} detik yang lalu`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} menit yang lalu`;
    return `${Math.floor(diffSec / 3600)} jam yang lalu`;
  };

  useEffect(() => {
    startMonitoring(30000);
    return () => stopMonitoring();
  }, [startMonitoring, stopMonitoring]);

  return {
    apiStatus,
    lastChecked,
    responseTime,
    getLastCheckedText,
    checkApiStatus,
    startMonitoring,
    stopMonitoring,
  };
};