import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { messageSchema } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = getClientIp(req.headers);
  const limited = rateLimit(`messages:${ip}`, 5, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Muitos recadinhos deste dispositivo. Tente mais tarde." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Confira os dados e tente novamente." },
      { status: 400 }
    );
  }

  // Honeypot: se veio conteúdo, finge sucesso sem gravar
  if (parsed.data.company && parsed.data.company.length > 0) {
    return NextResponse.json({ ok: true });
  }

  try {
    const supabase = getServerSupabase();
    const { error } = await supabase.from("messages").insert({
      author_name: parsed.data.author_name,
      message: parsed.data.message,
      visitor_id: parsed.data.visitor_id ?? null,
    });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("message error", err);
    return NextResponse.json(
      { error: "Não foi possível salvar. Tente novamente." },
      { status: 500 }
    );
  }
}
