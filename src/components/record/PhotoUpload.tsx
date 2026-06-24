"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface PhotoUploadProps {
  onSelected: (file: File) => void;
  disabled?: boolean;
}

export function PhotoUpload({ onSelected, disabled }: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setPreview(url);
    onSelected(file);

    // Reset so the same file can be selected again
    e.target.value = "";
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        className={cn(
          "w-24 h-24 rounded-full flex items-center justify-center",
          "text-4xl transition-all duration-150",
          "bg-emerald-700 hover:bg-emerald-600 shadow-lg shadow-emerald-700/30",
          "focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400",
          disabled && "opacity-40 cursor-not-allowed"
        )}
        aria-label="Subir foto del entrenamiento"
      >
        {preview ? "✅" : "📸"}
      </button>

      {preview && (
        <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-zinc-700">
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          <button
            onClick={() => setPreview(null)}
            className="absolute top-0.5 right-0.5 bg-black/60 rounded-full w-5 h-5 text-xs flex items-center justify-center text-white"
          >
            ✕
          </button>
        </div>
      )}

      <p className="text-xs text-zinc-400 text-center">Cámara o galería</p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
}
