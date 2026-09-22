import { getAdminData } from "@/lib/admin-data";
import { phoneToWhatsApp } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function csvCell(value: string | number | null): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET() {
  try {
    const { rsvps } = await getAdminData();
    const header = [
      "Nomes",
      "Telefone",
      "WhatsApp",
      "Quantidade",
      "Tamanho de fralda",
      "Confirmado em",
    ];
    const lines = [header.map(csvCell).join(",")];
    for (const r of rsvps) {
      lines.push(
        [
          csvCell(r.names),
          csvCell(r.phone),
          csvCell(`https://wa.me/${phoneToWhatsApp(r.phone)}`),
          csvCell(r.guests_count),
          csvCell(r.gift_size),
          csvCell(new Date(r.created_at).toLocaleString("pt-BR")),
        ].join(",")
      );
    }
    // BOM para o Excel reconhecer UTF-8
    const csv = "﻿" + lines.join("\r\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="confirmacoes-cha-revelacao.csv"`,
      },
    });
  } catch (err) {
    console.error("export error", err);
    return new Response("Erro ao exportar", { status: 500 });
  }
}
