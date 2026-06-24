import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createPresignedUploadUrl } from "@/lib/storage";
import { z } from "zod";

const PresignSchema = z.object({
  type: z.enum(["audio", "image"]),
  mimeType: z.string().min(1),
});

const r2Available =
  process.env.R2_ACCESS_KEY_ID && !process.env.R2_ACCESS_KEY_ID.includes("...");

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!r2Available) {
      return NextResponse.json(
        { error: "Almacenamiento de archivos (R2) no está configurado." },
        { status: 503 }
      );
    }

    const params = Object.fromEntries(req.nextUrl.searchParams.entries());
    const parsed = PresignSchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { uploadUrl, key, publicUrl } = await createPresignedUploadUrl(
      session.user.id,
      parsed.data.type,
      parsed.data.mimeType
    );

    return NextResponse.json({ uploadUrl, storageKey: key, publicUrl });
  } catch (err) {
    console.error("[GET /api/input/presign]", err);
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
