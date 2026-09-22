import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSupabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const idSchema = z.string().uuid();

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const parsed = idSchema.safeParse(params.id);
  if (!parsed.success) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  try {
    const supabase = getServerSupabase();
    const { error } = await supabase.from("rsvps").delete().eq("id", parsed.data);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("delete rsvp error", err);
    return NextResponse.json({ error: "Não foi possível excluir." }, { status: 500 });
  }
}
