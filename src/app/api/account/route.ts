import { NextRequest, NextResponse } from "next/server";
import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db/client";
import {
  users, accounts, authSessions, userProfiles,
  sessions, workoutSets, rawInputs, personalRecords,
} from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";

const ProfileSchema = z.object({
  fitnessLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  preferredUnits: z.enum(["kg", "lb"]).optional(),
  bodyWeightKg: z.number().positive().optional(),
  goals: z.array(z.string()).optional(),
});

// PATCH /api/account — update profile
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const body = await req.json();
  const parsed = ProfileSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await db
    .insert(userProfiles)
    .values({ userId, ...parsed.data })
    .onConflictDoUpdate({ target: userProfiles.userId, set: parsed.data });

  return NextResponse.json({ ok: true });
}

// DELETE /api/account — delete all user data and account
export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  // Get session IDs first (workoutSets has no userId column)
  const userSessions = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(eq(sessions.userId, userId));
  const sessionIds = userSessions.map((s) => s.id);

  if (sessionIds.length > 0) {
    await db.delete(workoutSets).where(inArray(workoutSets.sessionId, sessionIds));
  }

  await db.delete(personalRecords).where(eq(personalRecords.userId, userId));
  await db.delete(rawInputs).where(eq(rawInputs.userId, userId));
  await db.delete(sessions).where(eq(sessions.userId, userId));
  await db.delete(userProfiles).where(eq(userProfiles.userId, userId));
  await db.delete(accounts).where(eq(accounts.userId, userId));
  await db.delete(authSessions).where(eq(authSessions.userId, userId));
  await db.delete(users).where(eq(users.id, userId));

  return NextResponse.json({ ok: true });
}
