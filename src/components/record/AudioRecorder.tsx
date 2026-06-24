"use client";

import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { cn } from "@/lib/utils";

interface AudioRecorderProps {
  onRecorded: (transcript: string) => void;
  disabled?: boolean;
}

export function AudioRecorder({ onRecorded, disabled }: AudioRecorderProps) {
  const { state, transcript, start, stop, reset, error, supported } =
    useSpeechRecognition("es-ES");

  function handleToggle() {
    if (state === "idle" || state === "done") {
      reset();
      start();
    } else if (state === "recording") {
      stop();
    }
  }

  function handleConfirm() {
    if (transcript.trim()) {
      onRecorded(transcript.trim());
      reset();
    }
  }

  if (!supported) {
    return (
      <p className="text-sm text-zinc-400 text-center px-4">
        Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <button
        onClick={handleToggle}
        disabled={disabled || state === "processing"}
        className={cn(
          "w-24 h-24 rounded-full flex items-center justify-center",
          "text-4xl transition-all duration-150 select-none",
          "focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-400",
          (state === "idle" || state === "done") &&
            !disabled &&
            "bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30",
          state === "recording" &&
            "bg-red-500 scale-110 shadow-[0_0_0_10px_rgba(239,68,68,0.2)] animate-pulse",
          disabled && "opacity-40 cursor-not-allowed bg-zinc-700"
        )}
        aria-label={state === "recording" ? "Detener grabación" : state === "done" ? "Grabar de nuevo" : "Iniciar grabación"}
      >
        {state === "recording" ? "⏹" : "🎙️"}
      </button>

      <p className="text-xs text-zinc-400 text-center">
        {(state === "idle" || state === "done") && "Toca para hablar"}
        {state === "recording" && "Escuchando... toca para detener"}
      </p>

      {transcript && state === "done" && (
        <div className="w-full flex flex-col gap-2">
          <div className="w-full rounded-xl bg-zinc-900 border border-zinc-700 px-4 py-3 text-sm text-zinc-100">
            {transcript}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleConfirm}
              disabled={disabled}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors disabled:opacity-40"
            >
              Guardar
            </button>
            <button
              onClick={reset}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm transition-colors"
            >
              Repetir
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-400 text-center px-4">{error}</p>}
    </div>
  );
}
