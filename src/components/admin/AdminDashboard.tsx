"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Download,
  Loader2,
  Mail,
  MessageCircle,
  Printer,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import { fetchAdminData, type AdminData, type Message } from "@/lib/admin-data";
import { phoneToWhatsApp } from "@/lib/validation";

function formatPhone(digits: string): string {
  const d = digits.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return digits;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Escapa um valor para CSV (aspas + campos com vírgula/quebra de linha). */
function csvCell(value: string | number): string {
  const s = String(value ?? "");
  return `"${s.replace(/"/g, '""')}"`;
}

function downloadCsv(filename: string, rows: (string | number)[][]): void {
  const csv = rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
  // BOM para o Excel abrir com acentos corretos.
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function AdminDashboard() {
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchAdminData());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    if (!q) return data.rsvps;
    return data.rsvps.filter((r) => r.names.toLowerCase().includes(q));
  }, [query, data]);

  function exportRsvps() {
    if (!data) return;
    const rows: (string | number)[][] = [
      ["Nomes", "Telefone", "Pessoas", "Fralda", "Confirmado em"],
      ...data.rsvps.map((r) => [
        r.names,
        formatPhone(r.phone),
        r.guests_count,
        r.gift_size ?? "",
        formatDate(r.created_at),
      ]),
    ];
    downloadCsv("confirmacoes.csv", rows);
  }

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[100dvh] w-full max-w-content flex-col items-center justify-center gap-3 px-5 py-10 text-center">
        <Loader2 size={28} className="animate-spin text-caramel" />
        <p className="font-body text-brownlabel">Carregando confirmações…</p>
      </main>
    );
  }

  if (error || !data) {
    return <SetupNeeded message={error ?? "Erro desconhecido."} onRetry={load} />;
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-browndark">Confirmações</h1>
          <p className="font-body text-sm text-brownlabel">Chá revelação</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={exportRsvps} className="btn-secondary">
            <Download size={18} strokeWidth={2.2} /> Exportar CSV
          </button>
          <button type="button" onClick={() => void load()} className="btn-secondary">
            <RefreshCw size={18} strokeWidth={2.2} /> Atualizar
          </button>
        </div>
      </header>

      {/* Resumo */}
      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard
          label="Confirmações"
          value={data.totalConfirmations}
          icon={<Users size={20} strokeWidth={2.2} />}
        />
        <SummaryCard label="Pessoas" value={data.totalPeople} />
        {data.quotas.map((q) => (
          <SummaryCard
            key={q.size}
            label={`Fralda ${q.size}`}
            value={`${q.assigned}/${q.quota}`}
          />
        ))}
      </section>

      {/* Busca */}
      <div className="mb-4 flex items-center gap-2 rounded-full border-2 border-beige bg-white px-4 py-2">
        <Search size={18} strokeWidth={2.2} className="text-brownlabel" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome…"
          className="w-full bg-transparent font-body text-browndark outline-none"
          aria-label="Buscar por nome"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-card border-2 border-beige bg-white px-4 py-8 text-center font-body text-brownlabel">
          Nenhuma confirmação encontrada.
        </p>
      ) : (
        <>
          {/* Tabela (desktop) */}
          <div className="hidden overflow-hidden rounded-card border-2 border-beige bg-white sm:block">
            <table className="w-full text-left font-body text-sm">
              <thead className="bg-beige-light text-brownlabel-deep">
                <tr>
                  <th className="px-4 py-3">Nomes</th>
                  <th className="px-4 py-3">Telefone</th>
                  <th className="px-4 py-3 text-center">Qtd.</th>
                  <th className="px-4 py-3 text-center">Fralda</th>
                  <th className="px-4 py-3">Confirmado</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-t border-beige align-top">
                    <td className="px-4 py-3 text-browndark">{r.names}</td>
                    <td className="px-4 py-3">
                      <a
                        href={`https://wa.me/${phoneToWhatsApp(r.phone)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-caramel hover:underline"
                      >
                        <MessageCircle size={15} strokeWidth={2.2} />
                        {formatPhone(r.phone)}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-center text-browndark">
                      {r.guests_count}
                    </td>
                    <td className="px-4 py-3 text-center text-browndark">
                      {r.gift_size ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-brownlabel">
                      {formatDate(r.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Lista de cards (mobile) */}
          <div className="space-y-3 sm:hidden">
            {filtered.map((r) => (
              <div key={r.id} className="card px-4 py-4">
                <p className="font-body font-semibold text-browndark">{r.names}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-body text-sm text-brownlabel">
                  <a
                    href={`https://wa.me/${phoneToWhatsApp(r.phone)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-caramel"
                  >
                    <MessageCircle size={15} strokeWidth={2.2} />
                    {formatPhone(r.phone)}
                  </a>
                  <span>{r.guests_count} pessoa(s)</span>
                  <span>Fralda {r.gift_size ?? "—"}</span>
                </div>
                <p className="mt-1 font-body text-xs text-brownlabel">
                  {formatDate(r.created_at)}
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      <MessagesSection messages={data.messages} />
    </main>
  );
}

