"use client";

import { CheckCircle, Users, MapPin, Award } from "lucide-react";

type TrustStat = {
  icon: React.ReactNode;
  value: string;
  label: string;
};

// 🎯 POST-LAUNCH: Update these stats with real data from your analytics
const stats: TrustStat[] = [
  { icon: <Users className="h-4 w-4" />, value: "10K+", label: "Users" },
  { icon: <MapPin className="h-4 w-4" />, value:  "50K+", label: "Parcels Mapped" },
  { icon: <CheckCircle className="h-4 w-4" />, value:  "99.9%", label: "Accuracy" },
  { icon:  <Award className="h-4 w-4" />, value:  "4.9★", label: "Rating" },
];

export function TrustBadges() {
  return (
    <div className="w-full">
      {/* Mobile:  2x2 grid */}
      <div className="grid grid-cols-2 gap-3 sm:hidden">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2.5 shadow-sm"
          >
            <div className="text-primary flex-shrink-0">{stat. icon}</div>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate">{stat.value}</p>
              <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tablet & Desktop: horizontal row */}
      <div className="hidden sm:flex items-center justify-center gap-4 flex-wrap">
        {stats. map((stat, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 shadow-sm min-w-[160px]"
          >
            <div className="text-primary">{stat.icon}</div>
            <div>
              <p className="text-base font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}