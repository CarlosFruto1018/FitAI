import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { sessions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = Number(req.nextUrl.searchParams.get("limit") ?? "20");

  const rows = await db.query.sessions.findMany({
    where: eq(sessions.userId, session.user.id),
    with: {
      workoutSets: {
        with: { exercise: true },
        orderBy: (s, { asc }) => asc(s.createdAt),
      },
    },
    orderBy: desc(sessions.startedAt),
    limit: Math.min(limit, 100),
  });

  return NextResponse.json(rows);
}
