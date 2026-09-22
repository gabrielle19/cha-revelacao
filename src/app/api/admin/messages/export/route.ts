import { getMessages } from "@/lib/admin-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function csvCell(value: string | number | null): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET() {
  try {
    const messages = await getMessages();
    const header = ["Nome", "Recadinho", "Enviado em"];
    const lines = [header.map(csvCell).join(",")];
    for (const m of messages) {
      lines.push(
        [
          csvCell(m.author_name),
          csvCell(m.message),
          csvCell(new Date(m.created_at).toLocaleString("pt-BR")),
        ].join(",")
      );
    }
    // BOM para o Excel reconhecer UTF-8
    const csv = "﻿" + lines.join("\r\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="recadinhos-cha-revelacao.csv"`,
      },
    });
  } catch (err) {
    console.error("messages export error", err);
    return new Response("Erro ao exportar", { status: 500 });
  }
}
