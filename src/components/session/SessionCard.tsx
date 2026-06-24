import { formatDate, formatDuration, formatWeight, cn } from "@/lib/utils";
import type { Session, WorkoutSet, Exercise } from "@/lib/db/schema";
import Link from "next/link";

type SetWithExercise = WorkoutSet & { exercise: Exercise | null };
type SessionWithSets = Session & { workoutSets: SetWithExercise[] };

interface SessionCardProps {
  session: SessionWithSets;
}

export function SessionCard({ session }: SessionCardProps) {
  // Group sets by exercise
  const byExercise = session.workoutSets.reduce<Record<string, SetWithExercise[]>>(
    (acc, s) => {
      const name = s.exercise?.displayName ?? s.exerciseName ?? "Ejercicio";
      acc[name] = [...(acc[name] ?? []), s];
      return acc;
    },
    {}
  );

  const exercises = Object.entries(byExercise);

  return (
    <Link href={`/session/${session.id}`} className="block">
      <div
        className={cn(
          "rounded-2xl border p-4 flex flex-col gap-3 transition-colors",
          "bg-zinc-900 border-zinc-800 hover:border-zinc-600"
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-zinc-500">{formatDate(session.startedAt)}</p>
            <p className="text-sm font-semibold text-zinc-200 mt-0.5">
              {exercises.length} ejercicio{exercises.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex gap-2 text-right">
            {session.totalVolumeKg && (
              <Chip label={formatWeight(session.totalVolumeKg)} sublabel="volumen" />
            )}
            {session.durationMin && (
              <Chip label={formatDuration(session.durationMin)} sublabel="duración" />
            )}
          </div>
        </div>

        {/* Exercise list */}
        <div className="flex flex-col gap-1.5">
          {exercises.slice(0, 5).map(([name, sets]) => {
            const maxWeight = Math.max(...sets.map((s) => s.weightKg ?? 0));
            const totalReps = sets.reduce((a, s) => a + (s.reps ?? 0), 0);
            return (
              <div key={name} className="flex items-center justify-between">
                <span className="text-sm text-zinc-300 truncate max-w-[60%]">{name}</span>
                <span className="text-xs text-zinc-500">
                  {sets.length} series
                  {maxWeight > 0 && ` · ${maxWeight}kg`}
                  {totalReps > 0 && ` · ${totalReps} reps`}
                </span>
              </div>
            );
          })}
          {exercises.length > 5 && (
            <p className="text-xs text-zinc-600">+{exercises.length - 5} más</p>
          )}
        </div>

        {/* Summary */}
        {session.summaryText && (
          <p className="text-xs text-zinc-500 border-t border-zinc-800 pt-2 line-clamp-2">
            {session.summaryText}
          </p>
        )}
      </div>
    </Link>
  );
}

function Chip({ label, sublabel }: { label: string; sublabel: string }) {
  return (
    <div className="text-center bg-zinc-800 rounded-lg px-2.5 py-1.5">
      <p className="text-xs font-semibold text-zinc-200">{label}</p>
      <p className="text-[10px] text-zinc-500">{sublabel}</p>
    </div>
  );
}
