'use client';

import React from "react";
import {
  Shield,
  UserCog,
  Users,
  User,
  UserCheck,
  Settings,
  Key,
} from "lucide-react";
import { ROLE_COLORS, ROLE_DISPLAY } from "@/constants";
import type { RoleBadgeSize, StatCardColor } from "@/types";

// --- Role Icon Mapping ---

const ROLE_ICONS: Record<string, React.ReactNode> = {
  super_admin: <Shield size={14} />,
  admin: <UserCog size={14} />,
  manager: <Users size={14} />,
  staff: <User size={14} />,
  supervisor: <UserCheck size={14} />,
  technician: <Settings size={14} />,
  coordinator: <UserCog size={14} />,
  auditor: <Key size={14} />,
  viewer: <User size={14} />,
};

// --- Role Badge ---

interface RoleBadgeProps {
  role: string;
  size?: RoleBadgeSize;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, size = "md" }) => {
  const colors = ROLE_COLORS[role] ?? ROLE_COLORS.viewer;
  const icon = ROLE_ICONS[role] ?? ROLE_ICONS.viewer;

  const sizeClasses: Record<RoleBadgeSize, string> = {
    sm: "px-1.5 py-0.5 text-[10px]",
    md: "px-2 py-1 text-xs",
    lg: "px-2.5 py-1.5 text-sm",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${colors.bg} ${colors.text} border ${colors.border} ${sizeClasses[size]}`}
    >
      {icon}
      {ROLE_DISPLAY[role] ?? role}
    </span>
  );
};

// --- Stat Card ---

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: StatCardColor;
  trend?: string;
}

const STAT_CARD_COLORS: Record<StatCardColor, { wrapper: string; icon: string }> = {
  blue: {
    wrapper: "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 text-blue-700",
    icon: "bg-blue-100",
  },
  emerald: {
    wrapper: "bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-700",
    icon: "bg-emerald-100",
  },
  amber: {
    wrapper: "bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 text-amber-700",
    icon: "bg-amber-100",
  },
  purple: {
    wrapper: "bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 text-purple-700",
    icon: "bg-purple-100",
  },
};

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, trend }) => {
  const { wrapper, icon: iconBg } = STAT_CARD_COLORS[color];

  return (
    <div
      className={`p-4 sm:p-5 rounded-xl sm:rounded-2xl border ${wrapper} transition-all duration-300 hover:shadow-lg hover:translate-y-[-2px]`}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1 truncate">{title}</p>
          <p className="text-xl sm:text-2xl md:text-3xl font-bold truncate">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-1 sm:mt-2">
              <span
                className={`text-xs font-semibold ${
                  trend.startsWith("+") ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {trend}
              </span>
              <span className="text-xs text-slate-500 hidden sm:inline">dari bulan lalu</span>
            </div>
          )}
        </div>
        <div className={`p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl ${iconBg}`}>{icon}</div>
      </div>
    </div>
  );
};