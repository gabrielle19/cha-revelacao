"use client";

import { useState } from "react";
import { Loader2, Lock } from "lucide-react";
import BearHead from "@/components/BearHead";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "Não foi possível entrar.");
        setLoading(false);
        return;
      }
      window.location.reload();
    } catch {
      setError("Erro de conexão.");
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-content flex-col items-center justify-center px-5">
      <div className="card w-full max-w-sm px-6 py-8 text-center">
        <div className="mb-3 flex justify-center">
          <BearHead size={72} />
        </div>
        <h1 className="font-display text-2xl text-browndark">Área da dona do evento</h1>
        <p className="mt-1 font-body text-sm text-brownlabel">
          Digite a senha para continuar.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-left">
          <div>
            <label
              htmlFor="password"
              className="mb-1 flex items-center gap-2 font-body font-semibold text-browndark"
            >
              <Lock size={16} strokeWidth={2.4} /> Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              className="w-full rounded-2xl border-2 border-beige bg-white px-4 py-3 font-body text-browndark"
            />
          </div>
          {error && (
            <p className="font-body text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
          <button type="submit" disabled={loading} className="btn-pill w-full">
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Entrando…
              </>
            ) : (
              "Entrar"
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
