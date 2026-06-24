import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { sessions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { SessionCard } from "@/components/session/SessionCard";
import Link from "next/link";

export default async function HistoryPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let allSessions: any[] = [];
  let queryError: string | null = null;

  try {
    allSessions = await db.query.sessions.findMany({
      where: eq(sessions.userId, userId),
      with: {
        workoutSets: { with: { exercise: true }, orderBy: (s, { asc }) => asc(s.createdAt) },
      },
      orderBy: desc(sessions.startedAt),
      limit: 50,
    });
  } catch (e) {
    queryError = e instanceof Error ? e.message : String(e);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-zinc-100">Historial</h1>

      {queryError ? (
        <div className="rounded-xl bg-red-950 border border-red-800 p-4 text-xs text-red-300 font-mono break-all">
          {queryError}
        </div>
      ) : allSessions.length === 0 ? (
        <div className="text-center py-16 text-zinc-600">
          <p className="text-4xl mb-3">🏋️</p>
          <p className="text-sm mb-2">Todavía no hay sesiones registradas.</p>
          <Link href="/record" className="text-indigo-400 text-sm hover:underline">
            Registra tu primer entrenamiento
          </Link>
        </div>
      ) : (
        <>
          <p className="text-xs text-zinc-500">{allSessions.length} sesión{allSessions.length !== 1 ? "es" : ""} en total</p>
          <div className="flex flex-col gap-3">
            {allSessions.map((s) => (
              <SessionCard key={s.id} session={s as any} />
            ))}
          </div>
        </>
      )}

    </div>
  );
}
