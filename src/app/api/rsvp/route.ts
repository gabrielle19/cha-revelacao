import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { rsvpSchema } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = getClientIp(req.headers);
  const limited = rateLimit(`rsvp:${ip}`, 5, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Muitas confirmações deste dispositivo. Tente mais tarde." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const parsed = rsvpSchema.safeParse(body);
  if (!parsed.success) {
    // Honeypot preenchido cai aqui também; respondemos genérico
    return NextResponse.json(
      { error: "Confira os dados e tente novamente." },
      { status: 400 }
    );
  }

  // Honeypot: se veio conteúdo, finge sucesso sem gravar
  if (parsed.data.company && parsed.data.company.length > 0) {
    return NextResponse.json({ ok: true, gift_size: null });
  }

  const supabase = getServerSupabase();
  const phoneDigits = parsed.data.phone.replace(/\D/g, "");

  try {
    let giftSize = parsed.data.gift_size ?? null;

    // Se ainda não há sugestão e temos visitor_id, sorteia agora
    if (!giftSize && parsed.data.visitor_id) {
      const { data: gift, error: giftErr } = await supabase.rpc("assign_gift", {
        p_visitor: parsed.data.visitor_id,
      });
      if (!giftErr && gift) giftSize = gift as typeof giftSize;
    }

    // upsert por telefone (não duplica se confirmar de novo)
    const { data, error } = await supabase
      .from("rsvps")
      .upsert(
        {
          names: parsed.data.names,
          phone: phoneDigits,
          guests_count: parsed.data.guests_count,
          gift_size: giftSize,
          visitor_id: parsed.data.visitor_id ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "phone" }
      )
      .select("gift_size")
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, gift_size: data?.gift_size ?? giftSize });
  } catch (err) {
    console.error("rsvp error", err);
    return NextResponse.json(
      { error: "Não foi possível salvar. Tente novamente." },
      { status: 500 }
    );
  }
}
