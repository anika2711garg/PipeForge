"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { MetricRow } from "@/lib/api/types";
import { formatInteger } from "@/lib/format/numbers";
import { formatMinorUnitsExact, sumMinorUnits } from "@/lib/format/money";

import { useChartTheme } from "./theme";

function groupByDate(rows: MetricRow[]) {
  const map = new Map<string, { date: string; events: number; amount: number }>();
  for (const row of rows) {
    const current = map.get(row.metric_date) ?? { date: row.metric_date, events: 0, amount: 0 };
    current.events += Math.trunc(row.event_count || 0);
    current.amount = sumMinorUnits([current.amount, row.total_amount_minor_units]);
    map.set(row.metric_date, current);
  }
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function groupByType(rows: MetricRow[]) {
  const map = new Map<string, { type: string; events: number; amount: number }>();
  for (const row of rows) {
    const current = map.get(row.event_type) ?? { type: row.event_type, events: 0, amount: 0 };
    current.events += Math.trunc(row.event_count || 0);
    current.amount = sumMinorUnits([current.amount, row.total_amount_minor_units]);
    map.set(row.event_type, current);
  }
  return [...map.values()].sort((a, b) => a.type.localeCompare(b.type));
}

export function EventVolumeChart({ rows }: { rows: MetricRow[] }) {
  const theme = useChartTheme();
  const data = groupByDate(rows);
  return (
    <div className="h-64 w-full" role="img" aria-label="Events over time">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid stroke={theme.grid} strokeDasharray="3 3" />
          <XAxis dataKey="date" stroke={theme.text} fontSize={12} />
          <YAxis stroke={theme.text} fontSize={12} allowDecimals={false} />
          <Tooltip
            contentStyle={{ background: theme.tooltipBg, border: `1px solid ${theme.tooltipBorder}` }}
            formatter={(value) => [formatInteger(Number(value)), "Events"]}
          />
          <Area type="monotone" dataKey="events" stroke={theme.primary} fill={theme.primary} fillOpacity={0.18} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AmountChart({ rows }: { rows: MetricRow[] }) {
  const theme = useChartTheme();
  const data = groupByDate(rows).map((row) => ({
    ...row,
    amountExact: formatMinorUnitsExact(row.amount),
  }));
  return (
    <div className="h-64 w-full" role="img" aria-label="Amount over time in minor units">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke={theme.grid} strokeDasharray="3 3" />
          <XAxis dataKey="date" stroke={theme.text} fontSize={12} />
          <YAxis stroke={theme.text} fontSize={12} allowDecimals={false} />
          <Tooltip
            contentStyle={{ background: theme.tooltipBg, border: `1px solid ${theme.tooltipBorder}` }}
            formatter={(value) => [formatMinorUnitsExact(Number(value)), "Minor units"]}
          />
          <Bar dataKey="amount" fill={theme.info} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TypeBreakdownChart({ rows }: { rows: MetricRow[] }) {
  const theme = useChartTheme();
  const data = groupByType(rows);
  return (
    <div className="h-64 w-full" role="img" aria-label="Events by type">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke={theme.grid} strokeDasharray="3 3" />
          <XAxis dataKey="type" stroke={theme.text} fontSize={12} />
          <YAxis stroke={theme.text} fontSize={12} allowDecimals={false} />
          <Tooltip
            contentStyle={{ background: theme.tooltipBg, border: `1px solid ${theme.tooltipBorder}` }}
            formatter={(value, name) => [
              name === "amount" ? formatMinorUnitsExact(Number(value)) : formatInteger(Number(value)),
              name === "amount" ? "Minor units" : "Events",
            ]}
          />
          <Bar dataKey="events" fill={theme.success} radius={[4, 4, 0, 0]} />
          <Bar dataKey="amount" fill={theme.warning} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
