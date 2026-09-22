"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  LogOut,
  Mail,
  MessageCircle,
  Printer,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import type { AdminData, Message } from "@/lib/admin-data";
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

export default function AdminDashboard({ data }: { data: AdminData }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data.rsvps;
    return data.rsvps.filter((r) => r.names.toLowerCase().includes(q));
  }, [query, data.rsvps]);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
    window.location.href = "/admin";
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Excluir esta confirmação? Esta ação não pode ser desfeita.")) {
      return;
    }
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/rsvps/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      } else {
        window.alert("Não foi possível excluir.");
      }
    } finally {
      setDeleting(null);
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-browndark">Confirmações</h1>
          <p className="font-body text-sm text-brownlabel">
            Chá revelação
          </p>
        </div>
        <div className="flex gap-2">
          <a href="/api/admin/export" className="btn-secondary">
            <Download size={18} strokeWidth={2.2} /> Exportar CSV
          </a>
          <button type="button" onClick={handleLogout} className="btn-secondary">
            <LogOut size={18} strokeWidth={2.2} /> Sair
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
                  <th className="px-4 py-3"></th>
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
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(r.id)}
                        disabled={deleting === r.id}
                        aria-label="Excluir confirmação"
                        className="rounded-full p-2 text-red-700 transition-transform active:scale-90"
                      >
                        <Trash2 size={16} strokeWidth={2.2} />
                      </button>
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
                <div className="flex items-start justify-between gap-2">
                  <p className="font-body font-semibold text-browndark">
                    {r.names}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleDelete(r.id)}
                    disabled={deleting === r.id}
                    aria-label="Excluir confirmação"
                    className="rounded-full p-1.5 text-red-700"
                  >
                    <Trash2 size={16} strokeWidth={2.2} />
                  </button>
                </div>
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
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return messages;
    return messages.filter((m) => m.author_name.toLowerCase().includes(q));
  }, [query, messages]);

  async function handleDelete(id: string) {
    if (!window.confirm("Excluir este recadinho? Esta ação não pode ser desfeita.")) {
      return;
    }
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/messages/${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
      else window.alert("Não foi possível excluir.");
    } finally {
      setDeleting(null);
    }
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
          <a href="/api/admin/messages/export" className="btn-secondary">
            <Download size={18} strokeWidth={2.2} /> Exportar CSV
          </a>
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
              <div className="flex items-start justify-between gap-2">
                <p className="font-display text-lg text-caramel">
                  {m.author_name}
                </p>
                <button
                  type="button"
                  onClick={() => handleDelete(m.id)}
                  disabled={deleting === m.id}
                  aria-label="Excluir recadinho"
                  className="rounded-full p-1.5 text-red-700 transition-transform active:scale-90"
                >
                  <Trash2 size={16} strokeWidth={2.2} />
                </button>
              </div>
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
