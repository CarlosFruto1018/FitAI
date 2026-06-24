import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { userProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, userId),
  });

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-zinc-100">Ajustes</h1>

      {/* Profile info */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-4">
        {session!.user?.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={session!.user.image} alt="" className="w-12 h-12 rounded-full" />
        )}
        <div>
          <p className="text-sm font-semibold text-zinc-100">{session!.user?.name}</p>
          <p className="text-xs text-zinc-500">{session!.user?.email}</p>
        </div>
      </div>

      <SettingsClient
        profile={{
          fitnessLevel: profile?.fitnessLevel ?? "intermediate",
          preferredUnits: profile?.preferredUnits ?? "kg",
          bodyWeightKg: profile?.bodyWeightKg ?? null,
        }}
        signOutAction={handleSignOut}
      />
    </div>
  );
}
