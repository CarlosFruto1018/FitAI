"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hola 👋 Puedes preguntarme sobre tu historial. Por ejemplo: «¿cuánto levanté la última vez en sentadilla?» o «¿cuántas sesiones hice esta semana?»",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const question = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", content: question }]);
    setLoading(true);

    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const { answer } = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: answer }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Lo siento, no pude procesar tu consulta." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <h1 className="text-xl font-bold text-zinc-100 mb-4">Consultar historial</h1>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pb-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
              m.role === "user"
                ? "self-end bg-indigo-600 text-white rounded-br-sm"
                : "self-start bg-zinc-800 text-zinc-200 rounded-bl-sm"
            )}
          >
            {m.content}
          </div>
        ))}

        {loading && (
          <div className="self-start bg-zinc-800 rounded-2xl rounded-bl-sm px-4 py-3">
            <span className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={send} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu pregunta..."
          className={cn(
            "flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3",
            "text-sm text-zinc-100 placeholder:text-zinc-500",
            "focus:outline-none focus:ring-2 focus:ring-indigo-500"
          )}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-lg disabled:opacity-40 hover:bg-indigo-500 transition-colors"
        >
          ➤
        </button>
      </form>
    </div>
  );
}
