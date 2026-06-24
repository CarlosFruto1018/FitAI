"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Inicio", emoji: "🏠" },
  { href: "/record", label: "Registrar", emoji: "➕" },
  { href: "/progress", label: "Progreso", emoji: "📈" },
  { href: "/chat", label: "Consultar", emoji: "💬" },
  { href: "/settings", label: "Ajustes", emoji: "⚙️" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-zinc-950 border-t border-zinc-800 safe-area-pb">
      <div className="flex items-stretch">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5",
                "text-[10px] font-medium transition-colors",
                active ? "text-indigo-400" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <span className={cn("text-xl leading-none", active && "scale-110 transition-transform")}>
                {item.emoji}
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
