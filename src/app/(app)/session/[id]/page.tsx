import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { sessions, workoutSets, exercises } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authSession = await auth();
  const userId = authSession!.user!.id!;

  const session = await db.query.sessions.findFirst({
    where: eq(sessions.id, id),
    with: {
      workoutSets: {
        with: { exercise: true },
        orderBy: asc(workoutSets.createdAt),
      },
    },
  });

  if (!session || session.userId !== userId) notFound();

  // Group sets by exercise name
  const byExercise: Record<string, typeof session.workoutSets> = {};
  for (const s of session.workoutSets) {
    const name = s.exercise?.displayName ?? s.exerciseName ?? "Ejercicio";
    if (!byExercise[name]) byExercise[name] = [];
    byExercise[name].push(s);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/history" className="text-zinc-400 hover:text-zinc-200 text-sm">← Historial</Link>
      </div>

      <div>
        <h1 className="text-xl font-bold text-zinc-100">Sesión</h1>
        <p className="text-sm text-zinc-500 mt-1">{formatDate(session.startedAt)}</p>
      </div>

      {/* Stats */}
      <div className="flex gap-3">
        {session.totalVolumeKg && (
          <div className="flex-1 bg-zinc-900 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-zinc-100">{session.totalVolumeKg} kg</p>
            <p className="text-xs text-zinc-500">volumen total</p>
          </div>
        )}
        <div className="flex-1 bg-zinc-900 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-zinc-100">{Object.keys(byExercise).length}</p>
          <p className="text-xs text-zinc-500">ejercicios</p>
        </div>
        <div className="flex-1 bg-zinc-900 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-zinc-100">{session.workoutSets.length}</p>
          <p className="text-xs text-zinc-500">series</p>
        </div>
      </div>

      {/* Exercises */}
      <div className="flex flex-col gap-3">
        {Object.entries(byExercise).map(([name, sets]) => (
          <div key={name} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <p className="text-sm font-semibold text-zinc-200 mb-3">{name}</p>
            <div className="flex flex-col gap-1.5">
              {sets.map((s, i) => (
                <div key={s.id} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500 w-8">#{i + 1}</span>
                  <span className="text-zinc-300 flex-1">
                    {s.reps ? `${s.reps} reps` : ""}
                    {s.weightKg ? ` · ${s.weightKg} kg` : ""}
                    {s.durationSec ? ` · ${Math.round(s.durationSec / 60)}min` : ""}
                    {s.distanceM ? ` · ${s.distanceM}m` : ""}
                  </span>
                  {s.rpe && (
                    <span className="text-xs text-zinc-500">RPE {s.rpe}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {session.summaryText && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <p className="text-xs text-zinc-500 mb-1">Resumen</p>
          <p className="text-sm text-zinc-300">{session.summaryText}</p>
        </div>
      )}
    </div>
  );
}
