import { db } from "@/lib/db/client";
import { sessions } from "@/lib/db/schema";

const SESSION_GAP_MINUTES = 90;

const redisAvailable =
  process.env.UPSTASH_REDIS_REST_URL &&
  !process.env.UPSTASH_REDIS_REST_URL.includes("...");

interface ActiveSessionCache {
  sessionId: string;
  lastInputAt: number;
  locationLat?: number;
  locationLon?: number;
}

export async function getOrCreateSession(
  userId: string,
  options?: { locationLat?: number; locationLon?: number }
): Promise<string> {
  if (redisAvailable) {
    return getOrCreateSessionWithRedis(userId, options);
  }
  return getOrCreateSessionFromDb(userId, options);
}

async function getOrCreateSessionWithRedis(
  userId: string,
  options?: { locationLat?: number; locationLon?: number }
): Promise<string> {
  const { redis, keys } = await import("@/lib/redis");
  const cacheKey = keys.activeSession(userId);
  const cached = await redis.get<ActiveSessionCache>(cacheKey);

  if (cached) {
    const elapsedMin = (Date.now() - cached.lastInputAt) / 1000 / 60;

    if (elapsedMin < SESSION_GAP_MINUTES) {
      const updated: ActiveSessionCache = {
        ...cached,
        lastInputAt: Date.now(),
        ...(options?.locationLat && { locationLat: options.locationLat }),
        ...(options?.locationLon && { locationLon: options.locationLon }),
      };
      await redis.setex(cacheKey, SESSION_GAP_MINUTES * 60, JSON.stringify(updated));
      return cached.sessionId;
    }

    await closeSession(cached.sessionId);
  }

  return createNewSession(userId, options, async (sessionId) => {
    const { redis, keys } = await import("@/lib/redis");
    const cache: ActiveSessionCache = { sessionId, lastInputAt: Date.now(), ...options };
    await redis.setex(keys.activeSession(userId), SESSION_GAP_MINUTES * 60, JSON.stringify(cache));
  });
}

async function getOrCreateSessionFromDb(
  userId: string,
  options?: { locationLat?: number; locationLon?: number }
): Promise<string> {
  const recent = await db.query.sessions.findFirst({
    where: and(eq(sessions.userId, userId), eq(sessions.status, "active")),
    orderBy: desc(sessions.startedAt),
    columns: { id: true, startedAt: true },
  });

  if (recent) {
    const elapsedMin = (Date.now() - new Date(recent.startedAt).getTime()) / 1000 / 60;
    if (elapsedMin < SESSION_GAP_MINUTES) return recent.id;
    await closeSession(recent.id);
  }

  return createNewSession(userId, options);
}

async function createNewSession(
  userId: string,
  options?: { locationLat?: number; locationLon?: number },
  afterCreate?: (sessionId: string) => Promise<void>
): Promise<string> {
  const [session] = await db
    .insert(sessions)
    .values({
      userId,
      startedAt: new Date(),
      status: "active",
      locationLat: options?.locationLat,
      locationLon: options?.locationLon,
    })
    .returning({ id: sessions.id });

  await afterCreate?.(session.id);
  return session.id;
}

export async function closeSession(sessionId: string): Promise<void> {
  await db
    .update(sessions)
    .set({ status: "closed", endedAt: new Date() })
    .where(eq(sessions.id, sessionId));
}

import { eq, desc, and } from "drizzle-orm";
