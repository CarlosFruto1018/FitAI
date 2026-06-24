import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Keys
export const keys = {
  activeSession: (userId: string) => `session:${userId}:active`,
  userContext: (userId: string) => `ctx:${userId}`,
  rateLimit: (userId: string) => `rl:${userId}`,
};
