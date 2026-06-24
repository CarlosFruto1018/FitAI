"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Props {
  profile: {
    fitnessLevel: string;
    preferredUnits: string;
    bodyWeightKg: number | null;
  };
  signOutAction: () => Promise<void>;
}

export function SettingsClient({ profile, signOutAction }: Props) {
  const router = useRouter();
  const [fitnessLevel, setFitnessLevel] = useState(profile.fitnessLevel);
  const [preferredUnits, setPreferredUnits] = useState(profile.preferredUnits);
  const [bodyWeight, setBodyWeight] = useState(profile.bodyWeightKg?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fitnessLevel,
          preferredUnits,
          bodyWeightKg: bodyWeight ? parseFloat(bodyWeight) : undefined,
        }),
      });
      setSaveMsg(res.ok ? "✅ Guardado" : "❌ Error al guardar");
    } catch {
      setSaveMsg("❌ Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await fetch("/api/account", { method: "DELETE" });
      await signOutAction();
    } catch {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Preferences */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-zinc-300">Preferencias</h2>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-zinc-500">Nivel de fitness</label>
          <div className="flex gap-2">
            {(["beginner", "intermediate", "advanced"] as const).map((level) => (
              <button
                key={level}
                onClick={() => setFitnessLevel(level)}
                className={cn(
                  "flex-1 py-2 rounded-lg text-xs font-medium transition-colors",
                  fitnessLevel === level
                    ? "bg-indigo-600 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                )}
              >
                {level === "beginner" ? "Principiante" : level === "intermediate" ? "Intermedio" : "Avanzado"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-zinc-500">Unidades de peso</label>
          <div className="flex gap-2">
            {(["kg", "lb"] as const).map((unit) => (
              <button
                key={unit}
                onClick={() => setPreferredUnits(unit)}
                className={cn(
                  "flex-1 py-2 rounded-lg text-xs font-medium transition-colors",
                  preferredUnits === unit
                    ? "bg-indigo-600 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                )}
              >
                {unit.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-zinc-500">Peso corporal ({preferredUnits})</label>
          <input
            type="number"
            value={bodyWeight}
            onChange={(e) => setBodyWeight(e.target.value)}
            placeholder="Ej: 75"
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors disabled:opacity-40"
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
        {saveMsg && <p className="text-xs text-center text-zinc-400">{saveMsg}</p>}
      </section>

      {/* Sign out */}
      <form action={signOutAction}>
        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-300 text-sm font-medium transition-colors"
        >
          Cerrar sesión
        </button>
      </form>

      {/* Delete account */}
      <section className="bg-zinc-900 border border-red-900/40 rounded-2xl p-4 flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-red-400">Zona peligrosa</h2>
        <p className="text-xs text-zinc-500">Eliminar tu cuenta borra permanentemente todos tus datos: sesiones, series, récords y perfil.</p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full py-2.5 rounded-xl border border-red-800 text-red-400 text-sm font-medium hover:bg-red-950 transition-colors"
          >
            Eliminar mi cuenta
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-red-400 font-medium text-center">¿Estás seguro? Esta acción no se puede deshacer.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-700 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-40"
              >
                {deleting ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
