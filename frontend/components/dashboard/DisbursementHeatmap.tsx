"use client";
import { useMemo } from "react";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import { useDisbursementHeatmap } from "@/lib/use-disbursement-heatmap";

// Role → accent colour mapping
const ROLE_COLORS: Record<string, string> = {
  DRAFTER:  "#00f5ff",
  APPROVER: "#8a00ff",
  EXECUTOR: "#00ff9d",
  UNKNOWN:  "#ffffff",
};

// Count → opacity bucket (0–4 like GitHub)
function countClass(count: number): string {
  if (count === 0) return "heatmap-empty";
  if (count <= 2)  return "heatmap-low";
  if (count <= 5)  return "heatmap-mid";
  if (count <= 10) return "heatmap-high";
  return "heatmap-peak";
}

function shortAddr(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function DisbursementHeatmap() {
  const { data, isLoading } = useDisbursementHeatmap();

  const endDate = useMemo(() => new Date(), []);
  const startDate = useMemo(() => {
    const d = new Date(endDate);
    d.setFullYear(d.getFullYear() - 1);
    return d;
  }, [endDate]);

  // Build a lookup for role + count by date
  const dayMap = useMemo(() => {
    const m = new Map<string, { count: number; role: string }>();
    data?.days.forEach((d) => m.set(d.date, { count: d.count, role: d.role }));
    return m;
  }, [data]);

  // Values array for react-calendar-heatmap
  const values = useMemo(
    () =>
      (data?.days ?? []).map((d) => ({ date: d.date, count: d.count })),
    [data]
  );

  if (isLoading) {
    return (
      <div className="glass-card p-6 space-y-4 animate-pulse">
        <div className="h-4 w-48 rounded bg-white/10" />
        <div className="h-28 rounded bg-white/5" />
      </div>
    );
  }

  const admin = data?.mostActiveAdmin;

  return (
    <div className="glass-card p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-body text-xs uppercase tracking-widest text-white/40">
            Activity
          </p>
          <h3 className="font-heading mt-1 text-xl text-white">
            Disbursement Calendar
          </h3>
          <p className="font-body mt-0.5 text-xs text-white/40">
            Daily disbursements over the past 12 months
          </p>
        </div>

        {admin && (
          <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-right">
            <p className="font-body text-[10px] uppercase tracking-widest text-white/30">
              Most Active Admin
            </p>
            <p className="font-ticker mt-0.5 text-sm font-semibold text-[#00f5ff]">
              {shortAddr(admin.address)}
            </p>
            <p className="font-body text-xs text-white/40">
              {admin.count} disbursements
            </p>
          </div>
        )}
      </div>

      {/* Heatmap */}
      <div className="heatmap-wrapper overflow-x-auto">
        <CalendarHeatmap
          startDate={startDate}
          endDate={endDate}
          values={values}
          classForValue={(value) => {
            if (!value) return "heatmap-empty";
            return countClass(value.count);
          }}
          tooltipDataAttrs={(value: { date: string; count: number } | null) => {
            if (!value?.date) return { "data-tip": "No disbursements" };
            const info = dayMap.get(value.date);
            const role = info?.role ?? "UNKNOWN";
            return {
              "data-tip": `${value.date}: ${value.count} disbursement${value.count !== 1 ? "s" : ""} (${role})`,
            };
          }}
          showWeekdayLabels
        />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <div className="flex items-center gap-2">
          <span className="font-body text-[10px] uppercase tracking-widest text-white/30">
            Intensity
          </span>
          {["heatmap-empty", "heatmap-low", "heatmap-mid", "heatmap-high", "heatmap-peak"].map(
            (cls) => (
              <span key={cls} className={`inline-block h-3 w-3 rounded-sm ${cls}`} />
            )
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="font-body text-[10px] uppercase tracking-widest text-white/30">
            Role
          </span>
          {Object.entries(ROLE_COLORS).map(([role, color]) => (
            <span key={role} className="flex items-center gap-1">
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ background: color, opacity: 0.8 }}
              />
              <span className="font-body text-[10px] text-white/40">{role}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Inline styles for heatmap cells */}
      <style>{`
        .heatmap-wrapper .react-calendar-heatmap text {
          fill: rgba(255,255,255,0.3);
          font-size: 9px;
          font-family: "Plus Jakarta Sans", monospace;
        }
        .heatmap-wrapper .react-calendar-heatmap rect {
          rx: 2;
        }
        .heatmap-empty  { fill: rgba(255,255,255,0.06); }
        .heatmap-low    { fill: rgba(0,245,255,0.25); }
        .heatmap-mid    { fill: rgba(0,245,255,0.50); }
        .heatmap-high   { fill: rgba(0,245,255,0.75); }
        .heatmap-peak   { fill: rgba(0,245,255,1.00); }
      `}</style>
    </div>
  );
}
