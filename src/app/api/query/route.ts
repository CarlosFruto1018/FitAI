import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserContext } from "@/lib/memory/user-context";
import { answerQuery } from "@/lib/ai/query-engine";
import { z } from "zod";

const QuerySchema = z.object({
  question: z.string().min(1).max(500),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = QuerySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const ctx = await getUserContext(session.user.id);
    const answer = await answerQuery(parsed.data.question, session.user.id, ctx);
    return NextResponse.json({ answer });
  } catch (e) {
    console.error("[POST /api/query]", e);
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ answer: `Error al procesar la consulta: ${msg}` });
  }
}
