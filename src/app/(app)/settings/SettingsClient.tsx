"use client";

import { useState } from "react";
import { Sliders, Scale, LogOut, Trash2, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  profile: {
    fitnessLevel: string;
    preferredUnits: string;
    bodyWeightKg: number | null;
  };
  signOutAction: () => Promise<void>;
}

const FITNESS_LEVELS = [
  { id: "beginner", label: "Principiante" },
  { id: "intermediate", label: "Intermedio" },
  { id: "advanced", label: "Avanzado" },
] as const;

export function SettingsClient({ profile, signOutAction }: Props) {
  const [fitnessLevel, setFitnessLevel] = useState(profile.fitnessLevel);
  const [preferredUnits, setPreferredUnits] = useState(profile.preferredUnits);
  const [bodyWeight, setBodyWeight] = useState(profile.bodyWeightKg?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"ok" | "error" | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const canDelete = deleteConfirmText === "ELIMINAR";

  async function handleSave() {
    setSaving(true);
    setSaveStatus(null);
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
      setSaveStatus(res.ok ? "ok" : "error");
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus(null), 3000);
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
      <section className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm shadow-slate-200/50">
        <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-slate-50">
          <Sliders size={14} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-900">Preferencias</h2>
        </div>

        <div className="flex flex-col gap-5 p-4">
          {/* Fitness level */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-slate-500">Nivel de fitness</label>
            <div className="flex gap-1.5">
              {FITNESS_LEVELS.map((level) => (
                <button
                  key={level.id}
                  onClick={() => setFitnessLevel(level.id)}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl text-xs font-medium transition-all",
                    fitnessLevel === level.id
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  )}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>

          {/* Units */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-slate-500">Unidades de peso</label>
            <div className="flex gap-1.5">
              {(["kg", "lb"] as const).map((unit) => (
                <button
                  key={unit}
                  onClick={() => setPreferredUnits(unit)}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl text-xs font-medium transition-all",
                    preferredUnits === unit
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  )}
                >
                  {unit.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Body weight */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
              <Scale size={12} />
              Peso corporal ({preferredUnits})
            </label>
            <input
              type="number"
              value={bodyWeight}
              onChange={(e) => setBodyWeight(e.target.value)}
              placeholder="Ej: 75"
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
            />
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold transition-colors disabled:opacity-40 shadow-sm shadow-emerald-200"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>

          {saveStatus && (
            <div className={cn(
              "flex items-center justify-center gap-2 text-sm rounded-xl py-2",
              saveStatus === "ok" ? "text-emerald-700 bg-emerald-50" : "text-red-600 bg-red-50"
            )}>
              {saveStatus === "ok"
                ? <><CheckCircle size={14} /> Cambios guardados</>
                : <><XCircle size={14} /> Error al guardar</>
              }
            </div>
          )}
        </div>
      </section>

      {/* Sign out */}
      <form action={signOutAction}>
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-sm font-medium transition-colors shadow-sm"
        >
          <LogOut size={15} className="text-slate-400" />
          Cerrar sesión
        </button>
      </form>

      {/* Danger zone */}
      <section className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-slate-50">
          <Trash2 size={14} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-700">Eliminar cuenta</h2>
        </div>
        <div className="p-4 flex flex-col gap-3">
          <p className="text-xs text-slate-500 leading-relaxed">
            Esto borra permanentemente tu cuenta y todos tus datos: sesiones, series, récords y perfil.
            Esta acción no se puede deshacer.
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm font-medium hover:border-red-200 hover:text-red-500 hover:bg-red-50/50 transition-colors"
            >
              Eliminar mi cuenta
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex flex-col gap-1.5">
                <p className="text-xs font-semibold text-red-700">Confirma que quieres borrar todo</p>
                <p className="text-xs text-red-500/80">
                  Escribe{" "}
                  <span className="font-mono font-bold tracking-wider">ELIMINAR</span>{" "}
                  en mayúsculas para continuar.
                </p>
              </div>

              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="ELIMINAR"
                autoComplete="off"
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent font-mono tracking-widest transition-all"
              />

              <div className="flex gap-2">
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium transition-colors hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={!canDelete || deleting}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-red-500 hover:bg-red-600 text-white disabled:bg-slate-200 disabled:text-slate-400"
                >
                  {deleting ? "Eliminando..." : "Eliminar cuenta"}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
