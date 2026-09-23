import { supabase } from "@/lib/supabase-browser";
import { GIFT_SIZES, type GiftSize } from "@/lib/event";

export type Rsvp = {
  id: string;
  names: string;
  phone: string;
  guests_count: number;
  gift_size: GiftSize | null;
  created_at: string;
};

export type Quota = { size: GiftSize; quota: number; assigned: number };

export type Message = {
  id: string;
  author_name: string;
  message: string;
  created_at: string;
};

export type AdminData = {
  rsvps: Rsvp[];
  totalConfirmations: number;
  totalPeople: number;
  quotas: Quota[];
  messages: Message[];
};

/** Busca todos os dados do painel direto do Supabase, no navegador (chave pública). */
export async function fetchAdminData(): Promise<AdminData> {
  const [rsvpRes, quotaRes, msgRes] = await Promise.all([
    supabase
      .from("rsvps")
      .select("id, names, phone, guests_count, gift_size, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("gift_quotas").select("size, quota, assigned"),
    supabase
      .from("messages")
      .select("id, author_name, message, created_at")
      .order("created_at", { ascending: false }),
  ]);

  if (rsvpRes.error) throw rsvpRes.error;
  if (quotaRes.error) throw quotaRes.error;
  if (msgRes.error) throw msgRes.error;

  const rsvps = (rsvpRes.data ?? []) as Rsvp[];
  const totalPeople = rsvps.reduce((sum, r) => sum + (r.guests_count || 0), 0);

  // Ordena as cotas na ordem P, M, G, GG
  const quotaMap = new Map(
    (quotaRes.data ?? []).map((q) => [q.size as GiftSize, q as Quota])
  );
  const quotas: Quota[] = GIFT_SIZES.map(
    (size) => quotaMap.get(size) ?? { size, quota: 0, assigned: 0 }
  );

  return {
    rsvps,
    totalConfirmations: rsvps.length,
    totalPeople,
    quotas,
    messages: (msgRes.data ?? []) as Message[],
  };
}

/** Busca apenas os recadinhos (usado na versão para impressão). */
export async function fetchMessages(): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("id, author_name, message, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Message[];
}
