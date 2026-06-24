"use client";

import { useState, useTransition } from "react";
import { AudioRecorder } from "./AudioRecorder";
import { PhotoUpload } from "./PhotoUpload";
import { cn } from "@/lib/utils";

type Tab = "audio" | "photo" | "text";

interface RecordResult {
  sessionId: string;
  status: "processed" | "queued";
  extracted?: unknown;
}

interface RecordPageProps {
  onResult?: (result: RecordResult) => void;
}

export function RecordPage({ onResult }: RecordPageProps) {
  const [tab, setTab] = useState<Tab>("audio");
  const [textInput, setTextInput] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // ---------------------------------------------------------------------------
  // Upload helper — gets presigned URL then uploads to R2
  // ---------------------------------------------------------------------------
  async function uploadMedia(blob: Blob, type: "audio" | "image"): Promise<{ storageKey: string; publicUrl: string }> {
    const mimeType = blob.type;
    const presignRes = await fetch(
      `/api/input/presign?type=${type}&mimeType=${encodeURIComponent(mimeType)}`
    );
    const presignData = await presignRes.json();
    if (!presignRes.ok) {
      throw new Error(typeof presignData.error === "string" ? presignData.error : "Error al obtener URL de subida");
    }
    const { uploadUrl, storageKey, publicUrl } = presignData;
    await fetch(uploadUrl, { method: "PUT", body: blob, headers: { "Content-Type": mimeType } });
    return { storageKey, publicUrl };
  }

  // ---------------------------------------------------------------------------
  // Submit handlers
  // ---------------------------------------------------------------------------
  async function handleAudio(transcript: string) {
    if (!transcript.trim()) return;
    setStatus("Analizando...");
    startTransition(async () => {
      try {
        const res = await fetch("/api/input", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "text", content: transcript }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          const msg = typeof err.error === "string" ? err.error : JSON.stringify(err.error ?? "Error");
          setStatus(`❌ ${msg}`);
          return;
        }
        const data = await res.json();
        const count = data.extracted?.exercises?.length ?? 0;
        setStatus(
          count > 0
            ? `✅ ${count} ejercicio${count > 1 ? "s" : ""} registrado${count > 1 ? "s" : ""}`
            : "✅ Audio guardado (no se detectaron ejercicios)"
        );
        onResult?.(data);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Error al procesar el audio";
        setStatus(`❌ ${msg}`);
      }
    });
  }

  async function handlePhoto(file: File) {
    setStatus("Subiendo imagen...");
    try {
      const { storageKey, publicUrl: storageUrl } = await uploadMedia(file, "image");
      setStatus("Analizando imagen con IA...");

      const res = await fetch("/api/input", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "image", storageUrl, storageKey, mimeType: file.type }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setStatus(`❌ ${err.error ?? "Error al procesar la imagen"}`);
        return;
      }
      const data = await res.json();
      setStatus("✅ Imagen analizada correctamente");
      onResult?.(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al procesar la imagen";
      setStatus(`❌ ${msg}`);
    }
  }

  async function handleText(e: React.FormEvent) {
    e.preventDefault();
    if (!textInput.trim()) return;

    setStatus("Procesando...");
    startTransition(async () => {
      try {
        const res = await fetch("/api/input", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "text", content: textInput }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setStatus(`❌ Error: ${err.error ?? res.statusText}`);
          return;
        }
        const data = await res.json();
        setTextInput("");
        const count = data.extracted?.exercises?.length ?? 0;
        setStatus(
          count > 0
            ? `✅ ${count} ejercicio${count > 1 ? "s" : ""} registrado${count > 1 ? "s" : ""}`
            : "✅ Texto guardado (no se detectaron ejercicios)"
        );
        onResult?.(data);
      } catch {
        setStatus("❌ Error al guardar el registro");
      }
    });
  }

  const tabs: { id: Tab; label: string; emoji: string }[] = [
    { id: "audio", label: "Voz", emoji: "🎙️" },
    { id: "photo", label: "Foto", emoji: "📸" },
    { id: "text", label: "Texto", emoji: "✏️" },
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-sm mx-auto">
      {/* Tab selector */}
      <div className="flex rounded-xl bg-zinc-900 p-1 gap-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 py-2.5 rounded-lg text-sm font-medium transition-all",
              tab === t.id
                ? "bg-indigo-600 text-white shadow"
                : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* Content area */}
      <div className="flex flex-col items-center gap-4 min-h-[160px] justify-center">
        {tab === "audio" && (
          <AudioRecorder onRecorded={handleAudio} disabled={isPending} />
        )}

        {tab === "photo" && (
          <PhotoUpload onSelected={handlePhoto} disabled={isPending} />
        )}

        {tab === "text" && (
          <form onSubmit={handleText} className="w-full flex flex-col gap-3">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Ej: hice 4 series de 10 en press banca con 80 kg, luego 3×12 de curl con 15 kg..."
              rows={5}
              className={cn(
                "w-full rounded-xl bg-zinc-900 border border-zinc-700",
                "px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500",
                "resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
              )}
              disabled={isPending}
            />
            <button
              type="submit"
              disabled={isPending || !textInput.trim()}
              className={cn(
                "w-full py-3 rounded-xl font-semibold text-sm transition-all",
                "bg-indigo-600 text-white hover:bg-indigo-500",
                "disabled:opacity-40 disabled:cursor-not-allowed"
              )}
            >
              {isPending ? "Guardando..." : "Guardar registro"}
            </button>
          </form>
        )}
      </div>

      {/* Status message */}
      {status && (
        <div
          className={cn(
            "text-center text-sm rounded-lg px-4 py-2",
            status.startsWith("✅")
              ? "bg-emerald-900/50 text-emerald-400"
              : status.startsWith("❌")
              ? "bg-red-900/50 text-red-400"
              : "bg-zinc-800 text-zinc-300"
          )}
        >
          {status}
        </div>
      )}
    </div>
  );
}
