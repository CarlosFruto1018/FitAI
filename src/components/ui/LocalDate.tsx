"use client";

import { formatDate } from "@/lib/utils";

export function LocalDate({ date, className }: { date: Date | string; className?: string }) {
  return <span className={className}>{formatDate(date)}</span>;
}
