'use client';

import React, { useState } from "react";
import { CheckCircle, AlertCircle, Clock } from "lucide-react";
import { useApiStatus } from "@/hooks/useApiStatus";

interface StatusConfig {
  dot: string;
  bg: string;
  border: string;
  text: string;
  label: string;
  icon: React.ReactNode;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  online: {
    dot: "bg-emerald-400",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    label: "Online",
    icon: <CheckCircle size={14} className="text-emerald-500" />,
  },
  offline: {
    dot: "bg-rose-400",
    bg: "bg-rose-50",
    border: "border-rose-200",
    text: "text-rose-700",
    label: "Offline",
    icon: <AlertCircle size={14} className="text-rose-500" />,
  },
  checking: {
    dot: "bg-amber-400",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    label: "Checking",
    icon: <Clock size={14} className="text-amber-500 animate-spin" />,
  },
};

export const ApiStatusIndicator: React.FC = () => {
  const { apiStatus, responseTime, checkApiStatus } = useApiStatus();
  const [isHovered, setIsHovered] = useState(false);

  const config = STATUS_CONFIG[apiStatus] ?? STATUS_CONFIG.checking;

  return (
    <div className="relative">
      <button
        onClick={checkApiStatus}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border ${config.bg} ${config.border} hover:shadow-sm transition-all active:scale-95`}
      >
        <div className="relative">
          {config.icon}
          <div
            className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full border border-white ${config.dot}`}
          />
        </div>
        <span className={`text-xs font-medium ${config.text}`}>{config.label}</span>
        {responseTime && apiStatus === "online" && (
          <span className="text-[10px] text-slate-500 font-mono ml-0.5">{responseTime}ms</span>
        )}
      </button>

      {isHovered && (
        <div className="absolute top-full right-0 mt-1 z-50 w-48">
          <div className="bg-slate-900 text-white text-xs rounded-lg py-2 px-3 shadow-xl border border-slate-800">
            <div className="font-medium mb-1 text-slate-300">Status API</div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className={`font-medium ${config.text}`}>{config.label}</span>
              </div>
              {responseTime && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Response:</span>
                  <span className="font-mono text-emerald-400">{responseTime}ms</span>
                </div>
              )}
            </div>
            <p className="text-slate-500 text-[10px] mt-2 text-center">Klik untuk refresh</p>
          </div>
        </div>
      )}
    </div>
  );
};