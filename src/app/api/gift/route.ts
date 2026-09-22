import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { giftSchema } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = getClientIp(req.headers);
  const limited = rateLimit(`gift:${ip}`, 30, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Muitas tentativas. Tente mais tarde." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const parsed = giftSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase.rpc("assign_gift", {
      p_visitor: parsed.data.visitor_id,
    });
    if (error) throw error;
    return NextResponse.json({ size: data });
  } catch (err) {
    console.error("assign_gift error", err);
    return NextResponse.json(
      { error: "Não foi possível sortear." },
      { status: 500 }
    );
  }
}
