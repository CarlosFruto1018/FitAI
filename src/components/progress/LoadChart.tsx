"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface DataPoint {
  date: string;
  weightKg: number;
  reps: number;
}

interface LoadChartProps {
  data: DataPoint[];
  exerciseName: string;
}

export function LoadChart({ data, exerciseName }: LoadChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-zinc-600 text-sm">
        Sin datos suficientes para mostrar progresión
      </div>
    );
  }

  const formatted = data.map((d) => ({
    ...d,
    label: format(new Date(d.date), "d MMM", { locale: es }),
  }));

  return (
    <div className="w-full">
      <p className="text-sm font-medium text-zinc-300 mb-3">{exerciseName} — Carga máx.</p>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={formatted} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#71717a" }} />
          <YAxis tick={{ fontSize: 10, fill: "#71717a" }} unit="kg" />
          <Tooltip
            contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8 }}
            labelStyle={{ color: "#a1a1aa", fontSize: 11 }}
            itemStyle={{ color: "#818cf8", fontSize: 12 }}
            formatter={(v: number) => [`${v} kg`, "Carga"]}
          />
          <Line
            type="monotone"
            dataKey="weightKg"
            stroke="#818cf8"
            strokeWidth={2}
            dot={{ fill: "#818cf8", r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
