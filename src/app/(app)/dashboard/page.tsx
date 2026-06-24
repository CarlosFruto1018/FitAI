import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { sessions, personalRecords, exercises } from "@/lib/db/schema";
import { eq, desc, gte, and } from "drizzle-orm";
import { subDays } from "date-fns";
import { SessionCard } from "@/components/session/SessionCard";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const [recentSessions, prs] = await Promise.all([
    db.query.sessions.findMany({
      where: eq(sessions.userId, userId),
      with: {
        workoutSets: { with: { exercise: true }, orderBy: (s, { asc }) => asc(s.createdAt) },
      },
      orderBy: desc(sessions.startedAt),
      limit: 5,
    }),

    db.query.personalRecords.findMany({
      where: and(
        eq(personalRecords.userId, userId),
        gte(personalRecords.achievedAt, subDays(new Date(), 30))
      ),
      with: { exercise: true },
      orderBy: desc(personalRecords.achievedAt),
      limit: 3,
    }),
  ]);

  const weekSessions = recentSessions.filter(
    (s) => new Date(s.startedAt) >= subDays(new Date(), 7)
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Hola, {session!.user?.name?.split(" ")[0]} 👋</h1>
          <p className="text-sm text-zinc-500">{weekSessions.length} sesiones esta semana</p>
        </div>
        <Link
          href="/record"
          className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-xl hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/30"
          aria-label="Registrar entrenamiento"
        >
          ➕
        </Link>
      </div>

      {/* PRs this month */}
      {prs.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
            🏆 Récords este mes
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {prs.map((pr) => (
              <div
                key={pr.id}
                className="flex-shrink-0 bg-zinc-900 border border-amber-800/40 rounded-xl px-3 py-2 min-w-[130px]"
              >
                <p className="text-xs text-amber-400 font-semibold truncate">
                  {pr.exercise?.displayName}
                </p>
                <p className="text-lg font-bold text-zinc-100">
                  {pr.value}
                  <span className="text-xs font-normal text-zinc-400 ml-1">
                    {pr.metric === "weight_kg" ? "kg" : pr.metric}
                  </span>
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent sessions */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Sesiones recientes
          </h2>
          <Link href="/history" className="text-xs text-indigo-400 hover:text-indigo-300">
            Ver todo
          </Link>
        </div>

        {recentSessions.length === 0 ? (
          <div className="text-center py-12 text-zinc-600">
            <p className="text-4xl mb-3">🏋️</p>
            <p className="text-sm">Todavía no hay sesiones registradas.</p>
            <Link href="/record" className="text-indigo-400 text-sm hover:underline">
              Registra tu primer entrenamiento
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {recentSessions.map((s) => (
              <SessionCard key={s.id} session={s as any} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
