import { db } from "@/lib/db/client";
import {
  workoutSets,
  sessions,
  personalRecords,
  userProfiles,
  exercises,
} from "@/lib/db/schema";
import { eq, desc, gte, and } from "drizzle-orm";
import { subDays } from "date-fns";

export interface UserContext {
  preferredUnits: string;
  frequentExercises: string[];
  lastLoads: Record<string, string>; // e.g. { bench_press: "80kg x 10" }
  personalRecords: Record<string, string>;
  fitnessLevel: string;
}

const CTX_TTL = 60 * 60 * 24;

const redisAvailable =
  process.env.UPSTASH_REDIS_REST_URL &&
  !process.env.UPSTASH_REDIS_REST_URL.includes("...");

export async function getUserContext(userId: string): Promise<UserContext> {
  if (redisAvailable) {
    const { redis, keys } = await import("@/lib/redis");
    const cached = await redis.get<UserContext>(keys.userContext(userId));
    if (cached) return cached;
    const ctx = await buildContext(userId);
    await redis.setex(keys.userContext(userId), CTX_TTL, JSON.stringify(ctx));
    return ctx;
  }
  return buildContext(userId);
}

export async function invalidateUserContext(userId: string): Promise<void> {
  if (!redisAvailable) return;
  const { redis, keys } = await import("@/lib/redis");
  await redis.del(keys.userContext(userId));
}

async function buildContext(userId: string): Promise<UserContext> {
  const [profile, recentSets, prs] = await Promise.all([
    db.query.userProfiles.findFirst({ where: eq(userProfiles.userId, userId) }),

    db
      .select({
        canonicalName: exercises.canonicalName,
        weightKg: workoutSets.weightKg,
        reps: workoutSets.reps,
        createdAt: workoutSets.createdAt,
      })
      .from(workoutSets)
      .innerJoin(sessions, eq(workoutSets.sessionId, sessions.id))
      .leftJoin(exercises, eq(workoutSets.exerciseId, exercises.id))
      .where(
        and(
          eq(sessions.userId, userId),
          gte(workoutSets.createdAt, subDays(new Date(), 30))
        )
      )
      .orderBy(desc(workoutSets.createdAt))
      .limit(100),

    db.query.personalRecords.findMany({
      where: eq(personalRecords.userId, userId),
      with: { exercise: true },
    }),
  ]);

  // Count exercise frequency
  const freq: Record<string, number> = {};
  const lastLoad: Record<string, string> = {};

  for (const s of recentSets) {
    if (!s.canonicalName) continue;
    const name = s.canonicalName;
    freq[name] = (freq[name] ?? 0) + 1;

    if (!lastLoad[name] && s.weightKg && s.reps) {
      lastLoad[name] = `${s.weightKg}kg x ${s.reps}`;
    }
  }

  const frequentExercises = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name]) => name);

  const prMap: Record<string, string> = {};
  for (const pr of prs) {
    if (!pr.exercise) continue;
    prMap[pr.exercise.canonicalName] = `${pr.value}${pr.metric === "weight_kg" ? "kg" : pr.metric}`;
  }

  return {
    preferredUnits: profile?.preferredUnits ?? "kg",
    frequentExercises,
    lastLoads: lastLoad,
    personalRecords: prMap,
    fitnessLevel: profile?.fitnessLevel ?? "intermediate",
  };
}
