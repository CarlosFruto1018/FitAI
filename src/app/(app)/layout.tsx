import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BottomNav } from "@/components/layout/BottomNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-20">
      <main className="max-w-lg mx-auto px-4 pt-6">{children}</main>
      <BottomNav />
    </div>
  );
}
