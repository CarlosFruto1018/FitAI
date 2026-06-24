import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { sessions } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const row = await db.query.sessions.findFirst({
    where: and(eq(sessions.id, params.id), eq(sessions.userId, session.user.id)),
    with: {
      workoutSets: {
        with: { exercise: true },
        orderBy: (s, { asc }) => asc(s.createdAt),
      },
    },
  });

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const [updated] = await db
    .update(sessions)
    .set({
      status: body.status,
      endedAt: body.status === "closed" ? new Date() : undefined,
      summaryText: body.summaryText,
    })
    .where(and(eq(sessions.id, params.id), eq(sessions.userId, session.user.id)))
    .returning();

  return NextResponse.json(updated);
}
