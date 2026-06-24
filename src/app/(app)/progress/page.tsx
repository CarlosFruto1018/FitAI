import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { sessions, workoutSets, personalRecords } from "@/lib/db/schema";
import { eq, desc, gte, and, inArray } from "drizzle-orm";
import { subMonths } from "date-fns";
import { LoadChart } from "@/components/progress/LoadChart";
import Link from "next/link";

export default async function ProgressPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const threeMonthsAgo = subMonths(new Date(), 3);

  const [userSessions, prs] = await Promise.all([
    db.query.sessions.findMany({
      where: and(eq(sessions.userId, userId), gte(sessions.startedAt, threeMonthsAgo)),
      columns: { id: true, startedAt: true },
    }),
    db.query.personalRecords.findMany({
      where: eq(personalRecords.userId, userId),
      with: { exercise: true },
      orderBy: desc(personalRecords.achievedAt),
    }),
  ]);

  const charts: { name: string; data: { date: string; weightKg: number; reps: number }[] }[] = [];

  if (userSessions.length > 0) {
    const sessionIds = userSessions.map((s) => s.id);
    const sessionDateMap = Object.fromEntries(userSessions.map((s) => [s.id, s.startedAt]));

    const sets = await db.query.workoutSets.findMany({
      where: inArray(workoutSets.sessionId, sessionIds),
      with: { exercise: true },
      columns: { sessionId: true, weightKg: true, reps: true, exerciseId: true, exerciseName: true },
    });

    // Max weight per exercise per session date
    const byExercise: Record<string, { name: string; byDate: Record<string, { weightKg: number; reps: number }> }> = {};

    for (const s of sets) {
      if (!s.exerciseId || !s.weightKg) continue;
      const name = s.exercise?.displayName ?? s.exerciseName ?? s.exerciseId;
      const date = sessionDateMap[s.sessionId]?.toISOString().split("T")[0];
      if (!date) continue;

      if (!byExercise[s.exerciseId]) byExercise[s.exerciseId] = { name, byDate: {} };

      const existing = byExercise[s.exerciseId].byDate[date];
      if (!existing || s.weightKg > existing.weightKg) {
        byExercise[s.exerciseId].byDate[date] = { weightKg: s.weightKg, reps: s.reps ?? 0 };
      }
    }

    for (const { name, byDate } of Object.values(byExercise)) {
      const data = Object.entries(byDate)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, v]) => ({ date, ...v }));

      if (data.length >= 2) charts.push({ name, data });
    }

    charts.sort((a, b) => b.data.length - a.data.length);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-zinc-100">Progreso</h1>

      {/* PRs */}
      {prs.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
            🏆 Récords personales
          </h2>
          <div className="flex flex-col gap-2">
            {prs.map((pr) => (
              <div
                key={pr.id}
                className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3"
              >
                <p className="text-sm text-zinc-200">{pr.exercise?.displayName}</p>
                <p className="text-sm font-bold text-amber-400">
                  {pr.value}
                  {pr.metric === "weight_kg" ? " kg" : ` ${pr.metric}`}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Charts */}
      <section>
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
          📈 Progresión últimos 3 meses
        </h2>

        {charts.length > 0 ? (
          <div className="flex flex-col gap-4">
            {charts.slice(0, 4).map((e) => (
              <div key={e.name} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                <LoadChart data={e.data} exerciseName={e.name} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-zinc-600">
            <p className="text-4xl mb-3">📈</p>
            <p className="text-sm mb-2">
              Registra el mismo ejercicio en al menos 2 sesiones para ver la progresión.
            </p>
            <Link href="/record" className="text-indigo-400 text-sm hover:underline">
              Ir a registrar
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