function MessagesSection({ messages }: { messages: Message[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return messages;
    return messages.filter((m) => m.author_name.toLowerCase().includes(q));
  }, [query, messages]);

  function exportMessages() {
    const rows: (string | number)[][] = [
      ["Nome", "Recadinho", "Data"],
      ...messages.map((m) => [m.author_name, m.message, formatDate(m.created_at)]),
    ];
    downloadCsv("recadinhos.csv", rows);
  }

  return (
    <section className="mt-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-2xl text-browndark">
            <Mail size={22} strokeWidth={2.2} className="text-caramel" />
            Recadinhos
          </h2>
          <p className="font-body text-sm text-brownlabel">
            {messages.length} recadinho(s) guardado(s)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={exportMessages} className="btn-secondary">
            <Download size={18} strokeWidth={2.2} /> Exportar CSV
          </button>
          <a href="/admin/recados/imprimir" className="btn-secondary">
            <Printer size={18} strokeWidth={2.2} /> Versão para imprimir
          </a>
        </div>
      </div>

      {messages.length > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-full border-2 border-beige bg-white px-4 py-2">
          <Search size={18} strokeWidth={2.2} className="text-brownlabel" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome…"
            className="w-full bg-transparent font-body text-browndark outline-none"
            aria-label="Buscar recadinho por nome"
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="rounded-card border-2 border-beige bg-white px-4 py-8 text-center font-body text-brownlabel">
          Nenhum recadinho encontrado.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {filtered.map((m) => (
            <div key={m.id} className="card px-4 py-4">
              <p className="font-display text-lg text-caramel">{m.author_name}</p>
              <p className="mt-1 font-body italic leading-relaxed text-browndark">
                &ldquo;{m.message}&rdquo;
              </p>
              <p className="mt-2 font-body text-xs text-brownlabel">
                {formatDate(m.created_at)}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
}) {
  return (
    <div className="card px-4 py-4">
      <div className="flex items-center gap-2 font-body text-xs text-brownlabel">
        {icon}
        {label}
      </div>
      <p className="mt-1 font-display text-2xl text-browndark">{value}</p>
    </div>
  );
}

function SetupNeeded({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  const missingTable = /Could not find the table|does not exist|PGRST205/i.test(
    message
  );
  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-content flex-col items-center justify-center gap-4 px-5 py-10 text-center">
      <div className="card w-full px-6 py-6">
        <h1 className="font-display text-2xl text-browndark">
          Não foi possível carregar
        </h1>
        {missingTable ? (
          <div className="mt-3 space-y-2 font-body text-sm text-brownlabel-deep">
            <p>
              As tabelas do Supabase ainda não existem. No painel do Supabase,
              abra o <strong>SQL Editor</strong> e execute, nesta ordem:
            </p>
            <ol className="mx-auto max-w-sm list-decimal space-y-1 pl-5 text-left">
              <li>
                <code>supabase/migrations/0001_init.sql</code>
              </li>
              <li>
                <code>supabase/migrations/0002_messages.sql</code>
              </li>
              <li>
                <code>supabase/migrations/0003_public_rls.sql</code>
              </li>
            </ol>
            <p>Depois recarregue esta página.</p>
          </div>
        ) : (
          <p className="mt-3 font-body text-sm text-brownlabel-deep">
            Verifique as variáveis <code>NEXT_PUBLIC_SUPABASE_URL</code> e{" "}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> e as regras (RLS) de leitura
            pública.
          </p>
        )}
        <p className="mt-4 break-words font-body text-xs text-brownlabel/70">
          {message}
        </p>
        <button type="button" onClick={onRetry} className="btn-pill mt-4">
          Tentar de novo
        </button>
      </div>
    </main>
  );
}
